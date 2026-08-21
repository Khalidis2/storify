"use client";

import { useEffect } from "react";
import { useCart } from "@/components/storefront/cart-context";

export function OrderSuccessBanner() {
  const { clear } = useCart();

  useEffect(() => {
    clear();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="bg-green-50 px-6 py-4 text-center text-sm font-medium text-green-800">
      🎉 Thank you! Your order is confirmed — a receipt has been sent to your email.
    </div>
  );
}
