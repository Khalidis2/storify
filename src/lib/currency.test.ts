import assert from "node:assert/strict";
import test from "node:test";
import {
  formatPrice,
  SHOP_CURRENCY,
  STRIPE_CURRENCY,
} from "@/lib/currency";

test("uses AED consistently for display and Stripe", () => {
  assert.equal(SHOP_CURRENCY, "AED");
  assert.equal(STRIPE_CURRENCY, "aed");
  assert.match(formatPrice(2500), /AED/);
  assert.match(formatPrice(2500), /25\.00/);
});
