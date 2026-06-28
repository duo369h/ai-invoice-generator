# Corvioz Growth System V1

## Scope

This layer optimizes the revenue path only:

Landing -> Signup -> First Value -> First Payment

It does not modify the UI system, design tokens, or visual components.

## Funnel Events

Standard funnel events:

- `landing_view`
- `signup_start`
- `signup_complete`
- `dashboard_view`
- `first_quote_created`
- `first_invoice_created`
- `pricing_view`
- `pricing_select_plan`
- `checkout_started`
- `payment_completed`

All standardized events include:

- `session_id`
- `funnel_step`
- `funnel_step_index`
- `user_id` when available
- intent metadata when available
- timing metadata

## Intent Capture

`/lib/intent/intent-store.ts` stores pre-signup conversion intent in `sessionStorage`:

- `clicked_feature`
- `source_page`
- `cta_clicked`
- `selected_plan`
- `intended_route`

After signup, the dashboard restores the intent and routes the user directly to:

- `/invoices/create` for invoice intent
- `/quotes/create` for quote intent
- `/pricing?checkout=PLAN` for paid plan intent
- dashboard onboarding checklist when no specific intent exists

## Pricing Conversion

Pricing now tracks:

- `pricing_view`
- `pricing_hover_plan`
- `pricing_select_plan`
- `pricing_scroll_depth`
- `checkout_started`
- `payment_completed`

When a logged-out user selects a paid plan, Corvioz saves the plan, sends the user to signup, restores the plan after signup, and reopens checkout from `/pricing?checkout=PLAN`.

## Free To Paid Triggers

Upgrade prompts are triggered for:

- first invoice creation
- first quote creation/send path
- dashboard view 2+ without payment
- export/share actions
- existing free-plan limits

## Analysis Output

`/analytics/funnel-report.json` defines the report contract.

Runtime aggregation logic lives in `/lib/funnel/funnelTracker.ts` via `buildFunnelReport()`.
