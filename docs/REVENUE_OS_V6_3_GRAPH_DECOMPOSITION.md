# Revenue OS v6.3 — UI Graph Decomposition Layer

> **"UI Graph is NOT a data object"**
> **"UI Graph is NOT a computed model"**
> **"UI Graph is a render contract only"**

---

## Core Principle

The God Mapper of the UI Graph layer (`GET_DASHBOARD_UI.ts`) is decomposed into three distinct pipeline layers to enforce strict structural segregation:

1. **Aggregation Layer**: Normalizes raw input data into normalized records. Performs no business computation, ratios, win rates, or reductions.
2. **Derivation Layer**: Computes business metrics (e.g., winRate, overdue invoices, causality uplift). Outputs calculated figures but creates no UI layouts.
3. **Composition Layer**: Resolves final UI layout mapping and properties. Consumes derived calculations only and performs no inline computations.

---

## System Model

```
UserState / Raw Data
   │
   ▼
UI Data Aggregator (raw → normalized)
   │
   ▼
UI Business Derivation (computations & metrics)
   │
   ▼
UI Graph Composer (layout mapping only — no calculations)
   │
   ▼
UI Graph Contract (sections array contract)
   │
   ▼
DashboardOverview Renderer (renders sections via map)
```

---

## Decomposition Rules

### 1. Presentation Boundary
- **Aggregation**: Raw shaping only.
- **Derivation**: Computes metrics and scores.
- **Composition**: Layout only.

### 2. Forbidden Operations in Composer
- No winRate calculations inline.
- No overdue computations inline.
- No `.filter(` or `.reduce(` calls.

### 3. Forbidden Operations in Aggregator
- No ratio calculations.
- No scoring or ranking.
- No reductions or filters.

### 4. Dashboard Component Autonomy
- The main `DashboardOverview.js` has no direct component dependencies, conditional domain logic, or revenue state props. It loops over `ui.sections` and resolves layout cards dynamically.
