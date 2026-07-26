-- Corvioz analytics_events permissions repair
-- Allows event ingestion through Supabase REST while keeping raw event reads service-only.

ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;

GRANT INSERT ON TABLE public.analytics_events TO anon, authenticated, service_role;
GRANT SELECT ON TABLE public.analytics_events TO service_role;

DROP POLICY IF EXISTS "analytics_insert_any" ON public.analytics_events;
CREATE POLICY "analytics_insert_any"
  ON public.analytics_events
  FOR INSERT
  TO anon, authenticated, service_role
  WITH CHECK (true);

DROP POLICY IF EXISTS "analytics_read_service_only" ON public.analytics_events;
CREATE POLICY "analytics_read_service_only"
  ON public.analytics_events
  FOR SELECT
  TO service_role
  USING (true);
;
