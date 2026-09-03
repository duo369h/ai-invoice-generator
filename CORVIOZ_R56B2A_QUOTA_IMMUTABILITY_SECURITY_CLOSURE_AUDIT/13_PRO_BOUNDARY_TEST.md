# Pro boundary test

Sandbox runtime: create 99 Quotes, allow the 100th, reject the 101st. After deleting one business Quote, the next creation remains blocked; 100 immutable events remain and 99 Quotes remain.

`PRO_LIMIT=100`, `PRO_99_TO_100=PASS`, `PRO_100_TO_101=PASS`, and `PRO_DELETE_BYPASS=PASS`.
