# Recent Documents determinism

`buildRecentDocuments` sorts by timestamp descending and then by an explicit `type:id:number` tie-breaker. The test reverses source array insertion order for identical timestamps and receives the same order: `invoice:i-a`, `invoice:i-z`, `quote:q-a`, `quote:q-z`.

RECENT_DOCUMENT_EQUAL_TIMESTAMP_DETERMINISM=PASS
