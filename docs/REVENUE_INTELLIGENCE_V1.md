# Revenue Intelligence v1

> **From Observation → Strategy → UI Behavior Driving**
> **Architecture Stabilization Edition**

---

## Core Principle

> **Revenue Intelligence influences behavior, NOT routing.**
> **Revenue Intelligence is NOT a UI provider. It is a signal generator only.**
> **All UI interpretation must go through the Adapter Layer.**

---

## System Architecture

```
UserState
   │
   ├──→  Growth Layer         → GrowthSignals (intent, cold start)
   │
   ├──→  Kernel               → CorviozDecision (routing authority)
   │
   └──→  Revenue Engine       → RevenueIntelligence (raw signals)
              │
              ▼
         Strategy Adapter Layer   ← CRITICAL BOUNDARY (new in Stabilization)
         (adaptRevenueToUI)
              │
              ▼
         UI Hints (revenueUI)     ← frozen, precomputed
              │
              ▼
         Interpretation Engine    (merges all signals → SystemView)
              │
              ▼
         Orchestrator             (pure composer → route + systemView)
              │
              ▼
         Middleware               (HTTP executor)
              │
              ▼
         UI Rendering             (reads ONLY systemView.uiHints.revenueUI)
```

---

## Layer Contracts

### Revenue Intelligence Engine — Raw Signal Generator
**File**: `src/core/revenue/REVENUE_INTELLIGENCE_ENGINE.ts`

> ⚠️ **Interface Frozen** — do not add fields directly. All new UI-facing fields must go through `REVENUE_ADAPTER_LAYER.ts`.

**Outputs**:

| Field | Type | Description |
|-------|------|-------------|
| `revenueProbability` | `number` | 0.0–1.0 conversion likelihood |
| `revenueStrategy` | `ACQUIRE \| CONVERT \| MONETIZE \| EXPAND` | Funnel stage |
| `funnelBottleneck` | `TRAFFIC \| CONVERSION \| PAYMENT \| RETENTION \| NONE` | Where user is stuck |
| `pricingSuggestion` | `$9 \| $19 \| $29` | Tier appropriate for segment |
| `userSegment` | `ACTIVE \| INTENT \| PROPOSAL_CREATED \| UNKNOWN` | Behavioral class |

**Strategy Mapping**:

| Probability | Strategy |
|-------------|----------|
| < 0.3 | ACQUIRE |
| 0.3 – 0.59 | CONVERT |
| 0.6 – 0.79 | MONETIZE |
| ≥ 0.8 | EXPAND |

---

### Strategy Adapter Layer — Critical Boundary
**File**: `src/core/revenue/REVENUE_ADAPTER_LAYER.ts`

This is the **only** place that reads raw `RevenueIntelligence` fields and converts them to UI-safe values.

**Output** (`RevenueUIAdapter`):

| Field | Description |
|-------|-------------|
| `badge.label` | Human-readable stage label |
| `badge.color` | Display color |
| `cta.label` | Button text |
| `cta.href` | Destination URL |
| `insight.headline` | Primary message |
| `insight.subtext` | Supporting message |
| `pricingTag.price` | Formatted price string |
| `pricingTag.description` | Tier description |

---

### Revenue Freeze Mode
**File**: `src/core/revenue/REVENUE_FREEZE_MODE.ts`

Structural lock preventing future versions from breaking boundaries:

```typescript
export const REVENUE_FREEZE = {
  allowNewFields: false,        // Add fields via Adapter only
  allowDirectUIAccess: false,   // UI reads revenueUI only
  allowCIBusinessRules: false,  // CI validates structure, not business logic
}
```

---

## Strict Boundary Contract

### Revenue Intelligence v1 CAN:
- Generate raw revenue signals from user state
- Be consumed by the Adapter Layer
- Be passed as-is through `SystemView.revenueIntelligence` for debugging

### Revenue Intelligence v1 CANNOT:
- Be read directly by UI components
- Modify Kernel routing decisions
- Override Orchestrator route output
- Bypass the Interpretation Engine
- Have its interface extended without going through the Adapter Layer

---

## CI Enforcement (Structural Only)

```bash
node scripts/validate-launch-system.ts
```

> CI is a **structure validator**, not a business rule engine.

| Check | What It Validates |
|-------|------------------|
| `revenueStrategy` in valid set | Enum exists and is one of 4 values |
| `funnelBottleneck` in valid set | Enum exists and is one of 5 values |
| `pricingSuggestion` in valid set | Price is one of `$9`, `$19`, `$29` |
| `uiHints.revenueUI` shape | `badge`, `cta`, `insight`, `pricingTag` all present |
| UI raw field access | UI files must not contain `.revenueStrategy` etc. |
| Adapter Layer exists | `adaptRevenueToUI` must be exported |
| Kernel isolation | Kernel must not import Revenue Intelligence or Adapter |
| Orchestrator purity | No re-computation of revenue in Orchestrator |
