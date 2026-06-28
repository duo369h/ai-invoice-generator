# Corvioz Signal Convergence Architecture

> **Single Narrative Engine — Institutional Architecture Reference**

---

## Core Principle

> **UI must never interpret system state.**
> **UI only renders SystemView.**
> **All intelligence must be precomputed.**

---

## System Diagram

```
UserState
   │
   ├──→  Growth Layer       → GrowthSignals (intentScore, isColdStart)
   │         [signal only]
   │
   └──→  Kernel             → CorviozDecision (risk, mode, paywall)
             [decision only]
                   │
                   ▼
         Interpretation Engine   ← SINGLE TRUTH MERGER
         (getSystemView)
              │         │
              │         └── uiHints (precomputed, frozen)
              │
              ▼
         Orchestrator      ← PURE COMPOSER (delegates to Engine)
         (getNextRoute)
              │
              ▼
         Middleware         ← HTTP EXECUTOR (executes redirect)
              │
              ▼
         UI Layer           ← RENDERS ONLY SystemView
```

---

## Layer Contracts

### Growth Layer — Signal Producer
**File**: `src/core/growth/GROWTH_ENTRY_LAYER.ts`

✅ Allowed:
- Output `intentScore` (0.0 – 1.0)
- Output `isColdStart` boolean
- Output `suggestedAction` enum hint

❌ Forbidden:
- Return route strings
- Import from Kernel
- Make access control decisions
- Perform redirects

---

### Kernel — Revenue Decision Engine
**File**: `src/core/kernel/CORVIOZ_DECISION_KERNEL.ts`

✅ Allowed:
- Classify `riskLevel` (LOW / MEDIUM / HIGH)
- Assign `revenueMode`, `monetizationMode`, `dashboardMode`
- Enforce kill switch
- Determine `paywallAllowed`

❌ Forbidden:
- Import from Growth Layer
- Return demo/onboarding routes
- Contain UI hint logic
- Know about routing

---

### Interpretation Engine — Single Truth Merger
**File**: `src/core/orchestrator/CORVIOZ_INTERPRETATION_ENGINE.ts`

✅ Responsibilities:
- Consume both Growth signals AND Kernel decision
- Compute final route
- Precompute all `UIHints` (frozen, immutable for UI)
- Expose `getSystemView(userState): SystemView`

❌ Forbidden:
- Being bypassed by UI
- Being bypassed by Orchestrator for routing logic
- Exposing partial state

---

### Orchestrator — Pure Composer
**File**: `src/core/orchestrator/CORVIOZ_ORCHESTRATOR.ts`

✅ Responsibilities:
- Call `getSystemView()` from Interpretation Engine
- Return `.route` from the SystemView
- Expose `getNextRoute(userState): OrchestratorResult`

❌ Forbidden:
- Contain routing logic
- Import Growth Layer directly
- Import Kernel directly
- Evaluate intent or risk scores

---

### Middleware — HTTP Executor
**File**: `middleware.js`

✅ Responsibilities:
- Call `getNextRoute(userState)` from Orchestrator
- Execute redirect if route differs from current pathname
- Attach security headers

❌ Forbidden:
- Contain business logic
- Import Growth Layer directly
- Import Kernel directly
- Evaluate subscription, billing, or intent state

---

### UI Layer — Render Only
**Files**: `src/app/**/*.js`, `src/app/**/*.tsx`

✅ Responsibilities:
- Call `getSystemView(userContext)` to receive `SystemView`
- Render based ONLY on `systemView.uiHints`
- Use `systemView.kernelDecision.dashboardMode` for layout switching

❌ Forbidden:
- Import `GROWTH_ENTRY_LAYER` or call `getGrowthSignals()`
- Import `CORVIOZ_DECISION_KERNEL` or call `getCorviozDecision()`
- Derive UI state from raw signals (leads, quotes, invoices counts)
- Implement conditional growth hint logic independently

---

## UIHints Schema
**File**: `src/core/ui/UI_HINT_SCHEMA.ts`

```typescript
type UIHints = {
  showDemoCard: boolean;       // Computed from: isColdStart && !killSwitch
  showUpgradeHint: boolean;    // Computed from: paywallAllowed && mode !== NONE
  showRevenueInsight: boolean; // Computed from: revenueMode is ENFORCED or TRACKING_ONLY
}
```

All hints are **precomputed** by the Interpretation Engine. UI renders them as-is.

---

## CI Enforcement

Architecture rules are enforced at CI time:

```bash
node scripts/validate-launch-system.ts
```

### Enforced Rules

| # | Rule | Failure |
|---|------|---------|
| 1 | Interpretation Engine returns correct routes | `ENTRY` |
| 2 | Interpretation Engine precomputes correct uiHints | `DASHBOARD` / `MONETIZATION` |
| 3 | Orchestrator delegates to Engine only | `ARCHITECTURE` |
| 4 | UI files do NOT import Growth Layer or Kernel | `ARCHITECTURE` |
| 5 | Middleware calls `getNextRoute` only | `ARCHITECTURE` |
| 6 | Kernel does NOT import Growth Layer | `ARCHITECTURE` |
| 7 | Growth Layer does NOT import Kernel | `ARCHITECTURE` |
| 8 | Growth Layer does NOT return route strings | `ARCHITECTURE` |
| 9 | Interpretation Engine imports both Growth + Kernel | `ARCHITECTURE` |

---

## Former Systems (Deprecated Wrappers Only)

| System | Status | Notes |
|--------|--------|-------|
| `LAUNCH_CONTROL_CENTER.ts` | Wrapper | Proxies to Kernel |
| `MONETIZATION_AUTOPILOT.ts` | Wrapper | Proxies to Kernel |
| `REVENUE_CAUSALITY_ENGINE.ts` | Wrapper | Proxies to Kernel |
| `ENTRY_REVENUE_RESOLVER.ts` | Wrapper | Proxies to Kernel |
| `ENTRY_AUTHORITY.ts` | Wrapper | Proxies to Kernel |
| `LAUNCH_CONTROL_SYSTEM.ts` | Legacy | Superseded by Kernel |
| `SAFE_MODE_CONTROLLER.ts` | Legacy | Superseded by kill switch in Kernel |
