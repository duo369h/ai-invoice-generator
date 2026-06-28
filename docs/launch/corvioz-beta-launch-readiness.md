# Corvioz Beta Launch Readiness Audit

Date: 2026-06-21
Scope: Analytics + production verification only. No feature work, no UI redesign, no monetization changes.

## Executive Summary

Corvioz is build-ready for a controlled beta, but analytics is not fully launch-clean yet.

Recommendation: **TUNE BEFORE PUBLIC BETA SCALE**

Reason: production build, lint, and core route checks pass, but the GA4 funnel contract has naming gaps for `invoice_create`, `quote_create`, and `export_attempt`. These gaps will make beta funnel reporting harder to trust unless dashboards explicitly map the current event names.

## 1. GA4 Event Verification

| Required Event | Current Status | Evidence | Risk |
|---|---:|---|---|
| `landing_view` | Pass | `trackPageView()` calls `trackLandingViewOnce()`, with session dedupe via `corvioz_landing_view_tracked`. | Low |
| `invoice_create` | Partial | Current code emits `invoice_create_start` from route entry and aliases `create_invoice_click` to `invoice_create_start`; completion aliases `invoice_created` to `first_invoice_created`. | Medium |
| `quote_create` | Partial | Current code emits `quote_create_start` from route entry and aliases `create_quote_click` to `quote_create_start`; completion aliases `quote_created` to `first_quote_created`. | Medium |
| `export_attempt` | Blocker for analytics contract | Export path calls revenue action `export_pdf`; no direct `trackEvent('export_attempt')` implementation was found. | High |
| `pricing_view` | Pass | Pricing page calls `trackPricingView()`, which sends `pricing_view`. | Low |
| `signup_start` | Pass | Auth page sends `signup_start` for magic link and Google login attempts. | Low |
| `signup_complete` | Pass with alias | Dashboard emits `signup_completed`; analytics alias normalizes it to `signup_complete`. | Low |

### Event Payload Validity

`trackEvent()` enriches events with:

- `session_id`
- `user_id` when auth is ready
- `timestamp`
- `funnel_step`
- funnel timing fields
- attribution fields
- intent and revenue scoring fields

This is sufficient for beta funnel analytics.

### Duplicate Event Risk

The analytics layer suppresses duplicate final funnel events within a short window, and suppresses `dashboard_view` once per session.

Remaining risk:

- Clicking an invoice CTA can emit an aliased `invoice_create_start`, then route entry can emit another `invoice_create_start` with a different source/path. The dedupe key includes source/path, so this may count as two starts in some cases.
- Similar risk exists for quote creation.

## 2. Funnel Analytics Contract

Target funnel:

Landing -> Invoice -> Export -> Pricing -> Signup

Current measurable chain:

| Funnel Step | Current Measurement | Status |
|---|---|---:|
| Landing | `landing_view` | Pass |
| Invoice start | `invoice_create_start` | Partial naming mismatch |
| Invoice value | `first_invoice_created` | Pass |
| Export attempt | revenue control-plane `export_pdf`, not GA4 `export_attempt` | Analytics blocker |
| Pricing | `pricing_view`, `pricing_select_plan`, `checkout_started` | Pass |
| Signup | `signup_start`, `signup_complete` via alias | Pass |

End-to-end funnel can be measured if the analytics dashboard maps:

- `invoice_create_start` -> invoice creation intent
- `first_invoice_created` -> invoice value event
- `export_pdf` control-plane decision -> export attempt
- `signup_completed` alias -> `signup_complete`

Without that mapping, the requested funnel contract is incomplete.

## 3. Production Readiness Audit

### Route Verification

Production server tested at `http://localhost:3126` using `next start`.

Core route results:

| Route | Status |
|---|---:|
| `/` | 200 |
| `/invoices/create` | 200 |
| `/quotes/create` | 200 |
| `/pricing` | 200 |
| `/signup` | 200 |
| `/auth` | 200 |
| `/dashboard` | 200 |
| `/robots.txt` | 200 |
| `/sitemap.xml` | 200 |
| `/api/revenue/control-plane` | 200 |

Additional route samples:

| Route | Status |
|---|---:|
| `/blog/how-to-price-web-design-projects` | 200 |
| `/invoice-generator` | 200 |
| `/quote-generator` | 200 |
| `/invoice-template` | 200 |
| `/quote-template` | 200 |
| `/freelancer-profile-demo` | 200 |
| `/client` | 200 |
| `/payment-instructions` | 200 |

No 404s were found in the audited route sample.

### Console / Hydration / Critical Warnings

Evidence available in this audit:

- `npm run build` completed successfully.
- `npm run lint` completed successfully.
- `next start` served audited routes without server-side runtime errors in the terminal output.

Limitation:

- A real browser console/hydration E2E pass was not completed in this audit because no browser automation dependency is currently available in this project package. This report should not claim full browser-console coverage.

## 4. Build & Deployment Audit

### Build

Command:

```bash
npm run build
```

Result:

- Exit code: 0
- Next.js: 16.2.7
- Static pages generated: 973 / 973
- Production route table includes `/invoices/create`, `/quotes/create`, `/pricing`, `/signup`, and `/api/revenue/control-plane`.

### Lint

Command:

```bash
npm run lint
```

Result:

- Exit code: 0
- No ESLint errors reported.

### Environment Variables

Environment documentation exists in:

- `.env.example`
- `ENV_REQUIRED.md`
- `VERCEL_ENV_CHECKLIST.md`
- `corvioz-env-setup-guide.md`

Documented critical variables include:

- `NEXT_PUBLIC_SITE_URL`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_GA_ID`
- `PADDLE_API_KEY`
- `PADDLE_WEBHOOK_SECRET`
- `NEXT_PUBLIC_PADDLE_CLIENT_TOKEN`
- `NEXT_PUBLIC_PADDLE_ENV`
- Paddle price IDs

Deployment readiness depends on these being present in Vercel Production. This audit did not print or validate secret values.

## 5. Launch Blockers

### High

1. **Missing exact GA4 event `export_attempt`**

   Export monetization currently uses `export_pdf` through the revenue control plane. That is useful for backend decisions, but the requested analytics contract names `export_attempt`. Beta dashboards may miss or mislabel export intent.

### Medium

1. **Invoice and quote creation event names do not exactly match requested contract**

   The implementation uses `invoice_create_start` / `first_invoice_created` and `quote_create_start` / `first_quote_created`, not exact `invoice_create` / `quote_create`.

2. **Potential duplicate create-start counting**

   CTA click aliases and route-entry events can both represent creation start. Dedupe exists, but source/path differences may still split these into multiple start events.

3. **Browser console/hydration not fully verified with real browser automation**

   Build and route checks are clean, but this audit cannot claim full user-browser console coverage.

## 6. Final Recommendation

Recommendation: **TUNE**

Corvioz is acceptable for a small internal or invite-only beta if analytics dashboards explicitly map the current event names.

Do not use this analytics setup for public growth experiments until:

- `export_attempt` is tracked or mapped as a first-class GA4 event.
- `invoice_create` and `quote_create` naming is standardized or documented as `*_create_start`.
- A browser-console QA pass is completed on the production deployment.

Final status:

```json
{
  "analytics_status": "partial",
  "funnel_status": "measurable_with_mapping",
  "production_status": "build_and_routes_pass",
  "launch_blockers": 1,
  "recommendation": "tune_before_public_beta_scale"
}
```
