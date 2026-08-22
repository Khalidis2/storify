import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getShopForUser } from "@/lib/shop";
import { ProductsManager } from "@/components/products/products-manager";

export default async function ProductsPage() {
  const session = await auth();
  const shop = await getShopForUser(session!.user.id);

  if (!shop) {
    redirect("/dashboard");
  }

  const products = await prisma.product.findMany({
    where: { shopId: shop.id },
    orderBy: { createdAt: "desc" },
  });

  return <ProductsManager initialProducts={products} currency={shop.currency} />;
}
