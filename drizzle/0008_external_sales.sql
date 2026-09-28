ALTER TABLE "public"."sales"
  ADD COLUMN IF NOT EXISTS "externalSales" numeric(12, 2) DEFAULT '0.00' NOT NULL;
