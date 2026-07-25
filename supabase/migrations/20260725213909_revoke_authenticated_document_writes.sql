-- SAFE-03SEC-B2
-- Requires SAFE-03SEC-B1 application code to be deployed and smoke-tested first.
-- Do not apply before the four document writes use service_role.
-- Revokes write privileges only; SELECT remains granted to authenticated.
-- Existing RLS and policies are intentionally retained and become dormant for authenticated writes.
-- This migration closes the direct PostgREST DML path only.
-- SAFE-03SEC-B2-B independent production permission audit remains the next step after application.
-- SAFE-03B2B Payment API / ledger enforcement remains a separate, blocked follow-up stage.

REVOKE INSERT, UPDATE, DELETE
ON TABLE public.invoices
FROM authenticated;

REVOKE INSERT, UPDATE, DELETE
ON TABLE public.quotes
FROM authenticated;
