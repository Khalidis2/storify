import assert from "node:assert/strict";
import test from "node:test";
import { checkoutIdempotencyKey } from "@/lib/checkout-idempotency";

test("creates a stable Stripe idempotency key per order", () => {
  assert.equal(
    checkoutIdempotencyKey("order_123"),
    "checkout-session:order_123"
  );
});
