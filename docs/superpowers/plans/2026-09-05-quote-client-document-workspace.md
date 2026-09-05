# Quote Client Document Workspace Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the R56E-F-S4B responsive Quote business-editor/client-document workspace from the exact Production baseline without changing Quote persistence or product scope.

**Architecture:** Keep `Dashboard.js` as the Quote state/workflow authority, extract one `QuoteClientDocument` presentation component for both visible and printable instances, and extract one pure totals helper consumed by the editor summary and document. Use CSS classes for desktop split and tablet/mobile mode behavior, with local `quoteWorkspaceMode` state only.

**Tech Stack:** Next.js 16, React 19, existing Dashboard CSS, deterministic Node regression scripts, existing Playwright/browser infrastructure.

---

### Task 1: Establish the source-scoped regression contract

**Files:**
- Create: `scripts/test-r56e-s4b-quote-editor-client-document.mjs`
- Test: `scripts/test-r56e-s4b-quote-editor-client-document.mjs`

- [ ] **Step 1: Write the failing test**

Assert that the shared component and totals helper are imported, visible and printable bindings use `QuoteClientDocument`, the printable target remains `794px`, S4A section labels remain ordered, mode controls exist, changed Quote source has no bare-dollar literals or unauthorized S4C/S4D surfaces, and only allowed source paths are changed relative to the baseline.

- [ ] **Step 2: Run the targeted test and verify RED**

Run `node scripts/test-r56e-s4b-quote-editor-client-document.mjs`. It must fail because the shared component, helper, bindings, and responsive mode contract do not yet exist.

### Task 2: Extract shared totals and client-document authority

**Files:**
- Create: `src/components/dashboard/quoteTotals.js`
- Create: `src/components/dashboard/QuoteClientDocument.js`
- Modify: `src/components/dashboard/Dashboard.js`

- [ ] **Step 1: Add the pure totals helper**

Export `calculateQuoteTotals(items, discountRate, taxRate)` returning `subtotal`, `discount`, `discountedSubtotal`, `tax`, and `total` using the current arithmetic and no new rounding behavior.

- [ ] **Step 2: Extract the existing printable markup**

Move the current quote document content into `QuoteClientDocument`, accepting quote identity, client/from fields, items, rates, currency, notes, status, and `formatMoney`; keep client-facing semantics and the `794px` canonical width.

- [ ] **Step 3: Bind both instances to the same component**

Render a visible component instance in the client canvas and a hidden instance inside `id="printable-quote"`; remove the old duplicate printable JSX. Both instances receive the same current state and totals result.

- [ ] **Step 4: Replace editor arithmetic with the helper**

Use `calculateQuoteTotals` for the editor pricing summary and document props, preserving display formatting and all existing persistence payloads.

- [ ] **Step 5: Run the targeted test and verify GREEN**

Run `node scripts/test-r56e-s4b-quote-editor-client-document.mjs` and confirm it passes.

### Task 3: Implement responsive workspace modes

**Files:**
- Modify: `src/components/dashboard/Dashboard.js`
- Modify: `src/app/styles/layouts.css`

- [ ] **Step 1: Add local Edit/Preview state**

Initialize `quoteWorkspaceMode` to `edit` and switch only on explicit buttons. Keep the state independent from Save, Send, status, and Quote persistence.

- [ ] **Step 2: Add desktop split markup**

Wrap the existing editor in a controlled business-editor column and place the shared document in a centered client canvas. Keep the section index and all S4A sections in the editor column.

- [ ] **Step 3: Add tablet/mobile mode presentation**

At `768px–1179px`, show Edit or Preview as selected; below `768px`, keep one column and expose Preview explicitly. Hide only the inactive presentation region; do not duplicate state or markup.

- [ ] **Step 4: Add overflow and paper styles**

Use `min-width: 0`, bounded editor width, canvas overflow containment, responsive document scaling with CSS transform/width containment, and no page-level horizontal overflow. Keep printable width unchanged.

- [ ] **Step 5: Run targeted source checks**

Run `node scripts/test-r56e-s4b-quote-editor-client-document.mjs`, `npm run test:r55b`, `node scripts/test-r56e-english-locale-currency-authority.mjs`, and `node scripts/test-r56e-s4a-quote-workspace-structure.mjs`.

### Task 4: Browser and export verification

**Files:**
- Create: `scripts/test-r56e-s4b-browser-runtime.mjs` only if existing browser infrastructure cannot express the required checks without it.
- Create: `R56E-F-S4B-quote-editor-client-document-audit.zip` at finalization.

- [ ] **Step 1: Start the existing local browser harness**

Use the repository’s existing browser/runtime command and authenticated test path; do not add a browser dependency.

- [ ] **Step 2: Capture required viewport evidence**

Capture 1280, 1440, 768 Edit, 768 Preview, 390 Edit, 390 Preview, and 1280 zh-CN screenshots with overflow and visible-state assertions.

- [ ] **Step 3: Exercise live state and mode preservation**

Change client name, line description, currency USD→CAD, tax, and notes without saving; verify the document updates immediately, switch Edit→Preview→Edit, and verify values remain.

- [ ] **Step 4: Exercise the existing PDF path**

Verify the `printable-quote` target, current state values, totals, currency, and existing export entitlement behavior.

### Task 5: Full regression, audit bundle, and focused commit

**Files:**
- Create: `R56E-F-S4B-quote-editor-client-document-audit.zip`

- [ ] **Step 1: Run all required regression and build gates**

Run the relevant R1/R2/S4A/S3/S2/S1 authorities, `npm test`, `npm run build`, and `git diff --check`; record exact outputs and any unrun gate with its reason.

- [ ] **Step 2: Review changed files against scope**

Classify every changed path as S4B_REQUIRED; stop and repair if any unauthorized file appears.

- [ ] **Step 3: Build the single review ZIP**

Include the requested numbered evidence directories, screenshots, redacted command log, changed-file manifest, SHA256 manifest without self-reference, and final result; exclude dependencies, caches, secrets, tokens, cookies, and env values.

- [ ] **Step 4: Commit and push only the feature branch**

After all gates pass, commit the focused S4B changes and audit bundle on `feature/r56e-s4b-quote-editor-client-document`; never move release/candidate branches or deploy Production.
