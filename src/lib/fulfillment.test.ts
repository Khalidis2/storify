import assert from "node:assert/strict";
import test from "node:test";
import {
  effectiveShippingFee,
  isFulfillmentMode,
} from "@/lib/fulfillment";

test("only delivery orders charge shipping", () => {
  assert.equal(effectiveShippingFee("DELIVERY", 2000), 2000);
  assert.equal(effectiveShippingFee("PICKUP", 2000), 0);
});

test("rejects unsupported fulfillment modes", () => {
  assert.equal(isFulfillmentMode("DELIVERY"), true);
  assert.equal(isFulfillmentMode("COURIER"), false);
});
