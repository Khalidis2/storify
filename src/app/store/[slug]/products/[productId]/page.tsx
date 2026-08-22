import type { Metadata } from "next";
import { cache } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { CartProvider } from "@/components/storefront/cart-context";
import { CartDrawer } from "@/components/storefront/cart-drawer";
import { ProductDetail } from "@/components/storefront/product-detail";

const getPublishedShop = cache((slug: string) =>
  prisma.shop.findFirst({ where: { slug, published: true } })
);
const getShopProduct = cache((shopId: string, productId: string) =>
  prisma.product.findFirst({ where: { id: productId, shopId } })
);

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string; productId: string }>;
}): Promise<Metadata> {
  const { slug, productId } = await params;
  const shop = await getPublishedShop(slug);
  if (!shop) {
    return {
      title: "Product not found",
      robots: { index: false, follow: false },
    };
  }

  const product = await getShopProduct(shop.id, productId);
  if (!product) {
    return {
      title: "Product not found",
      robots: { index: false, follow: false },
    };
  }

  const description =
    product.description?.trim().slice(0, 160) ||
    `Buy ${product.title} from ${shop.name}.`;
  const canonical = `/store/${shop.slug}/products/${product.id}`;
  const images = product.imageUrl
    ? [{ url: product.imageUrl, alt: product.title }]
    : undefined;

  return {
    title: `${product.title} — ${shop.name}`,
    description,
    alternates: { canonical },
    openGraph: {
      type: "website",
      title: product.title,
      description,
      url: canonical,
      images,
    },
    twitter: {
      card: images ? "summary_large_image" : "summary",
      title: product.title,
      description,
      images: product.imageUrl ? [product.imageUrl] : undefined,
    },
  };
}

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ slug: string; productId: string }>;
}) {
  const { slug, productId } = await params;

  const shop = await getPublishedShop(slug);
  if (!shop) {
    notFound();
  }

  const product = await getShopProduct(shop.id, productId);
  if (!product) {
    notFound();
  }

  const products = await prisma.product.findMany({
    where: { shopId: shop.id },
    orderBy: { createdAt: "desc" },
  });

  const renderProducts = products.map((p) => ({
    id: p.id,
    title: p.title,
    priceCents: p.priceCents,
    imageUrl: p.imageUrl,
    imageFocalX: p.imageFocalX,
    imageFocalY: p.imageFocalY,
  }));

  return (
    <CartProvider shopSlug={shop.slug} products={renderProducts} currency={shop.currency}>
      <div className="flex-1 bg-white">
        <div className="mx-auto max-w-5xl px-6 pt-8">
          <Link
            href={`/store/${shop.slug}`}
            className="text-sm font-medium text-zinc-500 hover:text-zinc-900"
          >
            ← Back to shop
          </Link>
        </div>
        <ProductDetail product={product} currency={shop.currency} />
      </div>
      <CartDrawer
        shopSlug={shop.slug}
        fulfillmentMode={shop.fulfillmentMode}
        shippingFeeCents={shop.shippingFeeCents}
      />
    </CartProvider>
  );
}
