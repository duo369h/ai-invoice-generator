# Corvioz Analytics Contract v1

Date: 2026-06-21
Scope: Beta launch analytics normalization only. No UI changes, no monetization-rule changes, no new product features.

## Canonical GA4 Event List

These are the official launch-measurement events for Corvioz Beta.

| Canonical Event | Meaning | Primary Source | Duplicate Rule |
|---|---|---|---|
| `landing_view` | First tracked page/funnel entry in the session. | `trackPageView()` -> `trackLandingViewOnce()` | Once per session |
| `invoice_create` | User reaches invoice creation intent/value builder. | `/invoices/create` route entry | Deduped within 2 seconds per session/path/source |
| `quote_create` | User reaches quote creation intent/value builder. | `/quotes/create` route entry | Deduped within 2 seconds per session/path/source |
| `export_attempt` | User attempts a PDF export. | `useRevenueAction('export_pdf')` | Deduped within 2 seconds per session/path/export target |
| `pricing_view` | User views pricing. | `trackPricingView()` on `/pricing` | Deduped within 2 seconds |
| `signup_start` | User starts auth/signup. | Auth form magic link or Google sign-in | Deduped within 2 seconds by method/source |
| `signup_complete` | Authenticated user returns after signup intent. | Dashboard auth session handler | Once per consumed signup-start marker |

## Alias Normalization

The analytics layer normalizes legacy/internal events before sending to GA4.

| Legacy/Internal Event | Canonical Event |
|---|---|
| `invoice_create_start` | `invoice_create` |
| `quote_create_start` | `quote_create` |
| `export_pdf` | `export_attempt` |
| `pdf_export` | `export_attempt` |
| `export_invoice` | `export_attempt` |
| `quote_export` | `export_attempt` |
| `signup_click` | `signup_start` |
| `signup_started` | `signup_start` |
| `signup_completed` | `signup_complete` |

Non-core CTA events remain separate and should not be used as funnel-step counters:

- `invoice_create_click`
- `quote_create_click`
- `cta_click`
- `quick_action_click`

Completion/activation events also remain separate:

- `first_invoice_created`
- `first_quote_created`

## Standard Payload

Every canonical event is enriched through `trackEvent()` with:

```json
{
  "session_id": "string",
  "user_id": "string | undefined",
  "timestamp": "ISO-8601 string",
  "funnel_step": "canonical event name",
  "funnel_step_index": "number",
  "seconds_since_first_step": "number",
  "seconds_since_previous_step": "number",
  "entry_url": "string",
  "landing_path": "string",
  "referrer": "string",
  "utm_source": "string",
  "utm_medium": "string",
  "utm_campaign": "string",
  "utm_term": "string",
  "utm_content": "string",
  "intent_score": "number",
  "revenue_stage": "cold | warm | hot | ready_to_pay",
  "analytics_build": "analytics_contract_v1_2026_06_21"
}
```

## Event-Specific Payloads

### `invoice_create`

```json
{
  "source": "route_entry",
  "page_path": "/invoices/create"
}
```

### `quote_create`

```json
{
  "source": "route_entry",
  "page_path": "/quotes/create"
}
```

### `export_attempt`

```json
{
  "source": "invoice_export_button | quote_export_button | dashboard_export",
  "export_target": "pdf",
  "document_type": "invoice | quote",
  "user_plan": "free | pro | agency",
  "watermark_expected": true
}
```

Notes:

- Invoice export is currently wired through the shared revenue action hook.
- Watermark export does not create a second `export_attempt`; the attempt is counted when export is requested.
- Upgrade-triggered export produces one `export_attempt` before the upgrade/paywall response.
- A separate quote PDF export button was not found in the current dashboard surface. If quote export is added later and calls `evaluateAction('export_pdf', ..., { document_type: 'quote' })`, it will use the same canonical event.

### `pricing_view`

```json
{
  "trigger_source": "direct | export | dashboard | pricing_page"
}
```

### `signup_start`

```json
{
  "method": "magic_link | google",
  "source": "auth_form"
}
```

### `signup_complete`

```json
{
  "provider": "google | email | unknown",
  "user_id": "string"
}
```

## Funnel Contract v1

Official Beta measurement funnel:

```text
landing_view
-> invoice_create
-> export_attempt
-> pricing_view
-> signup_complete
```

Secondary quote path:

```text
landing_view
-> quote_create
-> export_attempt
-> pricing_view
-> signup_complete
```

Activation events may be analyzed alongside the funnel, but they are not the core funnel step names:

- `first_invoice_created`
- `first_quote_created`

## GA4 Mapping Guide

Recommended GA4 funnel exploration steps:

1. Step 1: `landing_view`
2. Step 2: `invoice_create`
3. Step 3: `export_attempt`
4. Step 4: `pricing_view`
5. Step 5: `signup_complete`

Recommended breakdown dimensions:

- `session_id`
- `user_id`
- `source_page`
- `cta_clicked`
- `clicked_feature`
- `selected_plan`
- `document_type`
- `user_plan`
- `watermark_expected`

## Duplicate Event Audit

| Event | Current Control |
|---|---|
| `landing_view` | Session flag `corvioz_landing_view_tracked`. |
| `invoice_create` | Route-entry canonical event; CTA clicks remain non-core click events. |
| `quote_create` | Route-entry canonical event; CTA clicks remain non-core click events. |
| `signup_complete` | Consumed signup-start marker prevents repeated completion events. |
| `export_attempt` | Fired once before revenue decision evaluation; modal watermark download does not fire another attempt. |

## Launch Measurement Notes

- Use canonical events for dashboard reporting.
- Do not count `invoice_create_click` or `quote_create_click` as funnel steps.
- Use `first_invoice_created` and `first_quote_created` for activation analysis, not for the core Beta funnel.
- Use `export_attempt` as the revenue-intent step, even when the control plane decision is `soft_paywall` or shadow-mode `allow` with `shadow_action`.
- Keep `analytics_build` in debug exports so beta data can be separated from pre-normalization sessions.
