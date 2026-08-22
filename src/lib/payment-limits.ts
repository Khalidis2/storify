import type { ShopCurrency } from "@/lib/currency";

const MIN_STRIPE_AMOUNTS: Record<ShopCurrency, number> = {
  AED: 200,
  USD: 50,
  EUR: 50,
  GBP: 30,
};

export const MAX_STRIPE_AMOUNT_CENTS = 99_999_999;

export function getMinimumStripeAmount(currency: ShopCurrency) {
  return MIN_STRIPE_AMOUNTS[currency];
}
