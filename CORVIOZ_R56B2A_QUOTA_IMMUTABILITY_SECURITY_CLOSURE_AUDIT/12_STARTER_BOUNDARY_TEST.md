# Starter boundary test

Sandbox runtime: create 30 Quotes, delete 1, attempt the 31st. Result: blocked, 30 immutable events remain, 29 business Quotes remain.

`STARTER_LIMIT=30` and `STARTER_DELETE_BYPASS=PASS`.
