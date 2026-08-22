import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getShopForUser } from "@/lib/shop";
import { getStripe } from "@/lib/stripe";
import { getSiteUrl } from "@/lib/site-url";

export async function POST() {
  try {
    const session = await auth();
      if (!session?.user?.id || !session.user.email) {
        return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
      }
    
      const stripe = getStripe();
      if (!stripe) {
        return NextResponse.json({ error: "Stripe is not configured." }, { status: 503 });
      }
    
      const shop = await getShopForUser(session.user.id);
      if (!shop) {
        return NextResponse.json({ error: "Shop not found." }, { status: 404 });
      }
    
      let accountId = shop.stripeAccountId;
      if (!accountId) {
        const account = await stripe.accounts.create({
          country: "AE",
          email: session.user.email,
          business_profile: {
            name: shop.name,
            url: `${getSiteUrl()}/store/${shop.slug}`,
          },
          controller: {
            fees: { payer: "application" },
            losses: { payments: "application" },
            stripe_dashboard: { type: "express" },
          },
          metadata: { shopId: shop.id },
        });
        accountId = account.id;
    
        await prisma.shop.update({
          where: { id: shop.id },
          data: {
            stripeAccountId: accountId,
            stripeChargesEnabled: account.charges_enabled,
            stripePayoutsEnabled: account.payouts_enabled,
          },
        });
      }
    
      const origin = getSiteUrl();
      const link = await stripe.accountLinks.create({
        account: accountId,
        refresh_url: `${origin}/dashboard/settings?connect=refresh`,
        return_url: `${origin}/dashboard/settings?connect=complete`,
        type: "account_onboarding",
      });
    
      return NextResponse.json({ url: link.url });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message.slice(0, 500)
        : "Stripe onboarding failed.";

    console.error("Stripe Connect onboarding failed", { message, error });

    return NextResponse.json(
      { error: message },
      { status: 502 }
    );
  }
}
