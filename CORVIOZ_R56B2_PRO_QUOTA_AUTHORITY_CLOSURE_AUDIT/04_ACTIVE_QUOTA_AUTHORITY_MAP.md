# Active Quota Authority Map

`ACTIVE_QUOTA_RPC_AUTHORITY` is `public.get_user_active_document_cycle`, `public.check_and_create_quote`, and `public.check_and_create_invoice` in the current pricing/quota migration chain. Runtime routes call `createQuoteWithAtomicQuota` and `createInvoiceWithAtomicQuota`, which invoke the matching atomic RPC; approved Quote→Invoice conversion invokes the approved conversion RPC, which reaches `check_and_create_invoice`.

`get_user_active_document_cycle` is the database plan/cycle authority. R56B2 makes its current plan outputs Free=5, Starter=30, Pro=100. The atomic RPCs retain ownership checks, payment-neutral insert behavior, combined row count, and `pg_advisory_xact_lock(hashtext(p_user_id::text))`.

`LEGACY_QUOTA_FUNCTIONS=create_document_with_usage`: retained historical function, not invoked by current Quote/Invoice route source and not used as a fallback.
