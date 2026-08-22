import { z } from "zod";
import {
  MAX_STRIPE_AMOUNT_CENTS,
  MIN_STRIPE_AMOUNT_CENTS,
} from "@/lib/payment-limits";

export const productSchema = z.object({
  title: z.string().trim().min(1).max(120),
  description: z.string().trim().max(2000).optional().default(""),
  priceCents: z
    .number()
    .int()
    .min(MIN_STRIPE_AMOUNT_CENTS)
    .max(MAX_STRIPE_AMOUNT_CENTS),
  imageUrl: z.string().trim().max(2000).optional().default(""),
  imageFocalX: z.number().int().min(0).max(100).default(50),
  imageFocalY: z.number().int().min(0).max(100).default(50),
  stock: z.number().int().min(0).max(1_000_000).default(0),
});
