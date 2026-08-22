import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getStripe } from "@/lib/stripe";
import { STRIPE_SHIPPING_COUNTRIES } from "@/lib/countries";

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

  const productIds = [...quantities.keys()];
  const products = await prisma.product.findMany({
    where: { id: { in: productIds }, shopId: shop.id },
  });

  if (products.length !== productIds.length) {
    return NextResponse.json(
      { error: "One of the items in your cart is no longer available." },
      { status: 400 }
    );
  }

  const lineItems = [];
  const orderItemsData = [];
  let totalCents = 0;

  for (const product of products) {
    const quantity = quantities.get(product.id)!;
    if (quantity > product.stock) {
      return NextResponse.json(
        { error: `Only ${product.stock} of "${product.title}" left in stock.` },
        { status: 409 }
      );
    }

    totalCents += product.priceCents * quantity;
    lineItems.push({
      quantity,
      price_data: {
        currency: "usd",
        unit_amount: product.priceCents,
        product_data: { name: product.title },
      },
    });
    orderItemsData.push({
      productId: product.id,
      title: product.title,
      priceCents: product.priceCents,
      quantity,
    });
  }

  const configuredOrigin = process.env.APP_URL ?? process.env.AUTH_URL;
  const origin = configuredOrigin
    ? new URL(configuredOrigin).origin
    : new URL(request.url).origin;

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: lineItems,
      shipping_address_collection: {
        allowed_countries: [...STRIPE_SHIPPING_COUNTRIES],
      },
      success_url: `${origin}/store/${shop.slug}?order=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/store/${shop.slug}?order=canceled`,
      metadata: { shopId: shop.id },
    });

    await prisma.order.create({
      data: {
        shopId: shop.id,
        stripeSessionId: session.id,
        status: "pending",
        totalCents,
        items: { create: orderItemsData },
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("Checkout creation failed", error);
    return NextResponse.json(
      { error: "Checkout is temporarily unavailable. Please try again." },
      { status: 502 }
    );
  }
}
