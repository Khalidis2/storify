# Storify Platform Roadmap

Storify will evolve as a modular monolith: one deployable Next.js application
with explicit commerce modules and PostgreSQL as the source of truth. Modules
can be extracted into services only when traffic or team ownership requires it.

## Platform modules

1. Identity: merchant accounts, staff, roles, sessions, MFA and audit events.
2. Tenancy: shops, plans, entitlements, custom domains and localization.
3. Catalog: products, variants, SKUs, collections, media and inventory.
4. Content: themes, pages, navigation, revisions and publishing.
5. Pricing: currencies, discounts, coupons, tax classes and price lists.
6. Checkout: carts, reservations, idempotency, shipping and payment sessions.
7. Orders: fulfillment, cancellations, refunds, returns and customer history.
8. Payments: Stripe Connect, reconciliation, disputes and merchant payouts.
9. Customers: profiles, addresses, consent and order tracking.
10. Operations: jobs, webhooks, notifications, observability and administration.

## Delivery order

### Phase 1: transaction safety

- Idempotent checkout creation
- Reservation reconciliation
- Payment and order reconciliation
- Refund and cancellation state machines
- Integration and concurrency tests

### Phase 2: catalog foundation

- Product variants and SKUs
- Collections and categories
- Inventory ledger and adjustments
- Product media lifecycle
- CSV import and export

### Phase 3: UAE commerce

- VAT-inclusive and VAT-exclusive pricing
- Tax invoices and credit notes
- Shipping zones, rates and pickup locations
- Order email notifications
- Merchant policies and return workflows

### Phase 4: SaaS platform

- Storify subscription billing
- Plan entitlements
- Staff roles and permissions
- Custom domains
- Analytics and merchant administration

### Phase 5: ecosystem and scale

- Public APIs and webhooks
- App authorization and extension points
- Background job infrastructure
- Multi-region operations and disaster recovery
- Fraud, risk and support tooling

## Engineering rules

- Every money-moving request is idempotent.
- Every external webhook is authenticated, persisted and replayable.
- Inventory changes are transactional and auditable.
- Tenant ownership is enforced server-side on every private resource.
- Database changes use backward-compatible migrations.
- CI runs type generation, strict TypeScript checks and tests.
- Production builds never mutate the database.
