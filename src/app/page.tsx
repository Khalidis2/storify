import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-1 flex-col bg-zinc-50">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-6">
        <span className="text-xl font-bold tracking-tight text-zinc-900">
          Storify
        </span>
        <nav className="flex items-center gap-4">
          <Link
            href="/login"
            className="text-sm font-medium text-zinc-700 hover:text-zinc-900"
          >
            Log in
          </Link>
          <Link
            href="/signup"
            className="rounded-full bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700"
          >
            Start your shop
          </Link>
        </nav>
      </header>

      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col items-center justify-center px-6 py-16 text-center">
        <h1 className="max-w-2xl text-4xl font-bold tracking-tight text-zinc-900 sm:text-6xl">
          Build your shop&rsquo;s website in minutes
        </h1>
        <p className="mt-6 max-w-xl text-lg text-zinc-600">
          Drag, drop, and customize your storefront. List your products.
          Publish when you&rsquo;re ready — no code required.
        </p>
        <div className="mt-10 flex items-center gap-4">
          <Link
            href="/signup"
            className="rounded-full bg-zinc-900 px-6 py-3 text-base font-medium text-white hover:bg-zinc-700"
          >
            Create your shop — free
          </Link>
          <Link
            href="/login"
            className="rounded-full border border-zinc-300 px-6 py-3 text-base font-medium text-zinc-900 hover:bg-zinc-100"
          >
            Log in
          </Link>
        </div>

        <div className="mt-20 grid w-full grid-cols-1 gap-6 sm:grid-cols-3">
          {[
            {
              title: "Drag & drop builder",
              body: "Design your homepage visually — hero banners, product grids, images, and more.",
            },
            {
              title: "List your products",
              body: "Add products with photos, prices, and descriptions in seconds.",
            },
            {
              title: "Publish when ready",
              body: "Pick a plan, create your account, and your storefront goes live at your own URL.",
            },
          ].map((f) => (
            <div
              key={f.title}
              className="rounded-2xl border border-zinc-200 bg-white p-6 text-left shadow-sm"
            >
              <h3 className="font-semibold text-zinc-900">{f.title}</h3>
              <p className="mt-2 text-sm text-zinc-600">{f.body}</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
