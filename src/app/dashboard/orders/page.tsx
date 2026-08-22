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
  reserved: "bg-blue-50 text-blue-700",
  pending: "bg-amber-50 text-amber-700",
  expired: "bg-zinc-100 text-zinc-600",
  canceled: "bg-red-50 text-red-700",
};

const STATUS_LABELS: Record<string, string> = {
  paid: "Paid",
  reserved: "Awaiting payment",
  pending: "Pending",
  expired: "Expired",
  canceled: "Canceled",
};

interface ShippingAddress {
  line1?: string | null;
  line2?: string | null;
  city?: string | null;
  state?: string | null;
  postal_code?: string | null;
  country?: string | null;
}

function formatAddress(raw: string | null): string | null {
  if (!raw) return null;
  try {
    const a: ShippingAddress = JSON.parse(raw);
    return [
      a.line1,
      a.line2,
      [a.city, a.state, a.postal_code].filter(Boolean).join(", "),
      a.country,
    ]
      .filter(Boolean)
      .join(", ");
  } catch {
    return null;
  }
}

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
                    {STATUS_LABELS[order.status] ?? order.status}
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

              {(order.shippingName || order.shippingAddress) && (
                <div className="mt-2 rounded-lg bg-zinc-50 px-3 py-2 text-xs text-zinc-600">
                  <p className="font-medium text-zinc-700">Ship to</p>
                  {order.shippingName && <p>{order.shippingName}</p>}
                  {formatAddress(order.shippingAddress) && (
                    <p>{formatAddress(order.shippingAddress)}</p>
                  )}
                </div>
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
