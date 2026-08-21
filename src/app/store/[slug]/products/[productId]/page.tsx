import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { CartProvider } from "@/components/storefront/cart-context";
import { CartDrawer } from "@/components/storefront/cart-drawer";
import { ProductDetail } from "@/components/storefront/product-detail";

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ slug: string; productId: string }>;
}) {
  const { slug, productId } = await params;

  const shop = await prisma.shop.findUnique({ where: { slug } });
  if (!shop || !shop.published) {
    notFound();
  }

  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product || product.shopId !== shop.id) {
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
    <CartProvider shopSlug={shop.slug} products={renderProducts}>
      <div className="flex-1 bg-white">
        <div className="mx-auto max-w-5xl px-6 pt-8">
          <Link
            href={`/store/${shop.slug}`}
            className="text-sm font-medium text-zinc-500 hover:text-zinc-900"
          >
            ← Back to shop
          </Link>
        </div>
        <ProductDetail product={product} />
      </div>
      <CartDrawer shopSlug={shop.slug} />
    </CartProvider>
  );
}
