import assert from "node:assert/strict";
import test from "node:test";
import {
  MAX_STRIPE_AMOUNT_CENTS,
  MIN_STRIPE_AMOUNT_CENTS,
} from "@/lib/payment-limits";
import { productSchema } from "@/lib/product-schema";

const validProduct = {
  title: "  Coffee beans  ",
  description: "  Fresh roast  ",
  priceCents: MIN_STRIPE_AMOUNT_CENTS,
  imageUrl: "https://example.com/product.webp",
  imageFocalX: 50,
  imageFocalY: 50,
  stock: 10,
};

test("normalizes and accepts a valid product", () => {
  const result = productSchema.parse(validProduct);

  assert.equal(result.title, "Coffee beans");
  assert.equal(result.description, "Fresh roast");
});

test("accepts Stripe's maximum amount", () => {
  const result = productSchema.safeParse({
    ...validProduct,
    priceCents: MAX_STRIPE_AMOUNT_CENTS,
  });

  assert.equal(result.success, true);
});

test("rejects amounts outside Stripe's range", () => {
  assert.equal(
    productSchema.safeParse({
      ...validProduct,
      priceCents: MIN_STRIPE_AMOUNT_CENTS - 1,
    }).success,
    false
  );
  assert.equal(
    productSchema.safeParse({
      ...validProduct,
      priceCents: MAX_STRIPE_AMOUNT_CENTS + 1,
    }).success,
    false
  );
});

test("rejects fractional prices and unsafe image URLs", () => {
  assert.equal(
    productSchema.safeParse({ ...validProduct, priceCents: 199.5 }).success,
    false
  );
  assert.equal(
    productSchema.safeParse({
      ...validProduct,
      imageUrl: "javascript:alert(1)",
    }).success,
    false
  );
  assert.equal(
    productSchema.safeParse({
      ...validProduct,
      imageUrl: "http://example.com/product.webp",
    }).success,
    false
  );
});

test("rejects unsafe inventory and focal-point values", () => {
  assert.equal(
    productSchema.safeParse({ ...validProduct, stock: 1_000_001 }).success,
    false
  );
  assert.equal(
    productSchema.safeParse({ ...validProduct, imageFocalX: 101 }).success,
    false
  );
});
