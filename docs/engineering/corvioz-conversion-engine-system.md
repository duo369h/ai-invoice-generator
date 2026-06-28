# Corvioz Conversion Engine System

Date: 2026-06-20

## Executive Summary

Implemented a scoped revenue optimization layer for Corvioz production beta:

- standardized required funnel events
- added session-backed conversion intent preservation
- added `/signup` as the funnel-facing auth entry point
- enforced dashboard auth redirect with preserved intent
- restored pricing plan intent after signup and routes back to checkout
- added post-signup activation guidance in the dashboard
- standardized the landing hero CTA label to `Start Free` and kept `View Live Demo` as the secondary CTA

No core product business logic was redesigned.

## Funnel Event Standardization

Required events are now represented in the analytics funnel model:

- `landing_view`
- `signup_start`
- `signup_complete`
- `dashboard_view`
- `quote_create_start`
- `quote_create_complete`
- `invoice_create_start`
- `invoice_create_complete`
- `pricing_view`
- `pricing_select_plan`

All events emitted through `trackEvent()` include:

- `session_id`
- `timestamp`
- optional `user_id`
- `funnel_step` when the event is part of the funnel model
- `analytics_build`
- `corvioz_analytics_build`

Duplicate control:

- `landing_view` remains once per session.
- `dashboard_view` remains once per session.
- `signup_click` now maps to canonical `signup_start` without emitting a second legacy GA4 event for the same final funnel step.
- `pricing_cta_click` maps to canonical `pricing_select_plan`.

## Conversion Path Enforcement

Implemented flow:

```text
Landing -> Signup -> Dashboard -> Create Quote -> Create Invoice -> Payment
```

Dashboard gate:

- unauthenticated `/dashboard`, `/quotes/create`, and `/invoices/create` access stores the intended route
- user is redirected to `/signup`
- `/signup` reuses the existing auth implementation

Post-auth restoration:

- selected paid pricing plan routes to `/pricing?checkout=<plan>`
- intended dashboard/tool route restores automatically
- restored intent is cleared after use

## Intent Preservation System

Created:

```text
src/app/lib/intent-store.ts
```

Stores:

- `intended_route`
- `selected_plan`
- `source_page`

Storage:

- canonical key: `corvioz_conversion_intent`
- backward-compatible legacy keys:
  - `corvioz_redirect_after_auth`
  - `corvioz_selected_plan`

Exports:

- `getConversionIntent`
- `saveConversionIntent`
- `saveIntendedRoute`
- `saveSelectedPlan`
- `clearConversionIntent`

## CTA Optimization Layer

Landing hero CTAs now match the requested labels:

- primary: `Start Free`
- secondary: `View Live Demo`

Landing CTA clicks now:

- preserve intended route before dashboard/auth redirect
- emit analytics events
- keep the existing UI system and layout

Homepage pricing card clicks now emit:

- `pricing_select_plan`
- `cta_click`
- `signup_start` only for the free plan CTA path

## Activation Boost System

Added a post-signup activation guide in the dashboard overview.

It appears after `signup_complete` is consumed and includes:

- `Create your first invoice`
- `Set up profile`
- `Send first quote`

Each action uses existing dashboard handlers:

- invoice creation opens the existing invoice builder
- profile setup opens the existing profile tab
- quote creation opens the existing quote builder

## Pricing Conversion Logic

Pricing page behavior:

- `pricing_view` fires on page load
- paid plan selection emits `pricing_select_plan`
- selected plan is stored before auth redirect
- unauthenticated paid plan click routes to `/signup?redirect=/pricing&plan=<plan>`
- after auth, dashboard restoration routes to `/pricing?checkout=<plan>`
- pricing page auto-opens checkout once when an authenticated session is present and `checkout=pro` or `checkout=agency`

## Files Changed

- `src/app/lib/analytics.js`
- `src/app/lib/intent-store.ts`
- `src/app/page.js`
- `src/app/pricing/page.js`
- `src/components/dashboard/Dashboard.js`
- `src/app/signup/page.js`
- `src/app/components/UIComponents.js`
- `src/app/components/SeoEntryCta.js`
- `src/components/ui/Button.js`
- `src/components/ui/Modal.js`
- `jsconfig.json`
- `tsconfig.json`
- `next.config.mjs`

## Verification

Full lint:

```text
npm run lint
Result: pass
```

Production build:

```text
npm run build
Result: pass
```

Build evidence:

- `Compiled successfully`
- generated `959` static pages
- route table includes `/signup`
- route table includes `/invoice-template`
- route table includes `/quote-template`
- route table includes `/freelancer-profile-demo`
- route table includes `/pricing`
- route table includes `/dashboard`
- route table includes `/quotes/create`
- route table includes `/invoices/create`

Local production browser verification:

```text
Server: npm run start -- -H 127.0.0.1 -p 3005
Browser: Playwright Chromium against local production build
```

Verified paths:

- `/` -> `Start Free` -> `/signup`
  - emitted `landing_view`
  - emitted `signup_start`
  - emitted `cta_click`
  - preserved intended route `/dashboard?action=create-profile`
  - no duplicate final funnel events detected
- `/pricing` -> `Upgrade to Pro` -> `/signup?redirect=/pricing&plan=pro`
  - emitted `pricing_view`
  - emitted `pricing_select_plan`
  - preserved selected plan `pro`
  - preserved intended route `/pricing`
  - no duplicate final funnel events detected
- `/quotes/create?debug_analytics=1`
  - emitted `quote_create_start`
  - redirected unauthenticated session to `/signup`
  - preserved intended route `/quotes/create?debug_analytics=1`
  - no duplicate final funnel events detected
- `/invoices/create?debug_analytics=1`
  - emitted `invoice_create_start`
  - redirected unauthenticated session to `/signup`
  - preserved intended route `/invoices/create?debug_analytics=1`
  - no duplicate final funnel events detected
- `/invoice-template?debug_analytics=1`
  - title: `Free Invoice Template for Freelancers | Corvioz`
  - canonical: `https://www.corvioz.com/invoice-template`
  - H1 present
  - H2 count: `14`
  - JSON-LD scripts: `3`
  - `Start Free` emitted `signup_start` and `cta_click`

All verified funnel/debug events included:

- `session_id`
- `timestamp`
- `funnel_step` for final funnel events
- `analytics_build`
- `corvioz_analytics_build: strict_v2_2026_06_20`

Debug mode:

- `?debug_analytics=1` logs GA4 debug output to console.
- `?debug_analytics=1` persists the last debug events to `sessionStorage.corvioz_analytics_debug_events` for verification across full-page redirects.
- `window.dataLayer` is initialized before event dispatch so local and production probes can inspect queued events even if `gtag.js` is delayed.

## Production Verification Status

Not deployed from this local session.

Required production follow-up:

- deploy the updated build from a clean release candidate
- verify GA4 Realtime shows all funnel events in order
- verify no duplicate `signup_start`
- verify `session_id` continuity from landing through signup/dashboard
- verify pricing plan restoration into checkout

## Success Criteria Status

- signup funnel fully tracked: implemented and locally verified
- no broken step transitions: local production browser probes passed
- intent preserved across redirects: implemented and locally verified
- pricing -> signup -> checkout friction reduced: implemented through selected plan restoration
- measurable conversion improvement potential: implemented through canonical funnel events, CTA standardization, pricing intent capture, and activation prompts
