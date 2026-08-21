import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { BlockRenderer } from "@/components/block-renderer";
import { defaultLayout, type Block } from "@/lib/blocks";

export default async function StorefrontPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const shop = await prisma.shop.findUnique({ where: { slug } });
  if (!shop || !shop.published) {
    notFound();
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
    <div className="flex-1 bg-white">
      {blocks.map((block) => (
        <BlockRenderer
          key={block.id}
          block={block}
          products={products.map((p) => ({
            id: p.id,
            title: p.title,
            priceCents: p.priceCents,
            imageUrl: p.imageUrl,
            imageFocalX: p.imageFocalX,
            imageFocalY: p.imageFocalY,
          }))}
        />
      ))}
    </div>
  );
}
