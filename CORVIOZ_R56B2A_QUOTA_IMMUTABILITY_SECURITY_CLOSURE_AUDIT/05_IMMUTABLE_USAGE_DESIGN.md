# Immutable usage design

For finite Free=5, Starter=30, and Pro=100 cycles, each atomic RPC takes the existing user advisory transaction lock, resolves the database cycle and limit, counts only matching immutable ledger events, rejects at the limit, validates ownership, inserts the business document, and inserts exactly one document-linked usage event before returning.

The event uses the new document UUID as both `document_id` and deterministic `idempotency_key`. `ON CONFLICT` is scoped to the document uniqueness key; an unexpected no-event result raises an integrity error. Any event-write failure aborts the transaction and rolls back the document insert.
