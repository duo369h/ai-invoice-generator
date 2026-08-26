
-- Pricing P0 Phase 2 hardening: the usage ledger is private write-state.
-- Its only runtime writer is the SECURITY DEFINER creation RPC owned by postgres.
ALTER TABLE public.document_usage_events ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.document_usage_events FROM PUBLIC;
REVOKE ALL ON TABLE public.document_usage_events FROM anon, authenticated, service_role;
