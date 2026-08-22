import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getShopForUser } from "@/lib/shop";
import { slugify } from "@/lib/slug";
import { defaultLayout } from "@/lib/blocks";

const createShopSchema = z.object({
  name: z.string().trim().min(1).max(80),
});

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = createShopSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Please enter a shop name." }, { status: 400 });
  }

  const baseSlug = slugify(parsed.data.name);

  for (let suffix = 1; suffix <= 25; suffix += 1) {
    const slug = suffix === 1 ? baseSlug : `${baseSlug}-${suffix}`;

    try {
      const shop = await prisma.shop.create({
        data: {
          ownerId: session.user.id,
          name: parsed.data.name,
          slug,
          pages: {
            create: {
              slug: "home",
              title: "Home",
              layout: JSON.stringify(defaultLayout()),
            },
          },
        },
      });

      return NextResponse.json({ id: shop.id, slug: shop.slug });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        const existing = await getShopForUser(session.user.id);
        if (existing) {
          return NextResponse.json(
            { error: "You already have a shop." },
            { status: 409 }
          );
        }
        continue;
      }

      console.error("Shop creation failed", error);
      return NextResponse.json(
        { error: "Could not create your shop. Please try again." },
        { status: 500 }
      );
    }
  }

  return NextResponse.json(
    { error: "Could not reserve a shop address. Please choose another name." },
    { status: 409 }
  );
}

function isHttpsUrl(value: string) {
  if (!value) return true;
  try {
    return new URL(value).protocol === "https:";
  } catch {
    return false;
  }
}

const updateShopSchema = z.object({
  name: z.string().trim().min(1).max(80),
  tagline: z.string().trim().max(200).optional().default(""),
  primaryColor: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  logoUrl: z
    .string()
    .trim()
    .max(2000)
    .refine(isHttpsUrl, "Logo URL must use HTTPS.")
    .optional()
    .default(""),
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
  const parsed = updateShopSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Please check your shop details." }, { status: 400 });
  }

  const updated = await prisma.shop.update({
    where: { id: shop.id },
    data: parsed.data,
  });

  return NextResponse.json(updated);
}
