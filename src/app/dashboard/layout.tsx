import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getShopForUser } from "@/lib/shop";
import { SignOutButton } from "@/components/sign-out-button";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Overview" },
  { href: "/dashboard/builder", label: "Page builder" },
  { href: "/dashboard/products", label: "Products" },
  { href: "/dashboard/settings", label: "Settings" },
  { href: "/dashboard/publish", label: "Publish" },
];

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const shop = await getShopForUser(session.user.id);

  return (
    <div className="flex min-h-screen flex-1 bg-zinc-50">
      <aside className="hidden w-60 shrink-0 border-r border-zinc-200 bg-white sm:flex sm:flex-col">
        <div className="border-b border-zinc-200 px-6 py-5">
          <Link href="/" className="text-lg font-bold text-zinc-900">
            Storify
          </Link>
          {shop && (
            <p className="mt-1 truncate text-xs text-zinc-500">{shop.name}</p>
          )}
        </div>
        <nav className="flex flex-1 flex-col gap-1 px-3 py-4">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={shop ? item.href : "/dashboard"}
              className="rounded-lg px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100 aria-disabled:pointer-events-none aria-disabled:opacity-40"
              aria-disabled={!shop && item.href !== "/dashboard"}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="border-t border-zinc-200 px-6 py-4">
          <p className="truncate text-xs text-zinc-500">{session.user.email}</p>
          <div className="mt-2">
            <SignOutButton />
          </div>
        </div>
      </aside>

      <div className="flex flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-zinc-200 bg-white px-6 py-4 sm:hidden">
          <span className="text-lg font-bold text-zinc-900">Storify</span>
          <SignOutButton />
        </header>
        <main className="flex-1 px-6 py-8 sm:px-10">{children}</main>
      </div>
    </div>
  );
}
