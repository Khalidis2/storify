import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getShopForUser } from "@/lib/shop";

const blockSchema = z.object({
  id: z.string(),
  type: z.string(),
  props: z.record(z.string(), z.union([z.string(), z.number()])),
});

const saveSchema = z.object({
  blocks: z.array(blockSchema),
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
