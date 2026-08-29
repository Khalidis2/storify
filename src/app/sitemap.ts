import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";
import { getSiteUrl } from "@/lib/site-url";

export const dynamic = "force-dynamic";
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = getSiteUrl();
  const shops = await prisma.shop.findMany({
    where: { published: true },
    select: {
      slug: true,
      updatedAt: true,
      products: {
        select: {
          id: true,
          updatedAt: true,
        },
      },
    },
    orderBy: { updatedAt: "desc" },
  });

  return [
    {
      url: siteUrl,
      changeFrequency: "weekly",
      priority: 1,
    },
    ...shops.flatMap((shop) => [
      {
        url: `${siteUrl}/store/${shop.slug}`,
        lastModified: shop.updatedAt,
        changeFrequency: "weekly" as const,
        priority: 0.8,
      },
      ...shop.products.map((product) => ({
        url: `${siteUrl}/store/${shop.slug}/products/${product.id}`,
        lastModified: product.updatedAt,
        changeFrequency: "weekly" as const,
        priority: 0.7,
      })),
    ]),
  ];
}
