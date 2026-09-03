# Atomic Invoice Boundary

`src/app/api/invoices/route.js` reaches `createInvoiceWithAtomicQuota`, whose sole creation authority is `check_and_create_invoice`. Approved Quote conversion reaches the same Invoice RPC path. Ownership, payment-neutral initialization, advisory locking, and combined current-cycle count are preserved.

Boundary evidence: Invoice creation is tested symmetrically for Free, Starter, and Pro and the mixed Pro cases.
