# Mixed combined quota test

Sandbox runtime: create 60 Quotes and 39 Invoices, allow the 40th Invoice, delete one Quote, then reject the next Invoice. Result: 100 immutable events and 99 business documents remain.

`MIXED_COMBINED_QUOTA=PASS`.
