import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getShopForUser } from "@/lib/shop";
import { slugify } from "@/lib/slug";
import { defaultLayout } from "@/lib/blocks";

const createShopSchema = z.object({
  name: z.string().min(1).max(80),
});

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const existing = await getShopForUser(session.user.id);
  if (existing) {
    return NextResponse.json({ error: "You already have a shop." }, { status: 409 });
  }

  const body = await request.json().catch(() => null);
  const parsed = createShopSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Please enter a shop name." }, { status: 400 });
  }

  const baseSlug = slugify(parsed.data.name);
  let slug = baseSlug;
  let suffix = 1;
  while (await prisma.shop.findUnique({ where: { slug } })) {
    suffix += 1;
    slug = `${baseSlug}-${suffix}`;
  }

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
}

const updateShopSchema = z.object({
  name: z.string().min(1).max(80),
  tagline: z.string().max(200).optional().default(""),
  primaryColor: z.string().min(1).max(20),
  logoUrl: z.string().max(2000).optional().default(""),
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
