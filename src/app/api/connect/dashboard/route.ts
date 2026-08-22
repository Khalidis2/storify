import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getShopForUser } from "@/lib/shop";
import { getStripe } from "@/lib/stripe";

export async function POST() {
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
    return NextResponse.json({ error: "Stripe is not configured." }, { status: 503 });
  }

  const link = await stripe.accounts.createLoginLink(shop.stripeAccountId);
  return NextResponse.json({ url: link.url });
}
