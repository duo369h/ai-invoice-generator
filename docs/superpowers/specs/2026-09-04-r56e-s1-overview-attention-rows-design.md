# R56E-S1 Overview Attention Rows Design

**Scope:** R56E-S1-OVERVIEW-ATTENTION-ROWS

This slice changes only the interaction hierarchy and responsive presentation of `Needs Attention` and `Recent Documents` in the Dashboard Overview. Existing deterministic builders, payment-state details, stale/error/empty branches, action names, payload shapes, routes, and document IDs remain authoritative.

Each actionable item becomes one semantic `button` row. Its accessible name remains the existing action label, while the visible row prioritizes document type, attention/state message, document number, client, and authoritative date/payment detail. The trailing arrow and action label are visual affordances only, so no nested interactive control is introduced. `Needs Attention` invokes `item.action` with `{ id: item.documentId, documentType: item.documentType }`. `Recent Documents` invokes `openQuotes` or `openInvoices` with `{ id: document.id, documentType }`.

CSS keeps the rows flat at rest with a subtle border/divider, restrained rounding, no permanent shadow, and hover/focus-visible treatment. The row button uses `width: 100%`, `min-width: 0`, `text-align: left`, and responsive wrapping/stacking so identity, state, and amounts remain usable at 320px, 390px, 768px, and 1280px without page-level horizontal overflow. Overview section order is unchanged; Quick Actions, Payments, Usage, Scope Snapshot, navigation, and Quote Workspace are out of scope.

Validation covers exact action payloads, Approved Quote to Create Invoice, semantic keyboard controls, absence of nested/repeated dominant buttons, preserved states, build/static checks, and real Dashboard screenshots at all four viewports.
