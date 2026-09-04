# R56E-A Implementation Slice Map v1

Status: planning authority only
Gate: R56E-A
No slice in this document is authorized for implementation. A future gate must select one slice, re-verify the exact source SHA, and explicitly authorize the required file areas.

## Slice map

| Slice ID | Goal / user outcome | Surfaces | Allowed file areas | Data model change | Backend change | Runtime contract risk | Visual risk | Dependencies |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| R56E-S1-OVERVIEW-ATTENTION-ROWS | Photographer sees the most urgent Quote/Invoice work as compact, directly actionable rows. | Overview `Needs Attention`, Recent Documents | `src/app/dashboard/components/DashboardOverview.js`; `src/app/styles/components.css`; narrowly related Dashboard overview tests only if separately authorized | NO | NO | Preserve `buildNeedsAttention`, exact-ID open, payment states, stale/error modes | Medium: row density, focus, overflow | Exact R56 source; existing Wave 1 contracts |
| R56E-S2-OVERVIEW-FOCUS-ORDER | Overview answers attention, next action, and recent work without feature-directory scanning. | Overview, Quick Create, Payments, Usage, Scope Snapshot | Overview component/styles and narrowly scoped overview tests | NO | NO | Preserve usage/quota and payment authority; no new cards | Medium | R56E-S1; product copy authority |
| R56E-S3-NAVIGATION-ALIGNMENT | Sidebar hierarchy and visual alignment make high-frequency work primary and utility/configuration secondary. | Sidebar, Account menu | `src/components/dashboard/Dashboard.js`; dashboard CSS; bounded navigation tests | NO | NO | Preserve route aliases and active-tab mapping | Medium | Account interaction acceptance; current route contract |
| R56E-S4-ACCOUNT-MENU-CLOSURE | Account menu closes reliably via click-away, Escape, toggle, and navigation. | Dashboard Account menu | Dashboard shell and focused interaction test only | NO | NO | Preserve account/session/sign-out behavior | Low/Medium | S3 optional; keyboard test authority |
| R56E-S5-SETTINGS-IA-BOUNDARY | Photographer can distinguish profile assets, low-frequency settings, business payments, and Corvioz billing. | Settings/Profile/Account | Future settings route/components only after separate route authority | NO initially | NO initially | High if route or persistence is expanded | Medium | Product route decision; no current `/settings` authority |
| R56E-S6-CLIENT-PORTAL-SEMANTICS | Photographer enters the private client output for the right Client/Quote/Invoice context. | Client, portal entry, private portal routes | Client/Portal UI only; preserve token APIs | NO | NO | High: preserve `/portal/[token]`, `/portal/doc/[id]`, ownership and output sanitization | Medium | S3; authenticated portal evidence |
| R56E-S7-QUOTE-SECTION-SHELL | Quote editor exposes Scope, Production, Usage, Pricing, and Terms as a progressive-disclosure shell. | Quote create/edit | Quote component and dashboard CSS only; no schema/API files | NO | NO | High: preserve current Quote save/send payload and `photography_scope_v2` | High: largest visual change | S1/S2; exact Quote source contract |
| R56E-S8-QUOTE-SCOPE-CLARITY | Photographer resolves Scope gaps before sending without inventing domain entities. | Quote Scope section, pre-send review | Quote UI and existing deterministic review contract | NO | NO | High: no silent field loss or payload broadening | Medium/High | S7; current Scope normalization |
| R56E-S9-QUOTE-CONTEXTUAL-INTELLIGENCE | AI findings appear beside the relevant section and retain deterministic fallback. | Quote Scope/Production/Usage/Pricing/Terms | Existing review UI and contract only; no provider changes | NO | NO | Very high: no autonomous edits, price, legal, or send action | High | S7/S8; accepted intelligence contract |
| R56E-S10-PREVIEW-SEND-FOCUS | Client output receives visual focus while business authority remains in Quote/Invoice workspace. | Preview, PDF, Send | Preview/client-output components and styles only | NO | NO | High: preserve PDF entitlement and portal output | High | S7; PDF/runtime authority |
| R56E-S11-INVOICE-STATE-HIERARCHY | Invoice state, due amount, payment action, and Preview/Send path are immediately legible. | Invoice list/editor/flow | Invoice UI/styles only | NO | NO | High: preserve payment read model, idempotency, settled read-only | Medium | Existing payment contract; S1 |
| R56E-S12-CLIENT-DENSITY | Client Directory remains scannable at 50+ records with exact document continuity. | Clients | Client UI/styles and bounded test fixture only | NO | NO | High: preserve canonical IDs and ownership filtering | Medium/High | S6; high-density validation |
| R56E-S13-RESPONSIVE-CLOSURE | Core workflows remain usable at 320, 375/390, 768, and 1280+. | Overview, Quote, Invoice, Client, Preview | CSS/component surfaces covered by selected slice | NO | NO | Medium/High depending surface | High | Selected surface slice; viewport evidence |

## Slice contract details

### R56E-S1-OVERVIEW-ATTENTION-ROWS

**GOAL:** Make the photographer's next action visible in a compact list row.

**USER OUTCOME:** From Overview, a photographer can identify the highest-priority Quote/Invoice item and open the exact object without scanning a wide card or choosing among repeated buttons.

**SURFACES:** `Needs Attention`, `Recent Documents`, stale/error/empty variants.

**ALLOWED FILE AREAS:** Overview component, existing dashboard component styles, and a narrowly scoped regression test if a future gate permits test edits. No route, API, schema, migration, package, or provider files.

**DATA MODEL CHANGE=NO**
**BACKEND CHANGE=NO**

**RUNTIME CONTRACT RISK:** Medium. Preserve `buildNeedsAttention`, payment read-model status, mixed-currency handling, stale disclosure, retry behavior, and exact document IDs.

**VISUAL RISK:** Medium. The row must work at 320px and 1280px without spreading client/object/action relationships apart.

**DEPENDENCIES:** R56E authority document; `dashboardWave1.mjs`; current `DashboardOverview.js`; current Dashboard action handlers.

**ACCEPTANCE CRITERIA:**

- Urgent items remain ordered by deterministic business priority.
- A row opens the exact Quote or Invoice object.
- Keyboard focus and touch expose the same primary action as hover.
- Secondary actions do not dominate the row.
- Empty, loading, stale, and error states remain distinct.
- No new persistence field or route is introduced.
- 320px and 390px evidence shows no page-level horizontal overflow.

**DO_NOT_TOUCH:** Quote save/send payloads, Invoice payment state, Client continuity, Portal routes, quota/entitlement logic, AI provider/runtime, release branch.

## Recommended next slice

`NEXT_IMPLEMENTATION_SLICE=R56E-S1-OVERVIEW-ATTENTION-ROWS`

Why it comes first:

1. It materially improves the daily photographer question: “What needs my attention?”
2. It uses already-authoritative deterministic data and action handlers.
3. It has a bounded, visible surface and does not require new persistence.
4. It preserves the frozen Quote/Invoice/Client product contract.
5. It creates a reviewable foundation for later Overview ordering and responsive work.

Do not implement this slice in R56E-A. Select it only in R56E-B or another explicitly authorized implementation gate.
