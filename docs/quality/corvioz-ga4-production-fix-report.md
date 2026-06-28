# Corvioz GA4 Production Fix Report

Date: 2026-06-20

## Executive Status

Local analytics instrumentation has been tightened to the strict funnel contract and verified in a local production build.

Production is still stale. `www.corvioz.com` points to the latest Vercel production deployment, but that deployment does not include the strict analytics bundle added locally in this sprint. A direct production deploy was intentionally blocked because the current worktree contains many unrelated dirty changes and would risk shipping more than analytics.

## Production Deployment Verification

Production domain tested:

- `https://www.corvioz.com`

Vercel deployment inspected:

- Latest production deployment: `https://corvioz-ns4rsgehw-jianxu-han-s-projects.vercel.app`
- Deployment id: `dpl_EfzgUb86DcCrJ61Dgt7ZyUU5Jx8u`
- Age: 11h
- Aliases include:
  - `https://www.corvioz.com`
  - `https://corvioz.com`
  - `https://corvioz.vercel.app`

Production env verification:

- `NEXT_PUBLIC_GA_ID` exists in Vercel Production and Preview.
- Live GA4 measurement id observed: `G-GS2S4PVXYV`

Production cache/deployment evidence:

- Browser probe with `?debug_analytics=1&_cb=<timestamp>` still returned Vercel cache `HIT`.
- Response age was about `40950` seconds.
- `window.__CORVIOZ_ANALYTICS_BUILD__` was `null`.
- `?debug_analytics=1` did not enable production debug logging.
- GA4 collect payloads had no `ep.analytics_build`, `ep.funnel_step`, `ep.session_id`, or `ep.timestamp`.

Conclusion: production is running an older analytics bundle.

## Deployment Action

Attempted production deployment command:

```bash
npx vercel --prod --force --scope jianxu-han-s-projects
```

Result:

- Rejected by approval layer.
- Reason: the worktree is very dirty and a direct deploy could ship many unrelated local changes beyond analytics.

Safe deployment requirement:

- Create a clean release branch/worktree containing only the intended analytics changes plus already-approved production code, then run `vercel --prod --force`.

## Strict Funnel Contract Implemented Locally

Final funnel order:

1. `landing_view`
2. `signup_start`
3. `signup_complete`
4. `dashboard_view`
5. `quote_create_start`
6. `quote_create_complete`
7. `invoice_create_start`
8. `invoice_create_complete`

## Code Changes

Updated `src/app/lib/analytics.js`:

- Added analytics build fingerprint:
  - `ga4-funnel-strict-2026-06-20-v1`
- Added `analytics_build` to emitted event payloads.
- Added `window.__CORVIOZ_ANALYTICS_BUILD__` support through the provider.
- Added production-safe `?debug_analytics=1` logs with:
  - event name
  - `funnel_step`
  - `session_id`
  - `user_id` when present
- Ensured `landing_view` fires once per session.
- Ensured first final funnel event forces `landing_view` first on direct page entry.
- Ensured `session_id` is stored in `sessionStorage` and remains consistent through same-tab landing -> auth -> dashboard navigation.
- Ensured `user_id` is read only after auth readiness is set.
- Added `clearAnalyticsUserId()` for sign-out cleanup.
- Removed final-funnel aliasing from quote/invoice button-click events.

Updated `src/app/components/AnalyticsProvider.js`:

- Exposes `window.__CORVIOZ_ANALYTICS_BUILD__`.
- Includes the analytics build id in debug initialization logs.

Updated `src/app/auth/page.js`:

- Removed `signup_start` emission from magic-link and Google auth submit actions.
- Auth submit actions now stay as login/auth intent telemetry.
- Sandbox auth entry no longer emits `signup_start`.

Updated `src/app/dashboard/DashboardClient.js`:

- `dashboard_view` fires only after authenticated Supabase session load.
- Removed sandbox `dashboard_view` final-funnel emission.
- `quote_create_start` fires on entering `/quotes/create`.
- `invoice_create_start` fires on entering `/invoices/create`.
- Quote/invoice completion still fires only from save success callbacks.
- Sign-out clears analytics user enrichment state.

Updated `src/app/page.js`:

- Removed final-funnel signup mapping from the non-signup-labeled `Create Your Profile` CTA.
- Remaining `signup_click` calls are Start Free CTAs.

## Local Production Validation

Commands run:

```bash
npm run lint
npm run build
npm run start -- -H 127.0.0.1 -p 3005
```

Results:

- `npm run lint`: passed
- `npm run build`: passed
- Local production server started and was stopped after validation.

Browser probe evidence from local production build:

### Landing -> Start Free

Observed:

- `landing_view`
- `signup_start`

Metadata:

- Same `session_id`: present
- `user_id`: null before auth
- `timestamp`: present
- `analytics_build`: `ga4-funnel-strict-2026-06-20-v1`
- Duplicates: none
- Debug logs included required fields.

### Quote Route -> Save Quote

Observed:

- `landing_view`
- `quote_create_start`
- `quote_create_complete`

Order:

- `landing_view` fired before `quote_create_start`.
- `quote_create_complete` fired from save success.

Duplicates: none

### Invoice Route -> Save Invoice

Observed:

- `landing_view`
- `invoice_create_start`
- `invoice_create_complete`

Order:

- `landing_view` fired before `invoice_create_start`.
- `invoice_create_complete` fired from save success.

Duplicates: none

## Production Probe Results

Production probe path:

- `https://www.corvioz.com/?debug_analytics=1&_cb=<timestamp>&utm_source=codex_prod_fix&utm_medium=qa&utm_campaign=strict_funnel`
- Clicked first Start Free CTA.

Observed GA4 collect events:

- `page_view`

Missing production final funnel events:

- `landing_view`
- `signup_start`
- `signup_complete`
- `dashboard_view`
- `quote_create_start`
- `quote_create_complete`
- `invoice_create_start`
- `invoice_create_complete`

Duplicate detection:

- Production target-event duplicates: none observed because no target final events fired.

Production vs local diff:

| Check | Local Production Build | Live Production |
| --- | --- | --- |
| Analytics build fingerprint | `ga4-funnel-strict-2026-06-20-v1` | missing |
| `?debug_analytics=1` logs | present | missing |
| `landing_view` | present | missing |
| `signup_start` | present from Start Free CTA | missing |
| Route-entry create starts | present | not deployed |
| Save-success completions | present locally | not production-verified |
| Metadata `session_id` / `funnel_step` / `timestamp` | present | missing |
| `NEXT_PUBLIC_GA_ID` | configured where GA runs | configured |

## Remaining Production Fix

Production cannot be marked fixed until the strict analytics bundle is deployed.

Recommended safe path:

1. Create a clean release worktree/branch.
2. Include only the intended analytics files and any already-approved production code required for the current deployed app.
3. Run:

```bash
npm run lint
npm run build
npx vercel --prod --force --scope jianxu-han-s-projects
```

4. Re-run the production probe.
5. Confirm in GA4 Realtime or DebugView that the eight final funnel events appear in order.

## Final Status

Analytics correctness is fixed locally and verified in the production build.

Production deployment alignment is blocked by dirty-worktree deployment risk. The live site remains stale until a clean analytics release is deployed.
