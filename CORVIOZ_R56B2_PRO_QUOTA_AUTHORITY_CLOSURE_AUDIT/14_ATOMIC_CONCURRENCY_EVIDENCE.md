# Atomic Concurrency Evidence

`ATOMIC_CONCURRENCY=STATIC_ONLY`.

The active Quote and Invoice SQL each retain `pg_advisory_xact_lock(hashtext(p_user_id::text))` before the combined count and insert. Existing atomic runtime suites passed. No local PostgreSQL concurrency run was available, so no dynamic concurrency claim is made.
