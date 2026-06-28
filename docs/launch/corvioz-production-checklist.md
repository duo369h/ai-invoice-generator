# Corvioz Production Checklist

Status: **Not launch ready**

Use this as the production gate before sending real freelancers to Corvioz.

## 1. Deployment

- [ ] Deploy the current checkout to production.
- [ ] Confirm `https://www.corvioz.com` and `https://corvioz.vercel.app` serve the same deployment hash/content as the local production build.
- [ ] Decide the canonical host: either make `https://corvioz.com` serve directly, or update generated metadata/sitemap/robots to `https://www.corvioz.com`.
- [ ] Re-check `https://corvioz.com/sitemap.xml` and `https://www.corvioz.com/sitemap.xml`.
- [ ] Confirm live sitemap count matches the local build artifact. Current evidence: local build has 821 URLs; live sitemap has 31 URLs.
- [ ] Confirm `robots.txt` matches the launch policy and includes no stale endpoints.
- [ ] Confirm `/`, `/pricing`, `/auth`, `/dashboard`, `/card/demo`, `/robots.txt`, `/sitemap.xml`, and `/manifest.webmanifest` return expected statuses.

## 2. Supabase

- [ ] Run `supabase/schema.sql` against the production Supabase project.
- [ ] Confirm RLS is enabled on `profiles`, `clients`, `invoices`, `quotes`, `leads`, `card_profiles`, `portal_tokens`, `audit_logs`, `subscriptions`, and `usage`.
- [ ] Confirm `payment_link` exists on `public.invoices`.
- [ ] Confirm public read policy exists for published `card_profiles`.
- [ ] Confirm anon insert policy exists for `leads` and cannot write leads for unpublished profiles.
- [ ] Confirm authenticated users can only read/write their own dashboard data.
- [ ] Confirm `SUPABASE_SERVICE_ROLE_KEY` exists only in server-side production env vars.
- [ ] Create or confirm one production test user for E2E verification.
- [ ] Run `npm run verify:production-loop` with production env vars and a confirmed test user.

## 3. Resend

- [ ] Add `RESEND_API_KEY` to production server env vars.
- [ ] Add `RESEND_FROM_SUPPORT`.
- [ ] Add `RESEND_FROM_BILLING`.
- [ ] Verify Resend sender domain for `corvioz.com`.
- [ ] Confirm SPF, DKIM, and DMARC records.
- [ ] Send and receive a real welcome email.
- [ ] Send and receive a real lead notification email.
- [ ] Send and receive real quote-approved and invoice-sent emails.
- [ ] Ensure production does not silently treat mock email mode as success.

## 4. Google Analytics 4

- [ ] Fix the env contract mismatch: docs use `NEXT_PUBLIC_GA_ID`, implementation reads `NEXT_PUBLIC_GA_TRACKING_ID`.
- [ ] Add the chosen GA4 measurement ID to production.
- [ ] Verify the GA script is present in the rendered page.
- [ ] Verify page views in GA4 Realtime or DebugView.
- [ ] Verify key events: `cta_click`, `quote_generated`, and `invoice_generated`.

## 5. Environment Variables

- [ ] Confirm all required variables exist in Vercel production, preview, and local verification contexts as appropriate.
- [ ] Confirm no server-only secret uses a `NEXT_PUBLIC_` prefix.
- [ ] Confirm the standalone verifier can read the same Supabase vars used by the deployed app.
- [ ] Confirm Upstash vars are production-ready and not exhausted or mis-keyed.
- [ ] Confirm optional AI vars are intentionally configured or intentionally absent.

## 6. Security

- [ ] Confirm protected APIs return `401` when unauthenticated, not a global `429`.
- [ ] Confirm unconfigured persistence returns `503` in production.
- [ ] Confirm tokenless `/api/portal/doc/[id]` and `/portal/doc/[id]` remain disabled or noindexed as intended.
- [ ] Review CSP before launch; current policy allows `unsafe-inline` and `unsafe-eval`.
- [ ] Remove or reconcile conflicting `X-Frame-Options` declarations between middleware and `vercel.json`.
- [ ] Confirm payment links remain HTTPS and restricted to approved payment hosts.
- [ ] Confirm email HTML safely handles user-controlled names, messages, notes, and line items.
- [ ] Confirm demo data seeding is intentional for real production users.

## 7. E2E Workflow Gate

- [ ] Register a new user.
- [ ] Login using magic link or Google OAuth.
- [ ] Create a public profile.
- [ ] Open the public profile URL.
- [ ] Submit a public lead.
- [ ] Confirm the lead appears in the dashboard.
- [ ] Generate a quote.
- [ ] Confirm a portal token is returned.
- [ ] Generate an invoice with a payment link.
- [ ] Open the client portal with the signed token.
- [ ] Submit a portal comment.
- [ ] Mark quote approved and confirm dashboard status updates.
- [ ] Mark invoice sent and confirm email is delivered.
- [ ] Mark invoice paid and confirm dashboard and email updates.

## Verified In This Audit

- [x] `npm run lint` passed.
- [x] `npm run build` passed.
- [x] `npm run verify:schema` passed.
- [x] Local production server started and served `/`, `/auth`, `/robots.txt`, and `/sitemap.xml`.
- [x] Tokenless portal document access returned 404 locally and live.
- [x] Live `https://www.corvioz.com` returned 200.

## Not Verified In This Audit

- [ ] Full authenticated Supabase write flow.
- [ ] User registration email/magic-link delivery.
- [ ] Google OAuth provider setup.
- [ ] Valid client portal token access.
- [ ] Real Resend delivery.
- [ ] GA4 collection.
- [ ] Production database schema state inside Supabase.
