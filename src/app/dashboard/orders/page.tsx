import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getShopForUser } from "@/lib/shop";

function formatPrice(cents: number) {
  return (cents / 100).toLocaleString(undefined, {
    style: "currency",
    currency: "USD",
  });
}

const STATUS_STYLES: Record<string, string> = {
  paid: "bg-green-50 text-green-700",
  pending: "bg-amber-50 text-amber-700",
};

export default async function OrdersPage() {
  const session = await auth();
  const shop = await getShopForUser(session!.user.id);

  if (!shop) {
    redirect("/dashboard");
  }

  const orders = await prisma.order.findMany({
    where: { shopId: shop.id },
    include: { items: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold text-zinc-900">Orders</h1>

      {orders.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-zinc-300 bg-white p-10 text-center text-sm text-zinc-500">
          No orders yet. Once your shop is published and customers check out,
          they&rsquo;ll show up here.
        </p>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div
              key={order.id}
              className="rounded-2xl border border-zinc-200 bg-white p-5"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-3">
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-medium ${
                      STATUS_STYLES[order.status] ?? "bg-zinc-100 text-zinc-600"
                    }`}
                  >
                    {order.status === "paid" ? "Paid" : "Pending"}
                  </span>
                  <span className="text-sm text-zinc-500">
                    {order.createdAt.toLocaleString()}
                  </span>
                </div>
                <span className="font-semibold text-zinc-900">
                  {formatPrice(order.totalCents)}
                </span>
              </div>

              {order.customerEmail && (
                <p className="mt-2 text-sm text-zinc-600">{order.customerEmail}</p>
              )}

              <ul className="mt-3 space-y-1 text-sm text-zinc-700">
                {order.items.map((item) => (
                  <li key={item.id} className="flex justify-between">
                    <span>
                      {item.quantity}× {item.title}
                    </span>
                    <span>{formatPrice(item.priceCents * item.quantity)}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
