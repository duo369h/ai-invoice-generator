# Concurrency runtime evidence

Two independent Sandbox SQL sessions concurrently called `check_and_create_quote` for a Pro user seeded at 99 immutable events. Exactly one call succeeded and one returned `QUOTA_EXCEEDED`; final state was 100 events and 1 newly inserted Quote. This is the required advisory-lock serialization at the 99→100 boundary.

`ATOMIC_CONCURRENCY=PASS`.
