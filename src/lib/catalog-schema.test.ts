import assert from "node:assert/strict";
import test from "node:test";
import {
  collectionSchema,
  normalizeSku,
  productVariantSchema,
} from "@/lib/catalog-schema";

test("normalizes merchant SKUs consistently", () => {
  assert.equal(normalizeSku("  coffee beans / 1kg  "), "COFFEE-BEANS-1KG");
});

test("validates product variants", () => {
  const variant = productVariantSchema.parse({
    title: "1 kg",
    sku: " beans 1kg ",
    priceCents: 2500,
    stock: 10,
  });

  assert.equal(variant.sku, "BEANS-1KG");
  assert.equal(variant.position, 0);
});

test("rejects invalid collection slugs", () => {
  assert.equal(
    collectionSchema.safeParse({
      title: "Coffee",
      slug: "Coffee & More",
    }).success,
    false
  );
});
