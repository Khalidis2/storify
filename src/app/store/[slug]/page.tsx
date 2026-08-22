import type { Metadata } from "next";
import { cache } from "react";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { BlockRenderer } from "@/components/block-renderer";
import { defaultLayout, type Block } from "@/lib/blocks";
import { CartProvider } from "@/components/storefront/cart-context";
import { CartDrawer } from "@/components/storefront/cart-drawer";
import { OrderSuccessBanner } from "@/components/storefront/order-success-banner";

const getPublishedShop = cache((slug: string) =>
  prisma.shop.findFirst({ where: { slug, published: true } })
);

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const shop = await getPublishedShop(slug);

  if (!shop) {
    return {
      title: "Shop not found",
      robots: { index: false, follow: false },
    };
  }

  const description =
    shop.tagline?.trim().slice(0, 160) || `Shop ${shop.name} online.`;
  const images = shop.logoUrl
    ? [{ url: shop.logoUrl, alt: `${shop.name} logo` }]
    : undefined;

  return {
    title: shop.name,
    description,
    alternates: { canonical: `/store/${shop.slug}` },
    openGraph: {
      type: "website",
      title: shop.name,
      description,
      url: `/store/${shop.slug}`,
      images,
    },
    twitter: {
      card: images ? "summary_large_image" : "summary",
      title: shop.name,
      description,
      images: shop.logoUrl ? [shop.logoUrl] : undefined,
    },
  };
}

export default async function StorefrontPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ order?: string }>;
}) {
  const { slug } = await params;
  const { order } = await searchParams;

  const shop = await getPublishedShop(slug);
  if (!shop) {
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

  const renderProducts = products.map((p) => ({
    id: p.id,
    title: p.title,
    priceCents: p.priceCents,
    imageUrl: p.imageUrl,
    imageFocalX: p.imageFocalX,
    imageFocalY: p.imageFocalY,
  }));

  return (
    <CartProvider shopSlug={shop.slug} products={renderProducts}>
      <div className="flex-1 bg-white">
        {order === "success" && <OrderSuccessBanner />}
        {blocks.map((block) => (
          <BlockRenderer
            key={block.id}
            block={block}
            products={renderProducts}
            shopSlug={shop.slug}
          />
        ))}
      </div>
      <CartDrawer shopSlug={shop.slug} />
    </CartProvider>
  );
}
