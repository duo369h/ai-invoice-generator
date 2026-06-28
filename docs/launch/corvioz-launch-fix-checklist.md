# Corvioz Launch Fix Checklist

Date: 2026-06-19

## Completed In Code

- [x] Selected one canonical host: `https://www.corvioz.com`
- [x] Updated site URL config default.
- [x] Updated `.env.example` canonical URL.
- [x] Updated sitemap/robots canonical output.
- [x] Updated metadata/Open Graph canonical URLs.
- [x] Updated email portal links to use configured canonical URL.
- [x] Updated deployment/domain/env docs to use `www`.
- [x] Standardized GA4 variable on `NEXT_PUBLIC_GA_ID`.
- [x] Removed checked `NEXT_PUBLIC_GA_TRACKING_ID` references.
- [x] Updated CSP to allow GA4 endpoints.
- [x] Changed private route rate limiting to run after auth validation.
- [x] Added authenticated user-keyed rate limiting helper.
- [x] Kept IP rate limits on public/anonymous endpoints.
- [x] Removed Resend mock-success behavior when API key is missing.
- [x] Added visible email failure logging for missing Resend API key.
- [x] Aligned Vercel `X-Frame-Options` header with middleware `DENY`.

## Local Verification Passed

- [x] `npm run lint`
- [x] `npm run verify:schema`
- [x] `npm run build`
- [x] Built sitemap artifact contains 821 URLs.
- [x] Local production `/sitemap.xml` returns 821 URLs.
- [x] Local production `/robots.txt` uses `https://www.corvioz.com`.
- [x] Local production homepage canonical uses `https://www.corvioz.com`.
- [x] Local production homepage `og:url` uses `https://www.corvioz.com`.
- [x] Local production `/api/user` without auth returns `401`.
- [x] Local production CSP includes GA4 endpoints.

## Still Blocked On Live Production

- [ ] Approve and run production Vercel deployment.
- [ ] Confirm latest deployment is assigned to `www.corvioz.com`.
- [ ] Confirm latest deployment is assigned to `corvioz.com`.
- [ ] Confirm apex still redirects to `https://www.corvioz.com/`.
- [ ] Confirm live `/sitemap.xml` returns 821 URLs.
- [ ] Confirm every live sitemap `<loc>` uses `https://www.corvioz.com`.
- [ ] Confirm live `/robots.txt` uses the canonical `www` sitemap.
- [ ] Confirm live homepage canonical/OG use `https://www.corvioz.com`.
- [ ] Confirm live CSP includes GA4 endpoints.
- [ ] Confirm live `/api/user` without auth returns `401`, not `429`.

## Production Env Checklist

- [ ] `NEXT_PUBLIC_SITE_URL=https://www.corvioz.com`
- [ ] `NEXT_PUBLIC_SUPABASE_URL`
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- [ ] `SUPABASE_SERVICE_ROLE_KEY`
- [ ] `UPSTASH_REDIS_REST_URL`
- [ ] `UPSTASH_REDIS_REST_TOKEN`
- [ ] `RESEND_API_KEY`
- [ ] `RESEND_FROM_SUPPORT`
- [ ] `RESEND_FROM_BILLING`
- [ ] `NEXT_PUBLIC_GA_ID`

## Supabase Production Verification

- [ ] Confirm production project URL/key pair matches Vercel env.
- [ ] Confirm auth signups/logins work with intended email-confirmation behavior.
- [ ] Confirm schema migration is applied.
- [ ] Confirm RLS policies are active.
- [ ] Confirm service role key is server-only.
- [ ] Confirm authenticated user can read `/api/user`.
- [ ] Confirm authenticated user can update public profile.
- [ ] Confirm dashboard APIs only return the signed-in user's data.

## Resend Production Verification

- [ ] Confirm sender domain is verified in Resend.
- [ ] Confirm `support@corvioz.com` sender works.
- [ ] Confirm `billing@corvioz.com` sender works.
- [ ] Confirm missing `RESEND_API_KEY` cannot silently report success.
- [ ] Send a real test welcome/quote/invoice email.
- [ ] Confirm API response reports success only when Resend accepts the email.
- [ ] Confirm test inbox receives the email.

## GA4 Verification

- [ ] Confirm `NEXT_PUBLIC_GA_ID` is present in Vercel production.
- [ ] Confirm deployed HTML loads `https://www.googletagmanager.com/gtag/js`.
- [ ] Confirm CSP does not block GA4.
- [ ] Confirm GA4 Realtime or DebugView receives `page_view`.
- [ ] Confirm client-side route changes emit page views.

## Full Workflow Validation

- [ ] Registration
- [ ] Login
- [ ] Public profile creation
- [ ] Public profile page access
- [ ] Lead submission
- [ ] Dashboard lead update
- [ ] Quote creation
- [ ] Invoice creation
- [ ] Client portal token access
- [ ] Portal comment/update flow
- [ ] Email notification trigger
- [ ] Dashboard quote/invoice updates

## Beta Launch Gate

Corvioz is ready for real freelancer beta testing only when all of these are true:

- [ ] Live production is running the latest fixed build.
- [ ] Live sitemap has 821 canonical `www` URLs.
- [ ] Live unauthenticated private API behavior is `401`, not `429`.
- [ ] Production Supabase env is configured and verified.
- [ ] Production Resend env is configured and verified with a real delivered email.
- [ ] GA4 is receiving live events.
- [ ] The full freelancer workflow passes against `https://www.corvioz.com`.
