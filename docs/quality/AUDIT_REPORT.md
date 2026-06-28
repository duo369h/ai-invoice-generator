# Corvioz Sprint 1 Release Audit

Audit date: 2026-06-16

## Executive Summary

Sprint 1 is closed. This package does not include Sprint 2 development work.

The release snapshot focuses on the Corvioz V1 surface: homepage, pricing, quote generator, invoice generator, public freelancer profile, client portal, blog/SEO pages, authenticated dashboard, and Supabase-backed APIs.

Cleanup performed before this audit:

- Removed unused dashboard components: `LeadsBoard.js`, `QuotesPanel.js`.
- Removed unused SEO component: `ProgrammaticSeoPage.js`.
- Removed local file persistence and quota helpers: `db.json`, `src/app/lib/db.js`, `src/app/lib/quota.js`.
- Removed local demo data: `src/app/lib/demo-data.js`.
- Removed hidden Dashboard Copilot dead code.
- Removed public internal `/design-system` page while keeping shared `design-system/tokens.js`.
- Removed unused default Next assets and one-off asset generation script.
- Replaced `/card/demo` links with production-facing directory/profile entry points.

## A. Route Audit

### Public Static And Dynamic Pages

| Route | Source | Type | Public | Notes |
| --- | --- | --- | --- | --- |
| `/` | `src/app/page.js` | Static | Yes | Homepage. |
| `/pricing` | `src/app/pricing/page.js` | Static | Yes | V1 pricing/roadmap copy. |
| `/invoice-generator` | `src/app/invoice-generator/page.js` | Static | Yes | SEO money page with FAQ schema. |
| `/quote-generator` | `src/app/quote-generator/page.js` | Static | Yes | SEO money page with FAQ schema. |
| `/invoice-template/[industry]` | `src/app/invoice-template/[industry]/page.js` | SSG | Yes | Generates industry invoice template pages. |
| `/quote-template/[industry]` | `src/app/quote-template/[industry]/page.js` | SSG | Yes | Generates industry quote template pages. |
| `/card/[username]` | `src/app/card/[username]/page.js` | Dynamic | Yes | Public profile lookup; depends on Supabase. |
| `/blog` | `src/app/blog/page.js` | Static | Yes | Blog index. |
| `/blog/[slug]` | `src/app/blog/[slug]/page.js` | SSG | Yes | Blog details with FAQ schema. |
| `/freelancers` | `src/app/freelancers/page.js` | Static | Yes | Directory entry page. |
| `/freelancers/[category]` | `src/app/freelancers/[category]/page.js` | Dynamic | Yes | Category directory page. |
| `/developers` | `src/app/developers/page.js` | Static | Yes | Segment landing page. |
| `/designers` | `src/app/designers/page.js` | Static | Yes | Segment landing page. |
| `/consultants` | `src/app/consultants/page.js` | Static | Yes | Segment landing page. |
| `/marketers` | `src/app/marketers/page.js` | Static | Yes | Segment landing page. |
| `/client` | `src/app/client/page.js` | Static | Yes | Portal token entry page. |
| `/portal/[token]` | `src/app/portal/[token]/page.js` | Dynamic | Token URL | Signed portal token page. |
| `/portal/doc/[id]` | `src/app/portal/doc/[id]/page.js` | Dynamic | Disabled in production | Tokenless document route returns 404 in production. |
| `/dashboard` | `src/app/dashboard/page.js` | Dynamic | Requires login for data actions | Dashboard shell. APIs enforce auth. |
| `/auth` | `src/app/auth/page.js` | Static | Yes | Auth entry page. |
| `/payment-instructions` | `src/app/payment-instructions/page.js` | Static | Yes | Manual payment instructions page. |
| `/contact` | `src/app/contact/page.js` | Static | Yes | Contact/support page. |
| `/privacy` | `src/app/privacy/page.js` | Static | Yes | Legal page. |
| `/terms` | `src/app/terms/page.js` | Static | Yes | Legal page. |
| `/refund-policy` | `src/app/refund-policy/page.js` | Static | Yes | Legal page. |
| `/robots.txt` | `src/app/robots.js` | Static metadata route | Yes | Disallows `/api/` and `/portal/`. |
| `/sitemap.xml` | `src/app/sitemap.js` | Static metadata route | Yes | Includes money pages, templates, blog, and legal pages. Public profiles are not seeded. |
| `/rss.xml` | `src/app/rss.xml/route.js` | Dynamic route | Yes | RSS feed. |

### Removed Or Invalid Routes

| Route/File | Action | Reason |
| --- | --- | --- |
| `/design-system` | Removed page route | Internal design review surface, not a production public page. Shared `tokens.js` retained because Dashboard uses it. |
| Local demo profile `/card/demo` links | Removed from public copy | No bundled demo profile file remains. |

## B. API Audit

| API route | Methods | Login required | Fail-closed | Supabase dependency | Notes |
| --- | --- | --- | --- | --- | --- |
| `/api/card-profile` | GET | Public when `username` query is present; otherwise yes | Yes | Yes | Public profile lookup uses Supabase/public client. Private dashboard profile lookup and POST require auth. |
| `/api/card-profile` | POST | Yes | Yes | Yes | Saves authenticated user's card profile. |
| `/api/clients` | GET/POST/DELETE | Yes | Yes | Yes | Owner-scoped via Supabase auth and RLS. |
| `/api/freelancers` | GET | No | Yes | Yes | Public directory data; returns 503 if Supabase env is missing. |
| `/api/invoices` | GET/POST/PATCH | Yes | Yes | Yes | Owner-scoped invoices; creates Supabase portal token on insert. |
| `/api/invoices/parse` | POST | Yes | Yes | Yes | Requires auth and Supabase quota. DeepSeek is optional; local heuristic parser is used when key is absent/unavailable. |
| `/api/leads` | GET/PATCH | Yes | Yes | Yes | Dashboard lead access and updates are owner-scoped. |
| `/api/leads` | POST | No | Yes | Yes | Public lead submission by profile username. Requires Supabase. Rate-limited and spam checked. |
| `/api/quotes` | GET/POST/PATCH | Yes | Yes | Yes | Owner-scoped quotes; creates Supabase portal token on insert. |
| `/api/quotes/generate` | POST | Yes | Yes | Auth via Supabase | Requires authenticated context. DeepSeek optional; local heuristic parser is used when key is absent/unavailable. |
| `/api/portal/token/[token]` | GET/POST | No login; signed token required | Yes | Yes, service role | Hashes portal token and resolves document by owner/resource. POST comments require valid token. |
| `/api/portal/doc/[id]` | GET/POST | No login in dev; disabled in production | Yes | Yes, service role | Tokenless document access returns 404 in production. |
| `/api/user` | GET/POST | Yes | Yes | Yes | GET returns profile/quota. POST plan changes are blocked for V1 beta. |
| `/rss.xml` | GET | No | N/A | No | Public RSS feed route. |

## C. SEO Audit

### Sitemap

- Implemented in `src/app/sitemap.js`.
- Includes:
  - `/`
  - `/invoice-generator`
  - `/quote-generator`
  - `/invoice-template/[industry]`
  - `/quote-template/[industry]`
  - Dynamic `/card/[username]` pages are not hard-coded into the sitemap. Public, completed profiles can be indexed by page-level robots metadata; private or incomplete profiles are noindex.
  - `/blog/[slug]`
  - `/pricing`
  - `/privacy`
  - `/terms`
  - `/refund-policy`

### Robots

- Implemented in `src/app/robots.js`.
- Allows `/`.
- Disallows `/api/` and `/portal/`.
- Lists `/sitemap.xml` and `/rss.xml`.

### Canonical

- Global canonical base configured in `src/app/layout.js` with `metadataBase`.
- Page-level canonicals present for:
  - `/invoice-generator`
  - `/quote-generator`
  - `/card/[username]`
  - `/blog/[slug]`
  - `/invoice-template/[industry]`
  - `/quote-template/[industry]`

### Metadata

- Global metadata in `src/app/layout.js` includes title template, description, keywords, Open Graph, Twitter card, icons, manifest, robots, and Google verification placeholder/env hook.
- Individual metadata exists for legal/payment pages and SEO pages.
- Dynamic metadata exists for profile, blog, invoice template, and quote template pages.

### FAQ Schema

- `FAQPage` JSON-LD present in:
  - `src/app/components/SeoMoneyPage.js`
  - `src/app/components/TemplateSeoPage.js`
  - `src/app/components/SeoPageLayout.js`
  - `src/app/blog/[slug]/page.js`

## D. Security Audit

### Portal Token

- Token generation uses `crypto.randomBytes(32).toString('base64url')`.
- Stored token value is hashed with SHA-256 via `hashPortalToken`.
- Portal tokens include:
  - `owner_id`
  - `resource_type`
  - `resource_id`
  - `scope`
  - `expires_at`
  - `revoked_at`
- Resolution checks hash, expiry, and revoked status in Supabase.

### Document Access

- `/portal/[token]` and `/api/portal/token/[token]` are the production document access path.
- `/portal/doc/[id]` and `/api/portal/doc/[id]` are tokenless document access paths and are disabled in production with 404/closed behavior.
- Portal comments require valid portal token or non-production tokenless access.

### API Auth

- Private APIs call `getRequestUser(request)`.
- Missing production Supabase config returns `mode: unconfigured`, converted to HTTP 503.
- Missing/invalid auth returns `mode: unauthenticated`, converted to HTTP 401.
- Local file fallback persistence was removed from active APIs.

### Rate Limiting

- Core APIs use `rateLimit` or `rateLimitByPolicy`.
- Production should use Upstash Redis env vars.
- Local development falls back to in-memory rate limiting.

### Spam And Input Validation

- Lead and portal comment submissions use spam signal checks.
- Payloads are normalized/validated in `src/app/lib/validation.js`.
- Payment links are restricted to allowlisted payment hosts in `src/app/lib/security.js`.

### RLS Dependency Points

RLS is required for:

- `profiles`
- `clients`
- `invoices`
- `quotes`
- `leads`
- `card_profiles`
- `portal_tokens`
- `audit_logs`
- `subscriptions`
- `usage`

Service-role operations are required for:

- Portal token creation/resolution.
- Portal comment writes.
- Audit log writes when authenticated client context is insufficient.
- Subscription/webhook operations if billing is re-enabled.

## E. Production Readiness

### Required Environment Variables

See `ENV_REQUIRED.md`. Minimum production launch requirements:

- `NEXT_PUBLIC_SITE_URL`
- `NEXT_PUBLIC_SUPPORT_EMAIL`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `UPSTASH_REDIS_REST_URL`
- `UPSTASH_REDIS_REST_TOKEN`

### Current Missing/External Requirements

The repository does not include secrets. A production deployment must provide:

- Supabase production project credentials.
- Upstash Redis REST credentials.
- DeepSeek key if AI parser/generator should use the external model instead of heuristic fallback.
- Analytics/verification IDs if desired.

### Supabase Production Requirements

- Apply `supabase/schema.sql`.
- Confirm `payment_link` exists on `public.invoices`.
- Confirm `paddle_customer_id` exists on `public.profiles` and `paddle_subscription_id` exists on `public.subscriptions`.
- Confirm RLS policies are present and enabled.
- Confirm public card profile read and public lead insert policies are present.
- Confirm service role key is server-only.

### Paddle Integration Requirements

Paddle is not implemented as a checkout workflow in this Sprint 1 package. Before paid launch:

- Add Paddle checkout/session creation API.
- Add Paddle webhook verification and subscription sync.
- Map Paddle plan/price ids to Corvioz `profiles.plan`.
- Add Paddle checkout/webhook routes in the next billing sprint.
- Add end-to-end paid plan entitlement tests.

## Build Verification

### `npm run lint`

```text
> corvioz@0.1.0 lint
> eslint
```

Result: passed with exit code 0.

### `npm run build`

```text
> corvioz@0.1.0 build
> next build

▲ Next.js 16.2.7 (Turbopack)
- Experiments (use with caution):
  · cpus: 4
  · staticGenerationMaxConcurrency: 2
  · staticGenerationMinPagesPerWorker: 1000

  Creating an optimized production build ...
✓ Compiled successfully in 1823ms
  Running TypeScript ...
  Finished TypeScript in 49ms ...
  Collecting page data using 4 workers ...
  Generating static pages using 4 workers (0/61) ...
  Generating static pages using 4 workers (15/61)
  Generating static pages using 4 workers (30/61)
  Generating static pages using 4 workers (45/61)
✓ Generating static pages using 4 workers (61/61) in 387ms
  Finalizing page optimization ...

Route (app)
┌ ○ /
├ ○ /_not-found
├ ƒ /api/card-profile
├ ƒ /api/clients
├ ƒ /api/freelancers
├ ƒ /api/invoices
├ ƒ /api/invoices/parse
├ ƒ /api/leads
├ ƒ /api/portal/doc/[id]
├ ƒ /api/portal/token/[token]
├ ƒ /api/quotes
├ ƒ /api/quotes/generate
├ ƒ /api/user
├ ○ /apple-icon.png
├ ○ /auth
├ ○ /blog
├ ● /blog/[slug]
│ ├ /blog/how-to-price-web-design-projects
│ ├ /blog/how-to-get-freelance-clients
│ ├ /blog/best-invoice-software-for-freelancers
│ └ /blog/invoice-vs-quote-vs-receipt
├ ƒ /card/[username]
├ ○ /client
├ ○ /consultants
├ ○ /contact
├ ƒ /dashboard
├ ○ /designers
├ ○ /developers
├ ○ /freelancers
├ ƒ /freelancers/[category]
├ ○ /icon.svg
├ ○ /invoice-generator
├ ● /invoice-template/[industry]
│ ├ /invoice-template/photographer
│ ├ /invoice-template/consultant
│ ├ /invoice-template/graphic-designer
│ └ [+7 more paths]
├ ○ /marketers
├ ○ /opengraph-image.png
├ ○ /payment-instructions
├ ƒ /portal/[token]
├ ƒ /portal/doc/[id]
├ ○ /pricing
├ ○ /privacy
├ ○ /quote-generator
├ ● /quote-template/[industry]
│ ├ /quote-template/photographer
│ ├ /quote-template/consultant
│ ├ /quote-template/graphic-designer
│ └ [+7 more paths]
├ ○ /refund-policy
├ ○ /robots.txt
├ ƒ /rss.xml
├ ○ /sitemap.xml
├ ○ /terms
└ ○ /twitter-image.png

ƒ Proxy (Middleware)

○  (Static)   prerendered as static content
●  (SSG)      prerendered as static HTML (uses generateStaticParams)
ƒ  (Dynamic)  server-rendered on demand
```

Result: passed with exit code 0.

## Residual Risks For External Review

- Paid subscription checkout is not production-ready until Paddle is implemented.
- `/portal/doc/[id]` exists for non-production tokenless access but is disabled in production; reviewer should confirm deployment sets `NODE_ENV=production`.
- AI parsing/generation can run on heuristic fallback without `DEEPSEEK_API_KEY`; this is acceptable for availability but less accurate than model-backed parsing.
- Public profile URLs are no longer seeded in sitemap; profile discovery should come from real published profiles.
