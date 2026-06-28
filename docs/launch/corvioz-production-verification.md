# Corvioz Production Verification

Date: 2026-06-19

## Verdict

Corvioz has moved from **local-ready** to **public production shell deployed**, but it is **not fully production-ready** for real freelancer beta testing yet.

The latest build is live on Vercel and the public SEO/domain blockers are fixed. The remaining blocker is production environment configuration: the Vercel project currently has no environment variables, so Supabase persistence, Upstash rate limiting, Resend email delivery, GA4 tracking, and the complete authenticated workflow cannot pass.

## Deployment Status

Status: **Deployed**

Evidence:

- Vercel project: `jianxu-han-s-projects/corvioz`
- Vercel account: `raykane6699-5244`
- Project link file: `.vercel/project.json`
  - `projectName`: `corvioz`
  - `projectId`: `prj_vsDLlC8wNXxW1XLgPWQxjIQOqVUl`
- New production deployment:
  - `https://corvioz-g16d0li25-jianxu-han-s-projects.vercel.app`
  - deployment id: `dpl_EBDtdmdPWy4DimvkHzjwn6Wm56t8`
  - ready state: `READY`
  - target: `production`
- Vercel production build completed successfully.
- Build generated 954 static pages.

Vercel CLI showed all Corvioz aliases now point to the new deployment:

- `corvioz.vercel.app`
- `corvioz-jianxu-han-s-projects.vercel.app`
- `corvioz-raykane6699-5244-jianxu-han-s-projects.vercel.app`
- `corvioz.com`
- `www.corvioz.com`

## Domain Status

Status: **Public domain routing works**

Canonical host:

`https://www.corvioz.com`

Evidence:

- `https://corvioz.com` returns `HTTP 308` to `https://www.corvioz.com/`.
- `https://www.corvioz.com` returns `HTTP 200`.
- Live response is served by Vercel.
- Live security headers include:
  - `content-security-policy`
  - `strict-transport-security`
  - `x-frame-options: DENY`
  - `x-content-type-options: nosniff`
  - `referrer-policy: strict-origin-when-cross-origin`

Domain caveat:

`vercel domains inspect corvioz.com` still shows third-party DNS nameservers:

- `breeze.dnspod.net`
- `julie.dnspod.net`

The domain is routing through Vercel successfully, but DNS ownership/intent should still be reviewed in the registrar/DNS provider because Vercel reports current nameservers as third-party.

## Environment Status

Status: **Blocked**

Evidence:

`npx vercel env ls` returned:

```text
No Environment Variables found for jianxu-han-s-projects/corvioz
```

Required production env vars that are currently missing from Vercel:

- `NEXT_PUBLIC_SITE_URL`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `UPSTASH_REDIS_REST_URL`
- `UPSTASH_REDIS_REST_TOKEN`
- `RESEND_API_KEY`
- `RESEND_FROM_SUPPORT`
- `RESEND_FROM_BILLING`
- `NEXT_PUBLIC_GA_ID`

Attempted env sync:

- A scoped attempt to copy existing local `.env.local` values into Vercel production was rejected by the approval layer because it would transfer sensitive local secrets to an external service.
- I did not work around that rejection.
- Local `.env.local` contains Supabase and Upstash variable names, but does not contain `RESEND_API_KEY` or `NEXT_PUBLIC_GA_ID`.

## Supabase Production Connection

Status: **Blocked**

Evidence:

Live API response:

```text
GET https://www.corvioz.com/api/user
HTTP 503
{"error":"user profile is unavailable because production persistence is not configured."}
```

Interpretation:

- The latest code is live.
- The stale `429` behavior on `/api/user` is gone.
- The app is correctly failing closed because Supabase env is absent in Vercel.

Remaining blocker:

Supabase production cannot be verified until these variables are added to Vercel production and the app is redeployed:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

## Resend Production Connection

Status: **Blocked**

Evidence:

- Vercel production has no env vars.
- Local `.env.local` does not include `RESEND_API_KEY`.
- Therefore no real Resend production delivery test could be run.

Expected production requirement:

- `RESEND_API_KEY`
- `RESEND_FROM_SUPPORT`
- `RESEND_FROM_BILLING`

Current code behavior:

- Missing Resend configuration no longer silently succeeds.
- Email sends should fail visibly with `success:false` when `RESEND_API_KEY` is missing.

Remaining blocker:

Add real Resend production credentials in Vercel, redeploy, then send a real quote/invoice email to a test inbox.

## GA4 Production Connection

Status: **Blocked**

Evidence:

- Vercel production has no env vars.
- Local `.env.local` does not include `NEXT_PUBLIC_GA_ID`.
- Live CSP now allows GA4 endpoints:
  - `https://www.googletagmanager.com`
  - `https://www.google-analytics.com`
  - `https://analytics.google.com`
  - `https://region1.google-analytics.com`
  - `https://*.google-analytics.com`

Remaining blocker:

Set `NEXT_PUBLIC_GA_ID` in Vercel production, redeploy, then confirm `page_view` events in GA4 Realtime or DebugView.

## Live Sitemap Verification

Status: **Passed**

Evidence:

```text
GET https://www.corvioz.com/sitemap.xml
<url> count: 821
```

Sample live sitemap entries:

```text
https://www.corvioz.com
https://www.corvioz.com/blog
https://www.corvioz.com/blog/best-invoice-software-for-freelancers
https://www.corvioz.com/client
https://www.corvioz.com/freelancers
https://www.corvioz.com/invoice-generator
```

All sampled `<loc>` values use the canonical `https://www.corvioz.com` host.

## Live Robots Verification

Status: **Passed**

Evidence:

```text
User-Agent: *
Allow: /
Disallow: /api/
Disallow: /auth/
Disallow: /dashboard/
Disallow: /portal/

Host: https://www.corvioz.com
Sitemap: https://www.corvioz.com/sitemap.xml
```

## Live Canonical Metadata Verification

Status: **Passed**

Evidence from `https://www.corvioz.com`:

```text
rel="canonical" href="https://www.corvioz.com"
property="og:url" content="https://www.corvioz.com"
```

Public image URLs also use `https://www.corvioz.com`.

## Live API Behavior

Status: **Partially passed, blocked by env**

Passed:

- `/api/user` no longer returns stale pre-auth `429`.
- `/api/user` now fails closed with `503` because production persistence is not configured.

Evidence:

```text
GET https://www.corvioz.com/api/user
HTTP 503
{"error":"user profile is unavailable because production persistence is not configured."}
```

Blocked:

- Authenticated user data access cannot be tested without Supabase env.
- Public `/api/freelancers` currently returns `429` because production Upstash env is missing and rate limiting cannot operate normally.

Evidence:

```text
GET https://www.corvioz.com/api/freelancers
HTTP 429
{"error":"Too many requests"}
```

## Workflow Status

Status: **Blocked**

The complete production workflow could not be run because production persistence is not configured in Vercel.

| Step | Status | Reason |
| --- | --- | --- |
| Registration | Blocked | Supabase env missing in Vercel production. |
| Login | Blocked | Supabase env missing in Vercel production. |
| Public Profile Creation | Blocked | Authenticated API access unavailable. |
| Lead Submission | Blocked | Requires a published profile created by an authenticated user. |
| Quote Creation | Blocked | Authenticated API access unavailable. |
| Invoice Creation | Blocked | Authenticated API access unavailable. |
| Portal Access | Blocked | Requires quote/invoice portal token creation first. |
| Email Trigger Flow | Blocked | Resend env missing. |
| Dashboard Updates | Blocked | Supabase env missing in Vercel production. |

## Remaining Blockers

### P0: Configure Vercel Production Env

Add the required production variables to Vercel:

- `NEXT_PUBLIC_SITE_URL=https://www.corvioz.com`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `UPSTASH_REDIS_REST_URL`
- `UPSTASH_REDIS_REST_TOKEN`
- `RESEND_API_KEY`
- `RESEND_FROM_SUPPORT`
- `RESEND_FROM_BILLING`
- `NEXT_PUBLIC_GA_ID`

Then redeploy.

### P0: Verify Supabase Production Workflow

After env is configured:

- Confirm unauthenticated `/api/user` returns `401`.
- Confirm authenticated `/api/user` returns `200`.
- Run `npm run verify:production-loop` against `https://www.corvioz.com`.

### P0: Verify Resend Delivery

After env is configured:

- Send a real quote/invoice email.
- Confirm Resend accepts the send.
- Confirm the test inbox receives the message.

### P1: Verify GA4 Events

After `NEXT_PUBLIC_GA_ID` is configured and redeployed:

- Confirm GA4 script appears in live HTML.
- Confirm GA4 Realtime or DebugView receives `page_view`.

## Production Readiness Decision

Corvioz is **not production-ready for real freelancer beta testing yet**.

It is now deployed with correct public sitemap, robots, canonical metadata, and domain routing. The remaining work is not feature development; it is production environment setup and live workflow verification.

