import Link from "next/link";
import { auth } from "@/auth";
import { getShopForUser } from "@/lib/shop";
import { prisma } from "@/lib/prisma";
import { CreateShopForm } from "@/components/create-shop-form";

export default async function DashboardPage() {
  const session = await auth();
  const shop = await getShopForUser(session!.user.id);

  if (!shop) {
    return (
      <div>
        <h1 className="text-2xl font-semibold text-zinc-900">
          Let&rsquo;s set up your shop
        </h1>
        <p className="mt-2 max-w-md text-sm text-zinc-600">
          Give your shop a name to get started. You can customize everything
          else — colors, pages, products — after this.
        </p>
        <div className="mt-6">
          <CreateShopForm />
        </div>
      </div>
    );
  }

  const productCount = await prisma.product.count({ where: { shopId: shop.id } });

  return (
    <div>
      <h1 className="text-2xl font-semibold text-zinc-900">{shop.name}</h1>
      <p className="mt-1 text-sm text-zinc-600">
        Status:{" "}
        {shop.published ? (
          <span className="font-medium text-green-600">Published</span>
        ) : (
          <span className="font-medium text-amber-600">Draft — not live yet</span>
        )}
      </p>

      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-zinc-200 bg-white p-5">
          <p className="text-sm text-zinc-500">Products</p>
          <p className="mt-1 text-2xl font-semibold text-zinc-900">{productCount}</p>
          <Link
            href="/dashboard/products"
            className="mt-3 inline-block text-sm font-medium text-zinc-900 underline"
          >
            Manage products
          </Link>
        </div>
        <div className="rounded-2xl border border-zinc-200 bg-white p-5">
          <p className="text-sm text-zinc-500">Homepage design</p>
          <p className="mt-1 text-sm text-zinc-700">
            Customize your storefront layout.
          </p>
          <Link
            href="/dashboard/builder"
            className="mt-3 inline-block text-sm font-medium text-zinc-900 underline"
          >
            Open builder
          </Link>
        </div>
        <div className="rounded-2xl border border-zinc-200 bg-white p-5">
          <p className="text-sm text-zinc-500">Your storefront</p>
          {shop.published ? (
            <Link
              href={`/store/${shop.slug}`}
              target="_blank"
              className="mt-3 inline-block text-sm font-medium text-zinc-900 underline"
            >
              /store/{shop.slug} ↗
            </Link>
          ) : (
            <Link
              href="/dashboard/publish"
              className="mt-3 inline-block text-sm font-medium text-zinc-900 underline"
            >
              Publish your shop
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
