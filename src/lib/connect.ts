import type Stripe from "stripe";
import { prisma } from "@/lib/prisma";

export async function syncConnectedAccount(
  stripe: Stripe,
  shopId: string,
  accountId: string
) {
  const account = await stripe.v2.core.accounts.retrieve(accountId, {
    include: ["configuration.recipient"],
  });

  if (account.closed) {
    await prisma.shop.update({
      where: { id: shopId },
      data: {
        stripeAccountId: null,
        stripeChargesEnabled: false,
        stripePayoutsEnabled: false,
      },
    });
    return { connected: false, chargesEnabled: false, payoutsEnabled: false };
  }

  const stripeBalance =
    account.configuration?.recipient?.capabilities?.stripe_balance;
  const status = {
    connected: true,
    chargesEnabled: stripeBalance?.stripe_transfers?.status === "active",
    payoutsEnabled: stripeBalance?.payouts?.status === "active",
  };

  await prisma.shop.update({
    where: { id: shopId },
    data: {
      stripeChargesEnabled: status.chargesEnabled,
      stripePayoutsEnabled: status.payoutsEnabled,
    },
  });

  return status;
}
