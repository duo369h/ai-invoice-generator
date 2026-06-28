# Revenue OS v5 — Product Model

> **"From infra correctness system → revenue product system"**
> **Focusing on SaaS product experience rather than multi-layered execution governance.**

---

## Core Principle

No runtime verification, consistency checking, or truth locking mechanism is allowed to influence or override UI rendering. The UI must trust runtime product signals directly from the Revenue Engine and Adapter.

---

## System Model

```
UserState
   │
   ▼
Kernel (decision authority — routing only)
   │
   ▼
Orchestrator (pass-through route composer)
   │
   ▼
Revenue Engine (ONLY source of business intelligence / raw signals)
   │
   ▼
Adapter Layer (UI translation + semantic safety check)
   │
   ▼
uiHints.revenueUI (frozen precomputed hints)
   │
   ▼
UI Renderer (pure display — renders Revenue Focus Card)
```

---

## Core Boundary & Rules

1. **Revenue Engine as Truth**: The Revenue Engine (`REVENUE_INTELLIGENCE_ENGINE.ts`) is the single source of truth for business intelligence, probability scoring, strategy planning, and suggested pricing.
2. **Adapter Layer**: The Adapter Layer (`REVENUE_ADAPTER_LAYER.ts`) converts raw signals to client-safe representation and validates them semantically. It never affects routing or triggers structural locks.
3. **No Runtime Verification Influence**: Consistency, snapshots, and governance loops are fully decoupled from the active UI rendering path.
4. **CI as Build-time Guardrail**: CI checking is confined to schema checks, type safety, forbidden imports, and kernel boundary validation. It does not simulate runtime states or enforce pricing/CTA rules on compilation.
