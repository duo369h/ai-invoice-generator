# Approved Quote Regression

The R56C action/state test remains passing. Approved Quote still emits createInvoiceFromQuote with the exact Quote ID, uses the canonical invoice-draft endpoint and server/RPC transition, opens the returned authoritative draft, and preserves existing-draft idempotency.
