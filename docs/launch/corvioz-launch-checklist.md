# Corvioz Launch Readiness Checklist

This checklist contains the necessary branding, product, SEO, security, routing, billing, and production readiness checks that must be executed and signed off prior to the official public release of **Corvioz**.

---

## 1. Branding & Visual Assets
* [ ] **Verify Logo Assets**: Ensure all SVG links (`logo-dark.svg`, `logo-light.svg`, `logo-symbol.svg`, `logo-wordmark.svg` in `/public`) render correctly and contain the updated Corvioz branding mark (C-arc enclosing the F-arrow symbol).
* [ ] **Favicon & Apple Touch Icons**: Confirm `favicon.ico`, `favicon.svg`, and `apple-touch-icon.png` in `/public` render sharp and clear on desktop tab bar and mobile bookmarks.
* [ ] **No Legacy References**: Search workspace for any remaining instances of `FreelanceOS` to guarantee 100% brand consistency.
* [ ] **Social Handles**: Verify social profile hooks (e.g. `@corvioz` on Twitter/X, support/contact links) route to active, branded accounts.

## 2. Product Features & Usability
* [ ] **Landing Page Flow**: Validate that the CTAs (*Start Free* and *View Demo*) route users to `/auth` and `/card/demo` respectively.
* [ ] **Timeline Steps**: Test the interactive timeline on the landing page on different viewport sizes (mobile, tablet, desktop).
* [ ] **Bento Grid Responsiveness**: View `/card/demo` and check that the services list, Availability details, and timezone parameters align nicely in a grid on large viewports and collapse cleanly into a single column on mobile viewports.
* [ ] **Leads Inbox Action**: Submit a test lead via a public profile, check that it appears inside the Dashboard Leads Inbox instantly, and click "AI Quote" to confirm the estimate generation launches.
* [ ] **PDF Invoicing Export**: Open client portal invoice, click "Print/Download PDF" and confirm page layout prints correctly on A4 or Letter sizes with no cut-off margins.

## 3. SEO & Structured Metadata
* [ ] **Verify Sitemap.xml**: Navigate to `/sitemap.xml` in local/staging and verify it includes money tools, legal pages, and blog slugs. Ensure public freelancer profiles are excluded.
* [ ] **Verify Robots.txt**: Navigate to `/robots.txt` and ensure it allows crawlers on core routes while explicitly blocklisting `/api/` and `/portal/` endpoints to protect private client data.
* [ ] **Canonical Tags**: Check page sources for `/invoice-generator`, `/quote-generator`, and blog pages to ensure `<link rel="canonical" href="https://corvioz.com/..."/>` matches the correct production URL.
* [ ] **JSON-LD Schema Validation**: Run money templates and blog posts through Google's Rich Results Test tool to check for valid `FAQPage` and `Article` structured markup.
* [ ] **OpenGraph / Twitter Visuals**: Ensure `og-image.png` and `twitter-image.png` are in `/public` and defined correctly in metadata configurations.

## 4. Security & Cryptographic Access
* [ ] **Row-Level Security (RLS)**: Verify RLS is enabled on all 10 tables (`profiles`, `clients`, `invoices`, `subscriptions`, `usage`, `card_profiles`, `leads`, `quotes`, `portal_tokens`, `audit_logs`).
* [ ] **API Auth Guarding**: Confirm that every endpoint in `src/app/api` (except public profile reads and public lead postings) utilizes `getRequestUser` to reject unauthenticated requests with HTTP 401.
* [ ] **Portal Token Security**: Verify that token validation uses SHA-256 hash matching (`hashPortalToken`) and that old tokens are immediately revoked (`revoked_at` timestamp is updated) upon new token generation.
* [ ] **Rate Limiting**: Verify Upstash Redis env variables are set to restrict bots from spamming `/api/leads` and quote generator endpoints.

## 5. Routing Integrity
* [ ] **Portal Subrouting**: Confirm client portals resolve under `/portal/[token]` and that comments post successfully to the server database.
* [ ] **Redirect Rules**: Check that the middleware redirects unauthenticated users trying to access `/dashboard/*` back to `/auth` smoothly.
* [ ] **Flexible Tokenless Portals**: Confirm `/portal/doc/[id]` displays the correct read-only document and doesn't trigger 404 in production.

## 6. Payment & Billing Readiness
* [ ] **Paddle Webhook Secret**: Configure and verify `PADDLE_WEBHOOK_SECRET` in production env variables.
* [ ] **Price Mapping**: Ensure Paddle product price IDs match price columns within public profiles database records.
* [ ] **Paddle Checkout SDK**: Load the Paddle integration JavaScript in script headers and test sandbox checkouts.
* [ ] **Entitlement Status Updates**: Trigger sandbox webhook callbacks and ensure user accounts are updated to `plan = 'pro'` in Supabase instantly.

## 7. Production Infrastructure
* [ ] **Supabase Migrations**: Run `supabase/schema.sql` in the production Supabase SQL editor to set up tables, schema constraints, indexes, and policy permissions.
* [ ] **Production Environment Variables**: Populate Vercel production settings with required values:
  * `NEXT_PUBLIC_SITE_URL` = `https://corvioz.com`
  * `NEXT_PUBLIC_SUPPORT_EMAIL` = `support@corvioz.com`
  * `NEXT_PUBLIC_SUPABASE_URL` = `[Production URL]`
  * `NEXT_PUBLIC_SUPABASE_ANON_KEY` = `[Production Anon Key]`
  * `SUPABASE_SERVICE_ROLE_KEY` = `[Production Service Role Key]` (keep server-side only!)
  * `UPSTASH_REDIS_REST_URL` = `[Upstash URL]`
  * `UPSTASH_REDIS_REST_TOKEN` = `[Upstash Token]`
  * `DEEPSEEK_API_KEY` = `[DeepSeek API Key]`
* [ ] **Domain & SSL**: Setup DNS A/CNAME records in registrar and confirm Vercel SSL certificates are active.
* [ ] **Production Build Command**: Run `npm run build` once more to ensure clean compilation.
