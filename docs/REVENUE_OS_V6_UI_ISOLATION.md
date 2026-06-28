# Revenue OS v6 — UI Graph Isolation Layer

> **"UI is no longer a consumer of systemView — only UI Graph"**
> **Enforcing strict boundary separation between system routing/governance and presentation.**

---

## Core Principle

To keep the UI presentation layer pure and isolated from backend orchestration, Kernel routing authorities, and raw system state representation, the UI is decoupled from `systemView`. It consumes ONLY the UI Graph, which acts as the single entry point.

---

## System Model

```
UserState
   │
   ▼
Kernel (decision only — routing only)
   │
   ▼
Orchestrator (routing composition only)
   │
   ▼
Revenue Engine (business truth)
   │
   ▼
Adapter (translates raw signals to UI-ready surfaces)
   │
   ▼
UI Graph (single entry selector: getDashboardUI)
   │
   ▼
UI Renderer (pure display — DashboardOverview)
```

---

## Isolation Rules

1. **No System View Destructuring**: UI components must never destructure or reference `systemView` anywhere.
2. **No Routing Orchestrator Dependency**: UI components are forbidden from importing or calling the Orchestrator (`CORVIOZ_ORCHESTRATOR.ts`).
3. **No Kernel Awareness**: UI components must not import, reference, or verify Kernel decisions (`CORVIOZ_DECISION_KERNEL.ts`). Kill switch active checks are mapped to `uiRevenue.metric.probability === 0`.
4. **Single UI Graph Entry**: UI components import and consume the dashboard state exclusively through `getDashboardUI()` defined in `GET_DASHBOARD_UI.ts`.

---

## CI Enforcement Gates

The build-time validation script enforces:
- If a Dashboard UI file contains the string `systemView`, compilation fails.
- If a Dashboard UI file references `orchestrator`, compilation fails.
- If a Dashboard UI file references `kernel`, compilation fails.
- Dashboard UI must import and consume `getDashboardUI`.
