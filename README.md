# Storify

Storify is a small Shopify-style app: shop owners sign up, drag-and-drop
build their homepage, list products, and publish a live storefront that
customers can actually buy from.

## Stack

- **Next.js 16** (App Router, TypeScript, Tailwind CSS)
- **Prisma 6 + Postgres** — works with any hosted Postgres, e.g. a free
  [Neon](https://neon.tech) instance
- **NextAuth v5** — email/password login via a Credentials provider
- **dnd-kit** — the drag-and-drop page builder
- **Vercel Blob** — real image uploads (falls back to pasting a URL if not configured)
- **Stripe Checkout** — cart + real payments

## Getting started

```bash
npm install
npx prisma migrate dev   # applies the schema to your database
npm run db:seed          # seeds the three pricing plans
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Environment variables live in `.env` (not committed — create your own):

```
DATABASE_URL="postgresql://user:password@host/dbname?sslmode=require"
AUTH_SECRET="…"
BLOB_READ_WRITE_TOKEN="…"       # from a Vercel Blob store (public access)
STRIPE_SECRET_KEY="sk_test_…"
STRIPE_WEBHOOK_SECRET="whsec_…"
CRON_SECRET="…"                    # random secret used by Vercel Cron
```

All four of the above are optional for local dev — the app degrades
gracefully without them (image upload shows a clear error and falls back
to pasting a URL; checkout shows "checkout isn't configured" instead of
crashing). `AUTH_SECRET` you should still set: `npx auth secret`, or
`openssl rand -base64 32`.

## Deploying (Vercel)

1. Import the GitHub repo into Vercel (Next.js is auto-detected).
2. In Project → Settings → Environment Variables, add for **Production**:
   `DATABASE_URL`, `AUTH_SECRET`, and once you're ready for uploads/payments,
   `BLOB_READ_WRITE_TOKEN`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`,
   and `CRON_SECRET`.
   - `BLOB_READ_WRITE_TOKEN` comes from connecting a **public-access** Blob
     store (Storage tab → Create Database → Blob). Must be public — product
     photos are shown to anonymous storefront visitors.
   - Stripe keys come from your Stripe dashboard (test mode is fine to
     start). Create a webhook endpoint pointing at
     `https://<your-domain>/api/webhooks/stripe` listening for
     `checkout.session.completed` and `checkout.session.expired`, and use its
     signing secret for `STRIPE_WEBHOOK_SECRET`.
   - Generate `CRON_SECRET` with `openssl rand -base64 32`. Configure a scheduler to send it as a bearer token in a GET request to
     `/api/cron/reconcile-reservations`.
3. `vercel.json` sets the build command to
   `prisma generate && prisma migrate deploy && tsx prisma/seed.ts && next build`,
   so schema migrations and plan seeding happen automatically on every
   deploy — just redeploy after adding/changing env vars for a fresh build
   to pick them up (existing deployments don't retroactively see new env vars).

## How it fits together

- **Sign up / log in** (`/signup`, `/login`) — NextAuth credentials provider,
  passwords hashed with bcrypt.
- **Dashboard** (`/dashboard/*`, auth-gated by `src/proxy.ts`) — first-time
  users are prompted to name their shop, which creates a `Shop` + a starter
  `Page` (hero, product grid, footer).
- **Page builder** (`/dashboard/builder`) — add, reorder (drag handle),
  duplicate, undo/redo, and edit sections inline by clicking their text on
  the canvas. Twelve block types (hero, banner, text, image, image+text,
  product grid, testimonial, FAQ, video, social links, spacer, footer) live
  in `src/lib/blocks.ts`; the same `BlockRenderer` component renders both
  the live builder preview and the public storefront, so what you see is
  what ships. Images upload via Vercel Blob with a click-to-set focal point
  for how they crop.
- **Products** (`/dashboard/products`) — CRUD with image upload + focal point,
  price, stock.
- **Publish** (`/dashboard/publish`) — shows pricing plans (seeded; the plan
  chosen isn't billed yet — that's a separate step from the storefront's own
  Stripe checkout) and requires the shop owner to already be logged in;
  picking a plan flips the shop to published and gives them their live URL.
- **Storefront** (`/store/[slug]`) — public, renders the saved layout for any
  shop with `published = true`. Has a cart (localStorage-backed) with an
  "Add to cart" button on every product, a cart drawer, and a Checkout
  button that creates a Stripe Checkout Session.
- **Orders** (`/dashboard/orders`) — shop owner sees every order, its status
  (pending until Stripe confirms payment via webhook, then paid), items,
  and total. The webhook also decrements product stock on payment.

## Project structure

```
prisma/schema.prisma       Data model: User, Shop, Page, Product, Plan, Order, OrderItem
prisma/seed.ts             Seeds the Starter/Growth/Pro plans
src/auth.ts                NextAuth config (credentials provider)
src/proxy.ts               Route protection for /dashboard/*
src/lib/blocks.ts           Block type registry (add new block types here)
src/lib/stripe.ts           Stripe client (returns null if unconfigured)
src/lib/prisma.ts           Prisma client singleton
src/components/builder/     Drag-and-drop editor (dnd-kit)
src/components/block-renderer.tsx   Shared renderer (builder + storefront)
src/components/storefront/  Cart context, cart drawer, add-to-cart button
src/app/dashboard/*         Authenticated app
src/app/store/[slug]/       Public storefront
src/app/api/checkout/       Creates the Stripe Checkout Session
src/app/api/webhooks/stripe/  Confirms payment, decrements stock
src/app/api/*               Other route handlers backing the dashboard
```

## Notes / next steps

- One page per shop (`home`) in v1 — the `Page` model already supports
  multiple pages/slugs per shop if you want to add more later.
- No individual product detail pages yet — "Add to cart" happens straight
  from the grid tile.
- No customer accounts — orders are tracked by Stripe session + email only,
  no login required to buy.
- No shipping rates/tax — Stripe Checkout session is a flat `price_data`
  line-item total; add `shipping_options`/Stripe Tax if you need those.
