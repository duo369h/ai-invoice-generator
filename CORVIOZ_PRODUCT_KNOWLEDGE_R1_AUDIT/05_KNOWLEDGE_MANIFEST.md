# Knowledge Manifest Audit

The manifest records all requested retrieval and authority metadata:

- identity: `id`, `version`, `title`, `language`
- status and authority: `status`, `knowledge_authority`, `implementation_authority`, `runtime_authority`, `current_mainline_impact`
- source: `source_document`, `source_sha256`, `created_at`
- evidence and consumers: `evidence_model`, `primary_consumers`, `future_consumers`
- boundaries: `core_principles`, `deferred_items`, `prohibited_assumptions`

The principles and design-direction identifiers remain knowledge identifiers. They are not imported as runtime constants.
