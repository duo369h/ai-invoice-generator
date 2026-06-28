# Corvioz Growth Analytics Implementation Report

This report summarizes the integration, event configuration, and validation of Google Analytics 4 (GA4) for tracking the user growth funnel of Corvioz.

---

## 1. GA4 Script Installation & Initialization

* **Initialization script**: Integrated in [AnalyticsProvider.js](file:///Users/duo/Documents/想做个网站/corvioz/src/app/components/AnalyticsProvider.js) and wrapped globally around children in [layout.js](file:///Users/duo/Documents/想做个网站/corvioz/src/app/layout.js).
* **Environment Configuration**: When the production environment variable `NEXT_PUBLIC_GA_ID` is set (e.g. `G-XXXXXXXXXX`), the Google tag (`gtag.js`) loads asynchronously:
  * Uses `afterInteractive` script loading strategy to preserve page speed.
  * Disables default page_views (`send_page_view: false`) to avoid duplicate counts during React client-side route transitions.
  * Captures client-side routing dynamically using a `<NavigationListener />` component that tracks pathnames and query strings.

---

## 2. Analytics Wrapper API Reference

The tracking library [analytics.js](file:///Users/duo/Documents/想做个网站/corvioz/src/app/lib/analytics.js) exposes the following API:

### `trackEvent(name, props)`
Pushes a structured event to `window.dataLayer` (or calls `window.gtag` directly) and `window.plausible` with enriched attribution metadata (UTMs, first referrer, entry page, session timings):
```javascript
import { trackEvent } from '@/lib/analytics';
trackEvent('signup_click', { position: 'navbar' });
```

### `trackPage(url, props)`
Custom page-view wrapper that records routes and page details:
```javascript
import { trackPage } from '@/lib/analytics';
trackPage('/dashboard?tool=invoice', { referrer: '/auth' });
```

---

## 3. Funnel Event tracking specifications

We configured event mapping aliases in `analytics.js` and hooked actions across landing, authentication, dashboard, and public profile components:

| Funnel Event | Trigger Action | Implemented Locations |
| :--- | :--- | :--- |
| **`page_view`** | Automated on client route transitions. | `AnalyticsProvider.js` |
| **`signup_click`** | Clicking "Start Free" signup elements, submitting auth forms, or clicking sandbox bypass. | `page.js` (landing), `auth/page.js` (Google, Magic Link, Sandbox) |
| **`signup_complete`** | Triggered on dashboard session load for newly signed up accounts. | `DashboardClient.js` (mapped from `signup_completed`) |
| **`pricing_click`** | Clicking navbar pricing link, mobile anchors, plan cards, footer anchors, or dashboard sidebar upgrades. | `page.js` (landing), `DashboardClient.js` |
| **`create_quote_click`** | Triggered when quote creation is initiated (blank, lead AI-generated, or preset). | `DashboardClient.js` (`initCreateQuote`, `handleAiQuoteGeneration`) |
| **`create_invoice_click`** | Triggered when invoice creation is initiated (blank, or converted from quote). | `DashboardClient.js` (`initCreateInvoice`, `handleConvertQuoteToInvoice`) |
| **`public_profile_view`** | Triggered when a public bento profile page is loaded. | `ProfileCardClient.js` |
| **`lead_submit`** | Submitting a quote request inquiry on a public bento card. | `ProfileCardClient.js` (mapped from `lead_submitted`) |

---

## 4. Verification & QA Compilation

### Linter & Compiling
* **Linting Validation**: Ran `npm run lint` with zero syntax warnings.
* **Build Check**: Ran `npm run build` with Next.js compilation successfully resolving all routes.

### Console Event Auditing (Development Mode)
In local development environments, tracking calls write log objects directly to the browser console. During testing, the following payload validations were verified:
```javascript
[ANALYTICS] Event Tracked: "signup_click" {
  entry_url: "http://localhost:3000/?utm_source=twitter",
  landing_path: "/",
  referrer: "direct",
  utm_source: "twitter",
  utm_medium: "",
  utm_campaign: "",
  funnel_step: "signup_click",
  funnel_step_index: 1,
  seconds_since_first_step: 0,
  seconds_since_previous_step: 0,
  position: "navbar"
}
```
Funnel step durations and UTM parameters successfully persist in `localStorage` and route through the analytics wrappers.
