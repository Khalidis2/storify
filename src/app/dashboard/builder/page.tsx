import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getShopForUser } from "@/lib/shop";
import { defaultLayout, type Block } from "@/lib/blocks";
import { Builder } from "@/components/builder/builder";

export default async function BuilderPage() {
  const session = await auth();
  const shop = await getShopForUser(session!.user.id);

  if (!shop) {
    redirect("/dashboard");
  }

  const page = await prisma.page.findUnique({
    where: { shopId_slug: { shopId: shop.id, slug: "home" } },
  });

  const products = await prisma.product.findMany({
    where: { shopId: shop.id },
    orderBy: { createdAt: "desc" },
  });

  let blocks: Block[];
  try {
    blocks = page ? JSON.parse(page.layout) : defaultLayout();
  } catch {
    blocks = defaultLayout();
  }

  return (
    <Builder
      initialBlocks={blocks}
      products={products.map((p) => ({
        id: p.id,
        title: p.title,
        priceCents: p.priceCents,
        imageUrl: p.imageUrl,
        imageFocalX: p.imageFocalX,
        imageFocalY: p.imageFocalY,
      }))}
      storeUrl={`/store/${shop.slug}`}
    />
  );
}
