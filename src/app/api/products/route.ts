import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getShopForUser } from "@/lib/shop";
import { productSchema } from "@/lib/product-schema";

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
