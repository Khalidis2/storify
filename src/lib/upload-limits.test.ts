import assert from "node:assert/strict";
import test from "node:test";
import {
  MAX_UPLOAD_REQUEST_BYTES,
  MAX_UPLOAD_SIZE_BYTES,
  UPLOAD_BURST_LIMIT,
  UPLOAD_DAILY_LIMIT,
} from "@/lib/upload-limits";

test("keeps uploaded files within the 4 MB product-image limit", () => {
  assert.equal(MAX_UPLOAD_SIZE_BYTES, 4 * 1024 * 1024);
});

test("allows multipart overhead without allowing an unbounded body", () => {
  assert.ok(MAX_UPLOAD_REQUEST_BYTES > MAX_UPLOAD_SIZE_BYTES);
  assert.ok(MAX_UPLOAD_REQUEST_BYTES <= 5 * 1024 * 1024);
});

test("daily upload allowance is stricter than repeated burst capacity", () => {
  assert.equal(UPLOAD_BURST_LIMIT, 20);
  assert.equal(UPLOAD_DAILY_LIMIT, 100);
  assert.ok(UPLOAD_DAILY_LIMIT < UPLOAD_BURST_LIMIT * 24 * 6);
});
