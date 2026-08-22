import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getShopForUser } from "@/lib/shop";
import { getStripe } from "@/lib/stripe";
import { syncConnectedAccount } from "@/lib/connect";

function dashboardErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message.slice(0, 500);
  }
  return "Could not open Stripe Express.";
}

export async function POST() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
    }

    const shop = await getShopForUser(session.user.id);
    if (!shop?.stripeAccountId) {
      return NextResponse.json(
        { error: "Stripe account not connected." },
        { status: 404 }
      );
    }

    const stripe = getStripe();
    if (!stripe) {
      return NextResponse.json(
        { error: "Stripe is not configured." },
        { status: 503 }
      );
    }

    const status = await syncConnectedAccount(
      stripe,
      shop.id,
      shop.stripeAccountId
    );
    if (!status.chargesEnabled || !status.payoutsEnabled) {
      return NextResponse.json(
        { error: "Complete Stripe setup before opening Stripe Express." },
        { status: 409 }
      );
    }

    const link = await stripe.accounts.createLoginLink(shop.stripeAccountId);
    return NextResponse.json({ url: link.url });
  } catch (error) {
    const message = dashboardErrorMessage(error);
    console.error("Stripe Express login failed", { message, error });
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
