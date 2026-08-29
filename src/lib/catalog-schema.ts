import { z } from "zod";
import {
  MAX_STRIPE_AMOUNT_CENTS,
  MIN_STRIPE_AMOUNT_CENTS,
} from "@/lib/payment-limits";

export function normalizeSku(value: string) {
  return value
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "-")
    .replace(/[^A-Z0-9._-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^[._-]+|[._-]+$/g, "")
    .slice(0, 64);
}

export const productVariantSchema = z.object({
  title: z.string().trim().min(1).max(100),
  sku: z.string().max(100).transform(normalizeSku).optional().default(""),
  priceCents: z
    .number()
    .int()
    .min(MIN_STRIPE_AMOUNT_CENTS)
    .max(MAX_STRIPE_AMOUNT_CENTS),
  stock: z.number().int().min(0).max(1_000_000),
  position: z.number().int().min(0).max(10_000).default(0),
});

export const collectionSchema = z.object({
  title: z.string().trim().min(1).max(120),
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .min(1)
    .max(80)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  description: z.string().trim().max(2000).optional().default(""),
});
