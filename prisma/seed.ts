import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const plans = [
    {
      name: "Starter",
      priceCents: 0,
      interval: "month",
      sortOrder: 1,
      features: ["Up to 10 products", "1 page", "Storify subdomain"],
    },
    {
      name: "Growth",
      priceCents: 1900,
      interval: "month",
      sortOrder: 2,
      features: ["Unlimited products", "Custom colors & logo", "Priority support"],
    },
    {
      name: "Pro",
      priceCents: 4900,
      interval: "month",
      sortOrder: 3,
      features: ["Everything in Growth", "Custom domain", "Advanced analytics"],
    },
  ];

  for (const plan of plans) {
    const existing = await prisma.plan.findFirst({ where: { name: plan.name } });
    if (existing) {
      await prisma.plan.update({
        where: { id: existing.id },
        data: { ...plan, features: JSON.stringify(plan.features) },
      });
    } else {
      await prisma.plan.create({
        data: { ...plan, features: JSON.stringify(plan.features) },
      });
    }
  }

  console.log(`Seeded ${plans.length} plans.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
