# Corvioz GA4 Production Final Verification

Date: 2026-06-20

## Executive Status

Production is still not running the strict GA4 funnel bundle.

The local code and local production build now contain the requested strict funnel instrumentation and the new build fingerprint:

```text
corvioz_analytics_build = "strict_v2_2026_06_20"
```

However, the forced Vercel production deployment was blocked because the checkout is heavily dirty and a direct deploy could ship many unrelated local changes beyond the GA4 fix. The live `www.corvioz.com` probe still shows the stale production bundle.

## Code Changes Applied

- Updated `src/app/lib/analytics.js`
  - `ANALYTICS_BUILD_VERSION = "strict_v2_2026_06_20"`
  - GA4 payloads now include both:
    - `analytics_build`
    - `corvioz_analytics_build`
  - Strict funnel event list remains:
    - `landing_view`
    - `signup_start`
    - `signup_complete`
    - `dashboard_view`
    - `quote_create_start`
    - `quote_create_complete`
    - `invoice_create_start`
    - `invoice_create_complete`

- Updated `src/app/components/AnalyticsProvider.js`
  - Exposes runtime fingerprint on:
    - `window.__CORVIOZ_ANALYTICS_BUILD__`
    - `window.corvioz_analytics_build`

- Updated `src/app/auth/page.js`
  - Removed a synchronous state setter inside `useEffect` so the current ESLint gate passes.
  - No UI or auth business behavior was changed.

## Local Verification

### Static/code verification

`rg` confirmed the local source and built `.next` output contain:

- `strict_v2_2026_06_20`
- `corvioz_analytics_build`
- `landing_view`
- `signup_start`
- `signup_complete`
- `dashboard_view`
- `quote_create_start`
- `quote_create_complete`
- `invoice_create_start`
- `invoice_create_complete`

### Build gates

```text
npm run lint
Result: pass
```

```text
npm run build
Result: pass
Next.js generated 958 static pages and included /quotes/create, /invoices/create, /invoice-template, /quote-template, and /freelancer-profile-demo.
```

### Local browser payload probe

Local production server:

```text
npm run start -- -H 127.0.0.1 -p 3005
```

Observed Start Free path:

```text
/ → Start Free → /dashboard?action=create-profile
```

Observed local GA4-style events:

- `page_view`
- `landing_view`
- `signup_start`
- legacy mapped `signup_click`
- `cta_click`

All observed local payloads included:

- `session_id = 2ea767c3-2a56-4187-8896-2f02aed73554`
- `timestamp`
- `analytics_build = strict_v2_2026_06_20`
- `corvioz_analytics_build = strict_v2_2026_06_20`
- debug logs with `event`, `funnel_step`, `session_id`, and `user_id` field support

Local quote/invoice form-save probing could not be repeated after the fingerprint change because the current local `/quotes/create` route rendered an empty body under the sandbox probe. The code path and built bundle still contain route-entry `quote_create_start` / `invoice_create_start` and save-success `quote_create_complete` / `invoice_create_complete` instrumentation.

## Production Verification

Production URL tested:

```text
https://www.corvioz.com/?debug_analytics=1&_cb=1781938603177&utm_source=codex_prod_fix&utm_medium=qa&utm_campaign=strict_funnel
```

HTTP evidence:

```text
status: 200
x-vercel-cache: HIT
age: 41988
```

Production browser state:

```json
{
  "url": "https://www.corvioz.com/auth",
  "analyticsBuild": null,
  "dataLayerReady": true,
  "dataLayerLength": 8,
  "gtagReady": true,
  "debugEnabled": false,
  "appSessionId": null,
  "authReady": null,
  "userId": null
}
```

Production GA4 collect payload observed:

```json
{
  "tid": "G-GS2S4PVXYV",
  "event": "page_view",
  "funnelStep": null,
  "appSessionId": null,
  "timestamp": null,
  "analyticsBuild": null
}
```

Production missing funnel events:

- `landing_view`
- `signup_start`
- `signup_complete`
- `dashboard_view`
- `quote_create_start`
- `quote_create_complete`
- `invoice_create_start`
- `invoice_create_complete`

Production duplicate detection:

```text
No duplicates detected because none of the strict funnel events fired in production.
```

Production debug mode:

```text
?debug_analytics=1 did not enable strict debug logging in production.
No [GA4 DEBUG] console messages were observed.
```

## Production vs Local Diff

| Check | Local build | Production |
| --- | --- | --- |
| `strict_v2_2026_06_20` fingerprint | Present | Missing |
| `corvioz_analytics_build` payload | Present | Missing |
| `landing_view` | Present locally | Missing |
| `signup_start` | Present locally | Missing |
| `signup_complete` | Instrumented after auth completion | Not observable; production stale |
| `dashboard_view` | Instrumented after authenticated session load | Not observable; production stale |
| `quote_create_start` | Instrumented on `/quotes/create` route entry | Missing |
| `quote_create_complete` | Instrumented on quote save success | Missing |
| `invoice_create_start` | Instrumented on `/invoices/create` route entry | Missing |
| `invoice_create_complete` | Instrumented on invoice save success | Missing |
| `?debug_analytics=1` logs | Present locally | Missing |
| Cache state | Fresh local build | Stale Vercel HIT |

## Deployment Attempt

Attempted command:

```text
npx vercel --prod --force --yes --scope jianxu-han-s-projects
```

Result:

```text
Blocked by safety reviewer.
Reason: forced production deploy from a heavily dirty checkout could ship many unrelated local changes beyond the requested GA4 fix.
```

No workaround deployment was attempted.

## Cache Status

Cache mismatch is not resolved in production.

Evidence:

- `www.corvioz.com` still returns cached Vercel HIT responses.
- Live HTML does not contain `strict_v2_2026_06_20`.
- Live GA4 payloads do not contain `corvioz_analytics_build`.

## Remaining Required Action

To complete the production fix, one of these must happen:

1. Explicitly approve deploying the current dirty checkout despite the risk of shipping unrelated changes.
2. Create a clean GA4-only release branch/worktree and deploy that branch to production.

After deployment, rerun:

- production HTTP fingerprint probe
- production browser GA4 collect probe
- GA4 Realtime dashboard check for all 8 strict funnel events in order

## Final Verification Result

Local analytics correctness: fixed and verified for the Start Free funnel leg, with build-level evidence for all strict funnel symbols.

Production deployment alignment: not fixed yet. Production remains stale until a safe production deploy is authorized or a clean GA4-only deploy candidate is prepared.
