-- Corvioz Real Behavior Capture Layer
-- Sprint C Phase 2.6
-- Migration: Create analytics_events table
--
-- Run this in Supabase Dashboard → SQL Editor

CREATE TABLE IF NOT EXISTS public.analytics_events (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event       TEXT NOT NULL,
  user_id     UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  session_id  TEXT,
  metadata    JSONB,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index on event name for aggregation queries
CREATE INDEX IF NOT EXISTS idx_analytics_events_event
  ON public.analytics_events (event);

-- Index on user_id for per-user funnel queries
CREATE INDEX IF NOT EXISTS idx_analytics_events_user_id
  ON public.analytics_events (user_id);

-- Index on session_id for session-level replay
CREATE INDEX IF NOT EXISTS idx_analytics_events_session_id
  ON public.analytics_events (session_id);

-- Index on created_at for time-range queries
CREATE INDEX IF NOT EXISTS idx_analytics_events_created_at
  ON public.analytics_events (created_at DESC);

-- Row Level Security: service role can read/write; anon can insert only
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;

-- Allow anonymous/authenticated inserts (browser-side capture)
CREATE POLICY "analytics_insert_any" ON public.analytics_events
  FOR INSERT
  WITH CHECK (true);

-- Only service role reads (no user can read raw events table)
CREATE POLICY "analytics_read_service_only" ON public.analytics_events
  FOR SELECT
  USING (auth.role() = 'service_role');
