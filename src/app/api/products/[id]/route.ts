import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getShopForUser } from "@/lib/shop";

const productSchema = z.object({
  title: z.string().min(1).max(120),
  description: z.string().max(2000).optional().default(""),
  priceCents: z.number().int().min(0),
  imageUrl: z.string().max(2000).optional().default(""),
  stock: z.number().int().min(0).default(0),
});

async function assertOwnership(userId: string, productId: string) {
  const shop = await getShopForUser(userId);
  if (!shop) return null;

  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product || product.shopId !== shop.id) return null;

  return product;
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const existing = await assertOwnership(session.user.id, id);
  if (!existing) {
    return NextResponse.json({ error: "Product not found." }, { status: 404 });
  }

  const body = await request.json().catch(() => null);
  const parsed = productSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Please check the product details." }, { status: 400 });
  }

  const product = await prisma.product.update({
    where: { id },
    data: parsed.data,
  });

  return NextResponse.json(product);
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const existing = await assertOwnership(session.user.id, id);
  if (!existing) {
    return NextResponse.json({ error: "Product not found." }, { status: 404 });
  }

  await prisma.product.delete({ where: { id } });

  return NextResponse.json({ ok: true });
}
