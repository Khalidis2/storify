import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getShopForUser } from "@/lib/shop";
import { productSchema } from "@/lib/product-schema";
import { STARTER_PRODUCT_LIMIT } from "@/lib/plan-limits";

class ProductLimitError extends Error {}

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

  try {
    const product = await prisma.$transaction(async (tx) => {
      await tx.$queryRaw`
        SELECT pg_advisory_xact_lock(hashtext(${`shop-products:${shop.id}`}))
      `;

      const productCount = await tx.product.count({
        where: { shopId: shop.id },
      });
      if (productCount >= STARTER_PRODUCT_LIMIT) {
        throw new ProductLimitError();
      }

      return tx.product.create({
        data: { ...parsed.data, shopId: shop.id },
      });
    });

    return NextResponse.json(product);
  } catch (error) {
    if (error instanceof ProductLimitError) {
      return NextResponse.json(
        { error: `The Starter plan supports up to ${STARTER_PRODUCT_LIMIT} products.` },
        { status: 409 }
      );
    }

    console.error("Product creation failed", error);
    return NextResponse.json(
      { error: "Could not create the product. Please try again." },
      { status: 500 }
    );
  }
}
