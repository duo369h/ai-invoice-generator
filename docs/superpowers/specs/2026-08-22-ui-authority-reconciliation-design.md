# Corvioz UI Authority Reconciliation

## Functional authority

`5a7263762e8566e092c1e4eea2f630499557b677` remains the functional source of truth. No API routes, database/RPC behavior, migrations, entitlement rules, payment ledger, billing, Resend, or Phase 1–4 workflow logic may be replaced by historical visual branches.

## Public reconciliation

Use `origin/codex/public-pages-v2-20260815` as a visual reference only. Selectively bring over the approved hierarchy, typography, header/footer treatment, responsive layout, reveal behavior, and still-valid brand assets for Home and For Photographers. Reconcile every CTA, plan label, and claim against current Pricing V2 truth: Free has no Portal/Approval, Starter has no Portal/Approval, Pro owns Portal/quote approval, and Proposal is unavailable. Keep current auth, pricing, cookie/legal, analytics, and route wiring.

## Dashboard reconciliation

Use `origin/preview/bplus-sidebar-icons` as a visual reference only. Preserve the current Dashboard component's handlers, hooks, state, entitlement loader, document flows, Portal/Approval, payment, and revenue integrations. Selectively apply the B+ sidebar icon system and compatible shell, spacing, typography, card, density, and responsive treatments without replacing `Dashboard.js` wholesale.

## Validation

Run UI guard, lint, build, the existing Pricing/Quote/Invoice/Portal/Approval/Payment/PDF suites, and the dashboard entitlement/auth suites. Create only a Vercel Preview from this reconciliation branch. Verify Public desktop/mobile pages and Preview Dashboard Quotes, Invoices, mobile/sidebar, Clients, Account/Settings, and Pro Portal entry. Confirm Pro/Free entitlement smoke behavior and no Dashboard access-unavailable regression. Production remains untouched.

## Explicit exclusions

Do not merge historical branches wholesale, reset main, rollback runtime behavior, resurrect Proposal or Free/Starter Portal/Approval, restore obsolete pricing or profile claims, modify the database, add migrations, or deploy Production.
