import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getShopForUser } from "@/lib/shop";
import { STARTER_PRODUCT_LIMIT } from "@/lib/plan-limits";

const publishSchema = z.object({
  planId: z.string().min(1),
});

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const shop = await getShopForUser(session.user.id);
  if (!shop) {
    return NextResponse.json({ error: "No shop found." }, { status: 404 });
  }

  const body = await request.json().catch(() => null);
  const parsed = publishSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Please choose a plan." }, { status: 400 });
  }

  const plan = await prisma.plan.findUnique({ where: { id: parsed.data.planId } });
  if (!plan) {
    return NextResponse.json({ error: "That plan doesn't exist." }, { status: 400 });
  }
  if (plan.priceCents > 0) {
    return NextResponse.json(
      { error: "Paid plans are not available until subscription billing is enabled." },
      { status: 403 }
    );
  }

  const productCount = await prisma.product.count({
    where: { shopId: shop.id },
  });
  if (productCount > STARTER_PRODUCT_LIMIT) {
    return NextResponse.json(
      {
        error: `The Starter plan supports up to ${STARTER_PRODUCT_LIMIT} products. Remove extra products before publishing.`,
      },
      { status: 409 }
    );
  }

  const updated = await prisma.shop.update({
    where: { id: shop.id },
    data: {
      planId: plan.id,
      published: true,
      publishedAt: new Date(),
    },
  });

  return NextResponse.json({ slug: updated.slug });
}

export async function DELETE() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const shop = await getShopForUser(session.user.id);
  if (!shop) {
    return NextResponse.json({ error: "No shop found." }, { status: 404 });
  }

  await prisma.shop.update({
    where: { id: shop.id },
    data: { published: false },
  });

  return NextResponse.json({ ok: true });
}
