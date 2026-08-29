import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { prisma } from "@/lib/prisma";
import { getReservationDecision } from "@/lib/reservation-reconciliation";
import { getStripe } from "@/lib/stripe";

const BATCH_SIZE = 100;

function isAuthorized(request: Request) {
  const secret = process.env.CRON_SECRET;
  return Boolean(secret) && request.headers.get("authorization") === `Bearer ${secret}`;
}

function sessionMatchesOrder(
  session: Stripe.Checkout.Session,
  order: {
    id: string;
    shopId: string;
    stripeAccountId: string | null;
    currency: string;
    totalCents: number;
  }
) {
  return (
    (session.client_reference_id === order.id || session.metadata?.orderId === order.id) &&
    session.metadata?.shopId === order.shopId &&
    session.metadata?.stripeAccountId === order.stripeAccountId &&
    session.currency?.toUpperCase() === order.currency &&
    session.amount_total === order.totalCents
  );
}

async function releaseOrder(orderId: string) {
  return prisma.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT "id" FROM "Order" WHERE "id" = ${orderId} FOR UPDATE`;
    const order = await tx.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    });
    if (!order || order.status !== "reserved") return false;

    for (const item of order.items) {
      if (!item.productId) continue;
      await tx.product.updateMany({
        where: { id: item.productId, shopId: order.shopId },
        data: { stock: { increment: item.quantity } },
      });
    }

    await tx.order.update({
      where: { id: order.id },
      data: { status: "expired" },
    });
    return true;
  });
}

async function finalizeOrder(orderId: string, session: Stripe.Checkout.Session) {
  return prisma.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT "id" FROM "Order" WHERE "id" = ${orderId} FOR UPDATE`;
    const order = await tx.order.findUnique({ where: { id: orderId } });
    if (!order || order.status !== "reserved") return false;

    const shippingDetails = session.collected_information?.shipping_details;
    await tx.order.update({
      where: { id: order.id },
      data: {
        status: "paid",
        stripeSessionId: session.id,
        customerEmail: session.customer_details?.email ?? null,
        shippingName: shippingDetails?.name ?? null,
        shippingAddress: shippingDetails
          ? JSON.stringify(shippingDetails.address)
          : null,
      },
    });
    return true;
  });
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const stripe = getStripe();
  if (!stripe) {
    return NextResponse.json({ error: "Stripe is not configured." }, { status: 503 });
  }

  const orders = await prisma.order.findMany({
    where: {
      status: "reserved",
      expiresAt: { lte: new Date() },
    },
    orderBy: { expiresAt: "asc" },
    take: BATCH_SIZE,
  });

  const result = {
    checked: orders.length,
    finalized: 0,
    released: 0,
    waiting: 0,
    skipped: 0,
    failed: 0,
  };

  for (const order of orders) {
    if (!order.stripeSessionId) {
      result.skipped += 1;
      console.error("Reserved order is missing its Stripe session", { orderId: order.id });
      continue;
    }

    try {
      const session = await stripe.checkout.sessions.retrieve(order.stripeSessionId);
      if (!sessionMatchesOrder(session, order)) {
        result.skipped += 1;
        console.error("Stripe session did not match reserved order", {
          orderId: order.id,
          sessionId: session.id,
        });
        continue;
      }

      const decision = getReservationDecision(session.status, session.payment_status);
      if (decision === "finalize") {
        if (await finalizeOrder(order.id, session)) result.finalized += 1;
        else result.skipped += 1;
      } else if (decision === "release") {
        if (await releaseOrder(order.id)) result.released += 1;
        else result.skipped += 1;
      } else {
        result.waiting += 1;
      }
    } catch (error) {
      result.failed += 1;
      console.error("Reservation reconciliation failed", { orderId: order.id, error });
    }
  }

  return NextResponse.json(result);
}
