# Corvioz GA4 Production Verification Report

Date: 2026-06-20 Asia/Shanghai
Production domain checked: https://www.corvioz.com

## Executive Summary

GA4 is now active in production at the script/configuration level.

Verified production GA4 measurement ID:

```text
G-GS2S4PVXYV
```

Production currently passes the basic GA4 installation checks:

- `NEXT_PUBLIC_GA_ID` is present in the deployed client bundle.
- `gtag/js` is loaded on tested production pages.
- Production CSP allows Google Tag Manager and GA4 collection endpoints.
- A real browser probe observed a live GA4 `page_view` collect request.

Production does not yet have full end-to-end confirmation for every requested event:

- SPA route changes are present in the deployed bundle, but production is still using a legacy `gtag('config', ..., { page_path })` route-change pattern rather than the current local explicit `page_view` event implementation.
- Homepage CTA click did not emit a captured `cta_click` event in the production browser probe.
- `signup_completed`, `quote_created`, and `invoice_created` are implemented in local source, but were not fully verified inside GA4 Realtime because GA4 dashboard access was not available in this Codex session.

## Production HTTP Evidence

Checked with `curl` against live production.

### Homepage

URL:

```text
https://www.corvioz.com
```

Result:

```text
HTTP/2 200
x-matched-path: /
x-vercel-cache: HIT
gtag/js?id=G-GS2S4PVXYV found
```

### Pricing

URL:

```text
https://www.corvioz.com/pricing
```

Result:

```text
HTTP/2 200
x-matched-path: /pricing
x-vercel-cache: HIT
gtag/js?id=G-GS2S4PVXYV found
```

### Dashboard

URL:

```text
https://www.corvioz.com/dashboard
```

Result:

```text
HTTP/2 200
x-matched-path: /dashboard
x-vercel-cache: MISS
gtag/js?id=G-GS2S4PVXYV found
```

### New SEO Entry Route

URL:

```text
https://www.corvioz.com/invoice-template
```

Result:

```text
HTTP/2 404
x-matched-path: /404
gtag/js?id=G-GS2S4PVXYV found on the 404 shell
```

Interpretation:

The current live deployment is older than the SEO entry pages added locally. GA4 is active in the production shell, but the new SEO routes are not live until the latest code is deployed.

## CSP Evidence

Production CSP includes the required GA4 script and collection endpoints.

Relevant allowed script endpoints:

```text
https://www.googletagmanager.com
https://www.google-analytics.com
```

Relevant allowed connect endpoints:

```text
https://www.google-analytics.com
https://analytics.google.com
https://region1.google-analytics.com
https://*.google-analytics.com
https://www.googletagmanager.com
```

## Browser Probe Evidence

Checked with a headless Chromium browser against production.

Initial page load produced a real GA4 collect request:

```json
{
  "endpoint": "https://www.google-analytics.com/g/collect",
  "tid": "G-GS2S4PVXYV",
  "event": "page_view",
  "dl": "https://www.corvioz.com/?utm_source=codex_ga4_check&utm_medium=qa&utm_campaign=production_verification",
  "dt": "Corvioz Freelancer OS | Win Clients, Send Invoices & Get Paid"
}
```

This confirms live production can send GA4 hits from the browser.

## SPA Route Change Status

Local source:

- `src/app/components/AnalyticsProvider.js` listens to `usePathname()` and `useSearchParams()`.
- It calls `trackPageView(url, { route_change: true })` on route/search changes.
- `trackPageView()` emits a `page_view` event through `trackEvent()`.

Production browser probe:

```json
[
  ["config", "G-GS2S4PVXYV", { "page_path": "/dashboard?action=create-profile" }],
  ["config", "G-GS2S4PVXYV", { "page_path": "/auth" }]
]
```

Interpretation:

SPA route tracking exists in production, but the live deployed bundle appears older than the local source. It is still sending route changes via GA4 `config` calls rather than explicit `page_view` events. Deploy the latest local source to align production with the current implementation.

## Event Instrumentation Status

### Signup

Local source status: implemented.

Files:

- `src/app/auth/page.js`
- `src/app/dashboard/DashboardClient.js`

Events:

- `signup_started` via alias from `signup_login_intent`
- `signup_login_requested`
- `signup_login_failed`
- `signup_completed` after authenticated dashboard return when `consumeSignupStarted()` is true

Production verification:

- GA script is live on `/auth`.
- Full `signup_completed` could not be verified without completing a real auth round trip and checking GA4 Realtime.

Status:

```text
Implemented locally; not fully verified in GA4 Realtime in this session.
```

### Quote Created

Local source status: implemented.

File:

- `src/app/dashboard/DashboardClient.js`

Event:

```text
quote_created
```

Production verification:

- Dashboard GA script is live.
- Production unauthenticated dashboard redirects to `/auth`.
- Sandbox dashboard bypass did not open in the current production bundle, indicating the deployed dashboard is older/different from current local source.
- No authenticated test account/session was available in this session.

Status:

```text
Implemented locally; production end-to-end event not verified.
```

### Invoice Created

Local source status: implemented.

File:

- `src/app/dashboard/DashboardClient.js`

Event:

```text
invoice_created
```

Production verification:

- Dashboard GA script is live.
- Full event firing requires authenticated or working sandbox dashboard access.
- Not verified in GA4 Realtime in this session.

Status:

```text
Implemented locally; production end-to-end event not verified.
```

## Fix Applied Locally

Added GA4 beacon transport to client analytics events:

```js
window.gtag('event', name, { transport_type: 'beacon', ...props });
```

File changed:

```text
src/app/lib/analytics.js
```

Reason:

CTA, signup, quote, and invoice events may be followed immediately by navigation or UI state changes. `transport_type: 'beacon'` improves delivery reliability for navigation-adjacent events.

## Remaining Production Actions

1. Deploy the latest local code to production.
2. Recheck these live URLs after deploy:

```text
https://www.corvioz.com
https://www.corvioz.com/pricing
https://www.corvioz.com/invoice-template
https://www.corvioz.com/quote-template
https://www.corvioz.com/freelancer-profile-demo
https://www.corvioz.com/auth
https://www.corvioz.com/dashboard
```

3. In GA4 Realtime, verify:

```text
page_view
cta_click
signup_started
signup_completed
quote_created
invoice_created
```

4. Mark these as GA4 key events after Realtime confirms collection:

```text
signup_completed
quote_created
invoice_created
profile_created
lead_submitted
```

## Final Status

```text
GA4 production installation: PASS
NEXT_PUBLIC_GA_ID active: PASS
gtag script on tested live pages: PASS
CSP permits GA4: PASS
Initial page_view browser hit: PASS
SPA route tracking: PARTIAL, live bundle uses legacy config route tracking
CTA click production event: NOT VERIFIED, homepage probe did not capture cta_click
signup_completed production event: NOT VERIFIED, requires auth + GA4 Realtime access
quote_created production event: NOT VERIFIED, requires authenticated/sandbox dashboard + GA4 Realtime access
invoice_created production event: NOT VERIFIED, requires authenticated/sandbox dashboard + GA4 Realtime access
GA4 Realtime dashboard: BLOCKED, no dashboard access available in this Codex session
```
