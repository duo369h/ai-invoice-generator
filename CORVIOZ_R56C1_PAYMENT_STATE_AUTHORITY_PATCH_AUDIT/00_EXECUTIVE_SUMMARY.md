# CORVIOZ R56C-1 Payment State Authority + Stale Disclosure Patch

R56C-1 applies one narrow corrective patch on top of R56C. Draft Invoices are excluded from the payment-obligation summary, Invoice refresh failures are disclosed without discarding cached values, and quota refresh failures render Usage unavailable rather than an old value.

Payment persistence, idempotency, quota limits, database migrations, Production, R56D, Portal/Approval, photography, and Intelligence are outside scope and unchanged.

The final gate is recorded in 21_FINAL_GATE_RESULT.md and finalized with the exact commit SHA in the delivered ZIP.
