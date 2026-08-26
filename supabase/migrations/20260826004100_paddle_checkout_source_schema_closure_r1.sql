SET lock_timeout = '10s';

-- Paddle checkout writes starter and paid plan state to the live profile.
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_plan_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_plan_check
  CHECK (plan IN ('free', 'starter', 'pro', 'agency', 'studio'));

-- One current subscription and one checkout billing cycle per user.
ALTER TABLE public.subscriptions ADD COLUMN IF NOT EXISTS billing_interval TEXT;
ALTER TABLE public.subscriptions DROP CONSTRAINT IF EXISTS subscriptions_plan_check;
ALTER TABLE public.subscriptions ADD CONSTRAINT subscriptions_plan_check
  CHECK (plan IN ('free', 'starter', 'pro', 'agency', 'studio'));
ALTER TABLE public.subscriptions DROP CONSTRAINT IF EXISTS subscriptions_status_check;
ALTER TABLE public.subscriptions ADD CONSTRAINT subscriptions_status_check
  CHECK (status IN ('active', 'canceled', 'past_due', 'trialing', 'incomplete', 'unpaid'));
ALTER TABLE public.subscriptions DROP CONSTRAINT IF EXISTS subscriptions_billing_interval_check;
ALTER TABLE public.subscriptions ADD CONSTRAINT subscriptions_billing_interval_check
  CHECK (billing_interval IN ('monthly', 'yearly') OR billing_interval IS NULL);
CREATE UNIQUE INDEX IF NOT EXISTS subscriptions_user_id_unique
  ON public.subscriptions(user_id);

-- The webhook writes the complete entitlement contract returned by
-- lib/entitlements.ts. Keep defaults and checks database-authoritative.
CREATE TABLE IF NOT EXISTS public.entitlements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  plan TEXT NOT NULL DEFAULT 'free',
  invoice BOOLEAN NOT NULL DEFAULT false,
  quote BOOLEAN NOT NULL DEFAULT false,
  export_pdf BOOLEAN NOT NULL DEFAULT false,
  pdf_branding TEXT NOT NULL DEFAULT 'branded',
  client_portal BOOLEAN NOT NULL DEFAULT false,
  client_approval BOOLEAN NOT NULL DEFAULT false,
  approval_scope TEXT NOT NULL DEFAULT 'none',
  crm BOOLEAN NOT NULL DEFAULT false,
  automation BOOLEAN NOT NULL DEFAULT false,
  advanced_invoicing BOOLEAN NOT NULL DEFAULT false,
  unlimited_invoices BOOLEAN NOT NULL DEFAULT false,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.entitlements ADD COLUMN IF NOT EXISTS invoice BOOLEAN DEFAULT false;
ALTER TABLE public.entitlements ADD COLUMN IF NOT EXISTS quote BOOLEAN DEFAULT false;
ALTER TABLE public.entitlements ADD COLUMN IF NOT EXISTS pdf_branding TEXT DEFAULT 'branded';
ALTER TABLE public.entitlements ADD COLUMN IF NOT EXISTS client_approval BOOLEAN DEFAULT false;
ALTER TABLE public.entitlements ADD COLUMN IF NOT EXISTS approval_scope TEXT DEFAULT 'none';
ALTER TABLE public.entitlements ADD COLUMN IF NOT EXISTS unlimited_invoices BOOLEAN DEFAULT false;
UPDATE public.entitlements
SET invoice = COALESCE(invoice, false),
    quote = COALESCE(quote, false),
    export_pdf = COALESCE(export_pdf, false),
    pdf_branding = COALESCE(pdf_branding, 'branded'),
    client_portal = COALESCE(client_portal, false),
    client_approval = COALESCE(client_approval, false),
    approval_scope = COALESCE(approval_scope, 'none'),
    crm = COALESCE(crm, false),
    automation = COALESCE(automation, false),
    advanced_invoicing = COALESCE(advanced_invoicing, false),
    unlimited_invoices = COALESCE(unlimited_invoices, false)
WHERE invoice IS NULL
   OR quote IS NULL
   OR export_pdf IS NULL
   OR pdf_branding IS NULL
   OR client_portal IS NULL
   OR client_approval IS NULL
   OR approval_scope IS NULL
   OR crm IS NULL
   OR automation IS NULL
   OR advanced_invoicing IS NULL
   OR unlimited_invoices IS NULL;
ALTER TABLE public.entitlements ALTER COLUMN invoice SET DEFAULT false;
ALTER TABLE public.entitlements ALTER COLUMN quote SET DEFAULT false;
ALTER TABLE public.entitlements ALTER COLUMN export_pdf SET DEFAULT false;
ALTER TABLE public.entitlements ALTER COLUMN pdf_branding SET DEFAULT 'branded';
ALTER TABLE public.entitlements ALTER COLUMN client_portal SET DEFAULT false;
ALTER TABLE public.entitlements ALTER COLUMN client_approval SET DEFAULT false;
ALTER TABLE public.entitlements ALTER COLUMN approval_scope SET DEFAULT 'none';
ALTER TABLE public.entitlements ALTER COLUMN crm SET DEFAULT false;
ALTER TABLE public.entitlements ALTER COLUMN automation SET DEFAULT false;
ALTER TABLE public.entitlements ALTER COLUMN advanced_invoicing SET DEFAULT false;
ALTER TABLE public.entitlements ALTER COLUMN unlimited_invoices SET DEFAULT false;
ALTER TABLE public.entitlements ALTER COLUMN invoice SET NOT NULL;
ALTER TABLE public.entitlements ALTER COLUMN quote SET NOT NULL;
ALTER TABLE public.entitlements ALTER COLUMN export_pdf SET NOT NULL;
ALTER TABLE public.entitlements ALTER COLUMN pdf_branding SET NOT NULL;
ALTER TABLE public.entitlements ALTER COLUMN client_portal SET NOT NULL;
ALTER TABLE public.entitlements ALTER COLUMN client_approval SET NOT NULL;
ALTER TABLE public.entitlements ALTER COLUMN approval_scope SET NOT NULL;
ALTER TABLE public.entitlements ALTER COLUMN crm SET NOT NULL;
ALTER TABLE public.entitlements ALTER COLUMN automation SET NOT NULL;
ALTER TABLE public.entitlements ALTER COLUMN advanced_invoicing SET NOT NULL;
ALTER TABLE public.entitlements ALTER COLUMN unlimited_invoices SET NOT NULL;
ALTER TABLE public.entitlements DROP CONSTRAINT IF EXISTS entitlements_plan_check;
ALTER TABLE public.entitlements ADD CONSTRAINT entitlements_plan_check
  CHECK (plan IN ('free', 'starter', 'pro', 'agency', 'studio'));
ALTER TABLE public.entitlements DROP CONSTRAINT IF EXISTS entitlements_pdf_branding_check;
ALTER TABLE public.entitlements ADD CONSTRAINT entitlements_pdf_branding_check
  CHECK (pdf_branding IN ('branded', 'clean'));
ALTER TABLE public.entitlements DROP CONSTRAINT IF EXISTS entitlements_approval_scope_check;
ALTER TABLE public.entitlements ADD CONSTRAINT entitlements_approval_scope_check
  CHECK (approval_scope IN ('none', 'quotes_only'));
CREATE UNIQUE INDEX IF NOT EXISTS entitlements_user_id_unique
  ON public.entitlements(user_id);

CREATE TABLE IF NOT EXISTS public.billing_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id TEXT UNIQUE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  event_type TEXT,
  payload JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
