# Corvioz GA4 Funnel Final Report

Date: 2026-06-20

## Status

Production GA4 is active, but the live deployment is not yet emitting the final funnel taxonomy. The local production build now emits the requested funnel events with required metadata and duplicate suppression.

## Final Funnel Event Contract

Required events:

- `landing_view`
- `signup_start`
- `signup_complete`
- `dashboard_view`
- `quote_create_start`
- `quote_create_complete`
- `invoice_create_start`
- `invoice_create_complete`

Required parameters:

- `user_id` when available
- `session_id`
- `funnel_step`
- `timestamp`

## Instrumentation Added

Updated `src/app/lib/analytics.js`:

- Added final event aliases:
  - `signup_click`, `signup_login_intent`, `signup_started` -> `signup_start`
  - `signup_completed` -> `signup_complete`
  - `create_quote_click` -> `quote_create_start`
  - `quote_created` / `quote_generated` -> `quote_create_complete`
  - `create_invoice_click` -> `invoice_create_start`
  - `invoice_created` / `invoice_generated` -> `invoice_create_complete`
- Added persistent browser `session_id` via `sessionStorage`.
- Added ISO `timestamp` to every analytics event.
- Added optional `user_id` enrichment from explicit event props or stored analytics user id.
- Added `landing_view` on first page view per browser session.
- Added final funnel duplicate suppression.
- Tightened `dashboard_view` to fire once per browser session.
- Kept legacy event names firing for compatibility, mapped to final funnel names.

Updated `src/app/dashboard/DashboardClient.js`:

- Stores authenticated Supabase user id for downstream analytics enrichment.
- Adds `user_id` to authenticated `dashboard_view`, `signup_complete`, and login events.
- Adds sandbox `dashboard_view` instrumentation for QA validation.
- Adds a component-level dashboard-view guard; analytics-layer session guard is the final duplicate protection.

No UI or business logic was intentionally changed.

## Local Production Build Validation

Commands run:

- `npm run lint` - passed
- `npm run build` - passed
- `npm run start -- -H 127.0.0.1 -p 3005` - local production server started for browser probes

Build route table includes:

- `/`
- `/dashboard`
- `/quotes/create`
- `/invoices/create`
- `/invoice-template`
- `/quote-template`
- `/freelancer-profile-demo`

## Browser Probe Evidence

Local production build, landing/signup path:

- `landing_view` emitted with:
  - `session_id`
  - `funnel_step: landing_view`
  - `timestamp`
- `signup_start` emitted from Pricing Start Free CTA with:
  - `session_id`
  - `funnel_step: signup_start`
  - `timestamp`

Local production build, quote path:

- Path: Dashboard sandbox -> Create Quote -> Save Quote
- Observed:
  - `dashboard_view`
  - `quote_create_start`
  - `quote_create_complete`
- Missing: none
- Duplicates: none
- Required metadata present on target events:
  - `session_id`
  - `funnel_step`
  - `timestamp`

Local production build, invoice path:

- Path: Dashboard sandbox -> Create Invoice -> Save Invoice
- Observed:
  - `dashboard_view`
  - `invoice_create_start`
  - `invoice_create_complete`
- Missing: none
- Duplicates: none
- Required metadata present on target events:
  - `session_id`
  - `funnel_step`
  - `timestamp`

## Production Validation

Live domain tested:

- `https://www.corvioz.com`

Production GA4 request evidence:

- GA4 measurement id observed: `G-GS2S4PVXYV`
- `gtag` and `dataLayer` are present on live pages.
- GA4 `/g/collect` requests are firing for:
  - `page_view`
  - `user_engagement`

Production gap:

- The final funnel events were not observed on the live deployment:
  - `landing_view`
  - `signup_start`
  - `signup_complete`
  - `dashboard_view`
  - `quote_create_start`
  - `quote_create_complete`
  - `invoice_create_start`
  - `invoice_create_complete`
- Production debug logs were not observed with `?debug_analytics=1`, which indicates the live deployment is older than this local instrumentation patch.
- Authenticated production Dashboard -> Create Quote could not be fully tested without a production-safe authenticated session.
- GA4 Realtime dashboard could not be directly verified because GA4 account/dashboard access is not available in this environment.

## Funnel Order

Expected final funnel order:

1. `landing_view`
2. `signup_start`
3. `signup_complete`
4. `dashboard_view`
5. `quote_create_start`
6. `quote_create_complete`
7. `invoice_create_start`
8. `invoice_create_complete`

Local production build confirms the order within tested legs:

- Landing -> Pricing Start Free:
  - `landing_view` before `signup_start`
- Dashboard -> Quote save:
  - `dashboard_view` before `quote_create_start` before `quote_create_complete`
- Dashboard -> Invoice save:
  - `dashboard_view` before `invoice_create_start` before `invoice_create_complete`

Full authenticated production order remains pending until deployment and GA4 dashboard access.

## Final Result

Code instrumentation is ready and verified in the local production build.

Production is not yet fully validated because the live site is still emitting the older analytics behavior. Deploy the updated build, then rerun the production probe and confirm the eight final events in GA4 Realtime.
