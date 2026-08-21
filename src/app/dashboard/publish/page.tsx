import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getShopForUser } from "@/lib/shop";
import { PublishFlow } from "@/components/publish-flow";

export default async function PublishPage() {
  const session = await auth();
  const shop = await getShopForUser(session!.user.id);

  if (!shop) {
    redirect("/dashboard");
  }

  const plans = await prisma.plan.findMany({ orderBy: { sortOrder: "asc" } });

  return (
    <PublishFlow
      plans={plans.map((p) => ({
        id: p.id,
        name: p.name,
        priceCents: p.priceCents,
        interval: p.interval,
        features: JSON.parse(p.features),
      }))}
      shopSlug={shop.slug}
      published={shop.published}
      currentPlanId={shop.planId}
    />
  );
}
