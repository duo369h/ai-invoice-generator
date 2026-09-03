# Draft Invoice Payment Authority

derivePaymentProgressState first projects eligible invoices by excluding rows whose workflow status is exactly draft. Only eligible rows are passed to resolveInvoicePaymentReadModel and only eligible rows contribute to invoiceCount, currency groups, paid amount, outstanding amount, or needs-payment count.

This is a non-mutating read-model projection. A malformed Draft Invoice containing payment_status=unpaid and amount_due_cents remains unchanged and contributes zero.
