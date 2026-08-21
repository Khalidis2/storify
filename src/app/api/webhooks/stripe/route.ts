import { NextResponse } from "next/server";
import Stripe from "stripe";
import { prisma } from "@/lib/prisma";
import { getStripe } from "@/lib/stripe";

export async function POST(request: Request) {
  const stripe = getStripe();
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!stripe || !webhookSecret) {
    return NextResponse.json({ error: "Webhook not configured." }, { status: 500 });
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing signature." }, { status: 400 });
  }

  const rawBody = await request.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch {
    return NextResponse.json({ error: "Invalid signature." }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;

    const order = await prisma.order.findUnique({
      where: { stripeSessionId: session.id },
      include: { items: true },
    });

    if (order && order.status !== "paid") {
      const shippingDetails = session.collected_information?.shipping_details;

      await prisma.order.update({
        where: { id: order.id },
        data: {
          status: "paid",
          customerEmail: session.customer_details?.email ?? null,
          shippingName: shippingDetails?.name ?? null,
          shippingAddress: shippingDetails ? JSON.stringify(shippingDetails.address) : null,
        },
      });

      for (const item of order.items) {
        if (!item.productId) continue;
        const product = await prisma.product.findUnique({ where: { id: item.productId } });
        if (!product) continue;
        await prisma.product.update({
          where: { id: item.productId },
          data: { stock: Math.max(0, product.stock - item.quantity) },
        });
      }
    }
  }

  return NextResponse.json({ received: true });
}
