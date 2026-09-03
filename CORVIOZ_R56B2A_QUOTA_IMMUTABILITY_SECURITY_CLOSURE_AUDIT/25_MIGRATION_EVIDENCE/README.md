# Migration evidence

Repository candidate: `supabase/migrations/20260903102519_r56b2a_quota_immutability_security_closure.sql`.

Sandbox applied migration names were `r56b2_pro_combined_document_quota_authority` and `r56b2a_quota_immutability_security_closure`; Supabase assigned runtime versions `20260903103324` and `20260903103339`. The candidate was applied only after the R56B2 baseline was present.

The candidate is forward-only and contains: active-cycle backfill, ledger-backed usage read, atomic Quote/Invoice event writes, RLS/table hardening, and service_role-only function grants.
