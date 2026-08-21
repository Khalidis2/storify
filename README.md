# Storify

Storify is a small Shopify-style app: shop owners sign up, drag-and-drop
build their homepage, list products, and publish a live storefront.

## Stack

- **Next.js 16** (App Router, TypeScript, Tailwind CSS)
- **Prisma 6 + SQLite** — zero-config local database (swap the `DATABASE_URL`
  for a hosted Postgres URL, e.g. a free [Neon](https://neon.tech) instance,
  when deploying)
- **NextAuth v5** — email/password login via a Credentials provider
- **dnd-kit** — the drag-and-drop page builder

## Getting started

```bash
npm install
npx prisma migrate dev   # creates prisma/dev.db and applies the schema
npm run db:seed          # seeds the three pricing plans
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Environment variables live in `.env` (already present for local dev):

```
DATABASE_URL="file:./dev.db"
AUTH_SECRET="dev-secret-change-me-in-production-please"
```

Generate a real `AUTH_SECRET` for any non-local deployment: `npx auth secret`.

## How it fits together

- **Sign up / log in** (`/signup`, `/login`) — NextAuth credentials provider,
  passwords hashed with bcrypt.
- **Dashboard** (`/dashboard/*`, auth-gated by `src/proxy.ts`) — first-time
  users are prompted to name their shop, which creates a `Shop` + a starter
  `Page` (hero, product grid, footer).
- **Page builder** (`/dashboard/builder`) — add, reorder (drag handle), and
  edit sections (hero, banner, text, image, product grid, spacer, footer).
  Block definitions and their editable fields live in `src/lib/blocks.ts`;
  the same `BlockRenderer` component renders both the live builder preview
  and the public storefront, so what you see is what ships.
- **Products** (`/dashboard/products`) — simple CRUD (title, description,
  price, image URL, stock).
- **Publish** (`/dashboard/publish`) — shows pricing plans (seeded, no real
  billing yet) and requires the shop owner to already be logged in; picking
  a plan flips the shop to published and gives them their live URL.
- **Storefront** (`/store/[slug]`) — public, renders the saved layout for
  any shop with `published = true`.

## Project structure

```
prisma/schema.prisma       Data model: User, Shop, Page, Product, Plan
prisma/seed.ts             Seeds the Starter/Growth/Pro plans
src/auth.ts                NextAuth config (credentials provider)
src/proxy.ts               Route protection for /dashboard/*
src/lib/blocks.ts           Block type registry (add new block types here)
src/lib/prisma.ts           Prisma client singleton
src/components/builder/     Drag-and-drop editor (dnd-kit)
src/components/block-renderer.tsx   Shared renderer (builder + storefront)
src/app/dashboard/*         Authenticated app
src/app/store/[slug]/       Public storefront
src/app/api/*               Route handlers backing the dashboard
```

## Notes / next steps

- One page per shop (`home`) in v1 — the `Page` model already supports
  multiple pages/slugs per shop if you want to add more later.
- Images are referenced by URL; there's no file upload yet.
- Publishing doesn't charge a real card — `Plan` rows exist but there's no
  Stripe integration. Wiring that up would replace the plan-select step in
  `src/components/publish-flow.tsx` with a real checkout.
- For production, move `DATABASE_URL` to a hosted Postgres instance and
  change the `datasource` provider in `prisma/schema.prisma` from `sqlite`
  to `postgresql`.
