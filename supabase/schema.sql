-- Users (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL,
  name TEXT DEFAULT '',
  avatar_url TEXT DEFAULT '',
  plan TEXT DEFAULT 'free' CHECK (plan IN ('free', 'pro')),
  stripe_customer_id TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
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
  stripe_subscription_id TEXT DEFAULT '',
  plan TEXT DEFAULT 'pro',
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'canceled', 'past_due', 'trialing')),
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
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
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS stripe_payment_link TEXT DEFAULT '';

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

-- RLS Policies
ALTER TABLE public.card_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quotes ENABLE ROW LEVEL SECURITY;

-- Card Profiles Policies
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'card_profiles' AND policyname = 'Card profiles are publicly viewable'
  ) THEN
    CREATE POLICY "Card profiles are publicly viewable"
      ON public.card_profiles FOR SELECT USING (true);
  END IF;

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
    SELECT 1 FROM pg_policies WHERE tablename = 'leads' AND policyname = 'Anyone can insert leads'
  ) THEN
    CREATE POLICY "Anyone can insert leads"
      ON public.leads FOR INSERT WITH CHECK (true);
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
  ADD CONSTRAINT profiles_plan_check CHECK (plan IN ('free', 'pro', 'agency'));

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

-- Production hardening: subscriptions for Stripe skeleton
ALTER TABLE public.subscriptions ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT DEFAULT '';
ALTER TABLE public.subscriptions ADD COLUMN IF NOT EXISTS price_id TEXT DEFAULT '';
ALTER TABLE public.subscriptions ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE public.subscriptions DROP CONSTRAINT IF EXISTS subscriptions_plan_check;
ALTER TABLE public.subscriptions
  ADD CONSTRAINT subscriptions_plan_check CHECK (plan IN ('free', 'pro', 'agency'));
ALTER TABLE public.subscriptions DROP CONSTRAINT IF EXISTS subscriptions_status_check;
ALTER TABLE public.subscriptions
  ADD CONSTRAINT subscriptions_status_check CHECK (status IN ('active', 'canceled', 'past_due', 'trialing', 'incomplete', 'unpaid'));

CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON public.subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_customer_id ON public.subscriptions(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_subscription_id ON public.subscriptions(stripe_subscription_id);

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
DROP POLICY IF EXISTS "Users can update own leads" ON public.leads;

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
