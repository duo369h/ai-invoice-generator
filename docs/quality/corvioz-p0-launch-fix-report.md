# Corvioz P0 Launch Fix Report

## Scope

This sprint fixed only the three launch blockers identified in the revenue and UX audits:

- Quote guest mode consistency
- Export paywall logic integrity
- Direct decision delivery from the control plane

No UI redesign, new pages, or new product features were added.

## 1. Quote Guest Mode Status

Status: Fixed.

What changed:

- `/quotes/create` now follows the same guest-mode gate behavior as `/invoices/create`.
- The dashboard auth gate now treats `initialTool="quote"` and `/quotes/create` as a value-first builder path instead of redirecting immediately to `/signup`.
- Quote creation initializes usable draft metadata for guest users:
  - quote number
  - quote date
- Quote save now persists the guest quote draft into `localStorage` as `corvioz_pending_quote`.
- Signup is triggered only when the guest user tries to save the quote to the account.
- After login, pending guest quote drafts are restored and saved to the account, matching the invoice draft restore path.

Verification:

- `curl -s -L -o /dev/null -w '%{url_effective} %{http_code}\n' http://localhost:3114/quotes/create`
- Result: `http://localhost:3114/quotes/create 200`
- Direct control-plane quote decision:
  - input: guest `create_quote`, first action
  - result: `action: "allow"`
  - reason: `Guest mode quote creation allowed before signup.`

Remaining note:

- Guest users can draft quotes. Account creation is still required for account-backed persistence, sending, or exporting.

## 2. Export Paywall Verification

Status: Fixed.

What changed:

- Export `soft_paywall` no longer auto-runs the premium PDF success callback.
- For export actions, `onSuccess(true)` is blocked when a paywall modal is shown.
- Free users can only continue export through the explicit free-download path, which calls `onSuccess(false)` for watermarked output.
- Paid users still receive the normal allowed export decision and can access watermark-free export.
- The UI decision hook now reads `shadow_action: "soft_paywall"` for export decisions so shadow-mode simulation cannot accidentally proceed as a premium free export in the UI path.

Verified paths:

- Invoice export:
  - free plan direct API decision in live mode returned `action: "soft_paywall"`.
  - paid plan direct API decision returned `action: "allow"`.
  - hook path no longer auto-downloads premium PDF for export soft paywalls.
- Quote export:
  - no direct dashboard quote PDF export button was found in the current dashboard path.
  - quote creation/save is guest-safe; future quote export actions should use the same `export_pdf` decision path.
- Client-facing export:
  - client portal uses browser `window.print()` / save-as-PDF, not Corvioz premium PDF generation.
  - no premium watermark-free PDF generation path is exposed there.

Control-plane evidence:

- Free export live decision returned:
  - `action: "soft_paywall"`
  - `reason: "export_locked_free_tier: PDF export is paid, while invoice and quote creation remain free."`
  - `upgrade_target: "pricing_page"`
- Paid export live decision returned:
  - `action: "allow"`
  - `reason: "No revenue control-plane rule matched."`
- Shadow-mode free export returned:
  - `action: "allow"`
  - `shadow_action: "soft_paywall"`
  - hook now interprets this as an export modal path for export safety.

## 3. Direct Decision Delivery Verification

Status: Fixed.

What changed:

- `useRevenueDecision()` now posts direct event fields to `/api/revenue/control-plane`.
- It no longer sends `simulate_action` for live UI decisions.
- It no longer reads `raw.decisions[0]` or any latest global decision snapshot.
- The hook normalizes the direct API response from:
  - `action`
  - `backend_action`
  - `ui_action`
  - `decision_id`
  - `reason`
  - `reason_chain`
  - `explanation`
  - `shadow_action`
- `/api/revenue/control-plane` returns direct strict decision payloads with `shadow_mode` and `shadow_action`.

Verification:

- Direct `create_quote` API result included a unique `decision_id`.
- Direct free `export_pdf` API result included a unique `decision_id`.
- Direct paid `export_pdf` API result included a unique `decision_id`.
- The response pipeline no longer depends on the shared `decisions` array for UI action handling.

## Build And Static Verification

Commands run:

- `npx eslint src/components/dashboard/Dashboard.js src/hooks/useRevenueAction.js src/app/lib/revenue/useRevenueDecision.ts src/app/api/revenue/control-plane/route.ts`
- `npm run build`

Results:

- Targeted lint: passed.
- Production build: passed.

Note:

- A previous full `npm run lint` run surfaced unrelated existing lint issues in `src/app/auth/page.js` and `src/app/page.js`. They were outside this P0 blocker scope and were not changed.

## Launch Blocker Verdict

- Quote guest mode works.
- Export monetization is safe against accidental premium PDF download.
- Revenue decision delivery is deterministic and direct.

Recommendation: P0 launch blockers are fixed for the revenue optimization sprint scope.
