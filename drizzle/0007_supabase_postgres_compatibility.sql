DO $$ BEGIN
  CREATE TYPE payment_status AS ENUM ('no_payment', 'initial_payment', 'fully_paid');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE payment_method AS ENUM ('cash', 'gcash', 'bank_transfer', 'card', 'other');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE client_status AS ENUM ('no_status', 'shipped', 'delivered', 'returned');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE public.sales
  ADD COLUMN IF NOT EXISTS "paymentStatus" payment_status NOT NULL DEFAULT 'no_payment',
  ADD COLUMN IF NOT EXISTS "initialPaymentAmount" numeric(12, 2) NOT NULL DEFAULT 0.00,
  ADD COLUMN IF NOT EXISTS "paymentDate" date,
  ADD COLUMN IF NOT EXISTS "paymentMethod" payment_method,
  ADD COLUMN IF NOT EXISTS "clientStatus" client_status NOT NULL DEFAULT 'no_status',
  ADD COLUMN IF NOT EXISTS "commissionAmount" numeric(12, 2) NOT NULL DEFAULT 0.00,
  ADD COLUMN IF NOT EXISTS "deletedAt" timestamp without time zone,
  ADD COLUMN IF NOT EXISTS "deletedBy" integer,
  ADD COLUMN IF NOT EXISTS "deleteReason" varchar(255);

CREATE INDEX IF NOT EXISTS sales_agent_date_idx ON public.sales ("agentId", "saleDate");
CREATE INDEX IF NOT EXISTS sales_date_idx ON public.sales ("saleDate");
CREATE INDEX IF NOT EXISTS audit_target_idx ON public.audit_logs ("targetUserId", "createdAt");
CREATE INDEX IF NOT EXISTS audit_admin_idx ON public.audit_logs ("adminId", "createdAt");
