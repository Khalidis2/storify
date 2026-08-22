import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import Stripe from "stripe";
import { prisma } from "@/lib/prisma";
import { getStripe } from "@/lib/stripe";

class InsufficientStockError extends Error {}

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

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      await request.text(),
      signature,
      webhookSecret
    );
  } catch {
    return NextResponse.json({ error: "Invalid signature." }, { status: 400 });
  }

  if (event.type !== "checkout.session.completed") {
    return NextResponse.json({ received: true });
  }

  const session = event.data.object as Stripe.Checkout.Session;
  if (session.payment_status !== "paid") {
    return NextResponse.json({ received: true });
  }

  try {
    await prisma.$transaction(async (tx) => {
      await tx.stripeEvent.create({
        data: { id: event.id, type: event.type },
      });

      const order = await tx.order.findUnique({
        where: { stripeSessionId: session.id },
        include: { items: true },
      });

      if (!order) {
        throw new Error(`Order not found for Stripe session ${session.id}`);
      }

      if (order.status === "paid") return;

      for (const item of order.items) {
        if (!item.productId) continue;
        const result = await tx.product.updateMany({
          where: {
            id: item.productId,
            shopId: order.shopId,
            stock: { gte: item.quantity },
          },
          data: { stock: { decrement: item.quantity } },
        });

        if (result.count !== 1) {
          throw new InsufficientStockError(
            `Insufficient stock for product ${item.productId}`
          );
        }
      }

      const shippingDetails = session.collected_information?.shipping_details;
      await tx.order.update({
        where: { id: order.id },
        data: {
          status: "paid",
          customerEmail: session.customer_details?.email ?? null,
          shippingName: shippingDetails?.name ?? null,
          shippingAddress: shippingDetails
            ? JSON.stringify(shippingDetails.address)
            : null,
        },
      });
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return NextResponse.json({ received: true });
    }

    console.error("Stripe webhook processing failed", {
      eventId: event.id,
      sessionId: session.id,
      error,
    });
    return NextResponse.json(
      {
        error:
          error instanceof InsufficientStockError
            ? "Inventory conflict requires review."
            : "Webhook processing failed.",
      },
      { status: 500 }
    );
  }

  return NextResponse.json({ received: true });
}
