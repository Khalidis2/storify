"use client";

import { useState } from "react";
import { useCart } from "@/components/storefront/cart-context";

function formatPrice(cents: number) {
  return (cents / 100).toLocaleString(undefined, {
    style: "currency",
    currency: "USD",
  });
}

export function CartDrawer({ shopSlug }: { shopSlug: string }) {
  const { products, items, totalCount, totalCents, setQuantity, removeItem } = useCart();
  const [open, setOpen] = useState(false);
  const [checkingOut, setCheckingOut] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const lineItems = Object.entries(items)
    .map(([productId, quantity]) => {
      const product = products.find((p) => p.id === productId);
      return product ? { product, quantity } : null;
    })
    .filter((x): x is { product: (typeof products)[number]; quantity: number } => x !== null);

  async function handleCheckout() {
    setError(null);
    setCheckingOut(true);

    const res = await fetch("/api/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        shopSlug,
        items: lineItems.map(({ product, quantity }) => ({
          productId: product.id,
          quantity,
        })),
      }),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.url) {
      setError(data.error || "Could not start checkout. Please try again.");
      setCheckingOut(false);
      return;
    }

    // Navigating away to Stripe's hosted checkout page, triggered by this click handler.
    // eslint-disable-next-line react-hooks/immutability
    window.location.href = data.url;
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-40 flex items-center gap-2 rounded-full bg-zinc-900 px-5 py-3 text-sm font-medium text-white shadow-lg hover:bg-zinc-700"
      >
        🛒 Cart
        {totalCount > 0 && (
          <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-white px-1 text-xs font-semibold text-zinc-900">
            {totalCount}
          </span>
        )}
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div
            className="absolute inset-0 bg-black/30"
            onClick={() => setOpen(false)}
          />
          <div className="relative flex h-full w-full max-w-sm flex-col bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-zinc-200 px-5 py-4">
              <h2 className="text-lg font-semibold text-zinc-900">Your cart</h2>
              <button
                onClick={() => setOpen(false)}
                className="text-zinc-500 hover:text-zinc-900"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-4">
              {lineItems.length === 0 ? (
                <p className="text-sm text-zinc-400">Your cart is empty.</p>
              ) : (
                <div className="space-y-4">
                  {lineItems.map(({ product, quantity }) => (
                    <div key={product.id} className="flex items-center gap-3">
                      <div className="h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-zinc-100">
                        {product.imageUrl && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={product.imageUrl}
                            alt={product.title}
                            className="h-full w-full object-cover"
                            style={{
                              objectPosition: `${product.imageFocalX ?? 50}% ${
                                product.imageFocalY ?? 50
                              }%`,
                            }}
                          />
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-zinc-900">{product.title}</p>
                        <p className="text-xs text-zinc-500">{formatPrice(product.priceCents)}</p>
                        <div className="mt-1 flex items-center gap-2">
                          <button
                            onClick={() => setQuantity(product.id, quantity - 1)}
                            className="h-6 w-6 rounded border border-zinc-300 text-xs"
                          >
                            −
                          </button>
                          <span className="text-sm">{quantity}</span>
                          <button
                            onClick={() => setQuantity(product.id, quantity + 1)}
                            className="h-6 w-6 rounded border border-zinc-300 text-xs"
                          >
                            +
                          </button>
                          <button
                            onClick={() => removeItem(product.id)}
                            className="ml-2 text-xs text-red-600 hover:underline"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {lineItems.length > 0 && (
              <div className="border-t border-zinc-200 px-5 py-4">
                {error && (
                  <p className="mb-2 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">
                    {error}
                  </p>
                )}
                <div className="mb-3 flex items-center justify-between text-sm font-medium text-zinc-900">
                  <span>Subtotal</span>
                  <span>{formatPrice(totalCents)}</span>
                </div>
                <button
                  onClick={handleCheckout}
                  disabled={checkingOut}
                  className="w-full rounded-full bg-zinc-900 py-3 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-50"
                >
                  {checkingOut ? "Redirecting…" : "Checkout"}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
