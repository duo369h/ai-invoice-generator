# Quote Client Document Workspace Design

**Gate:** R56E-F-S4B  
**Baseline:** `140c8c77f7ea5d471275b6297f8ac8382c63b8df`

## Goal

Turn Quote creation/editing into a photographer-first business editor paired with a live client-facing document canvas while preserving the existing Quote state, persistence contract, totals semantics, export entitlement, and workflow sections.

## Architecture

`Dashboard.js` remains the state and workflow authority. A focused `QuoteClientDocument` presentation component receives the current Quote state, user identity, formatted money function, and a shared pure totals result. Dashboard renders two instances of that component: one visible in the responsive canvas and one hidden at `id="printable-quote"`; the markup is maintained in only that component.

The desktop editor uses a dedicated Quote workspace grid at `min-width: 1180px`, with a controlled editor column and a centered, scroll-contained document canvas. At `768px–1179px`, the workspace becomes an explicit Edit/Preview mode switch with Edit as the default. Below `768px`, it is a single-column editor with the same explicit Preview mode. Mode changes are local UI state only and never invoke persistence or status transitions.

## Data flow and totals

The existing `q*` React state remains the single source of truth. The shared totals helper calculates subtotal, discount, discounted subtotal, tax, and total using the existing arithmetic and no rounding, currency, or stored-value changes. The editor summary and both document instances consume the same result. Client-facing content remains limited to quote identity, date/status, client/from details, line items, totals, and Quote Notes; internal Scope and future budget fields are not exposed.

## Visual direction

Use a restrained editorial document treatment: warm workspace background, white portrait paper, quiet rules, readable typographic hierarchy, and sparse metadata. The canvas should feel like a client document rather than a Dashboard card. No final brand-polish, new template semantics, or action controls inside the paper are included.

## Verification

The S4B regression test proves shared component bindings, one document markup authority, canonical `794px` export width, preserved S4A sections, no persistence/API/schema changes, English date/currency boundaries, and absence of unauthorized surfaces. Browser evidence covers 1280/1440 desktop, 768 Edit/Preview, 390 Edit/Preview, zh-CN English UI, live unsaved updates, view-mode preservation, and page-overflow checks. Existing R1/R2/S4A/S3/S2/S1, full suite, build, and diff checks remain required.

## Scope boundary

No database or Supabase work, API changes, new endpoint, persistence shape change, Invoice redesign, auth/billing/quota/analytics change, Production deployment, release-branch mutation, S4C/S4D workflow, portal, approval, project/job entity, generic AI chat, or pricing recommendation is part of this design.
