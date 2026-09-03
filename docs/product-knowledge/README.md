# Corvioz Product Knowledge

This directory stores durable, evidence-backed product knowledge so it survives conversation migration and remains retrievable by future engineering, product, and AI sessions.

Future agents must inspect [registry.json](./registry.json) before introducing new product assumptions. Original evidence documents are immutable, path-versioned artifacts; updates create a new version rather than rewriting an accepted source. Machine-readable `knowledge.json` manifests summarize retrieval metadata and authority boundaries. Each knowledge package has an Absorption Ledger that records what has entered the product and what remains deferred.

Product Knowledge is not implementation authority by default. A knowledge document may be accepted as a design input while still having `implementation_authority=NO` and `runtime_authority=NO`. Domain concepts are not automatically database entities, APIs, UI features, schema fields, embeddings, or RAG inputs.

The package under `photography/quote-production-intelligence/v0.1/` is a documentation-only design input. It must not be imported from `src/`, bundled into production JavaScript, or used to infer pricing, legal decisions, or runtime behavior without a separately authorized implementation decision.
