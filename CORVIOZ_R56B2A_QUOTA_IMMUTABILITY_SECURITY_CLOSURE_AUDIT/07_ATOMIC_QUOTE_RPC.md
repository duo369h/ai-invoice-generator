# Atomic Quote RPC

`check_and_create_quote(UUID, JSONB)` now counts `document_usage_events`, retains the advisory lock and ownership validation, inserts the Quote, and inserts one immutable `quote` event in the same transaction. The Sandbox Free, Starter, Pro, and concurrent tests exercised this path.
