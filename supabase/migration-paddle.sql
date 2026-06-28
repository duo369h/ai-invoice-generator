-- Migration to implement subscription entitlement system in Corvioz
-- Run this manually inside the Supabase Dashboard SQL Editor

-- 1. Extend profiles table with paddle_customer_id
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS paddle_customer_id TEXT DEFAULT '';

-- 2. Create/Update subscriptions table
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  paddle_subscription_id TEXT DEFAULT '',
  paddle_price_id TEXT DEFAULT '',
  price_id TEXT DEFAULT '', -- backward compatibility
  status TEXT DEFAULT 'active',
  plan TEXT DEFAULT 'free',
  current_period_start TIMESTAMPTZ DEFAULT NOW(),
  current_period_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure all columns exist on public.subscriptions (in case table was partially created)
ALTER TABLE public.subscriptions ADD COLUMN IF NOT EXISTS paddle_subscription_id TEXT DEFAULT '';
ALTER TABLE public.subscriptions ADD COLUMN IF NOT EXISTS paddle_price_id TEXT DEFAULT '';
ALTER TABLE public.subscriptions ADD COLUMN IF NOT EXISTS price_id TEXT DEFAULT '';
ALTER TABLE public.subscriptions ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';
ALTER TABLE public.subscriptions ADD COLUMN IF NOT EXISTS plan TEXT DEFAULT 'free';
ALTER TABLE public.subscriptions ADD COLUMN IF NOT EXISTS current_period_end TIMESTAMPTZ;
ALTER TABLE public.subscriptions ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Remove constraints that might conflict
ALTER TABLE public.subscriptions DROP CONSTRAINT IF EXISTS subscriptions_plan_check;
ALTER TABLE public.subscriptions DROP CONSTRAINT IF EXISTS subscriptions_status_check;

-- 3. Create/Update entitlements table
DROP TABLE IF EXISTS public.entitlements CASCADE;
CREATE TABLE public.entitlements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  plan TEXT NOT NULL DEFAULT 'free',
  export_pdf BOOLEAN DEFAULT false,
  client_portal BOOLEAN DEFAULT false,
  crm BOOLEAN DEFAULT false,
  automation BOOLEAN DEFAULT false,
  advanced_invoicing BOOLEAN DEFAULT false,
  unlimited_invoices BOOLEAN DEFAULT false,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Safe migration for existing deployments: add unlimited_invoices if it doesn't exist
ALTER TABLE public.entitlements ADD COLUMN IF NOT EXISTS unlimited_invoices BOOLEAN DEFAULT false;

-- 4. Create/Update billing_events table
DROP TABLE IF EXISTS public.billing_events CASCADE;
CREATE TABLE public.billing_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id TEXT UNIQUE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  event_type TEXT,
  payload JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Enable Row Level Security (RLS)
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.entitlements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.billing_events ENABLE ROW LEVEL SECURITY;

-- 6. Establish RLS Policies
DROP POLICY IF EXISTS "Users can view own subscriptions" ON public.subscriptions;
CREATE POLICY "Users can view own subscriptions"
  ON public.subscriptions FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view own entitlements" ON public.entitlements;
CREATE POLICY "Users can view own entitlements"
  ON public.entitlements FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view own billing events" ON public.billing_events;
CREATE POLICY "Users can view own billing events"
  ON public.billing_events FOR SELECT USING (auth.uid() = user_id);

-- 7. Grant Schema and Table permissions to Supabase Roles
GRANT USAGE ON SCHEMA public TO anon, authenticated;

GRANT SELECT ON public.subscriptions TO authenticated;
GRANT SELECT ON public.entitlements TO authenticated;
GRANT SELECT ON public.billing_events TO authenticated;

GRANT ALL PRIVILEGES ON public.subscriptions TO service_role;
GRANT ALL PRIVILEGES ON public.entitlements TO service_role;
GRANT ALL PRIVILEGES ON public.billing_events TO service_role;

-- 8. Create Pricing Plans Table (v1.6)
CREATE TABLE IF NOT EXISTS public.pricing_plans (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  price_monthly NUMERIC(10, 2) NOT NULL,
  price_yearly NUMERIC(10, 2) NOT NULL,
  paddle_monthly_price_id TEXT,
  paddle_yearly_price_id TEXT,
  features JSONB DEFAULT '[]'::jsonb,
  badge_text TEXT,
  active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.pricing_plans ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read access to active pricing plans" ON public.pricing_plans;
CREATE POLICY "Allow public read access to active pricing plans"
  ON public.pricing_plans FOR SELECT USING (active = true);

GRANT SELECT ON public.pricing_plans TO anon, authenticated;
GRANT ALL PRIVILEGES ON public.pricing_plans TO service_role;

-- 9. Seed Initial Pricing Plans (4-tier: Free / Pro / Growth / Studio)
INSERT INTO public.pricing_plans (id, name, description, price_monthly, price_yearly, paddle_monthly_price_id, paddle_yearly_price_id, features, badge_text, display_order, active)
VALUES
  (
    'free',
    'Free',
    'Try the core tools before you commit.',
    0.00,
    0.00,
    '',
    '',
    '["3 invoices total", "2 clients max", "Watermark PDF export", "Public freelancer profile", "Quote creation"]'::jsonb,
    'Try',
    1,
    true
  ),
  (
    'pro',
    'Pro',
    'You are managing freelance work. Run your billing smoothly with a polished brand.',
    12.00,
    10.00,
    'pri_pro_placeholder',
    'pri_pro_yearly_placeholder',
    '["Unlimited invoices", "Unlimited quotes", "Client portal", "SEO public profile", "Clean PDF export (no watermark)", "Manual payment status tracking"]'::jsonb,
    'Recommended',
    2,
    true
  ),
  (
    'growth',
    'Growth',
    'You are scaling up. Automate your workflow and keep every client relationship on track.',
    19.00,
    16.00,
    'pri_growth_placeholder',
    'pri_growth_yearly_placeholder',
    '["Everything in Pro", "Batch invoice generation", "Email reminders & follow-ups", "Workflow automation", "Advanced client tracking"]'::jsonb,
    'Popular',
    3,
    true
  ),
  (
    'studio',
    'Studio',
    'You are running client operations at scale. Full white-label control and priority support.',
    29.00,
    24.00,
    'pri_agency_placeholder',
    'pri_agency_yearly_placeholder',
    '["Everything in Growth", "Custom domain & white-label branding", "Multi-client workflow management", "Priority support", "Advanced automation & bulk exports"]'::jsonb,
    'Scale',
    4,
    true
  )
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price_monthly = EXCLUDED.price_monthly,
  price_yearly = EXCLUDED.price_yearly,
  paddle_monthly_price_id = COALESCE(
    NULLIF(EXCLUDED.paddle_monthly_price_id, 'pri_pro_placeholder'),
    NULLIF(EXCLUDED.paddle_monthly_price_id, 'pri_growth_placeholder'),
    NULLIF(EXCLUDED.paddle_monthly_price_id, 'pri_agency_placeholder'),
    pricing_plans.paddle_monthly_price_id
  ),
  paddle_yearly_price_id = COALESCE(
    NULLIF(EXCLUDED.paddle_yearly_price_id, 'pri_pro_yearly_placeholder'),
    NULLIF(EXCLUDED.paddle_yearly_price_id, 'pri_growth_yearly_placeholder'),
    NULLIF(EXCLUDED.paddle_yearly_price_id, 'pri_agency_yearly_placeholder'),
    pricing_plans.paddle_yearly_price_id
  ),
  features = EXCLUDED.features,
  badge_text = EXCLUDED.badge_text,
  display_order = EXCLUDED.display_order,
  active = EXCLUDED.active,
  updated_at = NOW();



