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
      { status: 500 }
    );
  }

  const body = await request.json().catch(() => null);
  const parsed = checkoutSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Your cart looks invalid." }, { status: 400 });
  }

  const shop = await prisma.shop.findUnique({ where: { slug: parsed.data.shopSlug } });
  if (!shop || !shop.published) {
    return NextResponse.json({ error: "This shop isn't available." }, { status: 404 });
  }

  const productIds = parsed.data.items.map((i) => i.productId);
  const products = await prisma.product.findMany({
    where: { id: { in: productIds }, shopId: shop.id },
  });

  const lineItems = [];
  const orderItemsData = [];
  let totalCents = 0;

  for (const { productId, quantity } of parsed.data.items) {
    const product = products.find((p) => p.id === productId);
    if (!product) {
      return NextResponse.json(
        { error: "One of the items in your cart is no longer available." },
        { status: 400 }
      );
    }
    if (quantity > product.stock) {
      return NextResponse.json(
        { error: `Only ${product.stock} of "${product.title}" left in stock.` },
        { status: 400 }
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

  const origin = new URL(request.url).origin;

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: lineItems,
      shipping_address_collection: {
        allowed_countries: [...STRIPE_SHIPPING_COUNTRIES],
      },
      success_url: `${origin}/store/${shop.slug}?order=success`,
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
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("Stripe checkout session creation failed:", message);
    return NextResponse.json(
      { error: `Checkout failed: ${message}` },
      { status: 500 }
    );
  }
}
