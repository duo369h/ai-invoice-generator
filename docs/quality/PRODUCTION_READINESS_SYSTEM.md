# Corvioz Production Readiness Audit System
**Document Version:** 1.0  
**Role:** Product Quality Guardian  
**Status:** Approved for Deployment Pipeline Integration  

---

## Executive Summary

This document establishes the permanent **Production Readiness Audit System** for Corvioz. Following the stabilization of the platform core and workspace architectures, future sprints must transition from creative refactoring to rigorous quality enforcement. 

This system defines the strict metrics, checks, and release gates that every subsequent deployment must pass. It guarantees that new feature releases or iterations do not compromise the **3-second comprehension**, **30-second completion**, and **restoration/activation** parameters defined in the `CORVIOZ_PRODUCT_BIBLE.md`.

---

## Phase 1 — Production Readiness Checklist

A comprehensive audit checklist covering Product, UX, UI, and Engineering criteria. Every deployment must pass all "Blocker" criteria before staging approval.

```
┌────────────────────────────────────────────────────────────────────────┐
│                        PRODUCTION READINESS GATE                       │
├────────────────────────────────────────────────────────────────────────┤
│ PRODUCT ──> UX/UI ──> ENGINEERING ──> SECURITY ──> PRODUCTION LAUNCH   │
└────────────────────────────────────────────────────────────────────────┘
```

---

### 1. Product Capabilities Checklist

#### Activation Flow
* [ ] **First success event tracking:** Verify that the first invoice creation correctly triggers the activation flag (`hasActivated === true`).
* [ ] **Skip Bypass Integrity:** Verify that clicking the "Skip" button sets the session cookie and successfully loads `/dashboard` without triggering the redirection loop.
* [ ] **No cold starts:** Ensure unactivated users are presented with a clear CTA to start their first task.

#### Workspace Zones
* [ ] **Zone rendering:** Verify that Today, Money, Clients, WIP, and Business Health zones render in the correct visual sequence matching the user's active tier.
* [ ] **Data synchronization:** Confirm workspace metrics update in real-time when underlying data (invoices, clients, leads) changes.

#### Invoice & Quote Creators
* [ ] **Bypass gate checks:** Verify that guest users are allowed exactly one free watermarked invoice export, and that the second attempt opens the pricing upsell modal.
* [ ] **Conversion pathways:** Ensure approved quotes can be converted into draft invoices with a single click.

#### Client Portal
* [ ] **Read-only document security:** Ensure client portals render correctly using the portal token, and that all editing capabilities are disabled.
* [ ] **Comments sync:** Verify that comments left by clients on the portal sync to the freelancer's dashboard feed.

#### Public Profile
* [ ] **Lead generation form:** Test the inquiry form on the public profile. Verify that entries appear in the freelancer's CRM Leads Inbox.
* [ ] **Bento card alignment:** Confirm that services lists, pricing ranges, and availability schedules align correctly across all viewports.

#### Pricing & Upgrade Flow
* [ ] **Price consistency:** Cross-reference price copy across the landing page, pricing plans page, inline upsell modals, and Paddle checkout overlays.
* [ ] **Entitlement response:** Ensure the user's database plan updates immediately upon receiving webhooks.

---

### 2. User Experience (UX) Checklist

#### Information Hierarchy
* [ ] **Action priority:** Ensure the primary action card (Zone 1) and financial metrics (Zone 2) reside above the fold, keeping tutorials and checklists below.
* [ ] **Visual contrast:** Maintain high contrast between primary CTAs and secondary navigation tabs.

#### Cognitive Load
* [ ] **Starter simplicity:** Verify that Starter mode hides advanced CRM leads, multi-client spaces, and forecasting graphs.
* [ ] **Progressive disclosure:** Reveal advanced workflows only as the freelancer's business grows or when they trigger tier upgrades.

#### Onboarding & Restore Flow
* [ ] **Draft restoration:** Verify that guest drafts (`corvioz_pending_invoice` in local storage) are synced and restored post-signup, bypassing the activation checklist page.
* [ ] **Consolidated checklists:** Ensure onboarding tasks do not duplicate across activation screens and dashboard feeds.

#### Loading, Error, & Success States
* [ ] **Skeleton loaders:** Verify that data-fetching blocks display layout skeletons instead of blank containers.
* [ ] **Actionable error bounds:** Ensure network or database errors render helpful descriptions and retry actions rather than raw stack traces.
* [ ] **Aha! moments:** Verify that first PDF exports trigger value-added success toasts prompting portal link sharing.

---

### 3. User Interface (UI) Checklist

#### Typography Consistency
* [ ] **Font hierarchy:** Maintain Outfit/Inter heading and body sizes across all panels.
* [ ] **Text wrapping:** Verify that long client names or invoice item titles wrap correctly on small screens without breaking layout alignments.

#### Interaction Components
* [ ] **Button states:** Confirm that default, hover, focused, active, and disabled states operate smoothly on all buttons.
* [ ] **Icon clarity:** Verify that all sidebar and tab icons align with their text labels.
* [ ] **Responsiveness:** Test bento grids and layouts on desktop (1440px), tablet (768px), and mobile (375px) screens.

---

### 4. Engineering & SEO Checklist

#### Build & Performance
* [ ] **Clean compilation:** Verify `npm run build` completes with zero linting warnings or compilation errors.
* [ ] **Lighthouse metrics:** Target score: Performance > 90, Accessibility > 95, SEO > 100.
* [ ] **Zero hydration mismatches:** Ensure Next.js client-side rendering matches server-side HTML outputs.

#### SEO & Metadata
* [ ] **Dynamic titles:** Verify each route (e.g. `/invoice-generator`, `/pricing`) contains descriptive metadata and canonical tags.
* [ ] **Robots.txt security:** Confirm that `/robots.txt` excludes `/api/` and `/portal/` paths from crawler access to protect client privacy.

---

## Phase 2 — Production Score System

The Production Score System establishes a quantitative quality gate. Each category has a minimum score required for release eligibility.

```
┌────────────────────────────────────────────────────────────────────────┐
│                        PRODUCTION QUALITY INDEX                        │
├────────────────────────────────────────────────────────────────────────┤
│ Category             │ Current Score │ Target Score │ Release Gate     │
├──────────────────────┼───────────────┼──────────────┼──────────────────┤
│ 1. Workspace UX      │ 82            │ 95           │ Blocked 🔴       │
│ 2. Activation Flow   │ 60            │ 100          │ Blocked 🔴       │
│ 3. UI Consistency    │ 88            │ 92           │ Blocked 🔴       │
│ 4. Build & Perf      │ 91            │ 95           │ Blocked 🔴       │
│ 5. Accessibility     │ 85            │ 95           │ Blocked 🔴       │
│ 6. SEO & Metadata    │ 98            │ 100          │ Pass ✅          │
└──────────────────────┴───────────────┴──────────────┴──────────────────┘
```

---

### Category Score Dissection

#### 1. Workspace UX
* *Current Score:* 82/100
* *Target Score:* 95/100
* *Blocking Issues:*
  * Inverted information hierarchy (metrics below checklists on Starter tier).
  * Missing rule-based Business Health and AI Advisor widgets.
* *Suggested Improvements:* Restructure `DashboardOverview.js` to place metrics cards in Zone 1. Extract panels into modular zone files.

#### 2. Activation Flow
* *Current Score:* 60/100
* *Target Score:* 100/100
* *Blocking Issues:*
  * Unactivated users stuck in redirect loops due to middleware overrides.
  * Guest drafts fail to restore, directing users to activation checks instead.
* *Suggested Improvements:* Set a session cookie to bypass redirects upon skipping activation, and insert a draft restoration hook in `/auth` routing.

#### 3. UI Consistency
* *Current Score:* 88/100
* *Target Score:* 92/100
* *Blocking Issues:*
  * Missing visual templates in client, invoice, and quote empty states.
  * Sidebar label misalignments across different responsive viewports.
* *Suggested Improvements:* Rebuild empty states using the Goal-Action-Safety template.

#### 4. Build & Performance
* *Current Score:* 91/100
* *Target Score:* 95/100
* *Blocking Issues:*
  * Large bundle size due to monolithic `Dashboard.js` file (328KB).
* *Suggested Improvements:* Split unified dashboard files into modular component files.

#### 5. Accessibility
* *Current Score:* 85/100
* *Target Score:* 95/100
* *Blocking Issues:*
  * Insufficient color contrast on secondary links and status badges.
  * Missing aria-labels on icon-only buttons.
* *Suggested Improvements:* Review and update badge contrast colors. Add descriptors to utility buttons.

---

## Phase 3 — Sprint Audit Template

This audit report must be filled out by the developer or automated CI/CD pipeline after every development sprint.

```markdown
# Corvioz Sprint Audit Report

## 1. General Overview
* **Sprint Name / Identifier:** [e.g. Workspace Sprint 1.5]
* **Target Release Date:** [YYYY-MM-DD]
* **Auditor Name:** [Name / Role]

## 2. Changes Introduced
* **Summary of Changes:** [Provide bullet points of features or refactors]
* **Files Modified:** [List file names and path links]

## 3. Impact Assessment
* **Business Impact:** [Describe how this improves activation, retention, or conversion]
* **UX Impact:** [Describe changes to user pathways, cognitive load, and hierarchy]
* **Conversion Impact:** [How does this impact pricing screens, checkouts, or upsells?]

## 4. Risk Analysis & Regressions
* **Identified Risks:** [State any potential issues or dependency blocks]
* **Regression Checks Completed:** [List pages verified to ensure existing features remain unbroken]

## 5. Production Readiness Status
* **Checklist Completion:** [Pass / Fail / Warnings]
* **Performance Scores:** [Lighthouse Metrics - Perf, A11y, SEO]
* **Release Verdict:** [APPROVED FOR STAGING / BLOCKED]

## 6. Manual Testing Log
| Test Case | Description | Expected Outcome | Actual Outcome | Status |
| :--- | :--- | :--- | :--- | :--- |
| [TC01] | [Test description] | [Expected behavior] | [Observed behavior] | [PASS/FAIL] |
```

---

## Phase 4 — Release Gate Rules

No deployment to production can occur if any of the following Release Gate rules are violated.

```
                  STAGING RELEASE SEVERITY GATE
                  
  [Critical Blockers Exist] ──────────────────────> ❌ DEPLOYMENT BLOCKED
  [High / Medium Bugs Present] ───────────────────> ⚠️ CONDITIONAL HOLD
  [All Gates Green] ──────────────────────────────> ✅ RELEASE APPROVED
```

### 1. Release Blocker Criteria (Critical Severity)
* **Redirect loops:** Any scenario where a user is redirected repeatedly between routing paths.
* **Authentication or Restoration failures:** Any issue that prevents users from registering, logging in, or restoring guest drafts.
* **Incomplete billing flows:** Any bug that prevents quote approval, invoice generation, PDF exports, or payment collections.
* **Build failures:** Any Next.js compilation errors, TypeScript schema check failures, or console errors on page load.

### 2. High Severity Hold Criteria (Staging Only)
* **Lighthouse drop:** Any performance or accessibility score drop below 90.
* **Broken responsiveness:** Layout shifts or overlapping text on viewports under 768px.
* **Pricing display discrepancies:** Any difference in price representations across checkout overlays and marketing pages.

---

## Phase 5 — Permanent Quality Standards

These standards establish the minimum acceptance criteria for each product module.

---

### 1. Activation Flow
* **Acceptance Criteria:**
  * Unactivated users must reach `/dashboard/activation` within 1 second of logging in.
  * Clicking "Skip" must route users to `/dashboard` in under 500ms.
  * The session cookie `corvioz_activation_skipped` must be set with `SameSite=Strict` and a maximum lifetime of 1 hour.

### 2. Workspace
* **Acceptance Criteria:**
  * Initial page load for `/dashboard` must complete in under 1.5 seconds.
  * The primary action block (Zone 1) must be visible above the fold on all device viewports.
  * Changing workspace tabs must use Next.js shallow routing to maintain page state.

### 3. Invoices
* **Acceptance Criteria:**
  * Building an invoice from a blank state must require fewer than 4 input steps.
  * PDF exports must download in under 3 seconds.
  * Tax and discount calculations must update immediately when line items change.

### 4. Client Portal
* **Acceptance Criteria:**
  * The portal page (`/portal/doc/[id]`) must load in under 1 second.
  * portal token verification must use secure SHA-256 hash comparison.
  * All editing tools must be locked for portal visitors.

### 5. SEO & Metadata
* **Acceptance Criteria:**
  * Every page must contain a single `<h1>` tag matching the metadata title.
  * Canonical tags must point to public production URLs (`https://corvioz.com/...`).
  * Sitemap and robot settings must exclude internal `/api/` and client `/portal/` subroutes.

---

## Phase 6 — Production Dashboard Design

The QA Dashboard provides a real-time visualization of release readiness.

```
+-----------------------------------------------------------------------+
|                       CORVIOZ QA AUDIT CORE                           |
|                                                                       |
|  [ OVERALL READY INDEX: 84 / 100 ]            STATUS: BLOCKED         |
+-----------------------------------------------------------------------+
|                                                                       |
|   PRODUCT PERFORMANCE:                        USER EXPERIENCE (UX):   |
|   - Activation: 60 / 100 [Bugs]               - Hierarchy: 85 / 100   |
|   - Billing: 95 / 100    [Pass]               - Load Speed: 91 / 100  |
|   - CRM Leads: 90 / 100  [Pass]               - Onboarding: 80 / 100  |
|                                                                       |
|   LIGHTHOUSE INDEX:                           MOBILE / VISUALS:       |
|   - Performance: 91 / 100                     - Mobile Score: 88 / 100|
|   - Accessibility: 85 / 100                   - Font Sync: 95 / 100   |
|   - SEO & Meta: 98 / 100                      - Contrast: 85 / 100    |
|                                                                       |
+-----------------------------------------------------------------------+
|   [!] P0 BLOCKERS DETECTED:                                           |
|   1. Middleware redirection loop (Skip button broken).                |
|   2. Guest draft restoration failure post-auth.                       |
+-----------------------------------------------------------------------+
```

### Dashboard Metrics Description
* **Overall Ready Index:** Weighted average of all scores. Release requires a minimum score of 95.
* **Product Performance:** Individual metrics for the activation flow, invoicing, and CRM pipelines.
* **Lighthouse Index:** Performance, accessibility, and SEO scores.
* **User Experience (UX):** Ratings for navigation flow, loading states, and onboarding steps.
* **Mobile / Visuals:** Measures responsive layout behavior and contrast compliance.
* **Blocker Alerts:** Automatically flags any active P0 blockers that prevent staging release.
