import assert from "node:assert/strict";
import test from "node:test";
import {
  DEFAULT_SHOP_CURRENCY,
  formatPrice,
  isShopCurrency,
  stripeCurrency,
} from "@/lib/currency";

test("defaults new shops to AED", () => {
  assert.equal(DEFAULT_SHOP_CURRENCY, "AED");
});

test("formats supported merchant currencies", () => {
  assert.match(formatPrice(2500, "AED"), /AED/);
  assert.match(formatPrice(2500, "USD"), /\$25\.00/);
  assert.equal(stripeCurrency("GBP"), "gbp");
});

test("rejects unsupported store currencies", () => {
  assert.equal(isShopCurrency("AED"), true);
  assert.equal(isShopCurrency("JPY"), false);
});
