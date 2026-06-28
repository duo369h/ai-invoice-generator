# Corvioz Supabase Production Setup

This document is the handoff checklist for creating a clean production Supabase project for Corvioz.

## Scope

Sprint 2 Final only supports the real production loop for:

- Authenticated freelancer account.
- Clients.
- Invoices.
- Quotes.
- Public/private freelancer profile.
- Public lead capture.
- Signed client portal token.
- Portal comments.

Do not add Proposal, Contract, CRM expansion, AI Copilot, Team Features, or new billing flows in this phase.

## Preflight

Run the local static schema check:

```bash
npm run verify:schema
```

Expected result:

```text
Schema static verification passed.
Stripe legacy patterns: none
```

This check confirms that the required tables, RLS snippets, portal token tables, Paddle placeholder fields, and public profile policy are present, and that Stripe/demo/mock seed names are not present in `supabase/schema.sql`.

## Create The Supabase Project

1. Create a new Supabase project for production.
2. Save the project URL and anon key.
3. Copy the service role key into the Vercel server environment only.
4. Do not expose `SUPABASE_SERVICE_ROLE_KEY` to browser code.

## SQL Execution Order

For a new Supabase project, run exactly one SQL file:

```text
supabase/schema.sql
```

Execution order inside the file:

1. Enable `pgcrypto`.
2. Create core tables: `profiles`, `clients`, `invoices`, `subscriptions`, `usage`.
3. Enable RLS for core tables.
4. Create owner-scoped RLS policies.
5. Create profile, lead, and quote tables.
6. Add invoice/profile production columns.
7. Enable RLS for `card_profiles`, `leads`, and `quotes`.
8. Create public/private profile policies.
9. Create portal token and audit log tables.
10. Add Paddle placeholder fields and indexes.

There are no Stripe columns or Stripe policies in the current schema. Production billing remains reserved for Paddle.

## Auth Configuration

In Supabase Auth:

1. Enable Email magic link.
2. Optional: enable Google OAuth if production OAuth credentials are ready.
3. Set Site URL to:

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

5. If email confirmation is enabled, create one confirmed test user for production verification.

## Storage Configuration

No production storage bucket is required for Sprint 2 Final.

Current profile assets use URL fields. If file upload is added later, create a private bucket for source files and a public or signed-read bucket for approved profile assets, then document the bucket policies before enabling upload UI.

## Required Environment Variables

Set these in Vercel production:

```bash
NEXT_PUBLIC_SITE_URL=https://corvioz.com
NEXT_PUBLIC_SUPPORT_EMAIL=support@corvioz.com
NEXT_PUBLIC_HELLO_EMAIL=hello@corvioz.com
NEXT_PUBLIC_BILLING_EMAIL=billing@corvioz.com
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
```

Paddle placeholders before paid checkout:

```bash
PADDLE_API_KEY=
PADDLE_WEBHOOK_SECRET=
NEXT_PUBLIC_PADDLE_CLIENT_TOKEN=
NEXT_PUBLIC_PADDLE_ENV=production
NEXT_PUBLIC_PADDLE_PRO_PRICE_ID=
```

Do not add Stripe env vars.

## RLS Verification Method

Create two confirmed test users: User A and User B.

For each protected table, create records as User A, then query as User B through the app API. User B must not see User A data.

Tables to verify:

- `clients`: owner-scoped by `user_id`.
- `invoices`: owner-scoped by `user_id`.
- `quotes`: owner-scoped by `user_id`.
- `leads`: owner-scoped by `freelancer_id`.
- `profiles`: owner-scoped by `id`.
- `usage`: owner-scoped by `user_id`.
- `portal_tokens`: owner-scoped by `owner_id`; public portal access must go through signed token API.
- `card_profiles`: public reads only when `is_public = true`; owner can read their own private profile.

Manual SQL checks in Supabase SQL Editor:

```sql
select tablename, rowsecurity
from pg_tables
where schemaname = 'public'
  and tablename in (
    'profiles',
    'clients',
    'invoices',
    'quotes',
    'leads',
    'card_profiles',
    'portal_tokens',
    'audit_logs',
    'subscriptions',
    'usage'
  )
order by tablename;
```

Expected: every listed table has `rowsecurity = true`.

Policy inventory:

```sql
select tablename, policyname, cmd, qual, with_check
from pg_policies
where schemaname = 'public'
order by tablename, policyname;
```

Expected highlights:

- `invoices`, `quotes`, `clients`, `usage`: `auth.uid() = user_id`.
- `leads`: `auth.uid() = freelancer_id` for owner reads/updates.
- `leads` inserts: only allowed when `card_profile_id` points to an existing `card_profiles` row where `is_public = true` and `card_profiles.user_id = leads.freelancer_id`.
- `card_profiles`: `is_public = true OR auth.uid() = user_id` for reads.
- `portal_tokens`: `auth.uid() = owner_id`.

## Production Privacy Tests

Run these tests after applying `supabase/schema.sql` and deploying to Vercel with production Supabase env vars.

### `/card/[username]` Private Profile Test

1. Sign in as User A.
2. Create a card profile with a valid username.
3. Set `Publish this profile` off so `card_profiles.is_public = false`.
4. Open `/card/<username>` in an anonymous browser.
5. Expected:
   - The page returns `404`.
   - Metadata must not expose the profile `name`, `title`, or `bio`.
   - `/api/card-profile?username=<username>` returns `404`.

### `/card/[username]` Incomplete Profile Test

1. Sign in as User A.
2. Create a card profile with `is_public = true`, but leave required public-indexing fields incomplete, such as missing bio, tags, service, or contact email.
3. Open `/card/<username>` in an anonymous browser.
4. Expected:
   - The page returns `404`.
   - Metadata is generic/noindex and does not expose profile details.

### Public Profile Lead Test

1. Sign in as User A.
2. Create a complete public profile:
   - `is_public = true`
   - username
   - name
   - title
   - bio of at least 40 characters
   - contact email
   - at least one tag
   - at least one service with a name
3. Open `/card/<username>` anonymously.
4. Submit the public lead form.
5. Expected:
   - `/api/leads` returns `201`.
   - User A sees the lead in Dashboard.
   - User B does not see the lead.

### Private Profile Lead Rejection Test

1. Sign in as User A.
2. Set the profile to `is_public = false`.
3. Submit a lead anonymously to the same username.
4. Expected:
   - `/api/leads` returns `404`.
   - Direct anonymous Supabase insert into `public.leads` is rejected by RLS unless `card_profile_id` belongs to an existing public profile and `freelancer_id` matches that profile owner.
   - User A does not receive a lead for the private profile.

### User A / User B Data Isolation Test

Create User A and User B as confirmed Supabase Auth users.

As User A:

1. Create one client.
2. Create one invoice.
3. Create one quote.
4. Create one public profile.
5. Submit one public lead to User A's profile.

As User B:

1. Call `/api/clients` with User B's token.
2. Call `/api/invoices` with User B's token.
3. Call `/api/quotes` with User B's token.
4. Call `/api/leads` with User B's token.
5. Call `/api/card-profile` with User B's token.

Expected:

- User B receives no User A clients, invoices, quotes, leads, or private card profile data.
- User B can access User A's public profile only through the public username route if it is complete and `is_public = true`.
- User B cannot mutate User A resources.

## Sitemap Seed Profile Rule

The current sitemap does not include seeded `/card/...` profiles. Published profile discovery should come from real user profiles and external links, not hard-coded seed URLs.
