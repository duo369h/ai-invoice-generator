# Approved Quote Transition

Approved Quote attention rows emit createInvoiceFromQuote with the exact persisted Quote ID. The Dashboard handler resolves that ID from active Quotes and calls the existing POST /api/quotes/:id/invoice-draft route.

The route delegates to createInvoiceDraftFromApprovedQuote, which uses the existing create_invoice_draft_from_approved_quote RPC. The returned draft is opened; created=false is reported as an existing draft; the Dashboard refreshes after success; and network, stale, missing, or backend failures show an error without fake success.

Idempotency and duplicate prevention remain server/RPC authority.
