# Corvioz Revenue Optimization Sprint Audit

Audit date: 2026-06-21  
Scope: Flow validation only. No product changes implemented.

## Executive Summary

Corvioz has a strong landing-to-invoice entry path: a first-time user can understand the primary CTA and reach invoice creation in one click without signup. The value-first direction is visible and mostly aligned with the new UX guardrails.

However, the current implementation is not yet fully consistent across the first-time revenue flow. The most important issues are:

1. Guest invoice creation works, but guest quote creation does not: `/quotes/create` redirects to `/signup`.
2. The export paywall backend is trust-oriented, but the UI bridge can bypass or undermine it.
3. Invoice creation copy says users can "download the PDF" before signup, while the monetization rules say export is paid/soft-gated.
4. Pricing is generally trust-building, but several labels and stats feel stronger than the product evidence shown in-session.

Overall recommendation: tune before finalizing the sprint. The invoice path is close; quote guest mode and export paywall behavior need alignment before this can be considered a trustworthy revenue flow.

## Evidence Reviewed

- Browser flow: `/` → `/invoices/create`
- Browser flow: direct `/quotes/create`
- Browser flow: `/pricing`
- Code reviewed:
  - `src/app/page.js`
  - `src/app/invoices/create/page.js`
  - `src/app/quotes/create/page.js`
  - `src/components/dashboard/Dashboard.js`
  - `src/hooks/useRevenueAction.js`
  - `src/app/lib/revenue/useRevenueDecision.ts`
  - `src/app/lib/revenue/control-plane/decision-engine.ts`
  - `src/app/pricing/page.js`

## 1. Landing -> Invoice Creation

### What Works

- The primary CTA is immediately understandable.
  - Hero headline: "Create your first invoice instantly."
  - Primary CTA: "Generate First Invoice Instantly"
  - Secondary CTA: "Try Without Signup"
  - Supporting copy: "You don't need an account to start"
- The main CTA points directly to `/invoices/create`.
- Real browser validation confirmed the user reaches invoice creation in one click.
- `/invoices/create` renders the invoice builder without redirecting to signup.

### Friction Points

- The invoice builder is prefilled with demo-style values such as `Acme Corporation` and consulting/development line items. This accelerates demo comprehension, but a first-time user may wonder whether they are editing a real invoice or a sample.
- The sidebar exposes the full dashboard surface immediately, including Leads CRM, Clients, Public Profile, Client Portal, and Upgrade to Pro. For a first-time invoice-only flow, this adds cognitive load.
- The invoice builder shows lifecycle badges like Created, Sent, Opened, Paid even though the user is only creating their first invoice. This can feel slightly confusing.

### Trust Issues

- The line "create your invoice, download the PDF, or sign up to save it" implies PDF download is available before signup. The revenue rules now treat PDF export as the primary paid/soft-paywall trigger. This wording can create expectation mismatch.
- The product preview on the homepage shows large existing revenue and client data. It looks polished, but it can feel like demo data rather than a blank first-user state.

### Conversion Blockers

- No major blocker on landing -> invoice creation. This is the strongest flow.
- The main risk is expectation mismatch around PDF export after the user invests time creating the invoice.

### Recommendations

- Keep the one-click landing -> invoice path.
- Clarify the invoice builder copy so the value promise is: create and preview free; export/send/save requires account or upgrade depending on action.
- Consider making sample data visibly labeled as editable sample content, so users understand they can replace it.
- Reduce first-run dashboard distractions around invoice creation when entered through `/invoices/create`.

## 2. Guest Mode Experience

### What Works

- Guest invoice creation works.
- `/invoices/create` has an explicit guest bypass in the dashboard auth logic.
- First invoice save without session stores a pending invoice locally, then requests signup to save securely.
- Backend control-plane rules now protect first invoice and first quote creation.

### Friction Points

- Guest mode is not consistent across invoice and quote routes.
- `/quotes/create` uses the same Dashboard shell, but the auth bypass currently only recognizes invoice route/tool conditions.
- A first-time user opening `/quotes/create` is redirected to `/signup`, before creating value.

### Trust Issues

- The product promises "quotes and invoices" as part of the same value loop, but guest quote creation is blocked by signup.
- This inconsistency can feel arbitrary: invoice creation is free-first, quote creation is auth-first.

### Conversion Blockers

- High: `/quotes/create` redirects to signup for unauthenticated users.
- Medium: Quote save logic does not include the same guest local-save flow as invoice save.
- Medium: Backend rules and frontend route auth behavior are not aligned. The backend says first quote should be allowed, but the UI route redirects before the user can act.

### Recommendations

- Align `/quotes/create` with `/invoices/create`: first quote creation should be possible without signup.
- Add the same guest-mode local draft and delayed signup model to quote save.
- Ensure route auth gates honor the same control-plane guardrails as action-level decisions.

## 3. Export Paywall Experience

### What Works

- The invoice builder places the export action at the right moment: after the user can see an invoice preview and total.
- The page explains near the button that free PDF downloads include a watermark and upgrading removes it.
- Backend control-plane response is now educational:
  - PDF export is paid because it creates a client-ready deliverable.
  - Invoice and quote creation remain free.
  - Free vs paid boundaries are returned in `trust_guardrail`.

### Friction Points

- The page says "download the PDF" as part of no-account-start copy, while the button-level note says free downloads include a watermark, and backend rules say export is a soft paywall. The three messages are close but not fully synchronized.
- The paywall/modal experience could not be reliably validated via browser click because the Playwright click hung during export interaction. Code inspection was needed.

### Trust Issues

- The UI bridge has a serious mismatch risk:
  - `useRevenueDecision` calls `/api/revenue/control-plane` using `simulate_action`, then reads the latest decision from the global state snapshot.
  - In shadow mode, export can normalize to `allow` and proceed without showing the educational paywall.
  - In soft-paywall mode, `useRevenueAction` calls `onSuccess(true)` for non-blocking decisions, which can trigger the actual PDF download while also setting the export modal.
- `onSuccess(true)` is used as the watermark-free argument in `handlePdfDownload`. That means the export path risks generating an unwatermarked PDF for a free user when the decision should educate and offer a free watermarked option.

### Conversion Blockers

- Critical: Export monetization may not behave as intended in the UI even though backend rules are correct.
- High: If a user gets an unexpected modal after seeing "download the PDF", trust may drop.
- High: If a free user can download watermark-free due to UI bridge semantics, revenue capture fails.

### Recommendations

- Treat export as a special decision path: do not auto-run `onSuccess(true)` on `soft_paywall`.
- For export soft-paywall, show the educational modal first, then let the user choose:
  - download free watermarked PDF
  - upgrade for watermark-free PDF
- Make the local copy consistent: "Create and preview free. Download with watermark on Free. Upgrade to export watermark-free."
- Avoid relying on global latest decision logs for user-action decisions; return the evaluated decision directly to the hook.

## 4. Pricing Experience

### What Works

- Pricing page is easy to understand.
- Free, Pro, and Agency tiers are visible without hunting.
- The Free plan clearly lists quote/invoice/client limits.
- Pro clearly lists unlimited invoices/quotes and PDF downloads.
- FAQ and refund/cancel copy help trust.
- No fake countdown urgency was observed.

### Friction Points

- Pricing nav "Start Free" sends users to `/dashboard?action=create-profile`, not directly to invoice/quote creation. That is reasonable for profile creation, but it is less aligned with the value-first invoice sprint.
- The pricing page introduces payment before value if visited directly. That is acceptable for direct pricing traffic, but not ideal as the main route from first-session users.

### Trust Issues

- Dynamic recommendation labels can feel pushy:
  - `HARD RECOMMENDATION`
  - `RECOMMENDED (Highest Value Workspaces)`
  - `ATTEMPTED PLAN`
- Trust stats such as `$12M+ Invoice Volume Billed`, `10k+ Active Freelancers`, and `4.9/5 User Satisfaction` are persuasive but need substantiation. If these are not backed by real data, they risk trust.
- "Secure 256-Bit Encrypted Payments" may be too specific unless the payment implementation and legal/security posture fully support that claim.

### Conversion Blockers

- Medium: Some pricing trust claims may trigger skepticism if the user has not yet experienced product value.
- Medium: Direct pricing CTA for Free starts at profile/dashboard rather than the invoice value path.

### Recommendations

- Keep pricing calm and transparent.
- Replace aggressive recommendation labels with user-benefit framing.
- Ensure any public metrics are real, sourced, or softened.
- For users arriving after invoice creation/export attempt, emphasize the exact value unlocked: watermark-free PDF, saved invoices, send/share workflow.

## Cross-Flow Findings

### Friction Points

- Invoice route is optimized; quote route is not.
- Dashboard shell exposes too much surface during first invoice creation.
- The product mixes "guest mode", "sandbox mode", and "not signed in" concepts, which can blur the user's mental model.

### Trust Issues

- Export expectations are not fully synchronized across landing copy, invoice builder copy, modal behavior, and backend rules.
- Pricing claims may feel inflated if not backed by real evidence.
- Backend guardrails are stronger than UI behavior in some places.

### Conversion Blockers

- First quote creation is blocked by signup.
- Export paywall UI can mis-handle backend soft-paywall semantics.
- Global decision-log response handling can create mismatch between the current action and the latest logged action.

## Priority Recommendations

### P0

1. Make `/quotes/create` behave like `/invoices/create` for unauthenticated users.
2. Fix export soft-paywall UI flow so it never auto-downloads watermark-free PDF for free users.
3. Return direct control-plane decisions to the UI hook instead of requiring the hook to read the latest global decision from a state snapshot.

### P1

1. Align invoice builder copy with the free/paid boundary.
2. Add visible "sample data" clarity to prefilled invoice fields.
3. Tone down pricing recommendation labels that feel pushy.

### P2

1. Reduce sidebar/dashboard complexity in the first invoice creation route.
2. Add substantiation or softer wording for pricing trust metrics.
3. Consider a first-run "invoice-only" workspace mode for landing CTA users.

## Go / Tune / Block Recommendation

Recommendation: tune before finalizing Revenue Optimization Sprint.

The landing -> invoice path is strong and should be preserved. The sprint should not be finalized until quote guest mode and export paywall behavior are aligned with the trust-first guardrails.

