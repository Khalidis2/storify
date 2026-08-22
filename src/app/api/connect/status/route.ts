import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getShopForUser } from "@/lib/shop";
import { getStripe } from "@/lib/stripe";
import { syncConnectedAccount } from "@/lib/connect";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const shop = await getShopForUser(session.user.id);
  if (!shop) {
    return NextResponse.json({ error: "Shop not found." }, { status: 404 });
  }
  if (!shop.stripeAccountId) {
    return NextResponse.json({
      connected: false,
      chargesEnabled: false,
      payoutsEnabled: false,
    });
  }

  const stripe = getStripe();
  if (!stripe) {
    return NextResponse.json({ error: "Stripe is not configured." }, { status: 503 });
  }

  try {
    return NextResponse.json(
      await syncConnectedAccount(stripe, shop.id, shop.stripeAccountId)
    );
  } catch (error) {
    console.error("Stripe Connect status check failed", {
      shopId: shop.id,
      accountId: shop.stripeAccountId,
      error,
    });
    return NextResponse.json(
      { error: "Could not check Stripe status." },
      { status: 502 }
    );
  }
}
