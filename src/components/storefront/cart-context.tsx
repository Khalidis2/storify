"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { RenderProduct } from "@/components/block-renderer";

type CartItems = Record<string, number>;

interface CartContextValue {
  products: RenderProduct[];
  items: CartItems;
  totalCount: number;
  totalCents: number;
  addItem: (productId: string, quantity?: number) => void;
  setQuantity: (productId: string, quantity: number) => void;
  removeItem: (productId: string) => void;
  clear: () => void;
}

export const CartContext = createContext<CartContextValue | null>(null);

function storageKey(shopSlug: string) {
  return `storify-cart:${shopSlug}`;
}

export function CartProvider({
  shopSlug,
  products,
  children,
}: {
  shopSlug: string;
  products: RenderProduct[];
  children: React.ReactNode;
}) {
  const [items, setItems] = useState<CartItems>({});
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    // One-time sync from localStorage on mount (client-only, avoids SSR hydration mismatch).
    try {
      const raw = window.localStorage.getItem(storageKey(shopSlug));
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (raw) setItems(JSON.parse(raw));
    } catch {
      // ignore malformed/inaccessible storage
    }
    setLoaded(true);
  }, [shopSlug]);

  useEffect(() => {
    if (!loaded) return;
    try {
      window.localStorage.setItem(storageKey(shopSlug), JSON.stringify(items));
    } catch {
      // ignore storage write failures (private browsing, quota, etc.)
    }
  }, [items, shopSlug, loaded]);

  function addItem(productId: string, quantity = 1) {
    setItems((current) => ({
      ...current,
      [productId]: (current[productId] ?? 0) + quantity,
    }));
  }

  function setQuantity(productId: string, quantity: number) {
    setItems((current) => {
      if (quantity <= 0) {
        const next = { ...current };
        delete next[productId];
        return next;
      }
      return { ...current, [productId]: quantity };
    });
  }

  function removeItem(productId: string) {
    setItems((current) => {
      const next = { ...current };
      delete next[productId];
      return next;
    });
  }

  function clear() {
    setItems({});
  }

  const { totalCount, totalCents } = useMemo(() => {
    let count = 0;
    let cents = 0;
    for (const [productId, quantity] of Object.entries(items)) {
      const product = products.find((p) => p.id === productId);
      if (!product) continue;
      count += quantity;
      cents += product.priceCents * quantity;
    }
    return { totalCount: count, totalCents: cents };
  }, [items, products]);

  return (
    <CartContext.Provider
      value={{ products, items, totalCount, totalCents, addItem, setQuantity, removeItem, clear }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within a CartProvider");
  return ctx;
}
