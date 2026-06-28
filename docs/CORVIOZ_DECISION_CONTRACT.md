# Corvioz Decision Contract

> **Institutional reference for system architecture compliance.**

---

## RULE 1 — Single Source of Truth

There is only one decision maker in the system:

```
CORVIOZ_DECISION_KERNEL
```

No other module may classify risk levels, assign monetization modes, or determine dashboard rendering state. All such logic must live in the Kernel.

---

## RULE 2 — Growth Layer Is NOT a Router

The Growth Layer (`GROWTH_ENTRY_LAYER.ts`) is a **signal layer only**.

✅ Allowed:
- Output `intentScore` (0.0 – 1.0)
- Output `isColdStart` boolean
- Output `suggestedAction` hint

❌ Forbidden:
- Return route strings
- Perform redirects
- Make access control decisions
- Determine subscription or billing state

---

## RULE 3 — Middleware Is NOT a Decision Maker

Middleware (`middleware.js`) is an **executor only**.

✅ Allowed:
- Call `getNextRoute(userState)`
- Execute the redirect returned by the Orchestrator
- Attach security headers

❌ Forbidden:
- Contain `if/else` business logic
- Import Growth Layer directly
- Import Kernel directly
- Evaluate user subscription or billing state

---

## RULE 4 — Orchestrator Is the ONLY Runtime Router

The Orchestrator (`CORVIOZ_ORCHESTRATOR.ts`) is the **sole entity** that combines signals and decisions to produce a final route.

```typescript
export function getNextRoute(userState): OrchestratorResult
```

**Call order** (strictly enforced):
1. Growth Signals are computed
2. Kernel decision is computed
3. Orchestrator combines both and emits a single route
4. Middleware executes that route

---

## System Diagram

```
UserState
   │
   ├──→  Growth Layer (signals: intent score, cold start flag)
   │
   └──→  Kernel (revenue decision: risk, mode, paywall)
                │
                ▼
          Orchestrator  ← ONLY routing authority
                │
                ▼
          Middleware (executes redirect)
                │
                ▼
          UI Layer (renders kernel output only)
```

---

## Former Systems (Wrapper-Only, Not Authoritative)

| System | Status | Role |
|--------|--------|------|
| `LAUNCH_CONTROL_CENTER.ts` | Deprecated wrapper | Proxies to Kernel |
| `MONETIZATION_AUTOPILOT.ts` | Deprecated wrapper | Proxies to Kernel |
| `REVENUE_CAUSALITY_ENGINE.ts` | Deprecated wrapper | Proxies to Kernel |
| `ENTRY_REVENUE_RESOLVER.ts` | Deprecated wrapper | Proxies to Kernel |
| `ENTRY_AUTHORITY.ts` | Deprecated wrapper | Proxies to Kernel |

---

## CI Enforcement

These constraints are automatically validated at CI time via:

```bash
node scripts/validate-launch-system.ts
```

Any violation causes the CI gate to fail with a module-level error report.
