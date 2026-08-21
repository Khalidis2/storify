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
  const parsed = productSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Please check the product details." }, { status: 400 });
  }

  const product = await prisma.product.create({
    data: { ...parsed.data, shopId: shop.id },
  });

  return NextResponse.json(product);
}
