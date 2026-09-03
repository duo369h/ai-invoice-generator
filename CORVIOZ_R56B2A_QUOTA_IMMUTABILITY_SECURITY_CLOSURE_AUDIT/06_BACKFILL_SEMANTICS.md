# Backfill semantics

The forward migration backfills only existing Quote and Invoice rows whose `created_at` falls inside the currently applicable finite cycle returned by the authoritative cycle function. It uses the existing document UUID as idempotency key and `ON CONFLICT DO NOTHING` on the document uniqueness key.

No history outside the active cycle is invented and no existing event is reset. The Sandbox started with zero profiles/documents/events, so the applied candidate produced no backfill delta; the static migration proof covers the bounded current-cycle predicates and conflict behavior.
