# Corvioz Launch Blockers

Corvioz is **not ready for real freelancer production use** yet. The app builds, but the live deployment and operational services are not verified enough to trust the full money path.

## P0 Blockers

### 1. Full Production E2E Was Not Verified

`npm run verify:production-loop` failed before execution because the standalone process could not read `NEXT_PUBLIC_SUPABASE_URL`.

Impact: registration, login, public profile creation, lead submission, quote creation, invoice creation, signed portal access, comments, and dashboard updates cannot be claimed production-ready.

Required fix: run the verifier with production Supabase env vars and a confirmed test user.

### 2. Live Deployment Appears Stale

Local production build generated a sitemap with 821 URL entries. The live sitemap at `https://www.corvioz.com/sitemap.xml` has 31 URL entries.

Impact: production is not serving the current local checkout/Sprint 4 launch state.

Required fix: redeploy current checkout, then verify the live sitemap, homepage copy, route table, and Vercel aliases.

### 3. Canonical Domain Conflict

`https://corvioz.com` redirects to `https://www.corvioz.com/`, while generated canonical metadata and sitemap URLs use `https://corvioz.com`.

Impact: SEO canonical signals are split between apex and www.

Required fix: choose one canonical host and align redirects, `NEXT_PUBLIC_SITE_URL`, sitemap, robots, Open Graph URLs, and Vercel aliases.

### 4. Core Production API Is Rate-Limited Before Auth Verification

Live `https://www.corvioz.com/api/user` returned `429 Too Many Requests`.

Impact: real users may fail at dashboard load/login follow-up before reaching normal `401` or authenticated behavior.

Required fix: inspect Upstash production keys, rate-limit key construction, bucket state, and Vercel region behavior. Re-test protected APIs until unauthenticated requests return the expected auth response.

### 5. Resend Production Delivery Is Not Verified

The code has Resend integration, but missing `RESEND_API_KEY` falls back to mock success.

Impact: Corvioz may appear to send welcome, lead, quote, invoice, and paid emails while no real user receives them.

Required fix: configure Resend production env vars, verify domain DNS, send real emails, and make production mock mode visibly fail or warn.

### 6. GA4 Env Contract Is Broken

Docs and `.env.example` use `NEXT_PUBLIC_GA_ID`; `AnalyticsProvider` reads `NEXT_PUBLIC_GA_TRACKING_ID`.

Impact: following the production checklist will not load GA4, so launch traffic and conversion events may be invisible.

Required fix: standardize one env var name and verify GA4 Realtime/DebugView.

## P1 Blockers

### 7. Supabase Production Database Was Not Directly Verified

`supabase/schema.sql` is strong and `npm run verify:schema` passed, but this audit did not prove the production Supabase project actually has the schema, RLS policies, grants, and test data state applied.

Impact: the code can be correct while production DB rejects inserts, exposes rows incorrectly, or lacks required columns.

Required fix: inspect production Supabase directly and run the full production loop.

### 8. CSP Is Launch-Weak

The current CSP allows `unsafe-inline` and `unsafe-eval`.

Impact: XSS containment is weak if any future injection slips through.

Required fix: tighten CSP after confirming Next.js/runtime script requirements.

### 9. Security Header Config Is Duplicated

`middleware.js` sets `X-Frame-Options: DENY`, while `vercel.json` sets `SAMEORIGIN`.

Impact: observed responses use `DENY`, but duplicated policy increases deployment drift risk.

Required fix: keep one clear source of truth for security headers.

### 10. Demo Data Seeds On Real Registration

`ensureProfile` imports `seedDemoData` for new users.

Impact: real freelancers may see demo invoices/leads/quotes during production onboarding, which can reduce trust unless intentionally framed as sample data.

Required fix: decide whether demo seeding is a product onboarding feature. If yes, label it clearly; if no, disable it for production.

## P2 Risks

### 11. Email HTML Escaping Needs Review

Email templates interpolate names, lead messages, quote/invoice fields, and line items into HTML.

Impact: sanitized API inputs reduce risk, but email rendering should still have a dedicated HTML escape rule.

Required fix: add or verify escaping for all user-controlled values in email templates.

### 12. Production Verification Script Needs Env Loading Clarity

Next build loaded `.env.local`; the standalone verifier did not.

Impact: future audits can falsely fail or pass depending on shell setup.

Required fix: document exact command for local, CI, and production verification environments.

## Launch Verdict

Do not launch to real freelancers until all P0 blockers are closed and the full production-loop verifier passes against `https://corvioz.com` or the chosen canonical production host.
