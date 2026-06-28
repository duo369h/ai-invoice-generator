# Corvioz Production Sync & SEO Readiness Report

Generated: 2026-06-20 02:27 CST
Production target: https://www.corvioz.com

## Executive Status

Production is usable for Google organic traffic from an SEO and core-workflow perspective, but analytics readiness is still blocked because no real GA4 Measurement ID is configured in Vercel Production.

The latest visible Antigravity UX shell is already live in production: the homepage shows the updated `Win Clients. Get Paid. Grow Faster.` positioning, updated hero, pricing section, trust copy, and the newer dashboard/onboarding surfaces are present in the live app.

I implemented minimal local tracking/logging patches, verified them with lint/build, but did not deploy them because the production deploy command was blocked by the approval layer due to the very dirty working tree. Directly deploying this checkout would ship many unrelated unreviewed changes beyond tracking/readiness.

## What Is Deployed

Live production checks:

- Homepage loads at `https://www.corvioz.com`.
- Live homepage includes the Antigravity-style Corvioz UI:
  - `Win Clients. Get Paid. Grow Faster.`
  - updated product flow section
  - updated pricing section
  - public profile / quote / invoice / portal positioning
- `robots.txt` is live and blocks private surfaces:
  - `/api/`
  - `/auth/`
  - `/dashboard/`
  - `/portal/`
- `sitemap.xml` is live and uses `https://www.corvioz.com` URLs.
- Homepage canonical and OG/Twitter tags are present.
- Full production workflow passed:
  - Supabase auth session acquired
  - dashboard user API returns authenticated profile/quota
  - public profile created
  - public profile API can read published profile
  - public lead submitted
  - dashboard leads API returns created lead
  - quote created with portal token
  - invoice created with portal token
  - portal token resolves invoice
  - portal comment saved
  - tokenless portal document route returns expected `404`

Production-loop evidence:

```text
Corvioz production loop verification completed successfully.
```

## What Is Missing

1. `NEXT_PUBLIC_GA_ID` is missing from Vercel Production.
   - `npx vercel env ls` showed no GA4 variable.
   - No real GA4 Measurement ID was found in `.env.local`, `.env.example`, or repo docs.
   - I did not set a placeholder ID because that would create fake tracking readiness.

2. The local tracking/logging patch is not deployed.
   - `npm run lint`: passed.
   - `npm run build`: passed.
   - `npx vercel --prod`: blocked by approval layer because the worktree is very dirty.

3. Email delivery is still not fully traceable in production.
   - Resend env exists in Vercel Production.
   - Existing production code can send emails, but does not yet log structured attempt/success/failure with Resend IDs.
   - I added this locally in `src/app/lib/email.js`, but it is not deployed yet.

## GA4 Production Activation

Status: blocked

Production env:

- Missing: `NEXT_PUBLIC_GA_ID`
- Present: Supabase, Resend, Upstash, site/support/billing env vars

Production HTML:

- No `googletagmanager`
- No `google-analytics`
- No `plausible`
- No `clarity`
- No `G-...` Measurement ID

Result:

- GA script is not loaded in production.
- `page_view` tracking is not firing.
- CTA click events are not reaching GA4.
- Dashboard / invoice / quote events are not reaching GA4.

Required action:

- Provide the real GA4 Measurement ID, for example `G-XXXXXXXXXX`.
- Add it to Vercel Production as `NEXT_PUBLIC_GA_ID`.
- Redeploy.
- Verify live HTML includes `https://www.googletagmanager.com/gtag/js?id=...`.
- Verify GA4 Realtime receives `page_view`.

## Funnel Event Tracking Audit

Current production tracking:

- `page_view`: implemented in `AnalyticsProvider`, but inactive because GA4 env is missing.
- CTA click: partially implemented on homepage, but inactive because GA4 env is missing.
- Public profile view: implemented, inactive without GA4.
- Lead submission: implemented, inactive without GA4.
- Quote created: implemented, inactive without GA4.
- Invoice created: implemented, inactive without GA4.

Local minimal patch added but not deployed:

- `signup_login_intent`
- `signup_login_requested`
- `signup_login_failed`
- `login_success`
- `profile_created`
- `pricing_click_intent`
- `dashboard_tab_click`
- `quick_action_click`
- `quote_convert_to_invoice`

Production tracking gaps until deploy:

- Signup
- Login
- Create profile
- Dashboard quick actions
- Pricing click intent beyond existing homepage CTA clicks
- Quote-to-invoice conversion

## Email Production Logging

Current production:

- Resend env is configured in Vercel Production:
  - `RESEND_API_KEY`
  - `RESEND_FROM_SUPPORT`
  - `RESEND_FROM_BILLING`
- Existing code logs some failures, but does not log every attempt and success with structured metadata.

Local minimal patch added but not deployed:

- Logs `[EMAIL] send_attempt`.
- Logs `[EMAIL] send_success` with `resend_id`.
- Logs `[EMAIL] send_failed`.
- Logs email type:
  - `welcome`
  - `new_lead`
  - `quote_approved`
  - `invoice_sent`
  - `invoice_paid`
- Logs sender and recipient domain only, not full recipient email.

Email traceability status:

- Current production: partial.
- Local code after patch: ready.
- Production after deploy: should be traceable in Vercel logs.

## SEO Readiness Status

Status: passed with one caveat

Verified production:

- Canonical URL:
  - `https://www.corvioz.com`
- OG URL:
  - `https://www.corvioz.com`
- OG image:
  - production absolute URL present
- Twitter image:
  - production absolute URL present
- Robots:
  - allows public pages
  - disallows private/app/API surfaces
  - points to production sitemap
- Sitemap:
  - live at `https://www.corvioz.com/sitemap.xml`
  - includes homepage, blog, client, consultants, contact, designers, developers, and programmatic SEO routes
  - local build artifact also uses `https://www.corvioz.com`

Caveat:

- `google-site-verification` still shows placeholder value in production HTML.
- If Search Console verification depends on this meta tag, replace it with the real verification value.

## Analytics Readiness Status

Status: failed until GA4 ID is provided and deployed

Code readiness:

- GA4 loader exists.
- GA4 route-change pageview forwarding exists.
- Event forwarding via `trackEvent` exists.
- Local patch fills missing funnel events.

Production readiness:

- Not ready.
- No GA4 Measurement ID configured.
- No GA4 script rendered.
- No real proof of page_view or CTA click collection.

## Production Verification

Live test command:

```bash
CORVIOZ_BASE_URL=https://www.corvioz.com \
CORVIOZ_TEST_EMAIL=corvioz-e2e-test-user@gmail.com \
CORVIOZ_TEST_PASSWORD='***' \
npm run verify:production-loop
```

Result:

- Passed.

Covered:

- landing/public domain availability
- signup/login via confirmed Supabase test user
- dashboard authenticated user API
- public profile
- lead capture
- quote creation
- invoice creation
- client portal token
- portal comment
- tokenless portal protection

## Deploy Status

Attempted:

```bash
npx vercel --prod
```

Result:

- Blocked by approval layer.

Reason:

- The worktree is very dirty.
- Deploying now would ship many unrelated, unreviewed changes in addition to the tracking/logging readiness patch.

Safe paths forward:

1. Explicitly approve deploying the current dirty working tree to production, accepting the broader blast radius.
2. Create a clean release branch containing only intended Antigravity UX changes plus the minimal tracking/logging patch, then deploy that.

## Files Changed Locally For Tracking/Logging

- `src/app/lib/email.js`
  - structured email attempt/success/failure logs
- `src/app/auth/page.js`
  - signup/login intent tracking
- `src/app/pricing/page.js`
  - pricing click intent tracking
- `src/app/dashboard/DashboardClient.js`
  - login success, profile creation, quick action, tab, quote/invoice funnel tracking
  - small Quick Action stability fix so create quote/invoice moves to the right tab
- `src/app/page.js`
  - pricing intent tracking on pricing anchors/cards

Validation:

- `npm run lint`: passed.
- `npm run build`: passed.

## Final Readiness Call

SEO readiness: mostly ready.

Core workflow readiness: ready.

Analytics readiness: not ready.

Email traceability: locally prepared, not deployed.

Production sync: partially complete. Antigravity UX appears live, but the new tracking/logging patch could not be deployed without explicit approval because of the dirty working tree.

Corvioz is not fully ready for Google organic traffic conversion tracking until:

1. a real `NEXT_PUBLIC_GA_ID` is added to Vercel Production,
2. the tracking/logging patch is deployed,
3. GA4 Realtime confirms `page_view` and CTA events,
4. email logs show Resend success IDs for lead/quote/invoice/welcome flows.
