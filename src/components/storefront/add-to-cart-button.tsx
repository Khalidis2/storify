"use client";

import { useContext, useState } from "react";
import { CartContext } from "@/components/storefront/cart-context";

export function AddToCartButton({ productId }: { productId: string }) {
  const cart = useContext(CartContext);
  const [added, setAdded] = useState(false);

  if (!cart) {
    // Builder preview: no live cart, show a realistic but inert button.
    return (
      <button
        type="button"
        disabled
        className="mt-2 w-full rounded-full border border-zinc-300 py-1.5 text-xs font-medium text-zinc-400"
      >
        Add to cart
      </button>
    );
  }

  function handleClick() {
    cart!.addItem(productId);
    setAdded(true);
    setTimeout(() => setAdded(false), 1200);
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className="mt-2 w-full rounded-full border border-zinc-900 py-1.5 text-xs font-medium text-zinc-900 hover:bg-zinc-900 hover:text-white"
    >
      {added ? "Added ✓" : "Add to cart"}
    </button>
  );
}
