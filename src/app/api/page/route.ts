import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getShopForUser } from "@/lib/shop";

const blockTypes = [
  "hero",
  "text",
  "image",
  "imageText",
  "productGrid",
  "banner",
  "testimonial",
  "faq",
  "video",
  "social",
  "footer",
  "spacer",
] as const;

const urlKeys = new Set([
  "imageUrl",
  "avatarUrl",
  "videoUrl",
  "instagramUrl",
  "facebookUrl",
  "twitterUrl",
  "tiktokUrl",
]);
const colorKeys = new Set(["backgroundColor", "textColor"]);

function isHttpsUrl(value: string) {
  if (!value) return true;
  try {
    return new URL(value).protocol === "https:";
  } catch {
    return false;
  }
}

const blockSchema = z.object({
  id: z.string().min(1).max(100),
  type: z.enum(blockTypes),
  props: z
    .record(
      z.string().min(1).max(100),
      z.union([z.string().max(5000), z.number().finite()])
    )
    .refine((props) => Object.keys(props).length <= 50),
});

const saveSchema = z
  .object({
    blocks: z.array(blockSchema).max(100),
  })
  .superRefine((value, ctx) => {
    const ids = value.blocks.map((block) => block.id);
    if (new Set(ids).size !== ids.length) {
      ctx.addIssue({ code: "custom", message: "Block IDs must be unique." });
    }

    value.blocks.forEach((block, blockIndex) => {
      Object.entries(block.props).forEach(([key, prop]) => {
        if (
          urlKeys.has(key) &&
          (typeof prop !== "string" || !isHttpsUrl(prop.trim()))
        ) {
          ctx.addIssue({
            code: "custom",
            path: ["blocks", blockIndex, "props", key],
            message: "Storefront URLs must use HTTPS.",
          });
        }
        if (
          colorKeys.has(key) &&
          (typeof prop !== "string" || !/^#[0-9a-fA-F]{6}$/.test(prop))
        ) {
          ctx.addIssue({
            code: "custom",
            path: ["blocks", blockIndex, "props", key],
            message: "Colors must use six-digit hex format.",
          });
        }
        if (
          (key.endsWith("FocalX") || key.endsWith("FocalY")) &&
          (typeof prop !== "number" || !Number.isInteger(prop) || prop < 0 || prop > 100)
        ) {
          ctx.addIssue({
            code: "custom",
            path: ["blocks", blockIndex, "props", key],
            message: "Image focal points must be whole numbers from 0 to 100.",
          });
        }
      });

      if (
        block.type === "spacer" &&
        (typeof block.props.height !== "number" ||
          !Number.isInteger(block.props.height) ||
          block.props.height < 0 ||
          block.props.height > 500)
      ) {
        ctx.addIssue({
          code: "custom",
          path: ["blocks", blockIndex, "props", "height"],
          message: "Spacer height must be a whole number from 0 to 500.",
        });
      }
    });

    if (JSON.stringify(value).length > 262_144) {
      ctx.addIssue({ code: "custom", message: "Page layout is too large." });
    }
  });

export async function PUT(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const shop = await getShopForUser(session.user.id);
  if (!shop) {
    return NextResponse.json({ error: "No shop found." }, { status: 404 });
  }

  const body = await request.json().catch(() => null);
  const parsed = saveSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid page layout." }, { status: 400 });
  }

  await prisma.page.upsert({
    where: { shopId_slug: { shopId: shop.id, slug: "home" } },
    update: { layout: JSON.stringify(parsed.data.blocks) },
    create: {
      shopId: shop.id,
      slug: "home",
      title: "Home",
      layout: JSON.stringify(parsed.data.blocks),
    },
  });

  return NextResponse.json({ ok: true });
}
