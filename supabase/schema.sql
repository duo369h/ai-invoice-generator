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

-- Invoices
CREATE TABLE IF NOT EXISTS public.invoices (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  invoice_number TEXT NOT NULL,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'paid', 'overdue')),
  doc_type TEXT DEFAULT 'invoice' CHECK (doc_type IN ('invoice', 'receipt')),
  -- Client
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
