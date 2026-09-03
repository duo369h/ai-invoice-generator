# Validation

Validation is local and deterministic.

| Check | Command / evidence | Result |
|---|---|---|
| Registry and source integrity | `node scripts/check-product-knowledge-registry.mjs` | PASS after final run |
| Source byte equality | `cmp` and SHA-256 | PASS after final run |
| Runtime separation | `rg -n "docs/product-knowledge|Corvioz_Quote_Production_Intelligence" src` plus diff review | PASS after final run |
| Scope of changes | `git diff --name-only HEAD` | Documentation/audit/validator paths only |
| No database/provider/deploy | Audit scope and command log | None performed |

No network, database, environment, provider, or deployment call is required for local validation.
