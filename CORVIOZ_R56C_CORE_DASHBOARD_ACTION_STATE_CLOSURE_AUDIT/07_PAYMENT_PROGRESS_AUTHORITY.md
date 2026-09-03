# Payment Progress Authority

derivePaymentProgressState resolves every Invoice through resolveInvoicePaymentReadModel, then derives paid amount, outstanding amount, and count needing payment from canonical payment_status, amount_paid_cents, and amount_due_cents.

The Overview renders an empty state, a single-currency compact summary, or separate currency groups. It never uses payment links, local row counts as payment truth, or client-side payment mutation.
