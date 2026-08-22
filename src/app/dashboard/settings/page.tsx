import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getShopForUser } from "@/lib/shop";
import { ShopSettingsForm } from "@/components/shop-settings-form";

export default async function SettingsPage() {
  const session = await auth();
  const shop = await getShopForUser(session!.user.id);

  if (!shop) {
    redirect("/dashboard");
  }

  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold text-zinc-900">Shop settings</h1>
      <ShopSettingsForm
        initial={{
          name: shop.name,
          tagline: shop.tagline ?? "",
          primaryColor: shop.primaryColor,
          logoUrl: shop.logoUrl ?? "",
          currency: shop.currency,
          fulfillmentMode: shop.fulfillmentMode,
          shippingFeeCents: shop.shippingFeeCents,
          shippingPolicy: shop.shippingPolicy ?? "",
          returnPolicy: shop.returnPolicy ?? "",
        }}
      />
    </div>
  );
}
