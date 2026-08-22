import assert from "node:assert/strict";
import test from "node:test";
import { slugify } from "@/lib/slug";

test("creates stable lowercase shop slugs", () => {
  assert.equal(slugify("  Khaled's Coffee Shop  "), "khaled-s-coffee-shop");
});

test("collapses punctuation and separators", () => {
  assert.equal(slugify("Coffee &   More!!!"), "coffee-more");
});

test("falls back for names without ASCII slug characters", () => {
  assert.equal(slugify("متجر"), "shop");
});

test("caps slugs at 60 characters", () => {
  assert.equal(slugify("a".repeat(100)).length, 60);
});
