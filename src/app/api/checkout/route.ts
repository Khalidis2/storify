import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getStripe } from "@/lib/stripe";
import { isShopCurrency, stripeCurrency } from "@/lib/currency";
import { STRIPE_SHIPPING_COUNTRIES } from "@/lib/countries";
import {
  getMinimumStripeAmount,
  MAX_STRIPE_AMOUNT_CENTS,
} from "@/lib/payment-limits";
import {
  checkRateLimit,
  getClientIdentifier,
  rateLimitResponse,
} from "@/lib/rate-limit";

const RESERVATION_MINUTES = 30;

class StockReservationError extends Error {}

const checkoutSchema = z.object({
  shopSlug: z.string().min(1),
  items: z
    .array(
      z.object({
        productId: z.string().min(1),
        quantity: z.number().int().min(1).max(99),
      })
    )
    .min(1)
    .max(50),
});

async function releaseReservation(orderId: string) {
  await prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    });
    if (!order || order.status !== "reserved") return;

    for (const item of order.items) {
      if (!item.productId) continue;
      await tx.product.updateMany({
        where: { id: item.productId, shopId: order.shopId },
        data: { stock: { increment: item.quantity } },
      });
    }

    await tx.order.update({
      where: { id: order.id },
      data: { status: "canceled" },
    });
  });
}

export async function POST(request: Request) {
  const stripe = getStripe();
  if (!stripe) {
    return NextResponse.json(
      { error: "This shop can't take payments yet — checkout isn't configured." },
      { status: 503 }
    );
  }

  const body = await request.json().catch(() => null);
  const parsed = checkoutSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Your cart looks invalid." }, { status: 400 });
  }

  try {
    const rateLimit = await checkRateLimit(request, {
      namespace: "checkout",
      identifier: `${getClientIdentifier(request)}:${parsed.data.shopSlug}`,
      limit: 10,
      windowMs: 60 * 1000,
    });
    if (!rateLimit.allowed) {
      return rateLimitResponse(rateLimit.retryAfterSeconds);
    }
  } catch (error) {
    console.error("Checkout rate limit check failed", error);
    return NextResponse.json(
      { error: "Checkout is temporarily unavailable. Please try again." },
      { status: 503 }
    );
  }

  const quantities = new Map<string, number>();
  for (const item of parsed.data.items) {
    quantities.set(item.productId, (quantities.get(item.productId) ?? 0) + item.quantity);
  }
  if ([...quantities.values()].some((quantity) => quantity > 99)) {
    return NextResponse.json({ error: "Your cart looks invalid." }, { status: 400 });
  }

  const shop = await prisma.shop.findUnique({ where: { slug: parsed.data.shopSlug } });
  if (!shop || !shop.published) {
    return NextResponse.json({ error: "This shop isn't available." }, { status: 404 });
  }
  if (!isShopCurrency(shop.currency)) {
    return NextResponse.json(
      { error: "This shop has an unsupported currency." },
      { status: 503 }
    );
  }
  const shopCurrency = shop.currency;

  const products = await prisma.product.findMany({
    where: { id: { in: [...quantities.keys()] }, shopId: shop.id },
  });
  if (products.length !== quantities.size) {
    return NextResponse.json(
      { error: "One of the items in your cart is no longer available." },
      { status: 400 }
    );
  }

  const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = products.map((product) => ({
    quantity: quantities.get(product.id)!,
    price_data: {
      currency: stripeCurrency(shopCurrency),
      unit_amount: product.priceCents,
      product_data: { name: product.title },
    },
  }));
  const orderItemsData = products.map((product) => ({
    productId: product.id,
    title: product.title,
    priceCents: product.priceCents,
    quantity: quantities.get(product.id)!,
  }));
  const totalCents = orderItemsData.reduce(
    (total, item) => total + item.priceCents * item.quantity,
    0
  );
  if (
    totalCents < getMinimumStripeAmount(shopCurrency) ||
    totalCents > MAX_STRIPE_AMOUNT_CENTS
  ) {
    return NextResponse.json(
      { error: "Your cart total is outside the supported payment range." },
      { status: 400 }
    );
  }

  const expiresAt = new Date(Date.now() + RESERVATION_MINUTES * 60 * 1000);

  let order;
  try {
    order = await prisma.$transaction(async (tx) => {
      for (const item of orderItemsData) {
        const result = await tx.product.updateMany({
          where: {
            id: item.productId,
            shopId: shop.id,
            stock: { gte: item.quantity },
          },
          data: { stock: { decrement: item.quantity } },
        });
        if (result.count !== 1) {
          throw new StockReservationError();
        }
      }

      return tx.order.create({
        data: {
          shopId: shop.id,
          status: "reserved",
          currency: shopCurrency,
          totalCents,
          reservedAt: new Date(),
          expiresAt,
          items: { create: orderItemsData },
        },
      });
    });
  } catch (error) {
    if (error instanceof StockReservationError) {
      return NextResponse.json(
        { error: "One of the items just sold out. Please review your cart." },
        { status: 409 }
      );
    }
    console.error("Inventory reservation failed", error);
    return NextResponse.json(
      { error: "Checkout is temporarily unavailable. Please try again." },
      { status: 502 }
    );
  }

  const configuredOrigin = process.env.APP_URL ?? process.env.AUTH_URL;
  const origin = configuredOrigin
    ? new URL(configuredOrigin).origin
    : new URL(request.url).origin;

  let session;
  try {
    session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: lineItems,
      shipping_address_collection: {
        allowed_countries: [...STRIPE_SHIPPING_COUNTRIES],
      },
      expires_at: Math.floor(expiresAt.getTime() / 1000),
      client_reference_id: order.id,
      success_url: `${origin}/store/${shop.slug}?order=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/store/${shop.slug}?order=canceled`,
      metadata: { shopId: shop.id, orderId: order.id },
    });
  } catch (error) {
    await releaseReservation(order.id).catch((releaseError) => {
      console.error("Reservation release failed", { orderId: order.id, releaseError });
    });
    console.error("Stripe Checkout Session creation failed", error);
    return NextResponse.json(
      { error: "Checkout is temporarily unavailable. Please try again." },
      { status: 502 }
    );
  }

  await prisma.order
    .update({
      where: { id: order.id },
      data: { stripeSessionId: session.id },
    })
    .catch((error) => {
      console.error("Could not attach Stripe session to reserved order", {
        orderId: order.id,
        sessionId: session.id,
        error,
      });
    });

  return NextResponse.json({ url: session.url });
}
