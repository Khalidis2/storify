import assert from "node:assert/strict";
import test from "node:test";
import { isOrderFulfillmentStatus } from "@/lib/order-fulfillment";

test("accepts only supported order fulfilment states", () => {
  assert.equal(isOrderFulfillmentStatus("UNFULFILLED"), true);
  assert.equal(isOrderFulfillmentStatus("PROCESSING"), true);
  assert.equal(isOrderFulfillmentStatus("FULFILLED"), true);
  assert.equal(isOrderFulfillmentStatus("PAID"), false);
});
