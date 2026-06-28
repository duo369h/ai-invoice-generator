# Corvioz Growth Validation Report

Generated: 2026-06-20

## Executive Status

GA4 production status: **broken in live production**

Reason: `NEXT_PUBLIC_GA_ID` is not set in Vercel Production, so the live site cannot load the GA4 script or send GA4 events yet.

Code instrumentation status: **ready after redeploy once GA4 ID is configured**

This sprint added growth instrumentation only. No product feature was added.

## Production GA4 Verification

### Vercel Environment

Checked with:

```bash
npx vercel env ls production
```

Result:

- `NEXT_PUBLIC_GA_ID` is **missing** from Production.
- Existing Production env vars include Supabase, Resend, Upstash, support/billing emails, and `NEXT_PUBLIC_SITE_URL`.

### Live HTML

Checked:

```bash
curl -sS https://www.corvioz.com | rg "googletagmanager|gtag/js|google-analytics|G-[A-Z0-9]+|dataLayer"
curl -sS https://www.corvioz.com/pricing | rg "googletagmanager|gtag/js|google-analytics|G-[A-Z0-9]+|dataLayer"
```

Result:

- No GA4 script found on the live homepage.
- No GA4 script found on the live pricing page.

Production conclusion:

- `page_view`: not firing in live GA4.
- route-change tracking: not firing in live GA4.
- CTA tracking: not firing in live GA4.
- Funnel events: not firing in live GA4.

Blocker:

- Add a real GA4 Measurement ID such as `G-XXXXXXXXXX` as `NEXT_PUBLIC_GA_ID` in Vercel Production, then redeploy.

## Implementation Completed

### GA4 Script + SPA Page Views

Updated:

- `src/app/components/AnalyticsProvider.js`
- `src/app/lib/analytics.js`

Behavior:

- GA4 script loads when `NEXT_PUBLIC_GA_ID` exists.
- Initial and client-side route changes emit `page_view`.
- `send_page_view: false` is used on GA config to avoid duplicate automatic page views.
- `trackPageView()` sends explicit `page_view` events with:
  - `page_path`
  - `page_location`
  - `page_title`
  - `route_change`

### Funnel Timing

Added funnel timing metadata to tracked funnel events:

- `funnel_step`
- `funnel_step_index`
- `seconds_since_first_step`
- `seconds_since_previous_step`

This enables visibility into where users drop off and how long they take between major funnel steps.

### SEO Entry Tracking

Added first-touch attribution storage:

- `entry_url`
- `landing_path`
- `referrer`
- `utm_source`
- `utm_medium`
- `utm_campaign`
- `utm_term`
- `utm_content`

This is attached to subsequent events so GA4 can segment organic/UTM behavior and first-page conversion.

## Event Coverage Map

| Required Event | Status in Code | Production Status | Source |
|---|---:|---:|---|
| `page_view` | Implemented | Blocked by missing GA ID | `AnalyticsProvider` route listener |
| `signup_started` | Implemented | Blocked by missing GA ID | auth magic link / Google start |
| `signup_completed` | Implemented | Blocked by missing GA ID | dashboard after auth return when signup was started |
| `login_completed` | Implemented | Blocked by missing GA ID | dashboard session/auth state |
| `pricing_view` | Implemented | Blocked by missing GA ID | pricing page mount |
| `pricing_cta_click` | Implemented | Blocked by missing GA ID | pricing upgrade CTA; legacy pricing intent aliases also map |
| `dashboard_view` | Implemented | Blocked by missing GA ID | dashboard authenticated session |
| `profile_created` | Implemented | Blocked by missing GA ID | public profile save success |
| `quote_created` | Implemented | Blocked by missing GA ID | quote save success |
| `invoice_created` | Implemented | Blocked by missing GA ID | invoice save success |
| `portal_opened` | Implemented | Blocked by missing GA ID | portal document load success |
| `lead_submitted` | Implemented | Blocked by missing GA ID | public profile lead form success |

## Conversion Events

Primary conversions:

- `invoice_created`
- `quote_created`

Secondary conversions:

- `profile_created`
- `lead_submitted`

All four conversion events are now tracked in client-side analytics code. They still need to be marked as key events inside GA4 after production starts receiving them.

## Funnel Visibility

Tracked funnel:

Landing → Signup → Dashboard → Quote → Invoice → Portal

Visible after GA4 activation:

- entry page and referrer
- signup start
- signup completion after auth return
- login completion
- dashboard view
- profile creation
- quote creation
- invoice creation
- portal open
- seconds since previous funnel step
- seconds since first funnel step

Current live limitation:

- No drop-off data can appear in GA4 until `NEXT_PUBLIC_GA_ID` is added and a new production deployment is shipped.

## Missing Tracking Points

Production blockers:

- Missing `NEXT_PUBLIC_GA_ID` in Vercel Production.
- Live site has no `googletagmanager.com/gtag/js` script.
- Live site has no GA4 `dataLayer` bootstrap.
- The new instrumentation is not proven live because this report did not deploy the dirty working tree.

Potential future refinements:

- Mark `invoice_created`, `quote_created`, `profile_created`, and `lead_submitted` as GA4 key events.
- Add GA4 Explorations for first-touch SEO landing path to conversion.
- Consider server-side Measurement Protocol later for authenticated API success events if ad blockers materially reduce client-side visibility.

## SEO Visibility Readiness

Code readiness: **ready**

Production readiness: **blocked**

The code now captures first entry URL, referrer, landing path, and UTM values and attaches them to funnel/conversion events. However, because GA4 is absent from production, Google Analytics currently cannot receive or report that data.

## Validation

Passed locally:

```bash
npm run lint
npm run build
```

Build evidence:

- Next.js production build compiled successfully.
- TypeScript completed successfully.
- Static generation completed for 955 pages.
- Core growth routes remain present: `/`, `/auth`, `/dashboard`, `/pricing`, `/card/[username]`, `/portal/[token]`.

## Final Readiness Call

Growth instrumentation code is implemented and build-stable.

Production growth validation is **not complete** because GA4 is not configured in Vercel Production and the live site currently has no GA4 script.
