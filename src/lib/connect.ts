import type Stripe from "stripe";
import { prisma } from "@/lib/prisma";

export async function syncConnectedAccount(
  stripe: Stripe,
  shopId: string,
  accountId: string
) {
  const account = await stripe.accounts.retrieve(accountId);
  if (account.deleted) {
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

  const status = {
    connected: true,
    chargesEnabled: account.charges_enabled,
    payoutsEnabled: account.payouts_enabled,
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
