ALTER TABLE "Order"
    ALTER COLUMN "stripeSessionId" DROP NOT NULL,
    ADD COLUMN "reservedAt" TIMESTAMP(3),
    ADD COLUMN "expiresAt" TIMESTAMP(3);

CREATE INDEX "Order_status_expiresAt_idx" ON "Order"("status", "expiresAt");
