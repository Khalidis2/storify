import { prisma } from "@/lib/prisma";

export function getShopForUser(userId: string) {
  return prisma.shop.findFirst({
    where: { ownerId: userId },
    orderBy: { createdAt: "asc" },
  });
}
