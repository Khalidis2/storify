import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getShopForUser } from "@/lib/shop";
import { getStripe } from "@/lib/stripe";
import { getSiteUrl } from "@/lib/site-url";

function onboardingErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message.slice(0, 500);
  }
  return "Stripe onboarding failed.";
}

export async function POST() {
  try {
    const session = await auth();
    if (!session?.user?.id || !session.user.email) {
      return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
    }

    const stripe = getStripe();
    if (!stripe) {
      return NextResponse.json(
        { error: "Stripe is not configured." },
        { status: 503 }
      );
    }

    const shop = await getShopForUser(session.user.id);
    if (!shop) {
      return NextResponse.json({ error: "Shop not found." }, { status: 404 });
    }

    let accountId = shop.stripeAccountId;
    if (!accountId) {
      const account = await stripe.v2.core.accounts.create({
        contact_email: session.user.email,
        display_name: shop.name,
        dashboard: "express",
        identity: {
          country: "ae",
        },
        configuration: {
          recipient: {
            capabilities: {
              stripe_balance: {
                stripe_transfers: { requested: true },
              },
            },
          },
        },
        defaults: {
          currency: "aed",
          profile: {
            business_url: `${getSiteUrl()}/store/${shop.slug}`,
          },
          responsibilities: {
            fees_collector: "application",
            losses_collector: "application",
          },
        },
        include: ["configuration.recipient"],
        metadata: { shopId: shop.id },
      });
      accountId = account.id;

      await prisma.shop.update({
        where: { id: shop.id },
        data: {
          stripeAccountId: accountId,
          stripeChargesEnabled: false,
          stripePayoutsEnabled: false,
        },
      });
    }

    const origin = getSiteUrl();
    const link = await stripe.v2.core.accountLinks.create({
      account: accountId,
      use_case: {
        type: "account_onboarding",
        account_onboarding: {
          configurations: ["recipient"],
          collection_options: {
            fields: "eventually_due",
            future_requirements: "include",
          },
          refresh_url: `${origin}/dashboard/settings?connect=refresh`,
          return_url: `${origin}/dashboard/settings?connect=complete`,
        },
      },
    });

    return NextResponse.json({ url: link.url });
  } catch (error) {
    const message = onboardingErrorMessage(error);
    console.error("Stripe Connect onboarding failed", { message, error });
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
