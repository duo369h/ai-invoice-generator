# CORVIOZ R56B2A — Immutable Creation Quota and DB Privilege Closure

R56B2A closes the combined Quote + Invoice creation quota around the existing `public.document_usage_events` ledger. Creation events are written in the same transaction as the document insert; deleting a Quote or Invoice does not delete its event and therefore cannot restore capacity.

Result: PASS for source authority, privilege closure, sequential Sandbox runtime, delete-bypass behavior, concurrent 99→100 contention, regression, lint, and build. Production database mutation and deployment were both NONE. DeepSeek calls were 0. The shared dirty checkout was not mutated.

R56C remains explicitly out of scope.
