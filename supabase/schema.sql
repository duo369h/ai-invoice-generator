CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Users (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL,
  name TEXT DEFAULT '',
  avatar_url TEXT DEFAULT '',
  plan TEXT DEFAULT 'free' CHECK (plan IN ('free', 'pro', 'agency', 'studio')),
  paddle_customer_id TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  first_invoice_created_at TIMESTAMPTZ,
  first_client_added_at TIMESTAMPTZ,
  invoice_sent_timestamp TIMESTAMPTZ,
  quote_sent_timestamp TIMESTAMPTZ,
  time_to_first_export INTEGER,
  time_to_first_client_response INTEGER
);

-- Clients
CREATE TABLE IF NOT EXISTS public.clients (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  email TEXT DEFAULT '',
  address TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Invoices
CREATE TABLE IF NOT EXISTS public.invoices (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  invoice_number TEXT NOT NULL,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'pending', 'sent', 'paid', 'overdue', 'approved')),
  doc_type TEXT DEFAULT 'invoice' CHECK (doc_type IN ('invoice', 'receipt', 'quote')),
  client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  -- Client (flat copy for printing)
  client_name TEXT NOT NULL,
  client_email TEXT DEFAULT '',
  client_address TEXT DEFAULT '',
  -- Business
  business_name TEXT DEFAULT '',
  business_email TEXT DEFAULT '',
  business_address TEXT DEFAULT '',
  logo_url TEXT DEFAULT '',
  -- Financial
  currency TEXT DEFAULT 'USD',
  items JSONB DEFAULT '[]',
  subtotal INTEGER DEFAULT 0,       -- in cents
  discount_rate NUMERIC(5,2) DEFAULT 0,
  discount_amount INTEGER DEFAULT 0, -- in cents
  tax_rate NUMERIC(5,2) DEFAULT 0,
  tax_amount INTEGER DEFAULT 0,      -- in cents
  total INTEGER DEFAULT 0,           -- in cents
  -- Dates & terms
  invoice_date DATE DEFAULT CURRENT_DATE,
  due_date DATE,
  payment_terms TEXT DEFAULT 'Net 30',
  notes TEXT DEFAULT '',
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Subscriptions
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  paddle_subscription_id TEXT DEFAULT '',
  paddle_price_id TEXT DEFAULT '',
  price_id TEXT DEFAULT '', -- backward compatibility
  status TEXT DEFAULT 'active',
  plan TEXT DEFAULT 'free',
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Monthly usage tracking
CREATE TABLE IF NOT EXISTS public.usage (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  month TEXT NOT NULL,             -- 'YYYY-MM'
  invoices_created INTEGER DEFAULT 0,
  ai_parses_used INTEGER DEFAULT 0,
  UNIQUE(user_id, month)
);

-- RLS Policies
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usage ENABLE ROW LEVEL SECURITY;

-- Profiles Policies
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'profiles' AND policyname = 'Users can view own profile'
  ) THEN
    CREATE POLICY "Users can view own profile"
      ON public.profiles FOR SELECT USING (auth.uid() = id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'profiles' AND policyname = 'Users can update own profile'
  ) THEN
    CREATE POLICY "Users can update own profile"
      ON public.profiles FOR UPDATE USING (auth.uid() = id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'profiles' AND policyname = 'Users can insert own profile'
  ) THEN
    CREATE POLICY "Users can insert own profile"
      ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
  END IF;
END
$$;

-- Invoices Policies
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'invoices' AND policyname = 'Users can view own invoices'
  ) THEN
    CREATE POLICY "Users can view own invoices"
      ON public.invoices FOR SELECT USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'invoices' AND policyname = 'Users can insert own invoices'
  ) THEN
    CREATE POLICY "Users can insert own invoices"
      ON public.invoices FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'invoices' AND policyname = 'Users can update own invoices'
  ) THEN
    CREATE POLICY "Users can update own invoices"
      ON public.invoices FOR UPDATE USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'invoices' AND policyname = 'Users can delete own invoices'
  ) THEN
    CREATE POLICY "Users can delete own invoices"
      ON public.invoices FOR DELETE USING (auth.uid() = user_id);
  END IF;
END
$$;

-- Subscriptions Policies
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'subscriptions' AND policyname = 'Users can view own subscriptions'
  ) THEN
    CREATE POLICY "Users can view own subscriptions"
      ON public.subscriptions FOR SELECT USING (auth.uid() = user_id);
  END IF;
END
$$;

-- Usage Policies
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'usage' AND policyname = 'Users can view own usage'
  ) THEN
    CREATE POLICY "Users can view own usage"
      ON public.usage FOR SELECT USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'usage' AND policyname = 'Users can upsert own usage'
  ) THEN
    CREATE POLICY "Users can upsert own usage"
      ON public.usage FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'usage' AND policyname = 'Users can update own usage'
  ) THEN
    CREATE POLICY "Users can update own usage"
      ON public.usage FOR UPDATE USING (auth.uid() = user_id);
  END IF;
END
$$;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_invoices_user_id ON public.invoices(user_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON public.invoices(status);
CREATE INDEX IF NOT EXISTS idx_usage_user_month ON public.usage(user_id, month);

-- Clients Policies
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'clients' AND policyname = 'Users can view own clients'
  ) THEN
    CREATE POLICY "Users can view own clients"
      ON public.clients FOR SELECT USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'clients' AND policyname = 'Users can insert own clients'
  ) THEN
    CREATE POLICY "Users can insert own clients"
      ON public.clients FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'clients' AND policyname = 'Users can update own clients'
  ) THEN
    CREATE POLICY "Users can update own clients"
      ON public.clients FOR UPDATE USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'clients' AND policyname = 'Users can delete own clients'
  ) THEN
    CREATE POLICY "Users can delete own clients"
      ON public.clients FOR DELETE USING (auth.uid() = user_id);
  END IF;
END
$$;

CREATE INDEX IF NOT EXISTS idx_clients_user_id ON public.clients(user_id);

-- Card Profiles
CREATE TABLE IF NOT EXISTS public.card_profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL UNIQUE,
  username TEXT NOT NULL UNIQUE,
  name TEXT DEFAULT '',
  title TEXT DEFAULT '',
  bio TEXT DEFAULT '',
  tags JSONB DEFAULT '[]',
  services JSONB DEFAULT '[]',
  portfolio JSONB DEFAULT '[]',
  contact_email TEXT DEFAULT '',
  contact_phone TEXT DEFAULT '',
  social_links JSONB DEFAULT '{}',
  is_public BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Leads
CREATE TABLE IF NOT EXISTS public.leads (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  card_profile_id UUID REFERENCES public.card_profiles(id) ON DELETE CASCADE,
  freelancer_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  email TEXT DEFAULT '',
  message TEXT DEFAULT '',
  status TEXT DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'quote_generated', 'archived')),
  visitor_ip TEXT DEFAULT '',
  source_utm JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Quotes
CREATE TABLE IF NOT EXISTS public.quotes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  quote_number TEXT NOT NULL,
  client_name TEXT NOT NULL,
  client_email TEXT DEFAULT '',
  client_address TEXT DEFAULT '',
  items JSONB DEFAULT '[]',
  subtotal INTEGER DEFAULT 0,
  discount_rate NUMERIC(5,2) DEFAULT 0,
  discount_amount INTEGER DEFAULT 0,
  tax_rate NUMERIC(5,2) DEFAULT 0,
  tax_amount INTEGER DEFAULT 0,
  total INTEGER DEFAULT 0,
  currency TEXT DEFAULT 'USD',
  notes TEXT DEFAULT '',
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'approved', 'declined', 'converted')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Alter invoices
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS quote_id UUID REFERENCES public.quotes(id) ON DELETE SET NULL;
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS payment_link TEXT DEFAULT '';

-- Alter card profiles for production profile persistence
ALTER TABLE public.card_profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT DEFAULT '';
ALTER TABLE public.card_profiles ADD COLUMN IF NOT EXISTS cover_banner TEXT DEFAULT '';
ALTER TABLE public.card_profiles ADD COLUMN IF NOT EXISTS location TEXT DEFAULT '';
ALTER TABLE public.card_profiles ADD COLUMN IF NOT EXISTS timezone TEXT DEFAULT '';
ALTER TABLE public.card_profiles ADD COLUMN IF NOT EXISTS languages TEXT DEFAULT '';
ALTER TABLE public.card_profiles ADD COLUMN IF NOT EXISTS availability_status TEXT DEFAULT '';
ALTER TABLE public.card_profiles ADD COLUMN IF NOT EXISTS response_time TEXT DEFAULT '';
ALTER TABLE public.card_profiles ADD COLUMN IF NOT EXISTS starting_price TEXT DEFAULT '';
ALTER TABLE public.card_profiles ADD COLUMN IF NOT EXISTS calendly_link TEXT DEFAULT '';
ALTER TABLE public.card_profiles ADD COLUMN IF NOT EXISTS verified_badge BOOLEAN DEFAULT false;
ALTER TABLE public.card_profiles ADD COLUMN IF NOT EXISTS top_rated_badge BOOLEAN DEFAULT false;
ALTER TABLE public.card_profiles ADD COLUMN IF NOT EXISTS fast_response_badge BOOLEAN DEFAULT false;
ALTER TABLE public.card_profiles ADD COLUMN IF NOT EXISTS testimonials JSONB DEFAULT '[]';
ALTER TABLE public.card_profiles ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT true;

-- RLS Policies
ALTER TABLE public.card_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quotes ENABLE ROW LEVEL SECURITY;

-- Card Profiles Policies
DROP POLICY IF EXISTS "Card profiles are publicly viewable" ON public.card_profiles;

CREATE POLICY "Card profiles are publicly viewable"
  ON public.card_profiles FOR SELECT USING (is_public = true OR auth.uid() = user_id);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'card_profiles' AND policyname = 'Users can manage own card profile'
  ) THEN
    CREATE POLICY "Users can manage own card profile"
      ON public.card_profiles FOR ALL USING (auth.uid() = user_id);
  END IF;
END
$$;

-- Leads Policies
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'leads' AND policyname = 'Users can view own leads'
  ) THEN
    CREATE POLICY "Users can view own leads"
      ON public.leads FOR SELECT USING (auth.uid() = freelancer_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'leads' AND policyname = 'Anyone can insert leads for public profiles'
  ) THEN
    CREATE POLICY "Anyone can insert leads for public profiles"
      ON public.leads FOR INSERT WITH CHECK (
        card_profile_id IS NOT NULL
        AND EXISTS (
          SELECT 1
          FROM public.card_profiles cp
          WHERE cp.id = card_profile_id
            AND cp.user_id = freelancer_id
            AND cp.is_public = true
        )
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'leads' AND policyname = 'Users can update own leads'
  ) THEN
    CREATE POLICY "Users can update own leads"
      ON public.leads FOR UPDATE USING (auth.uid() = freelancer_id);
  END IF;
END
$$;

-- Quotes Policies
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'quotes' AND policyname = 'Users can view own quotes'
  ) THEN
    CREATE POLICY "Users can view own quotes"
      ON public.quotes FOR SELECT USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'quotes' AND policyname = 'Users can insert own quotes'
  ) THEN
    CREATE POLICY "Users can insert own quotes"
      ON public.quotes FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'quotes' AND policyname = 'Users can update own quotes'
  ) THEN
    CREATE POLICY "Users can update own quotes"
      ON public.quotes FOR UPDATE USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'quotes' AND policyname = 'Users can delete own quotes'
  ) THEN
    CREATE POLICY "Users can delete own quotes"
      ON public.quotes FOR DELETE USING (auth.uid() = user_id);
  END IF;
END
$$;

CREATE INDEX IF NOT EXISTS idx_card_profiles_username ON public.card_profiles(username);
CREATE INDEX IF NOT EXISTS idx_card_profiles_user_id ON public.card_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_leads_freelancer_id ON public.leads(freelancer_id);
CREATE INDEX IF NOT EXISTS idx_quotes_user_id ON public.quotes(user_id);

-- Production hardening: plan values
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_plan_check;
ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_plan_check CHECK (plan IN ('free', 'pro', 'agency', 'studio'));

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS paddle_subscription_id TEXT DEFAULT '';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS current_period_end TIMESTAMPTZ;

-- Production hardening: portal tokens
CREATE TABLE IF NOT EXISTS public.portal_tokens (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  token_hash TEXT NOT NULL UNIQUE,
  owner_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  resource_type TEXT NOT NULL CHECK (resource_type IN ('invoice', 'quote')),
  resource_id UUID NOT NULL,
  scope TEXT DEFAULT 'view:comment',
  expires_at TIMESTAMPTZ NOT NULL,
  revoked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_portal_tokens_hash ON public.portal_tokens(token_hash);
CREATE INDEX IF NOT EXISTS idx_portal_tokens_owner ON public.portal_tokens(owner_id);
CREATE INDEX IF NOT EXISTS idx_portal_tokens_resource ON public.portal_tokens(resource_type, resource_id);

ALTER TABLE public.portal_tokens ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'portal_tokens' AND policyname = 'Users can view own portal tokens'
  ) THEN
    CREATE POLICY "Users can view own portal tokens"
      ON public.portal_tokens FOR SELECT
      USING (auth.uid() = owner_id);
  END IF;
END
$$;

-- Production hardening: subscriptions for Paddle prep
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS paddle_customer_id TEXT DEFAULT '';
ALTER TABLE public.subscriptions ADD COLUMN IF NOT EXISTS paddle_subscription_id TEXT DEFAULT '';
ALTER TABLE public.subscriptions ADD COLUMN IF NOT EXISTS price_id TEXT DEFAULT '';
ALTER TABLE public.subscriptions ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE public.subscriptions DROP CONSTRAINT IF EXISTS subscriptions_plan_check;
ALTER TABLE public.subscriptions
  ADD CONSTRAINT subscriptions_plan_check CHECK (plan IN ('free', 'pro', 'agency', 'studio'));
ALTER TABLE public.subscriptions DROP CONSTRAINT IF EXISTS subscriptions_status_check;
ALTER TABLE public.subscriptions
  ADD CONSTRAINT subscriptions_status_check CHECK (status IN ('active', 'canceled', 'past_due', 'trialing', 'incomplete', 'unpaid'));

CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON public.subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_paddle_customer_id ON public.profiles(paddle_customer_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_paddle_subscription_id ON public.subscriptions(paddle_subscription_id);

-- Production hardening: public profile read, owner-only writes
ALTER TABLE public.card_profiles DROP CONSTRAINT IF EXISTS card_profiles_username_format;
ALTER TABLE public.card_profiles
  ADD CONSTRAINT card_profiles_username_format
  CHECK (username ~ '^[a-z0-9_-]{3,40}$');

DROP POLICY IF EXISTS "Users can manage own card profile" ON public.card_profiles;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'card_profiles' AND policyname = 'Users can insert own card profile'
  ) THEN
    CREATE POLICY "Users can insert own card profile"
      ON public.card_profiles FOR INSERT
      WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'card_profiles' AND policyname = 'Users can update own card profile'
  ) THEN
    CREATE POLICY "Users can update own card profile"
      ON public.card_profiles FOR UPDATE
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'card_profiles' AND policyname = 'Users can delete own card profile'
  ) THEN
    CREATE POLICY "Users can delete own card profile"
      ON public.card_profiles FOR DELETE
      USING (auth.uid() = user_id);
  END IF;
END
$$;

-- Production hardening: owner-scoped lead mutations
DROP POLICY IF EXISTS "Anyone can insert leads" ON public.leads;
DROP POLICY IF EXISTS "Anyone can insert leads for public profiles" ON public.leads;
DROP POLICY IF EXISTS "Users can update own leads" ON public.leads;

CREATE POLICY "Anyone can insert leads for public profiles"
  ON public.leads FOR INSERT
  WITH CHECK (
    card_profile_id IS NOT NULL
    AND EXISTS (
      SELECT 1
      FROM public.card_profiles cp
      WHERE cp.id = card_profile_id
        AND cp.user_id = freelancer_id
        AND cp.is_public = true
    )
  );

CREATE POLICY "Users can update own leads"
  ON public.leads FOR UPDATE
  USING (auth.uid() = freelancer_id)
  WITH CHECK (auth.uid() = freelancer_id);

-- Production hardening: audit logs
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id UUID,
  ip TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'audit_logs' AND policyname = 'Users can view own audit logs'
  ) THEN
    CREATE POLICY "Users can view own audit logs"
      ON public.audit_logs FOR SELECT
      USING (auth.uid() = user_id);
  END IF;
END
$$;

CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource ON public.audit_logs(resource_type, resource_id);

-- Beta growth infrastructure: acquisition events and user feedback.
CREATE TABLE IF NOT EXISTS public.growth_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_name TEXT NOT NULL,
  session_id TEXT DEFAULT '',
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  page_path TEXT DEFAULT '',
  page_location TEXT DEFAULT '',
  source TEXT DEFAULT '',
  properties JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.beta_feedback (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  session_id TEXT DEFAULT '',
  page_path TEXT DEFAULT '',
  rating INTEGER CHECK (rating BETWEEN 1 AND 5),
  message TEXT NOT NULL,
  email TEXT DEFAULT '',
  screenshot_data_url TEXT DEFAULT '',
  user_agent TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.feedback (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  email TEXT DEFAULT '',
  category TEXT NOT NULL,
  message TEXT NOT NULL,
  page_url TEXT DEFAULT '',
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  status TEXT DEFAULT 'new',
  source TEXT DEFAULT '',
  metadata JSONB DEFAULT '{}'
);

CREATE TABLE IF NOT EXISTS public.early_access_waitlist (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  country TEXT NOT NULL,
  role TEXT NOT NULL,
  reason TEXT NOT NULL,
  source TEXT DEFAULT 'early_access',
  utm JSONB DEFAULT '{}',
  status TEXT DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'invited', 'activated', 'archived')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.feedback ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL;
ALTER TABLE public.feedback ADD COLUMN IF NOT EXISTS priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent'));
ALTER TABLE public.feedback ADD COLUMN IF NOT EXISTS source TEXT DEFAULT '';
ALTER TABLE public.feedback ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';

ALTER TABLE public.growth_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.beta_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.early_access_waitlist ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'growth_events' AND policyname = 'Service role can manage growth events'
  ) THEN
    CREATE POLICY "Service role can manage growth events"
      ON public.growth_events FOR ALL
      USING (auth.role() = 'service_role')
      WITH CHECK (auth.role() = 'service_role');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'beta_feedback' AND policyname = 'Service role can manage beta feedback'
  ) THEN
    CREATE POLICY "Service role can manage beta feedback"
      ON public.beta_feedback FOR ALL
      USING (auth.role() = 'service_role')
      WITH CHECK (auth.role() = 'service_role');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'feedback' AND policyname = 'Service role can manage feedback'
  ) THEN
    CREATE POLICY "Service role can manage feedback"
      ON public.feedback FOR ALL
      USING (auth.role() = 'service_role')
      WITH CHECK (auth.role() = 'service_role');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'early_access_waitlist' AND policyname = 'Service role can manage early access waitlist'
  ) THEN
    CREATE POLICY "Service role can manage early access waitlist"
      ON public.early_access_waitlist FOR ALL
      USING (auth.role() = 'service_role')
      WITH CHECK (auth.role() = 'service_role');
  END IF;
END
$$;

CREATE INDEX IF NOT EXISTS idx_growth_events_event_name ON public.growth_events(event_name);
CREATE INDEX IF NOT EXISTS idx_growth_events_created_at ON public.growth_events(created_at);
CREATE INDEX IF NOT EXISTS idx_growth_events_session_id ON public.growth_events(session_id);
CREATE INDEX IF NOT EXISTS idx_beta_feedback_created_at ON public.beta_feedback(created_at);
CREATE INDEX IF NOT EXISTS idx_feedback_created_at ON public.feedback(created_at);
CREATE INDEX IF NOT EXISTS idx_feedback_user_id ON public.feedback(user_id);
CREATE INDEX IF NOT EXISTS idx_feedback_category_status ON public.feedback(category, status);
CREATE INDEX IF NOT EXISTS idx_early_access_waitlist_created_at ON public.early_access_waitlist(created_at);
CREATE INDEX IF NOT EXISTS idx_early_access_waitlist_country ON public.early_access_waitlist(country);
CREATE INDEX IF NOT EXISTS idx_early_access_waitlist_status ON public.early_access_waitlist(status);

-- Production grants for Supabase API roles.
-- RLS policies above remain the source of truth for row-level access.
GRANT USAGE ON SCHEMA public TO anon, authenticated;

GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.clients TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.invoices TO authenticated;
GRANT SELECT ON public.subscriptions TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.usage TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.card_profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.quotes TO authenticated;
GRANT SELECT, UPDATE ON public.leads TO authenticated;
GRANT SELECT ON public.portal_tokens TO authenticated;
GRANT SELECT ON public.audit_logs TO authenticated;

GRANT SELECT ON public.card_profiles TO anon;
GRANT INSERT ON public.leads TO anon;

GRANT ALL PRIVILEGES ON public.profiles TO service_role;
GRANT ALL PRIVILEGES ON public.clients TO service_role;
GRANT ALL PRIVILEGES ON public.invoices TO service_role;
GRANT ALL PRIVILEGES ON public.subscriptions TO service_role;
GRANT ALL PRIVILEGES ON public.usage TO service_role;
GRANT ALL PRIVILEGES ON public.card_profiles TO service_role;
GRANT ALL PRIVILEGES ON public.leads TO service_role;
GRANT ALL PRIVILEGES ON public.quotes TO service_role;
GRANT ALL PRIVILEGES ON public.portal_tokens TO service_role;
GRANT ALL PRIVILEGES ON public.audit_logs TO service_role;
GRANT ALL PRIVILEGES ON public.growth_events TO service_role;
GRANT ALL PRIVILEGES ON public.beta_feedback TO service_role;
GRANT ALL PRIVILEGES ON public.feedback TO service_role;
GRANT ALL PRIVILEGES ON public.early_access_waitlist TO service_role;

-- Reality Instrumentation updates (v1.4.1)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS first_invoice_created_at TIMESTAMPTZ;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS first_client_added_at TIMESTAMPTZ;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS invoice_sent_timestamp TIMESTAMPTZ;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS quote_sent_timestamp TIMESTAMPTZ;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS time_to_first_export INTEGER;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS time_to_first_client_response INTEGER;

-- Entitlements and Billing Events (v1.5)
CREATE TABLE IF NOT EXISTS public.entitlements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  plan TEXT NOT NULL DEFAULT 'free',
  export_pdf BOOLEAN DEFAULT false,
  client_portal BOOLEAN DEFAULT false,
  crm BOOLEAN DEFAULT false,
  automation BOOLEAN DEFAULT false,
  advanced_invoicing BOOLEAN DEFAULT false,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.billing_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id TEXT UNIQUE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  event_type TEXT,
  payload JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.entitlements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.billing_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own entitlements"
  ON public.entitlements FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view own billing events"
  ON public.billing_events FOR SELECT USING (auth.uid() = user_id);

GRANT SELECT ON public.entitlements TO authenticated;
GRANT SELECT ON public.billing_events TO authenticated;

GRANT ALL PRIVILEGES ON public.entitlements TO service_role;
GRANT ALL PRIVILEGES ON public.billing_events TO service_role;

-- Pricing Plans Table (v1.6)
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


-- Studio OS Persistence Migration (TASK E)

CREATE TABLE IF NOT EXISTS public.client_metadata (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE NOT NULL UNIQUE,
  health TEXT NOT NULL DEFAULT 'Healthy',
  timezone TEXT NOT NULL DEFAULT 'EST (UTC-5)',
  sla TEXT NOT NULL DEFAULT '< 24 hours',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.client_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE NOT NULL UNIQUE,
  notes TEXT DEFAULT '',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.client_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  url TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'Design',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.client_deliverables (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'Discovery',
  milestones JSONB DEFAULT '[]'::jsonb,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.client_metadata ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_deliverables ENABLE ROW LEVEL SECURITY;

-- Select Policies
CREATE POLICY "Users can select own client_metadata" ON public.client_metadata FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can select own client_notes" ON public.client_notes FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can select own client_files" ON public.client_files FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can select own client_deliverables" ON public.client_deliverables FOR SELECT USING (auth.uid() = user_id);

-- Insert Policies
CREATE POLICY "Users can insert own client_metadata" ON public.client_metadata FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can insert own client_notes" ON public.client_notes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can insert own client_files" ON public.client_files FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can insert own client_deliverables" ON public.client_deliverables FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Update Policies
CREATE POLICY "Users can update own client_metadata" ON public.client_metadata FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own client_notes" ON public.client_notes FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own client_files" ON public.client_files FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own client_deliverables" ON public.client_deliverables FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Delete Policies
CREATE POLICY "Users can delete own client_metadata" ON public.client_metadata FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own client_notes" ON public.client_notes FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own client_files" ON public.client_files FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own client_deliverables" ON public.client_deliverables FOR DELETE USING (auth.uid() = user_id);

-- Grants
GRANT SELECT, INSERT, UPDATE, DELETE ON public.client_metadata TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.client_notes TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.client_files TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.client_deliverables TO authenticated;

GRANT ALL PRIVILEGES ON public.client_metadata TO service_role;
GRANT ALL PRIVILEGES ON public.client_notes TO service_role;
GRANT ALL PRIVILEGES ON public.client_files TO service_role;
GRANT ALL PRIVILEGES ON public.client_deliverables TO service_role;

-- Revenue Decisions (v2 Autopilot tracking)
CREATE TABLE IF NOT EXISTS public.revenue_decisions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  service_type TEXT NOT NULL,
  recommended_price NUMERIC NOT NULL,
  final_price NUMERIC NOT NULL,
  accepted BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.revenue_decisions ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view own revenue_decisions" ON public.revenue_decisions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own revenue_decisions" ON public.revenue_decisions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own revenue_decisions" ON public.revenue_decisions FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own revenue_decisions" ON public.revenue_decisions FOR DELETE USING (auth.uid() = user_id);

-- Grants
GRANT SELECT, INSERT, UPDATE, DELETE ON public.revenue_decisions TO authenticated;
GRANT ALL PRIVILEGES ON public.revenue_decisions TO service_role;

-- ─────────────────────────────────────────────────────────────────────────────
-- Revenue Outcomes (v3.1.2 Feedback Intelligence Layer)
-- Full lifecycle tracking per deal — strategy performance & user segmentation
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.revenue_outcomes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  proposal_id UUID REFERENCES public.quotes(id) ON DELETE CASCADE NOT NULL,
  strategy_used TEXT NOT NULL CHECK (strategy_used IN ('MAX_REVENUE', 'BALANCED', 'FAST_DEAL')),
  price_offered NUMERIC NOT NULL,
  price_accepted NUMERIC,
  outcome TEXT NOT NULL DEFAULT 'PENDING' CHECK (outcome IN ('WON', 'LOST', 'PENDING', 'REVISED')),
  client_type TEXT NOT NULL CHECK (client_type IN ('individual', 'small_business', 'startup', 'enterprise')),
  service_type TEXT NOT NULL,
  urgency TEXT DEFAULT 'medium' CHECK (urgency IN ('low', 'medium', 'high')),
  time_to_decision_hours NUMERIC,
  revision_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_user_proposal_outcome UNIQUE (user_id, proposal_id)
);

-- Enable RLS
ALTER TABLE public.revenue_outcomes ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view own revenue_outcomes" ON public.revenue_outcomes FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own revenue_outcomes" ON public.revenue_outcomes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own revenue_outcomes" ON public.revenue_outcomes FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own revenue_outcomes" ON public.revenue_outcomes FOR DELETE USING (auth.uid() = user_id);

-- Grants
GRANT SELECT, INSERT, UPDATE, DELETE ON public.revenue_outcomes TO authenticated;
GRANT ALL PRIVILEGES ON public.revenue_outcomes TO service_role;

-- Index for fast user-scoped queries
CREATE INDEX IF NOT EXISTS idx_revenue_outcomes_user_id ON public.revenue_outcomes(user_id);
CREATE INDEX IF NOT EXISTS idx_revenue_outcomes_strategy ON public.revenue_outcomes(user_id, strategy_used);
CREATE INDEX IF NOT EXISTS idx_revenue_outcomes_outcome ON public.revenue_outcomes(user_id, outcome);
