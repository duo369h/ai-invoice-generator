# Atomic Invoice RPC

`check_and_create_invoice(UUID, JSONB)` now counts the same combined immutable ledger, retains the advisory lock and ownership validation, preserves payment-neutral initialization, inserts the Invoice, and inserts one immutable `invoice` event in the same transaction. Mixed Quote + Invoice Sandbox tests exercised the combined path.
