-- Migration: Create public.revenue_events table for Autonomous Revenue Loop System (v3)

CREATE TABLE IF NOT EXISTS public.revenue_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_name TEXT NOT NULL,
  session_id TEXT DEFAULT '',
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  page_path TEXT DEFAULT '',
  trigger_type TEXT DEFAULT '',
  target_plan TEXT DEFAULT '',
  offer_type TEXT DEFAULT '',
  properties JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.revenue_events ENABLE ROW LEVEL SECURITY;

-- Policies
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'revenue_events' AND policyname = 'Service role can manage revenue events'
  ) THEN
    CREATE POLICY "Service role can manage revenue events"
      ON public.revenue_events FOR ALL
      USING (auth.role() = 'service_role')
      WITH CHECK (auth.role() = 'service_role');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'revenue_events' AND policyname = 'Authenticated users can view own revenue events'
  ) THEN
    CREATE POLICY "Authenticated users can view own revenue events"
      ON public.revenue_events FOR SELECT
      USING (auth.uid() = user_id);
  END IF;
END
$$;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_revenue_events_event_name ON public.revenue_events(event_name);
CREATE INDEX IF NOT EXISTS idx_revenue_events_user_id ON public.revenue_events(user_id);
CREATE INDEX IF NOT EXISTS idx_revenue_events_created_at ON public.revenue_events(created_at);

-- Grants
GRANT ALL PRIVILEGES ON public.revenue_events TO service_role;
GRANT SELECT ON public.revenue_events TO authenticated;
