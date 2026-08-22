export const SHOP_CURRENCY = "AED";
export const STRIPE_CURRENCY = "aed";

export function formatPrice(cents: number) {
  return new Intl.NumberFormat("en-AE", {
    style: "currency",
    currency: SHOP_CURRENCY,
  }).format(cents / 100);
}
