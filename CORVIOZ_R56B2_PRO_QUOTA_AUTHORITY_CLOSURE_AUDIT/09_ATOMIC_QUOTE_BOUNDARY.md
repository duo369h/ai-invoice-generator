# Atomic Quote Boundary

`src/app/api/quotes/route.js` reaches `createQuoteWithAtomicQuota`, whose sole creation authority is `check_and_create_quote`. No direct insert fallback was added. The database function continues to lock per user, count current-cycle Quotes plus Invoices, validate Client ownership, and insert the Quote atomically.

Boundary evidence: Free 4 allowed/5 blocked; Starter 29 allowed/30 blocked; Pro 99 allowed/100 blocked.
