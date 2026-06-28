# Corvioz Vercel Environment Checklist

Scope: Vercel Deployment Readiness for Corvioz first production release.

Do not add new features, Paddle integration, Proposal, Contract, Tax, or bulk SEO content during this phase.

## Required Vercel Production Environment Variables

Set these in Vercel Project Settings -> Environment Variables -> Production.

| Variable | Required value / source | Status before deploy | Notes |
| --- | --- | --- | --- |
| `NEXT_PUBLIC_SITE_URL` | `https://www.corvioz.com` | Required | Must exactly match the canonical production domain. |
| `NEXT_PUBLIC_SUPABASE_URL` | Production Supabase project URL | Required | Browser-safe Supabase URL. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Production Supabase anon key | Required | Browser-safe anon key; RLS must stay enabled. |
| `SUPABASE_SERVICE_ROLE_KEY` | Production Supabase service role key | Required | Server-only. Never prefix with `NEXT_PUBLIC_`. |
| `NEXT_PUBLIC_SUPPORT_EMAIL` | Public support mailbox | Required | Expected production value: `support@corvioz.com`. |
| `NEXT_PUBLIC_HELLO_EMAIL` | Public hello mailbox | Required | Expected production value: `hello@corvioz.com`. |
| `NEXT_PUBLIC_BILLING_EMAIL` | Public billing mailbox | Required | Expected production value: `billing@corvioz.com`. |
| `UPSTASH_REDIS_REST_URL` | Upstash Redis REST URL | Required | Required because production rate limiting fails closed when missing. |
| `UPSTASH_REDIS_REST_TOKEN` | Upstash Redis REST token | Required | Required with the Upstash REST URL. |

## Local Env Snapshot

Checked on 2026-06-18 against `.env.local` without printing secret values.

| Variable | Local status |
| --- | --- |
| `NEXT_PUBLIC_SITE_URL` | Present and matches `https://www.corvioz.com`. |
| `NEXT_PUBLIC_SUPABASE_URL` | Present. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Present. |
| `SUPABASE_SERVICE_ROLE_KEY` | Present. |
| `NEXT_PUBLIC_SUPPORT_EMAIL` | Present. |
| `NEXT_PUBLIC_HELLO_EMAIL` | Present. |
| `NEXT_PUBLIC_BILLING_EMAIL` | Present. |
| `UPSTASH_REDIS_REST_URL` | Empty locally. Must be set in Vercel Production. |
| `UPSTASH_REDIS_REST_TOKEN` | Empty locally. Must be set in Vercel Production. |

## Vercel Build Settings

| Setting | Value |
| --- | --- |
| Framework preset | Next.js |
| Install command | `npm install` |
| Build command | `npm run build` |
| Output directory | `.next` |
| Production branch | Use the release branch selected for the first production deployment. |

## Pre-Deploy Verification

Run locally before triggering production deploy:

```bash
npm run verify:schema
npm run lint
npm run build
```

Expected result:

- Schema verification passes.
- ESLint passes.
- Next.js production build passes.
- No Paddle checkout/webhook routes are introduced.
- No Proposal, Contract, or Tax feature scope is introduced.
- No bulk SEO page generation is introduced.

## Post-Deploy Route Verification

After Vercel deploys `https://www.corvioz.com`, verify these public URLs:

| URL | Expected result |
| --- | --- |
| `https://www.corvioz.com/` | `200` |
| `https://www.corvioz.com/invoice-generator` | `200` |
| `https://www.corvioz.com/quote-generator` | `200` |
| `https://www.corvioz.com/sitemap.xml` | `200`; URLs use `https://www.corvioz.com`. |
| `https://www.corvioz.com/robots.txt` | `200`; includes sitemap references for `https://www.corvioz.com`. |
| `https://www.corvioz.com/auth` | `200` |
| `https://www.corvioz.com/dashboard` | `200`, or auth-protected redirect behavior if no browser session exists. |
| `https://www.corvioz.com/card/[username]` | `200` for a complete public profile; `404` for private/incomplete profiles. |
| `https://www.corvioz.com/portal/[token]` | `200` for a valid signed portal token. |
| `https://www.corvioz.com/portal/doc/[id]` | Must return `404` in production. |

Suggested header checks:

```bash
curl -I https://www.corvioz.com/
curl -I https://www.corvioz.com/invoice-generator
curl -I https://www.corvioz.com/quote-generator
curl -I https://www.corvioz.com/sitemap.xml
curl -I https://www.corvioz.com/robots.txt
curl -I https://www.corvioz.com/auth
curl -I https://www.corvioz.com/dashboard
curl -I https://www.corvioz.com/portal/doc/test-id
```

## Production Loop Verification

Run after Vercel production deploy and after a confirmed Supabase test user exists:

```bash
CORVIOZ_BASE_URL=https://www.corvioz.com \
CORVIOZ_TEST_EMAIL=confirmed-test-user@example.com \
CORVIOZ_TEST_PASSWORD='replace-with-test-password' \
npm run verify:production-loop
```

Current check on 2026-06-18:

- Not executed to completion until `https://www.corvioz.com` passes HTTPS route checks.
- The sample `CORVIOZ_TEST_EMAIL` and `CORVIOZ_TEST_PASSWORD` values must be replaced with a real confirmed Supabase test account before running.
- Local `.env.local` has Supabase values present, but `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` are empty and must be set in Vercel Production.

The production loop must pass all of these:

- Supabase auth login.
- Authenticated `/api/user` profile/quota read.
- Public profile create and public profile read.
- Public lead submission.
- Dashboard lead read for the authenticated freelancer.
- Quote creation with portal token.
- Invoice creation with portal token and `payment_link`.
- Signed `/api/portal/token/[token]` read.
- Signed portal comment write.
- Tokenless `/api/portal/doc/[id]` returns `404`.

## User A / User B Isolation Test

Run after the automated production loop passes.

| Step | Expected result |
| --- | --- |
| Sign in as User A and create one invoice, one quote, one public profile, and one lead. | User A Dashboard shows only User A records. |
| Sign out, then sign in as User B. | User B Dashboard does not show User A invoices, quotes, leads, clients, or profile settings. |
| User B creates one invoice and one quote. | User B Dashboard shows User B records only. |
| Use User A token against User B-owned API resource IDs. | API returns unauthorized/not found behavior; no cross-user data is returned. |
| Use User B token against User A-owned API resource IDs. | API returns unauthorized/not found behavior; no cross-user data is returned. |
| Open User A signed portal token while signed out. | Portal loads only the signed resource allowed by that token. |
| Try tokenless `/portal/doc/[id]` for User A and User B docs. | Production route returns `404`. |

Pass criteria:

- RLS and route filters prevent cross-user reads.
- Dashboard data stays scoped to the signed-in user.
- Public card and signed portal routes expose only intentionally public or token-authorized data.
- `/portal/doc/[id]` remains unavailable without a signed token.

## Release Boundary

For this deployment readiness phase:

- Do not add Proposal.
- Do not add Contract.
- Do not add Tax.
- Do not connect Paddle.
- Do not batch-generate SEO content.
- Do not change UI.
