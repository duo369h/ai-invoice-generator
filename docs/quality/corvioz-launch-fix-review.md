# Corvioz Launch Fix Review

Date: 2026-06-19

Status: **code fixes applied and locally verified; live production is still blocked until Vercel deployment and production env configuration are explicitly approved.**

## Executive Summary

Corvioz is closer to real freelancer beta testing, but it is not yet production-ready on the live domain.

The core launch-blocking code issues were fixed locally:

- Canonical host is now standardized on `https://www.corvioz.com`.
- Local production sitemap contains 821 URLs.
- Local robots and homepage metadata use the canonical `www` host.
- Private API routes now authenticate before user-scoped rate limiting.
- `/api/user` now returns `401` locally for unauthenticated users instead of `429`.
- Resend no longer reports mock success when `RESEND_API_KEY` is missing.
- GA4 now uses one env var, `NEXT_PUBLIC_GA_ID`, and CSP allows GA4 endpoints.

However, live production still serves the old deployment:

- Live sitemap has only 31 URLs.
- Live sitemap and robots still reference `https://corvioz.com`.
- Live `/api/user` still returns `429`.
- Live CSP still lacks GA4 endpoints.
- Production Vercel env configuration remains unverified and was previously reported as empty.

I attempted to deploy, but the production deployment command was rejected by the approval layer because it mutates the live Vercel service. That means the code fixes are ready, but the live site has not received them.

## Fixes Applied

### 1. Deployment And Sitemap Parity

Root cause:

Live Vercel production is stale. The current local codebase builds an 821-URL sitemap, while live production still serves a 31-URL sitemap.

Fix applied:

- Verified local production build.
- Verified generated sitemap output.
- Verified local production sitemap and robots output.
- Prepared canonical sitemap/robots changes for deployment.

Evidence:

- `npm run build` passed.
- `.next/server/app/sitemap.xml.body` contains `821` `<url>` entries.
- Local `http://localhost:3020/sitemap.xml` returns `821`.
- Live `https://www.corvioz.com/sitemap.xml` returns `31`.

Remaining risk:

The live site remains stale until Vercel production deployment is explicitly approved and completed.

### 2. Canonical Domain Unification

Selected canonical host:

`https://www.corvioz.com`

Root cause:

The apex domain redirects to `www`, but sitemap, robots, metadata, docs, and some URL generation paths still used mixed apex references.

Fix applied:

- Updated default site URL config to `https://www.corvioz.com`.
- Updated `.env.example` and local public site URL.
- Updated metadata, sitemap, robots, Open Graph, email portal links, and docs.
- Updated Vercel/domain checklists.

Evidence:

- Local homepage canonical: `https://www.corvioz.com`.
- Local `og:url`: `https://www.corvioz.com`.
- Local robots Host and Sitemap use `https://www.corvioz.com`.
- Static scan found no checked `https://corvioz.com` source/doc references.

Remaining risk:

Live robots and sitemap still use apex because the fixed build has not been deployed.

### 3. API Rate Limit/Auth Ordering

Root cause:

Private routes applied IP rate limiting before auth validation. This caused unauthenticated `/api/user` requests to receive `429` instead of `401`.

Fix applied:

- Added `rateLimitAuthenticated(policy, userId)`.
- Moved auth validation before rate limiting on private routes.
- Kept IP-based limits on public surfaces only.

Evidence:

- Local production `/api/user` without auth returns `HTTP 401 Unauthorized`.
- Live production `/api/user` still returns `HTTP 429`, confirming stale deployment.

Remaining risk:

Authenticated live workflow cannot be validated until the latest code is deployed and production env is configured.

### 4. Resend Email Readiness

Root cause:

Email could previously appear to succeed in mock/simulation mode when Resend was not configured.

Fix applied:

- Removed silent mock success.
- Added `isEmailConfigured()`.
- Missing `RESEND_API_KEY` now returns `success:false` and logs `[EMAIL ERROR]`.
- Resend API failures return `success:false`.
- Email links use the canonical site URL.

Evidence:

- Static scan found no `EMAIL SIMULATION` or `mock_` success path.
- `npm run build` passed.
- Env docs now require `RESEND_API_KEY`, `RESEND_FROM_SUPPORT`, and `RESEND_FROM_BILLING`.

Remaining risk:

Real email delivery was not verified because production Resend env is not confirmed and deployment was not completed.

### 5. GA4 Configuration

Root cause:

Docs and implementation used different GA4 variable names, and CSP did not allow GA4 endpoints.

Fix applied:

- Standardized on `NEXT_PUBLIC_GA_ID`.
- Removed `NEXT_PUBLIC_GA_TRACKING_ID` references from checked source/docs.
- Updated CSP to allow Google Tag Manager and Google Analytics endpoints.

Evidence:

- `AnalyticsProvider` reads `NEXT_PUBLIC_GA_ID`.
- Local production CSP includes GA4 script and collection endpoints.
- Static scan found no `NEXT_PUBLIC_GA_TRACKING_ID` references.

Remaining risk:

GA4 live tracking cannot be verified until `NEXT_PUBLIC_GA_ID` exists in Vercel production and the fixed deployment is live.

## Full Workflow Validation

The complete live workflow is **blocked**, not passed.

| Step | Status | Evidence |
| --- | --- | --- |
| Registration | Blocked | Live private API still returns stale `429`; production env/deploy parity missing. |
| Login | Blocked | Authenticated live session could not be validated while `/api/user` is stale. |
| Public Profile Creation | Blocked | Local route ordering fixed; live private routes remain stale. |
| Lead Submission | Blocked | Requires a live published profile created by an authenticated user. |
| Quote Creation | Blocked | Requires authenticated production API access. |
| Invoice Creation | Blocked | Requires authenticated production API access. |
| Client Portal Access | Blocked | Requires live quote/invoice portal token creation first. |
| Email Trigger Flow | Blocked | Resend env and real delivery not verified. |
| Dashboard Updates | Blocked | Requires production Supabase env and authenticated API success. |

## Verification Commands Run

Passed:

- `npm run lint`
- `npm run verify:schema`
- `npm run build`
- Local sitemap artifact count: `821`
- Local production `/api/user`: `401`
- Local production `/sitemap.xml`: `821`
- Local production `/robots.txt`: canonical `www`
- Local production homepage canonical/OG: canonical `www`

Live failures still present:

- `https://www.corvioz.com/sitemap.xml`: `31`
- `https://www.corvioz.com/api/user`: `429`
- `https://www.corvioz.com/robots.txt`: apex sitemap references
- `https://www.corvioz.com`: old CSP without GA4 endpoints

## Launch Decision

Corvioz is **not ready for real freelancer beta testing on the live domain yet**.

It can become ready after these deployment actions are completed:

1. Explicitly approve production Vercel deployment.
2. Explicitly approve production Vercel env configuration for Supabase, Upstash, Resend, GA4, and canonical site URL.
3. Redeploy.
4. Re-run live sitemap, robots, `/api/user`, email, GA4, and full production-loop workflow validation.

