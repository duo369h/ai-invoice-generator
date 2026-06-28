# Corvioz GA4 Funnel Verification Report

Date: 2026-06-20 Asia/Shanghai
Production domain tested: https://www.corvioz.com
GA4 Measurement ID observed in production: `G-GS2S4PVXYV`

## Executive Verdict

GA4 is installed in production and basic `page_view` collection is working.

The full growth funnel is **not yet production-validated** because named CTA and funnel events were not observed in the production GA4 collect stream during the browser probe, and GA4 Realtime dashboard access was not available in this Codex session.

Current status:

```text
page_view: PASS
dataLayer present in production: PASS
gtag present in production: PASS
Landing -> Pricing page_view: PASS
Pricing -> Signup/Auth page_view: PASS
Dashboard page_view attempt: PASS
CTA click named events: FAIL / not observed in production collect stream
Signup completion: BLOCKED, requires real auth completion + GA4 Realtime access
Dashboard -> Create Quote: BLOCKED, production redirects unauthenticated user to auth
Quote created: BLOCKED, requires authenticated dashboard or verified sandbox path
GA4 Realtime dashboard: BLOCKED, no GA4 account/dashboard access in this session
```

## Code Changes Made

### 1. Added GA4 Debug Mode Logging

Files changed:

```text
src/app/lib/analytics.js
src/app/components/AnalyticsProvider.js
```

Debug mode can be enabled by any of these:

```text
?debug_analytics=1
?analytics_debug=1
?ga_debug=1
localStorage.corvioz_analytics_debug = "true"
NEXT_PUBLIC_ANALYTICS_DEBUG=true
```

Debug logging now reports:

- `window.dataLayer` readiness
- `window.dataLayer.length`
- `window.gtag` readiness
- event name and payload before dispatch
- `gtag('event', ...)` dispatch confirmation
- queued `dataLayer` event when `gtag` is not ready
- GA4 event callback confirmation when debug mode is active

The GA4 bootstrap script now logs:

```text
[GA4 DEBUG] gtag initialized
```

with:

```text
gaId
dataLayerReady
dataLayerLength
gtagReady
```

### 2. Hardened Event Delivery

GA4 event dispatch uses beacon transport:

```js
window.gtag('event', name, { transport_type: 'beacon', ...props });
```

Reason:

CTA and signup clicks often navigate immediately. Beacon transport improves delivery reliability for navigation-adjacent events.

### 3. Fixed One Silent CTA

File changed:

```text
src/app/pricing/page.js
```

The pricing-page navbar `Start Free` CTA now emits:

```text
signup_click
cta_click
```

with `position: "pricing_navbar"`.

## Production Browser Probe

Tooling:

- Headless Chromium through the bundled Playwright runtime.
- Captured outgoing GA4 `/g/collect` requests.
- Captured runtime state for `dataLayer` and `gtag`.

Test path:

```text
Landing -> Pricing anchor -> Pricing page -> Start Free -> Auth -> Dashboard attempt
```

### Runtime State

Landing page:

```json
{
  "url": "https://www.corvioz.com/?debug_analytics=1&utm_source=codex_ga4_funnel&utm_medium=qa&utm_campaign=production_funnel",
  "dataLayerReady": true,
  "dataLayerLength": 5,
  "gtagReady": true
}
```

After Pricing anchor click:

```json
{
  "url": "https://www.corvioz.com/?debug_analytics=1&utm_source=codex_ga4_funnel&utm_medium=qa&utm_campaign=production_funnel#pricing",
  "dataLayerReady": true,
  "dataLayerLength": 7,
  "gtagReady": true
}
```

Pricing page:

```json
{
  "url": "https://www.corvioz.com/pricing?debug_analytics=1&utm_source=codex_ga4_funnel&utm_medium=qa&utm_campaign=production_funnel",
  "dataLayerReady": true,
  "dataLayerLength": 5,
  "gtagReady": true
}
```

After Start Free click:

```json
{
  "url": "https://www.corvioz.com/auth",
  "dataLayerReady": true,
  "dataLayerLength": 8,
  "gtagReady": true
}
```

Dashboard attempt:

```json
{
  "url": "https://www.corvioz.com/auth",
  "dataLayerReady": true,
  "dataLayerLength": 7,
  "gtagReady": true
}
```

Interpretation:

GA4 runtime is present on production pages. The dashboard path redirects unauthenticated users to `/auth`, so Create Quote cannot be verified from production without a real authenticated session or a working demo/sandbox bypass.

## GA4 Collect Requests Observed

### Landing Page Load

Observed:

```json
{
  "tid": "G-GS2S4PVXYV",
  "event": "page_view",
  "page_location": "https://www.corvioz.com/?debug_analytics=1&utm_source=codex_ga4_funnel&utm_medium=qa&utm_campaign=production_funnel",
  "page_title": "Corvioz Freelancer OS | Win Clients, Send Invoices & Get Paid"
}
```

Status:

```text
PASS
```

### Pricing Page Load

Observed:

```json
{
  "tid": "G-GS2S4PVXYV",
  "event": "page_view",
  "page_location": "https://www.corvioz.com/pricing?debug_analytics=1&utm_source=codex_ga4_funnel&utm_medium=qa&utm_campaign=production_funnel"
}
```

Status:

```text
PASS
```

### Auth Page After Start Free

Observed:

```json
{
  "tid": "G-GS2S4PVXYV",
  "event": "page_view",
  "page_location": "https://www.corvioz.com/auth",
  "referrer": "https://www.corvioz.com/pricing?debug_analytics=1&utm_source=codex_ga4_funnel&utm_medium=qa&utm_campaign=production_funnel"
}
```

Status:

```text
PASS for page_view
FAIL for named Start Free CTA event, not observed in production collect stream
```

### Dashboard Attempt

Observed:

```json
{
  "tid": "G-GS2S4PVXYV",
  "event": "page_view",
  "page_location": "https://www.corvioz.com/dashboard?debug_analytics=1"
}
```

Final browser URL after app logic:

```text
https://www.corvioz.com/auth
```

Status:

```text
PASS for dashboard page_view collect request
BLOCKED for dashboard funnel continuation because unauthenticated user is redirected to auth
```

## Requested Funnel Step Matrix

| Funnel Step | Expected GA4 Event | Production Probe Result | Status |
|---|---:|---|---|
| Landing | `page_view` | `/g/collect` event observed | PASS |
| Pricing anchor click | `pricing_click` or alias | `dataLayerLength` increased, but no named collect event captured | FAIL / needs redeploy + Realtime check |
| Pricing page | `page_view`, `pricing_view` | `page_view` observed; `pricing_view` not captured as collect request | PARTIAL |
| Signup / Start Free click | `signup_click`, `cta_click` | Auth page `page_view` observed; named click events not captured | FAIL |
| Auth signup request | `signup_started`, `signup_login_requested` | Not completed; no email/auth action taken | BLOCKED |
| Dashboard | `dashboard_view`, `page_view` | Dashboard `page_view` request observed, then redirected to `/auth` | PARTIAL |
| Create Quote click | `create_quote_click`, `quick_action_click` | Cannot reach authenticated dashboard | BLOCKED |
| Quote saved | `quote_created` | Cannot reach authenticated dashboard | BLOCKED |

## Why CTA Events Were Silent In Production

The production runtime has GA4 installed, but the browser probe did not observe named CTA events such as:

```text
cta_click
signup_click
pricing_click
pricing_view
create_quote_click
quick_action_click
```

Likely causes:

1. The current production deployment is older than local analytics changes.
2. Navigation-adjacent click events may be lost before transport completes.
3. Some production CTAs still lack tracking in the live bundle.
4. The new debug mode has not been deployed yet, so `?debug_analytics=1` does not produce console diagnostics in production.

Local fixes applied:

- Beacon transport for GA4 events.
- Debug event dispatch logs.
- Debug GA bootstrap logs.
- Pricing navbar `Start Free` event tracking.

## Realtime Dashboard Status

GA4 Realtime dashboard verification was requested but could not be completed from this Codex session because no authenticated GA4 dashboard access was available.

Required owner-side Realtime validation:

1. Deploy latest code.
2. Open GA4 -> Reports -> Realtime.
3. Visit:

```text
https://www.corvioz.com/?debug_analytics=1&utm_source=manual_ga4_check&utm_medium=qa&utm_campaign=funnel_validation
```

4. Execute:

```text
Landing -> Pricing -> Start Free -> Signup/Auth -> Dashboard -> Create Quote
```

5. Confirm these events appear:

```text
page_view
pricing_click
pricing_view
signup_click
cta_click
signup_started
signup_complete
dashboard_view
create_quote_click
quick_action_click
quote_created
```

## Deployment Gate

Before calling the funnel production-ready:

```text
1. Deploy latest local code.
2. Re-run the production browser probe.
3. Confirm debug logs appear with ?debug_analytics=1.
4. Confirm named CTA events appear in the GA4 collect stream.
5. Confirm Realtime dashboard sees the same event names.
6. Use a real test login or a production-safe sandbox route to complete Dashboard -> Create Quote.
```

## Validation Commands Run

Local:

```text
npm run lint
npm run build
```

Result:

```text
PASS
```

Production browser probe:

```text
Landing -> Pricing anchor -> Pricing page -> Start Free -> Auth -> Dashboard attempt
```

Result:

```text
GA4 runtime present: PASS
page_view collection: PASS
named CTA/funnel events: NOT VERIFIED / not observed
dashboard create quote: BLOCKED by auth redirect
GA4 Realtime UI: BLOCKED by lack of dashboard access
```

## Final Status

```text
Corvioz GA4 installation is live.
Corvioz GA4 funnel is not yet production-validated.
Debug instrumentation and one missing CTA fix are ready locally.
Latest code must be deployed, then Realtime must be verified with dashboard access.
```
