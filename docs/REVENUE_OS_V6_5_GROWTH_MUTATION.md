# Revenue OS v6.5 — UI Growth Mutation Engine Integration

> **"UI is a growth optimization surface"**

---

## Core Principle

Applying runtime mutations to the UI sections mapping using the Growth Mutation Engine. In response to telemetry signals (e.g. conversion drop, high churn risk), the Growth Mutation Engine modifies section priorities, placement layout parameters, or hides/boosts components dynamically.

---

## System Model

```
Signals (leads, quotes, invoices, probability)
  │
  ▼
Runtime Decision Engine
  │
  ▼
Growth Mutation Engine (UI_GROWTH_MUTATION_ENGINE)
  │
  ▼
UI Graph (dynamic ordering / mutations)
  │
  ▼
Renderer (DashboardOverview loops & floats)
```

---

## Isolation boundaries

- **Scope**: `MUTATION_SCOPE = "UI_ONLY"`.
- **Prohibitions**:
  - No routing change allowed.
  - No kernel influence allowed.
  - No revenue engine mutations allowed.
  - Growth Mutation Engine is strictly prohibited from importing or depending on Kernel/Orchestrator classes.
