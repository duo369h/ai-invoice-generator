# Source evidence before

Before-state authority is the exact R56B2 commit `4c0749c823418a00416073f2b3981dc7d5dbbe07`. The relevant before-state files were read from that commit, not from the shared dirty checkout:

- `supabase/migrations/20260815000000_document_usage_engine_v2.sql`
- `supabase/migrations/20260815134423_document_usage_engine_v2_hardening.sql`
- `supabase/migrations/20260821174436_pricing_quota_client_quote_foundation.sql`
- `supabase/migrations/20260903092326_r56b2_pro_combined_document_quota_authority.sql`
- `src/app/lib/supabase.js`
- `src/app/api/user/route.js`
- `src/app/api/invoices/route.js`

The R56B2 audit package remains preserved in its parent commit.
