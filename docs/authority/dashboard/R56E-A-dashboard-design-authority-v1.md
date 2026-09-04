# R56E-A Dashboard Design Authority v1

Status: documentation/design authority only
Gate: R56E-A
Production authority: R56 `d65533c8b71a3ee137d26f596561fa98dfa20b09`
Accepted inputs: photography product knowledge R1 and Dashboard UI/UX knowledge R2
Implementation authority: NO
Runtime/schema/API authority: NO

This document is the canonical design authority for a future Dashboard implementation gate. It consolidates the frozen R56 product contract, the exact R56 source reality, accepted photography domain knowledge, and accepted Dashboard UI/UX knowledge. It does not authorize application edits, schema edits, deployment, or runtime behavior changes.

## Authority precedence

When an input disagrees with another input, apply this order:

1. Frozen R56 product/runtime contract.
2. Explicit current mainline product authority.
3. Accepted Dashboard UI/UX knowledge R2.
4. Accepted photography domain knowledge R1.
5. Exact implemented source reality at R56.
6. Older historical design ideas.

R1 and R2 are design inputs, not implementation or runtime authority. A design concept that is not persisted in R56 remains `DESIGN_CONCEPT_ONLY`.

## 1. Product role of Dashboard

Corvioz is a photographer-first, lightweight business workflow for independent photographers. The Dashboard is the focus layer for the photographer's active work. It is not a feature directory, analytics home, generic CRM, Project/Job system, or generic AI destination.

The Dashboard must answer, in order:

1. What needs my attention?
2. What should I do next?
3. What did I recently work on?

The product position is `SCOPE CLARITY BEFORE QUOTE` plus `STATE CLARITY AFTER QUOTE`. The long-term direction, `AI BUSINESS PRODUCER FOR PHOTOGRAPHERS`, is an internal direction and must not be inferred as homepage copy or autonomous behavior.

## 2. Dashboard interaction model

The interaction model is:

```text
Dashboard focus
  -> exact work object
  -> section-level business decision
  -> deterministic save/send/record action
  -> client output when needed
```
Use `WORK_OBJECT_OVER_PAGE_TITLE`, `STATUS_TO_NEXT_ACTION`, `ENTITY_FIRST_TO_ACTION_WORK_FIRST`, and `PROGRESSIVE_DISCLOSURE` together. A page title locates the user; the work object, state, and next action carry the visual weight.

The default surface is quiet and scannable. A row or section is flat at rest, gains a restrained interactive treatment when actionable, and exposes secondary actions only when needed. Critical actions must remain available to keyboard and touch users without hover.

## 3. Navigation hierarchy

### Current exact route/surface map

| Route or control | Current behavior | Authority disposition |
| --- | --- | --- |
| `/dashboard` | Renders `Dashboard` through a no-op `TierRouter`. | Keep as authenticated work shell. |
| `/dashboard?tool=quote` | Selects Quotes tab. | Keep exact work-object entry. |
| `/dashboard?tool=invoice` | Selects Invoices tab and may open invoice creation flow. | Keep exact work-object entry. |
| `/dashboard?tool=client` | Selects Clients tab. | Keep exact work-object entry. |
| `/dashboard?tool=profile` | Selects Public Profile tab. | Reframe as a low-frequency asset/configuration surface. |
| `/quotes`, `/invoices`, `/client` | Redirect to Dashboard query-tool routes. | Keep compatibility aliases; do not infer new page architecture. |
| Sidebar current primary items | Overview, Quotes, Invoices, Clients, Public Profile. | Keep the four high-frequency work items; move Public Profile below a divider. |
| Sidebar Settings button | Calls the `profile` tab change. | Conflict: Settings is not a distinct implementation surface yet. Treat future Settings IA as planned, not current behavior. |
| Account button | Opens a small menu with account email and Sign out. | Keep compact; future implementation must add click-away, Escape, and navigation-close behavior. |
| Code-only extra tabs | `leads`, `studio`, `portfolio`, `brand`, `reports`, `automation` are mapped or rendered in code but are not returned by current `getDashboardTabs`. | Do not elevate to primary nav. Classify as legacy/future-only until a separate product authority exists. |

### Target hierarchy

```text
Corvioz

Overview
Quotes
Invoices
Clients

---

Public Profile

--- bottom utility ---

Settings
Account
```

Client Portal is not a peer to internal Clients by default. A photographer should reach a client-facing view from the relevant Client/Quote/Invoice object. If a future global Portal manager is needed, it must list active private portals and their client/document context rather than jump to a public URL.

## 4. Dashboard Overview authority

### Primary purpose

The Overview is a focus surface for active document work, not a product inventory. It should make the next meaningful action obvious without requiring the user to inspect every feature.

### Current exact source reality

At R56 the Overview renders, in order, Quick Actions, Payments, document Usage, Needs Attention, Scope Snapshot, and Recent Documents. The surrounding Dashboard may also render activation guidance, first-revenue-loop content, Preview Mode messaging, draft restore, and upgrade/banner surfaces before the Overview. These are implementation facts, not a new product contract.

### Attention model

`Needs Attention` is the primary attention area. It is a deterministic projection from current Quotes and Invoices:

| Source state | Overview message | Primary action |
| --- | --- | --- |
| Draft Quote | Finish and send quote | Open Quote |
| Sent Quote | Awaiting client decision | Open Quote |
| Approved Quote | Ready to create invoice | Create Invoice |
| Past-due Invoice | Past-due balance | Open Invoice |
| Partial Invoice | Remaining balance | Open Invoice |
| Unpaid Invoice | Payment not recorded | Open Invoice |

Order by business urgency, then recency, with stable tie-breaking. The Overview may summarize these facts; it must not invent a Project/Job state or change Quote/Invoice authority.

### Next action model

Each actionable row has one dominant next action. The row itself is the primary entry affordance. A chevron or `Open` label may appear on hover/focus, but touch and keyboard must expose the same route. Avoid repeating a full button on every row when the row already opens the object.

### Recent work model

Recent Documents is a mixed, recency-sorted list of Quotes and Invoices. Each row shows document type, number, client, state, total where available, and an exact object-open action. It is not a second action queue and does not need every secondary operation.

### Document state model

Use the existing deterministic Quote status and Invoice payment read model. Display state together with the next meaningful action when the next action is known. Never flatten Invoice payment state into a generic status if a recorded payment read model is available. Multi-currency totals must not be summed into a false single amount.

### Client attention model

Client attention is represented through a document row or an exact Client context, not a new global Client health score. `Awaiting client decision` is acceptable when sourced from a sent Quote. Do not infer approval, feedback, project completion, or portal engagement without a current authoritative record.

### Payment attention model

Payment attention may show paid, outstanding, needs-payment count, partial, unpaid, and overdue states. It must remain a compact decision aid and preserve the existing payment status/recording authority. `Record Payment` changes a payment record; it is not a payment processor and must not be presented as one.

### Intelligence intervention model

The Overview may elevate a severe, actionable intelligence finding into Needs Attention only when it has a deterministic or accepted intelligence contract behind it. The default home experience must not contain a generic AI chatbot, floating assistant, or autonomous recommendation stream.

### Quick Create role

Quick Create is a lightweight escape hatch, not a permanent feature directory. Prefer one `+ New` affordance that reveals Create Quote and Create Invoice, with Create Client only if the user is already in a Client context. It must not outrank a real blocking work item.

### Secondary information

Payment summary, document usage, recent work, and lightweight metadata may appear below the primary attention area. Usage is an account-cycle counter, not a business success metric. Do not expose internal pricing logic or raw metadata on the Overview.

### What must not appear as primary cards

Do not make primary Overview cards for raw counts of Quotes/Invoices/Clients, speculative revenue analytics, generic AI, settings, a full feature list, a Scope Snapshot with no action, or long-term CRM/PM concepts. The Overview is not a dashboard-shaped settings page.

## 5. Work-object hierarchy

The current canonical work objects are Quote, Invoice, and Client. Quote remains the canonical business work object for future Quote Workspace design. `Business Workspace` is a visual interaction model, not a persistence entity.

```text
Overview focus
  -> Quote or Invoice exact object
      -> section/work decision
      -> internal detail
      -> Preview / client output

Client directory
  -> exact client context
      -> linked Quotes / Invoices
```

Do not create Project, Job, Task, Workspace, Proposal, or Portal approval entities in this gate.

## 6. Quote Business Workspace design authority

The Quote Workspace is a progressive-disclosure business workspace. It is not a long undifferentiated form and not an A4/page builder.

Target order:

```text
Scope -> Production -> Usage -> Pricing -> Terms -> Review -> Preview & Send
```

The current R56 source already has a photography workflow selector, Client/Quote Number/Currency fields, line items, notes, `photography_scope_v2`, Usage Rights, deterministic pre-send review, semantic findings, Save, Send Quote, and client-ready PDF actions. The future design reorganizes these responsibilities without changing their contracts.

The five business sections below define design intent. They do not authorize new fields. Any field not already persisted or explicitly authorized in a future implementation gate is `DESIGN_CONCEPT_ONLY`.

### Section contract matrix

| Section | Photographer question | Data shown | Data edited | Contextual AI intervention | Warning/validation role | Default visibility | Client output impact | Internal-only data |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Scope | What exactly am I promising? | Shoot context, coverage, deliverables, counts, format, deadline, assumptions, exclusions | Existing Quote scope fields and line items where authorized | Missing/unclear deliverables, quantity contradiction, date conflict | Prevent unclear or contradictory scope from silently reaching send | Open first; show compact summary after completion | Client-readable scope and deliverables | Raw brief interpretation, internal assumptions |
| Production | What must happen to deliver this? | Production context and dependencies that are supported by current data or future design input | Only fields with current persistence; dependency concepts are design-only until authorized | Missing production dependency or responsibility ambiguity | Prompt confirmation; never silently add crew/cost | Summary by default; details on demand | Only confirmed client-facing production commitments | Internal workload, cash-cost logic, dependency reasoning |
| Usage | Where, how, and for how long may the images be used? | Status, purpose, media/channels, territory, duration, exclusivity | Existing `usage_rights` fields; `unspecified`, `specified`, `not_applicable` | Usage ambiguity or specified-without-details | Require clarity before send when relevant; changing to not-applicable may require confirmation | Compact status; details when specified or flagged | Only client-approved usage wording | Personal pricing treatment, unresolved negotiation |
| Pricing | What is my price and why? | Existing Quote line items, totals, currency, tax/discount where authorized | Existing line items and pricing controls | Inconsistency against the photographer's own confirmed patterns; never market-rate authority | Preserve line-item math and explicit user choice | Summary plus expandable detail | Client grouping/detail chosen by the photographer | Internal cost, margin, concessions, workload; future-only unless persisted |
| Terms | What delivery and commercial boundaries are agreed? | Existing notes/payment/validity/delivery terms as available | Existing persisted fields only | Deliverable, revision, payment, or responsibility inconsistency | Explain and ask user to resolve; no autonomous legal decision | Compact summary; expand when editing | Selected client-facing terms | Internal negotiation notes and assumptions |

### Section behavior rules

- A section can be complete, incomplete, or needs attention; these are UI states, not new database states.
- A template guides Scope capture. It must not write prices, line items, or terms automatically.
- A client requirement and a Corvioz recommendation must be visually distinct.
- `BRIEF_IS_NOT_SCOPE`; quantify before a final Quote.
- Internal detail may be richer than client presentation. Do not force one universal client grouping.

## 7. Scope section authority

Current persisted authority is `photography_scope_v2` with the common keys `shoot_type`, `shoot_date`, `shoot_duration`, `primary_location`, `coverage_expectation`, `deliverables`, `final_image_count`, `retouched_image_count`, `delivery_format`, `usage_rights`, `delivery_deadline`, `exclusions`, and `assumptions`. Usage Rights is nested and normalized. Render only values present in the persisted allowlist projection.

Scope should lead with the smallest set of decisions needed to make a Quote understandable, then reveal additional fields. A blank or partially captured Scope is not permission to infer a Project/Job. `Scope Snapshot` on Overview remains secondary or future-only unless it becomes a direct actionable summary such as a count of Quotes needing clarification.

## 8. Production section authority

R1 establishes `REQUIREMENT -> DEPENDENCY -> COST` as a reasoning model. Production complexity includes coordination, technical, and operational complexity. A requirement such as talent, food production, or complex set work may imply dependencies, but the UI must not silently create crew, supplier, cash-cost, or staffing records.

Current R56 does not authorize a production-budget entity. Display current persisted scope/line-item facts and future dependency suggestions as `DESIGN_CONCEPT_ONLY` until a later implementation gate explicitly authorizes persistence. Production warnings are advisory and require the photographer's decision.

## 9. Usage/licensing section authority

Usage is a first-class business variable, but it does not have to be a separate price line item. Supported dimensions are purpose, media/channels, territory, license duration, exclusivity, and status. A base Quote may contain a finite usage scope, but one year or any other duration is not a global hard rule.

The UI must preserve the current safety behavior: `specified` without details is a high-severity pre-send finding; changing a populated Usage Rights section to `not_applicable` may require confirmation and clears details only after confirmation. Usage ambiguity should be resolved in the Quote Workspace, not hidden in PDF editing.

## 10. Pricing section authority

Quote line items and totals remain pricing authority in R56. Do not derive a new autonomous price from a domain concept, LLM output, market average, or an unverified rulebook. Personal pricing history may be a future input, but the user confirms the result.

The UI may distinguish photographer fee, production, usage, expenses, concessions, or grouping only where current data supports it or a future implementation gate authorizes it. `Internal Budget`, `Margin`, `Risk Buffer`, `Market Rate`, and `Verified Market Data` are design inputs only unless separately persisted and authorized.

## 11. Terms section authority

Terms clarify delivery, payment, validity, revisions, exclusions, assumptions, and responsibility boundaries. They must not become an autonomous legal decision engine. The user remains the decision maker and the current Quote/Invoice contract remains authoritative.

Terms shown to clients are a selected presentation of business data. Internal notes and assumptions stay internal unless intentionally mapped to client output by an authorized contract.

## 12. Invoice workspace authority

Invoices remain a separate canonical work object. Current R56 supports list, create/edit, Preview, Send Document, payment terms, payment link, recorded payment, payment states, and read-only treatment after recorded payment. The visual hierarchy should be:

```text
Invoice identity and state
  -> line items and amount
  -> payment terms / due state
  -> Preview
  -> Send / Record Payment / next state
```

Invoice UI must not inherit photography Scope as if every Invoice were a Quote. R56 intentionally has no Invoice photography Scope authority. Quote-to-Invoice conversion preserves the canonical relation; it does not create a Project/Job.

## 13. Payment/state presentation authority

Payment state is data truth, not a decorative badge. Use the existing read model for paid, partial, unpaid, overdue, and recorded payment. The Overview may summarize outstanding amounts per currency, but must not implicitly FX-convert or combine currencies.

`Record Payment` is a photographer-side state-recording action. It is not a payment processor, approval, or entitlement grant. A settled Invoice is read-only where the current contract requires it. Loading, stale, unavailable, and error states must say whether cached data is being shown.

## 14. Client surface authority

The Client surface answers: who is this client, and what is happening with this client now? Current R56 has a Client Directory with linked Quote/Invoice continuity, add-client fields, document expansion, Bill, and delete. Preserve canonical IDs and ownership-scoped document relations.

Do not add analytics-heavy Client cards, AI scores, Projects, Messages, or a client-value model as primary surface without separate authority. A future high-density Client view may add search/sort/recent activity, but these are implementation slices, not current persistence claims.

## 15. Preview/client-output authority

```text
Business data -> Quote/Invoice workspace -> Preview -> PDF / Client Portal / Send
```

Preview is the client-output layer, not the primary business editor. Internal costing, dependencies, personal pricing logic, unresolved scope gaps, and internal notes stay out of client output by default. Client output may show selected scope, deliverables, grouped or detailed pricing, usage, commercial terms, logo, and optional client-facing note when the current contract supports them.

Preview editing is intentionally limited to presentation controls. Do not edit fee authority, usage logic, production cost, deposit logic, or scope logic only inside an A4 surface. Preserve PDF plan boundaries: Free is branded; Starter and Pro are clean, as frozen in R56.

Client Portal is private output for a specific shared document/context. `PUBLIC_PROFILE != CLIENT_PORTAL`. Existing tokenized `/portal` routes remain compatibility/runtime surfaces; their semantics must not be replaced by a new global Portal entity in this gate.

## 16. Settings authority

Settings are low-frequency configuration and must not appear in daily work surfaces. Target IA is:

```text
Profile & Business
Branding
Documents & Defaults
Payments
Client Experience
Notifications
Integrations
Account & Security
Billing
```

`BUSINESS_PAYMENTS != CORVIOZ_BILLING`: photographer payment instructions and Corvioz subscription billing are different concerns. Current source routes the Settings control to the Public Profile tab and has no dedicated `/settings` page. This is a known implementation gap, not permission to implement it now.

## 17. Intelligence contextual intervention authority

AI is a contextual intervention, never a final business authority. Supported design contexts include:

| Context | Trigger | Input authority | AI role | User decision | Output location | Failure fallback | Autonomy limit |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Scope ambiguity | Missing/unclear deliverable, quantity, date, or contradiction | Current Quote, current `photography_scope_v2`, selected workflow | Explain the ambiguity and suggest what to confirm | Confirm/edit/dismiss | Local Scope finding; severe items may reach page-level Needs Attention | Keep deterministic review and user editing available | Never alter Scope or send |
| Usage ambiguity | Usage unspecified or specified without dimensions | Current Usage Rights fields and Quote context | Point out missing purpose/channel/territory/duration/exclusivity | Add, mark not applicable, or dismiss | Local Usage section | Show deterministic warning; no model required | Never choose a license or price |
| Production dependency | Requirement suggests a missing dependency | User-confirmed Scope and accepted domain rules | Surface a possible dependency and why | Confirm or ignore | Local Production section | Do not create a dependency record | Never add crew, supplier, or cost |
| Pricing inconsistency | Current Quote differs from photographer's own confirmed pattern | Current Quote plus confirmed personal history, if available | Compare and explain | Accept/edit/ignore | Local Pricing section | Show current line-item math | Never claim market rate or set final price |
| Deliverable conflict | Scope, notes, line items, or dates disagree | Current Quote business data | Explain evidence and proposed question | Resolve in workspace | Local Scope/Terms finding | Deterministic validation remains | Never rewrite client promise |
| Terms inconsistency | Delivery/revision/payment wording conflicts | Current persisted terms/notes | Highlight inconsistency | Edit/confirm | Local Terms section | Keep existing terms visible | Never provide legal decision |
| Payment attention | Invoice state needs follow-up | Invoice payment read model | Explain state and point to action | Open/record/follow up | Overview or Invoice state row | Use deterministic payment state | Never process or mark payment autonomously |

Each finding must be dismissible or actionable according to the existing review contract. LLM output is advisory and must fall back to deterministic behavior when unavailable.

## 18. Empty states

Empty states should point to one useful next action and explain what will become visible afterward.

- Overview: no documents -> Create Quote or Create Invoice; do not show a feature catalog.
- Needs Attention: no items -> say no Quotes or Invoices need attention.
- Recent Documents: no documents -> explain that created/saved documents appear here.
- Scope Snapshot: no Quote -> keep secondary; point to Create Quote, not a new entity.
- Quotes: create the first Quote using an optional workflow guide; line-item pricing remains user-owned.
- Invoices: create the first Invoice or convert an approved Quote where authorized.
- Clients: add a Client; do not imply a Project is created.
- Portal manager, if later authorized: show no active private links and explain the object path.

## 19. Loading, stale, and unavailable states

The UI must distinguish:

```text
loading       = no usable data yet; show progress
ready         = current data available
stale         = cached/previous data visible while refresh failed
unavailable   = no usable data and refresh failed
error         = action or surface cannot complete; offer bounded retry when safe
```

Current source already has stale handling for Needs Attention, Scope Snapshot, Client document continuity, Payment progress, and document usage. Preserve the wording pattern: state what is shown, whether it may be out of date, and the safe next action. Never render empty as if it were a successful zero when data is unavailable.

## 20. Error states

Errors must be local, actionable, and contract-preserving. A retry must re-fetch the current surface; it must not mutate data. Save/send errors must preserve the user's editable state. Payment errors must not change payment status optimistically. Preview/PDF errors must leave the business workspace accessible.

Do not turn a provider or intelligence failure into a fake success, and do not make a missing optional AI finding block Quote editing unless a deterministic product contract explicitly says so.

## 21. Responsive authority

### 320px

- Collapse the sidebar to an accessible compact control or a vertical navigation surface; never rely on hover.
- Keep one primary action per section; wrap or stack secondary actions.
- Quote and Invoice fields use one column; line-item tables may scroll horizontally within a bounded region.
- Keep document identity, status, and primary action visible without horizontal page overflow.
- Contextual AI findings appear inline below the relevant section.

### 375/390px

- Preserve the same hierarchy as 320px with slightly more room for row metadata.
- Rows may show type, object title, status, and amount; secondary actions remain in an accessible menu or object detail.
- Preview controls stack; client output remains readable at its own scroll boundary.

### 768px

- Sidebar may remain persistent if it does not compress the work area; otherwise use a controlled compact state.
- Quote sections can use a two-column layout only when labels and primary actions remain clear.
- Lists/tables retain scanability with bounded overflow; never shrink text until it becomes ambiguous.
- AI findings may sit alongside the active section but must not create a separate visual universe.

### 1280px+

- Use a comfortable max-width for the work area; do not stretch related row content to the viewport edges.
- Preserve whitespace around work, not inside a single object's identity/state/action relationship.
- A sticky Quote summary may exist, but it holds state and next action rather than every editor, AI panel, PDF control, and settings control.

Critical actions must be reachable by keyboard, focus-visible, and touch at all widths. Hover elevation is supplemental only.

## 22. Keyboard and direct-edit expectations

- Every actionable row has a real button/link target and visible focus state.
- Account menu: Account click opens/toggles, click-away closes, Escape closes, and navigation closes it.
- Section controls expose expanded/collapsed state with `aria-expanded` and an associated label.
- Do not require drag-and-drop to complete a core workflow.
- Direct editing happens in the business section that owns the data. Preview allows presentation-only edits.
- Save, Send, Record Payment, Cancel, and Exit actions must be keyboard operable and report busy/error/success states.

## 23. Primary and secondary action hierarchy

```text
Level 1: resolve the current blocker or advance the current work object
Level 2: state, amount, date, Scope summary, and safe review
Level 3: ordinary metadata and history
Level 4: settings, advanced configuration, and diagnostics
```

Primary actions include Open exact object, Create Invoice from approved Quote, Send Quote/Document, Record Payment, and the single relevant Create action. Secondary actions include Delete, Download again, Copy Link, and configuration. Secondary actions recede but remain available without hover-only access.

## 24. Progressive-disclosure rules

- Start with the photographer's current business question.
- Show a compact decision summary before detailed fields.
- Reveal detailed fields within the active section.
- Keep the complexity available; do not delete it merely to make the screen look simple.
- Do not expose internal-only fields in client Preview by default.
- Do not use a new page/entity to solve a hierarchy problem.
- Do not put Settings, Analytics, or generic AI into the active Quote editing path.

## 25. Attention-budget rules

Each surface gets a small attention budget. At most one primary blocker/action group should dominate a view. A new feature must first declare its attention level and the object/action it serves before it receives a card or navigation item.

Avoid persistent banners, stacked cards, repeated `Open` buttons, large empty gaps between an object and its action, and `Card -> Card -> Card` nesting. Quiet Workspace means flat by default, moderate density, few permanent shadows, restrained rounding, rows/lists where appropriate, and elevation only during interaction.

## 26. Visual hierarchy principles

- Work object > page title > metadata.
- Status must be legible but not louder than the action it governs.
- Use spacing, typography, dividers, background, and interaction to express hierarchy; do not use rounded containers for every level.
- Keep related information grouped.
- Use a fixed icon column and fixed label start in navigation.
- Interactive surfaces may lift slightly on hover/focus; static surfaces remain calm.
- Active editing uses a small accent bar, focus ring, or light tint rather than making every field equally active.
- Maximum useful surface nesting is approximately two levels.

## 27. Explicit Product non-goals

R56E-A does not authorize:

- Proposal, Portal, or Approval as marketed entitlements.
- Project, Job, Task, Workspace, CRM/PM, or Accounting suite entities.
- Gallery hosting, Marketplace, generic AI chatbot, autonomous pricing, or verified market-rate engine.
- Payment processor, implicit FX, quota changes, new billing semantics, or delete-restores-quota behavior.
- Full Dashboard rewrite, public website redesign, SEO/AEO/GEO, calendar/email/contracts/e-sign.
- Product UI, API, database, migration, CSS, route, package, test, or deployment work.

## 28. Data-model boundaries

The following are current or explicitly frozen boundaries:

| Concept | Boundary |
| --- | --- |
| Quote | Canonical business work object; line items and totals remain pricing authority. |
| Invoice | Canonical document/work object; payment state is read-model authority; no photography Scope projection is assumed. |
| Client | Core capability and canonical client record; linked document continuity uses canonical IDs. |
| `photography_scope_v2` | Persisted Quote metadata allowlist used for client-safe Scope projection; do not broaden silently. |
| Business Workspace | Visual concept only; not a database entity. |
| Project / Job / Task | Explicitly not canonical in R56E-A. |
| Internal Budget / dependencies / personal baseline | Accepted domain concepts/design inputs; `DESIGN_CONCEPT_ONLY` unless future persistence authority exists. |
| Client Preview / Portal | Output projection, not a second internal business model. |
| Usage Rights | First-class Quote business variable with normalized status and dimensions; not automatic autonomous licensing. |

## 29. Runtime contracts that UI may not violate

- Do not change Quote, Invoice, Client, quota, entitlement, payment, PDF, or authentication contracts.
- Do not expose raw metadata, internal notes, internal costing, or unsanitized Scope in client output.
- Do not sum mixed currencies or infer FX.
- Do not treat a Preview deployment or offline result as Production authority.
- Do not make a design recommendation final business truth.
- Do not send, approve, convert, record payment, or mutate data merely because an AI finding exists.
- Preserve exact-ID document opening, account-scoped state isolation, payment read-model states, settled Invoice read-only behavior, and existing portal token routes.
- UI changes must respect the repository's five-layer CSS system in a future implementation gate; R56E-A itself makes no CSS changes.

## 30. Implementation sequencing

Future work should begin with visible, bounded behavior and preserve existing contracts:

1. Overview attention and recent-work hierarchy.
2. Global visual discipline and navigation alignment.
3. Account/Settings/Client Portal semantics.
4. Quote Workspace progressive disclosure.
5. Preview/Send focus mode and limited presentation controls.
6. High-density and responsive validation.

The recommended first slice is defined in `R56E-A-implementation-slice-map-v1.md`. No slice is authorized by this document; a future implementation gate must explicitly select one slice and re-verify its source authority.

## Consolidated authority summary

```text
Dashboard = focus and next action
Quote = canonical business workspace
Invoice = document and payment-state workspace
Client = exact client context and linked document continuity
Preview = client output
Settings = low-frequency configuration
AI = contextual intervention
Business Workspace = visual concept, not entity
Complexity stays with Corvioz.
Focus stays with the photographer.
```
