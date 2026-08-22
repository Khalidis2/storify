import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getShopForUser } from "@/lib/shop";
import { ORDER_FULFILLMENT_STATUSES } from "@/lib/order-fulfillment";

const updateSchema = z.object({
  status: z.enum(ORDER_FULFILLMENT_STATUSES),
});

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const shop = await getShopForUser(session.user.id);
  if (!shop) {
    return NextResponse.json({ error: "Shop not found." }, { status: 404 });
  }

  const body = await request.json().catch(() => null);
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Unsupported fulfilment status." },
      { status: 400 }
    );
  }

  const { id } = await params;
  const result = await prisma.order.updateMany({
    where: {
      id,
      shopId: shop.id,
      status: "paid",
    },
    data: {
      fulfillmentStatus: parsed.data.status,
      fulfilledAt: parsed.data.status === "FULFILLED" ? new Date() : null,
    },
  });

  if (result.count !== 1) {
    return NextResponse.json(
      { error: "Paid order not found." },
      { status: 404 }
    );
  }

  return NextResponse.json({ ok: true });
}
