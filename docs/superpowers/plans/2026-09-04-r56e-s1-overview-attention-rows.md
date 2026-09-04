# R56E-S1 Overview Attention Rows Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make Dashboard Overview Needs Attention and Recent Documents compact, semantic, exact-ID row actions without changing business or runtime contracts.

**Architecture:** Keep `buildNeedsAttention`, `buildRecentDocuments`, `resolveAction`, state derivation, and action payloads unchanged. Replace only the two list-item wrappers with full-width semantic buttons whose visible content preserves the existing hierarchy and whose arrow/action label is non-interactive. Add narrowly scoped CSS for flat rows and four-viewport responsive wrapping.

**Tech Stack:** Next.js/React, repository CSS, Node ESM regression scripts, existing Playwright browser harness.

---

### Task 1: Add the failing S1 regression test

**Files:**
- Create: `scripts/test-r56e-s1-overview-attention-rows.mjs`

- [ ] **Step 1: Write the failing source-contract test**

Assert that the Overview source uses semantic full-row buttons for both lists, preserves the exact existing action payload expressions, keeps state branches, and does not put an actionable button inside a row. Use the existing builders for deterministic fixtures and assert the expected actions for Draft/Approved/Past-due/Partial and recent Quote/Invoice records.

- [ ] **Step 2: Run the test to verify it fails for the old article-plus-button implementation**

Run: `node scripts/test-r56e-s1-overview-attention-rows.mjs`

Expected: FAIL because the current list items are `<article>` elements with separate inner buttons and no semantic row control.

### Task 2: Implement semantic Needs Attention rows

**Files:**
- Modify: `src/app/dashboard/components/DashboardOverview.js` in `Wave1NeedsAttention`

- [ ] **Step 1: Replace each item wrapper with a button row**

Use `type="button"`, `aria-label={item.actionLabel}`, `data-testid="needs-attention-item"`, and the existing `onClick={() => resolveAction(actionHandlers, item.action, { id: item.documentId, documentType: item.documentType })}`. Keep the type, title, number/client, past-due detail, partial payment detail, and visible `item.actionLabel`/arrow as non-interactive content.

- [ ] **Step 2: Run the narrow regression**

Run: `node scripts/test-r56e-s1-overview-attention-rows.mjs`

Expected: PASS for action preservation, exact IDs, Approved Quote create-invoice authority, semantic row structure, and preserved state branches.

### Task 3: Implement semantic Recent Documents rows

**Files:**
- Modify: `src/app/dashboard/components/DashboardOverview.js` in `Wave1RecentDocuments`

- [ ] **Step 1: Replace each document wrapper with a button row**

Use `type="button"`, `aria-label={`Open ${typeLabel}`}`, `data-testid={`recent-document-${document.type}`}`, and the existing `resolveAction(actionHandlers, openAction, { id: document.id, documentType: isQuote ? 'quote' : 'invoice' })`. Keep type, exact number, client, status, authoritative total, and visible `Open {typeLabel}`/arrow as non-interactive content.

- [ ] **Step 2: Run the related exact-ID browser regression**

Run: `CORVIOZ_NODE_MODULES_ROOT=/Users/duo/Documents/想做个网站/corvioz node scripts/test-dashboard-overview-exact-open-r51.mjs`

Expected: PASS while opening the exact Quote and Invoice objects through the existing handlers.

### Task 4: Add quiet responsive row styling

**Files:**
- Modify: `src/app/styles/components.css` in the Wave 1 row selectors and responsive media blocks

- [ ] **Step 1: Style semantic rows as full-width flat controls**

Set row buttons to inherit the existing font, width, `min-width: 0`, left alignment, restrained border/radius, no permanent shadow, and visible `:focus-visible` outline. Preserve wrapping for long numbers, clients, and currency amounts.

- [ ] **Step 2: Add viewport-safe stacking**

At 768px and below, stack row metadata under the identity while keeping the action affordance aligned within the row. At 430px and below, reduce padding/gaps and allow all content to wrap; do not introduce horizontal overflow or force amounts into a fixed-width column.

- [ ] **Step 3: Run the S1 regression and R56D static UX checks**

Run: `node scripts/test-r56e-s1-overview-attention-rows.mjs && node scripts/test-r56d-dashboard-ux-closure.mjs`

Expected: PASS with no changes to data derivation or unrelated Overview sections.

### Task 5: Verify build, browser behavior, and scope

**Files:**
- Inspect: `src/app/dashboard/components/DashboardOverview.js`
- Inspect: `src/app/styles/components.css`
- Inspect: `git diff --check` and `git diff --stat`

- [ ] **Step 1: Run all targeted source/state tests**

Run: `node scripts/test-dashboard-overview-needs-attention-r42.mjs && node scripts/test-r56c-error-stale-data.mjs && node scripts/test-r56c1-payment-state-authority.mjs && node scripts/test-dashboard-overview-exact-open-r51.mjs`

Expected: PASS; existing stale/error/empty/payment/exact-ID contracts remain intact.

- [ ] **Step 2: Run production build and available static checks**

Run: `npm run build` and `npm run lint:ui`

Expected: both exit successfully without source changes outside the selected files and test.

- [ ] **Step 3: Run the real local Dashboard visual capture**

Use the existing non-production browser harness with fixtures for Draft Quote, Approved Quote, Past-due Invoice, Partial Invoice, Recent Quote, Recent Invoice, empty, and stale/error states. Capture 320px, 390px, 768px, and 1280px; inspect keyboard focus and touch-sized row targets; assert `document.documentElement.scrollWidth <= document.documentElement.clientWidth`.

- [ ] **Step 4: Review the final diff and commit the implementation**

Run: `git diff --check && git status --short && git diff -- src/app/dashboard/components/DashboardOverview.js src/app/styles/components.css scripts/test-r56e-s1-overview-attention-rows.mjs`

Commit only the selected implementation files and the S1 regression with message: `R56E-S1 implement overview attention rows`.
