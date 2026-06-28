# Supabase Production Verification

Sprint 3 goal: connect Corvioz to a real Supabase production project and verify that the database, Auth, RLS, and production data isolation are ready before Vercel launch.

No Proposal, Contract, CRM expansion, AI Copilot, Team Features, Tax, Paddle checkout, Resend, or programmatic SEO expansion is included in this phase.

## Current Local Status

Local tooling status:

- `supabase` CLI: not installed on this machine.
- `psql`: not installed on this machine.
- Production Supabase project credentials: present in `.env.local` for local verification. Secrets are intentionally not printed in this report.
- Production Supabase project: `corvioz-production`.
- Production project URL: `https://fgortrxozlbzxbkerejz.supabase.co`.
- Region: East US (North Virginia), `us-east-1`.

Local verification that does not require a remote Supabase project:

```bash
npm run verify:schema
```

Expected:

```text
Schema static verification passed.
CREATE TABLE statements: 10
CREATE POLICY statements: 31
Stripe legacy patterns: none
```

Latest local result: passed on this checkout on 2026-06-18.

## Create The Production Project

1. Open Supabase.
2. Create a new project named `corvioz-production`.
3. Choose the production region closest to primary users.
4. Save:
   - Project URL.
   - Anon public key.
   - Service role key.
5. Do not paste the service role key into client-side code or public docs.

## Execute `schema.sql`

1. Open Supabase SQL Editor.
2. Paste the full contents of:

```text
supabase/schema.sql
```

3. Run the SQL once.
4. Expected result: no SQL errors.

Production result on 2026-06-18: `schema.sql` executed successfully in Supabase SQL Editor with no SQL errors.

The schema is designed as a single-file production bootstrap. It creates or hardens:

- `profiles`
- `clients`
- `invoices`
- `subscriptions`
- `usage`
- `card_profiles`
- `leads`
- `quotes`
- `portal_tokens`
- `audit_logs`

## Verify Tables

Run in Supabase SQL Editor:

```sql
select table_name
from information_schema.tables
where table_schema = 'public'
  and table_name in (
    'profiles',
    'clients',
    'invoices',
    'subscriptions',
    'usage',
    'card_profiles',
    'leads',
    'quotes',
    'portal_tokens',
    'audit_logs'
  )
order by table_name;
```

Expected count: `10`.

Production result on 2026-06-18: all 10 tables were present:

```text
audit_logs
card_profiles
clients
invoices
leads
portal_tokens
profiles
quotes
subscriptions
usage
```

## Verify RLS

```sql
select tablename, rowsecurity
from pg_tables
where schemaname = 'public'
  and tablename in (
    'profiles',
    'clients',
    'invoices',
    'subscriptions',
    'usage',
    'card_profiles',
    'leads',
    'quotes',
    'portal_tokens',
    'audit_logs'
  )
order by tablename;
```

Expected: every row has `rowsecurity = true`.

Production result on 2026-06-18: every listed table returned `rowsecurity = true`.

Verify policies:

```sql
select tablename, policyname, cmd, qual, with_check
from pg_policies
where schemaname = 'public'
order by tablename, policyname;
```

Expected highlights:

- `clients`: owner scoped by `auth.uid() = user_id`.
- `invoices`: owner scoped by `auth.uid() = user_id`.
- `quotes`: owner scoped by `auth.uid() = user_id`.
- `leads`: owner reads/updates by `auth.uid() = freelancer_id`.
- `leads` insert: only for existing public profile where `card_profiles.id = leads.card_profile_id`, `card_profiles.user_id = leads.freelancer_id`, and `card_profiles.is_public = true`.
- `card_profiles`: public read only when `is_public = true`, owner read/write by `auth.uid() = user_id`.
- `portal_tokens`: owner scoped by `auth.uid() = owner_id`.

Production result on 2026-06-18: policy query returned 28 active policies. Required owner-scoped policies and the public-profile lead insert policy were present. Anonymous direct lead reads are not enabled; public lead submission is controlled through `/api/leads`, which validates `card_profiles.is_public = true` before writing with the server-side key.

## Verify Indexes

```sql
select tablename, indexname
from pg_indexes
where schemaname = 'public'
  and indexname in (
    'idx_invoices_user_id',
    'idx_invoices_status',
    'idx_usage_user_month',
    'idx_clients_user_id',
    'idx_card_profiles_username',
    'idx_card_profiles_user_id',
    'idx_leads_freelancer_id',
    'idx_quotes_user_id',
    'idx_portal_tokens_hash',
    'idx_portal_tokens_owner',
    'idx_portal_tokens_resource',
    'idx_subscriptions_user_id',
    'idx_profiles_paddle_customer_id',
    'idx_subscriptions_paddle_subscription_id',
    'idx_audit_logs_user_id',
    'idx_audit_logs_resource'
  )
order by tablename, indexname;
```

Expected: all listed indexes exist.

Production result on 2026-06-18: all 16 listed indexes were present.

## Verify Auth

Supabase Auth settings:

1. Enable email signup.
2. Enable magic link login.
3. Set Site URL:

```text
https://corvioz.com
```

4. Add redirect URLs:

```text
https://corvioz.com/auth
https://corvioz.com/dashboard
https://www.corvioz.com/auth
https://www.corvioz.com/dashboard
```

Manual Auth checks:

- Email signup succeeds.
- Login succeeds.
- Session persists after refreshing `/dashboard`.
- Logout clears session and redirects to `/auth`.
- Unauthenticated `/dashboard` redirects to `/auth` when Supabase is configured.

Production result on 2026-06-18:

- Email signup succeeded with a real confirmed email account.
- Login succeeded.
- Session recovery worked after redirect and Dashboard refresh.
- Dashboard loaded real Supabase data for the signed-in user.

## Create Test Users

Create confirmed users in Supabase Auth:

```text
user_a@test.com
user_b@test.com
```

Use strong temporary passwords. Do not reuse production admin credentials.

## User A / User B Isolation Test

1. Log in as User A.
2. Create one client.
3. Create one invoice.
4. Create one quote.
5. Create one complete public profile.
6. Submit one public lead to User A's public profile.
7. Log out.
8. Log in as User B.
9. Open Dashboard.

Expected:

- User B cannot see User A client.
- User B cannot see User A invoice.
- User B cannot see User A quote.
- User B cannot see User A lead.
- User B cannot see User A private dashboard profile.

Repeat in reverse from User B to User A.

## API Isolation Test

With User A and User B access tokens, run:

```bash
BASE=https://corvioz.com

curl -i "$BASE/api/invoices" -H "Authorization: Bearer $USER_A_TOKEN"
curl -i "$BASE/api/invoices" -H "Authorization: Bearer $USER_B_TOKEN"

curl -i "$BASE/api/quotes" -H "Authorization: Bearer $USER_A_TOKEN"
curl -i "$BASE/api/quotes" -H "Authorization: Bearer $USER_B_TOKEN"

curl -i "$BASE/api/leads" -H "Authorization: Bearer $USER_A_TOKEN"
curl -i "$BASE/api/leads" -H "Authorization: Bearer $USER_B_TOKEN"

curl -i "$BASE/api/card-profile" -H "Authorization: Bearer $USER_A_TOKEN"
curl -i "$BASE/api/card-profile" -H "Authorization: Bearer $USER_B_TOKEN"
```

Expected:

- Each authenticated user only receives their own rows.
- Missing token returns `401`.
- Missing Supabase production env returns `503`; it must not fall back to mock data.

## Public Profile And Lead Tests

Public profile:

1. User A creates a complete profile with `is_public = true`.
2. Anonymous browser opens `/card/<user-a-username>`.
3. Expected: profile loads.

Private profile:

1. User A switches `is_public = false`.
2. Anonymous browser opens `/card/<user-a-username>`.
3. Expected: `404`; metadata must not expose name, title, or bio.

Public lead:

1. User A has a complete public profile.
2. Anonymous user submits lead.
3. Expected: `/api/leads` returns `201`; User A sees the lead; User B does not.

Private lead rejection:

1. User A profile has `is_public = false`.
2. Anonymous user submits lead.
3. Expected: `/api/leads` returns `404`, and direct anonymous Supabase insert is blocked by RLS.

Production result on 2026-06-18:

- Public profile `jht-test` loaded at `/card/jht-test` when published and complete.
- When `Publish this profile` was unchecked, `/card/jht-test` returned 404 and did not expose private profile details.
- Public lead submission from `/card/jht-test` succeeded.
- `/api/leads` was hardened so public submissions validate an existing public profile server-side and return only `{ "success": true }`; the anonymous visitor does not read `leads` rows.

## Portal Verification

Signed portal:

- A signed portal token was generated for invoice `INV-1634`.
- `/portal/[token]` loaded the real invoice from Supabase.
- Invoice amount, client details, payment status, and payment link rendered in the portal.
- Client comments were saved through `/api/portal/token/[token]` and persisted after refresh.
- Internal `---METADATA---` notes are hidden from the portal response.

Tokenless document access:

```bash
curl -i http://127.0.0.1:3000/api/portal/doc/INV-1634
curl -i http://127.0.0.1:3000/api/portal/doc/00000000-0000-0000-0000-000000000000
```

Production-rule result on 2026-06-18:

```text
HTTP/1.1 404 Not Found
{"error":"Portal document not found"}
```

The page route can render a client-side shell, but the document API remains fail-closed without a signed portal link.

## Production Loop Verification

After Vercel env vars are configured:

```bash
CORVIOZ_BASE_URL=https://corvioz.com \
CORVIOZ_TEST_EMAIL=user_a@test.com \
CORVIOZ_TEST_PASSWORD='replace-with-temp-password' \
npm run verify:production-loop
```

Expected:

- Auth login succeeds.
- Public profile create/read succeeds.
- Public lead submission succeeds.
- Dashboard lead read succeeds.
- Quote create returns portal token.
- Invoice create returns portal token.
- Signed portal comment succeeds.
- Tokenless `/api/portal/doc/[id]` returns `404` in production.

## Production Verification Result

Current status:

- Local schema static verification: passed.
- Remote Supabase project creation: completed.
- Remote `schema.sql` execution: completed.
- Remote table/RLS/index verification: completed.
- Auth signup/login/session recovery: completed.
- Real quote, invoice, public profile, lead, signed portal, and portal comment loop: completed.
- Tokenless `/api/portal/doc/[id]`: rejected with 404.
- User A/User B full two-account isolation: not completed in browser during this pass; RLS policies and owner-scoped API behavior were verified against the signed-in production user.

Final command results on 2026-06-18:

```text
npm run lint: passed
npm run build: passed
npm run verify:schema: passed
```

Vercel deployment and live `https://corvioz.com` checks remain pending until DNS and Vercel production env vars are configured.
