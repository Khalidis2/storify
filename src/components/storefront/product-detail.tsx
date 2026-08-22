"use client";

import { useContext, useState } from "react";
import { CartContext } from "@/components/storefront/cart-context";

import { formatPrice } from "@/lib/currency";
export function ProductDetail({
  product,
}: {
  product: {
    id: string;
    title: string;
    description: string | null;
    priceCents: number;
    imageUrl: string | null;
    imageFocalX: number;
    imageFocalY: number;
    stock: number;
  };
}) {
  const cart = useContext(CartContext);
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);

  const outOfStock = product.stock <= 0;

  function handleAddToCart() {
    if (!cart) return;
    cart.addItem(product.id, quantity);
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  }

  return (
    <div className="mx-auto grid max-w-5xl grid-cols-1 gap-10 px-6 py-16 md:grid-cols-2">
      <div className="aspect-square w-full overflow-hidden rounded-2xl bg-zinc-100">
        {product.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={product.imageUrl}
            alt={product.title}
            className="h-full w-full object-cover"
            style={{
              objectPosition: `${product.imageFocalX}% ${product.imageFocalY}%`,
            }}
          />
        ) : null}
      </div>

      <div>
        <h1 className="text-3xl font-bold text-zinc-900">{product.title}</h1>
        <p className="mt-2 text-xl text-zinc-700">{formatPrice(product.priceCents)}</p>

        {product.description && (
          <p className="mt-6 whitespace-pre-line text-zinc-600">{product.description}</p>
        )}

        <p className="mt-6 text-sm text-zinc-500">
          {outOfStock ? "Out of stock" : `${product.stock} in stock`}
        </p>

        <div className="mt-4 flex items-center gap-4">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              className="h-9 w-9 rounded border border-zinc-300 text-sm"
              disabled={outOfStock}
            >
              −
            </button>
            <span className="w-6 text-center text-sm">{quantity}</span>
            <button
              onClick={() => setQuantity((q) => Math.min(product.stock, q + 1))}
              className="h-9 w-9 rounded border border-zinc-300 text-sm"
              disabled={outOfStock}
            >
              +
            </button>
          </div>

          <button
            onClick={handleAddToCart}
            disabled={outOfStock || !cart}
            className="flex-1 rounded-full bg-zinc-900 py-3 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-40"
          >
            {outOfStock ? "Out of stock" : added ? "Added ✓" : "Add to cart"}
          </button>
        </div>
      </div>
    </div>
  );
}
