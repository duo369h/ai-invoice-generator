# UI Authority Reconciliation Implementation Plan

> **For agentic workers:** Execute this plan inline with checkpoints. Preserve the current runtime authority and never deploy Production.

**Goal:** Selectively reconcile the approved Public V2 and Dashboard B+ visual language onto `5a7263762e8566e092c1e4eea2f630499557b677` while preserving all current product/runtime behavior.

**Architecture:** Keep current route entrypoints and functional components as the authority. Port only visual primitives, layout classes, valid brand assets, and page composition from the two historical branches; reconcile copy and CTAs against current product truth. Validate source gates, local runtime, and a Vercel Preview before handoff.

**Tech Stack:** Next.js/React, existing Corvioz CSS, Vercel Preview, Playwright/browser screenshots, Node runtime suites.

---

### Task 1: Capture visual-source diffs and establish protected scope

**Files:**
- Read: `src/app/page.js`, `src/app/for-photographers/page.js`, `src/components/dashboard/Dashboard.js`
- Read: `origin/codex/public-pages-v2-20260815` Public V2 files
- Read: `origin/preview/bplus-sidebar-icons` Dashboard/icon/style files

- [ ] Record exact current-vs-source file diffs and reject wholesale replacement of `Dashboard.js`, API routes, hooks, and product logic.
- [ ] Identify only valid visual units: Public V2 shell/hero/workflow/reveal styles and assets; Dashboard B+ sidebar icons, spacing, shell/card treatments.
- [ ] Confirm no DB/migration/API/email/payment files are in the allowed change set.

### Task 2: Reconcile Public Home and For Photographers

**Files:**
- Modify: `src/app/page.js`
- Modify: `src/app/for-photographers/page.js`
- Modify: `src/app/components/PublicHeader.js`
- Modify: `src/app/components/SharedFooter.js`
- Modify: `src/app/styles/*.css` only where Public V2 visual classes are required
- Create/modify: valid `public/brand/*` assets only when referenced by the reconciled shell

- [ ] Preserve current auth/pricing/analytics/cookie/legal wiring and current product claims.
- [ ] Port Public V2 hierarchy, responsive composition, header/footer visual treatment, and reveal behavior without importing obsolete copy or routes.
- [ ] Verify Free/Starter/Pro claims remain: no Free/Starter Portal or Approval; Pro Portal and quote approval; Proposal unavailable.

### Task 3: Reconcile Dashboard visuals without replacing runtime logic

**Files:**
- Modify: `src/components/dashboard/Dashboard.js` only for visual classes/layout placement
- Modify: `src/components/icons/SidebarIconsBPlus.js` if needed
- Modify: `src/app/styles/*.css` or `src/styles/*` only for B+ visual tokens/layout

- [ ] Preserve current entitlement loader, Quote/Invoice handlers, Client/Portal/Approval flows, payment/revenue state, and API calls byte-for-behavior compatible.
- [ ] Port B+ icons, sidebar hierarchy, spacing, typography, card density, feedback placement, and responsive behavior selectively.
- [ ] Verify no visual-only change removes current Quotes, Invoices, Clients, Account/Settings, or Pro Portal entry states.

### Task 4: Run source and runtime guardrails

**Files:**
- Test: existing `scripts/test-*.mjs` suites named by the reconciliation task

- [ ] Run `node scripts/ui-guard.js` and `npm run lint`; require zero errors.
- [ ] Run dashboard entitlement/auth, pricing, Quote, Invoice, Portal/Approval, email-send, Payment, PDF, and paid-write guard suites.
- [ ] Run `npm run build`; require success.
- [ ] Run `git diff --check` and inspect changed-file scope for forbidden DB/migration/runtime files.

### Task 5: Commit and create Preview only

**Files:**
- Commit only reviewed reconciliation source, tests/assets, and this plan/spec documentation.

- [ ] Commit on `codex/ui-authority-reconciliation-20260822`.
- [ ] Push that branch; do not merge `main` and do not invoke Production deployment.
- [ ] Wait for Vercel Preview to reach Ready and record Preview URL plus deployment SHA.

### Task 6: Preview screenshots and runtime smoke

**Files:**
- Artifact output: Preview screenshots outside tracked source files

- [ ] Capture Home desktop/mobile and For Photographers desktop/mobile from local/Preview visual checks.
- [ ] Capture Preview Dashboard Quotes, Invoices, and mobile/sidebar; inspect Clients, Account/Settings, and Pro Portal entry.
- [ ] Smoke Pro/FREE entitlement resolution, Quote list, Invoice list, Client Portal, and absence of Dashboard access-unavailable regression.
- [ ] Return screenshots, Preview URL, commit SHA, changed files, test/build results, known visual differences, and `PRODUCTION_DEPLOYED=NO`.
