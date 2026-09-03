# Runtime Separation

This package is documentation-only.

Checks and boundaries:

- No file under `src/` imports `docs/product-knowledge/`.
- The research document is not bundled into production JavaScript.
- No API endpoint, database table, migration, embedding, vector database, or RAG system is added.
- No provider, database, environment, or deployment action is part of this branch.
- Any future implementation requires a separate authorized decision and must preserve the knowledge authority boundary.
