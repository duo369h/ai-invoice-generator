# Revenue OS v6.8.3 — UI Control Plane Consolidation

## Core Principles

The UI control plane has been consolidated to adhere to three structural pillars:

1. **Single Entry Control Plane**: Every UI path must execute through `UI_CONTROL_PLANE.ts`. Implicit pipeline staging, hand-rolling in individual render components, or custom routing setups are strictly prohibited.
2. **Governance Unification**: Governance checking is unified into exactly one layer (`runGovernance` inside `UI_GOVERNOR_ENFORCER.ts`), outputting a uniform result schema:
   ```typescript
   {
     decision: "ALLOW | BLOCK | REWRITE",
     reason: string,
     overrides?: any
   }
   ```
3. **Renderer Purity**: `UI_GRAPH_COMPOSER.ts` functions as a pure layout renderer. It is forbidden from performing sorting, filtering, priority computation, or dynamic layout mutations of its own.

---

## Unified Execution Workflow

```
Signal
  │
  ▼
getDashboardUI()
  │
  ▼
UI_CONTROL_PLANE.execute(input)
  │
  ├─► Stage 1: Data Normalization
  ├─► Stage 2: Feedback telemetry logging (log-only)
  ├─► Stage 3: Intent resolution
  ├─► Stage 4: Mutation telemetry proposals
  ├─► Stage 5: Unified Governance Preflight check
  ├─► Stage 6: UI_EXECUTION_GUARD (Final Authority pre-render gate)
  │             (can rewrite intents, block mutations, override feedback)
  ▼
UI_GRAPH_COMPOSER.render(sections) (pure renderer)
```
