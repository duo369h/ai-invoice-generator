-- Productization sprint: passive analytics, early access, and structured feedback.

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

ALTER TABLE public.early_access_waitlist ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
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

CREATE INDEX IF NOT EXISTS idx_early_access_waitlist_created_at ON public.early_access_waitlist(created_at);
CREATE INDEX IF NOT EXISTS idx_early_access_waitlist_country ON public.early_access_waitlist(country);
CREATE INDEX IF NOT EXISTS idx_early_access_waitlist_status ON public.early_access_waitlist(status);
CREATE INDEX IF NOT EXISTS idx_feedback_user_id ON public.feedback(user_id);
CREATE INDEX IF NOT EXISTS idx_feedback_category_status ON public.feedback(category, status);

GRANT ALL PRIVILEGES ON public.early_access_waitlist TO service_role;
