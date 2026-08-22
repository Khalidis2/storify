ALTER TABLE "Shop"
ADD COLUMN "stripeAccountId" TEXT,
ADD COLUMN "stripeChargesEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "stripePayoutsEnabled" BOOLEAN NOT NULL DEFAULT false;

CREATE UNIQUE INDEX "Shop_stripeAccountId_key" ON "Shop"("stripeAccountId");

ALTER TABLE "Order"
ADD COLUMN "stripeAccountId" TEXT;
