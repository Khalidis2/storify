import { z } from "zod";

export const productSchema = z.object({
  title: z.string().min(1).max(120),
  description: z.string().max(2000).optional().default(""),
  priceCents: z.number().int().min(0),
  imageUrl: z.string().max(2000).optional().default(""),
  imageFocalX: z.number().int().min(0).max(100).default(50),
  imageFocalY: z.number().int().min(0).max(100).default(50),
  stock: z.number().int().min(0).default(0),
});
