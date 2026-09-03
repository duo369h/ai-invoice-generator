# Active quota schema authority

The existing `public.document_usage_events` table remains the only creation-usage ledger. Its unique constraints are `(user_id, document_type, document_id)` and `(user_id, document_type, idempotency_key)`. `document_id` has no foreign key to a business document, so document deletion cannot cascade into usage history. `user_id` remains protected by the profile foreign key.

The table has RLS enabled and direct table access revoked from PUBLIC, anon, authenticated, and service_role. Creation authority is the existing atomic Quote/Invoice RPC pair; R56B2A replaces their live-row counts with immutable ledger counts.
