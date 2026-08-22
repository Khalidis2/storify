const MIN_STRIPE_AMOUNTS: Record<string, number> = {
  AED: 200,
  USD: 50,
  EUR: 50,
  GBP: 30,
};

export const MIN_STRIPE_AMOUNT_CENTS = MIN_STRIPE_AMOUNTS.AED;
export const MAX_STRIPE_AMOUNT_CENTS = 99_999_999;

export function getMinimumStripeAmount(currency: string) {
  return MIN_STRIPE_AMOUNTS[currency] ?? MIN_STRIPE_AMOUNT_CENTS;
}
