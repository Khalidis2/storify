export const SUPPORTED_SHOP_CURRENCIES = ["AED", "USD", "EUR", "GBP"] as const;
export type ShopCurrency = (typeof SUPPORTED_SHOP_CURRENCIES)[number];
export const DEFAULT_SHOP_CURRENCY: ShopCurrency = "AED";

export function isShopCurrency(value: string): value is ShopCurrency {
  return SUPPORTED_SHOP_CURRENCIES.includes(value as ShopCurrency);
}

export function stripeCurrency(currency: ShopCurrency) {
  return currency.toLowerCase() as Lowercase<ShopCurrency>;
}

export function formatPrice(cents: number, currency: string) {
  const safeCurrency = isShopCurrency(currency) ? currency : DEFAULT_SHOP_CURRENCY;
  return new Intl.NumberFormat("en", {
    style: "currency",
    currency: safeCurrency,
  }).format(cents / 100);
}
