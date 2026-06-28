# Vercel Deployment Checklist

Sprint 3 goal: prepare Corvioz for Vercel production deployment with real Supabase persistence and correct public metadata.

No new product features are included.

## Local Build Verification

Run before every production deploy:

```bash
npm run verify:schema
npm run lint
npm run build
```

Expected:

- Schema static verification passes.
- ESLint passes.
- Next.js production build completes.

Latest local result on this checkout:

```text
npm run lint: passed
npm run build: passed
npm run verify:schema: passed
```

Final Sprint 3 verification ran on 2026-06-18:

```text
npm run lint
> eslint
Result: passed

npm run build
> next build
Result: passed
Next.js 16.2.7, 60 static pages generated, dynamic API/portal/dashboard routes preserved.

npm run verify:schema
Schema static verification passed.
CREATE TABLE statements: 10
CREATE POLICY statements: 31
Stripe legacy patterns: none
```

## Required Production Environment Variables

Set these in Vercel Production:

```bash
NEXT_PUBLIC_SITE_URL=https://www.corvioz.com
NEXT_PUBLIC_SUPPORT_EMAIL=support@corvioz.com
NEXT_PUBLIC_HELLO_EMAIL=hello@corvioz.com
NEXT_PUBLIC_BILLING_EMAIL=billing@corvioz.com
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
```

Local production verification used:

```text
NEXT_PUBLIC_SUPABASE_URL=https://fgortrxozlbzxbkerejz.supabase.co
NEXT_PUBLIC_SITE_URL=https://www.corvioz.com
```

The Supabase publishable key and service role key are present locally for verification but are not printed in this document. In Vercel, `SUPABASE_SERVICE_ROLE_KEY` must be added only as a server-side environment variable.

Optional current variables:

```bash
DEEPSEEK_API_KEY=
NEXT_PUBLIC_GA_ID=
NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION=
NEXT_PUBLIC_CLARITY_ID=
```

Reserved for Paddle, not connected in Sprint 3:

```bash
PADDLE_API_KEY=
PADDLE_WEBHOOK_SECRET=
NEXT_PUBLIC_PADDLE_CLIENT_TOKEN=
NEXT_PUBLIC_PADDLE_ENV=production
NEXT_PUBLIC_PADDLE_PRO_PRICE_ID=
NEXT_PUBLIC_PADDLE_AGENCY_PRICE_ID=
```

Reserved for future email, not connected in Sprint 3:

```bash
RESEND_API_KEY=
RESEND_FROM_SUPPORT=support@corvioz.com
RESEND_FROM_BILLING=billing@corvioz.com
```

## `NEXT_PUBLIC_SITE_URL`

Production value must be:

```text
https://www.corvioz.com
```

This controls canonical URLs, sitemap URLs, robots sitemap references, RSS links, and metadata base.

## Vercel Project Settings

Framework preset:

```text
Next.js
```

Build command:

```bash
npm run build
```

Install command:

```bash
npm install
```

Output directory:

```text
.next
```

Node.js version: use Vercel default compatible with Next.js 16, or pin a current LTS if the dashboard requires a selection.

## Pre-Deploy Checks

1. Confirm all required env vars exist in Vercel Production.
2. Confirm `SUPABASE_SERVICE_ROLE_KEY` is server-only and not prefixed with `NEXT_PUBLIC_`.
3. Confirm Supabase Auth redirects include `https://www.corvioz.com/dashboard`.
4. Confirm `npm run build` passes locally.
5. Confirm `npm run verify:schema` passes locally.

Sprint 3 local status on 2026-06-18:

- Supabase project: created.
- `schema.sql`: executed successfully in Supabase SQL Editor.
- Table/RLS/index verification: passed.
- Supabase Auth URL configuration: set for `https://www.corvioz.com` plus local test redirects.
- Local Dashboard data loop: passed with real Supabase data.
- Signed portal token loop: passed.
- `/api/portal/doc/[id]` without signed portal token: 404.

## Post-Deploy URL Checks

After deployment, check:

```bash
curl -I https://www.corvioz.com
curl -I https://www.corvioz.com/sitemap.xml
curl -I https://www.corvioz.com/robots.txt
curl -I https://www.corvioz.com/auth
curl -I https://www.corvioz.com/dashboard
```

Expected:

- `/` returns `200`.
- `/sitemap.xml` returns `200`.
- `/robots.txt` returns `200`.
- `/auth` returns `200`.
- `/dashboard` returns `200` or redirects to `/auth` when no session is present.

## Sitemap Check

Current implementation:

```text
src/app/sitemap.js
```

Expected behavior:

- Uses `NEXT_PUBLIC_SITE_URL`, defaulting to `https://www.corvioz.com`.
- Includes core money pages, template pages, blog pages, pricing, privacy, terms, and refund policy.
- Does not include hard-coded seed `/card/...` profiles.

Production check:

```bash
curl https://www.corvioz.com/sitemap.xml
```

Expected:

- URLs start with `https://www.corvioz.com`.
- No `sarahdesign`, `alexdev`, or demo card profile URLs.

## Robots Check

Current implementation:

```text
src/app/robots.js
```

Expected:

```text
Allow: /
Disallow: /api/
Disallow: /portal/
Sitemap: https://www.corvioz.com/sitemap.xml
Sitemap: https://www.corvioz.com/rss.xml
```

Production check:

```bash
curl https://www.corvioz.com/robots.txt
```

## Production Data Loop Check

After deployment:

```bash
CORVIOZ_BASE_URL=https://www.corvioz.com \
CORVIOZ_TEST_EMAIL=user_a@test.com \
CORVIOZ_TEST_PASSWORD='replace-with-temp-password' \
npm run verify:production-loop
```

Pass condition: script completes without errors.

## Deployment Status

Current status:

- Local schema/lint/build: passed on 2026-06-18.
- Supabase production setup: completed and verified.
- Vercel production env setup: pending.
- Vercel production deployment: pending.
- Live `/sitemap.xml` and `/robots.txt` checks: pending until deploy.

Do not connect Paddle checkout/webhooks in this phase. Paddle variables remain reserved only.
