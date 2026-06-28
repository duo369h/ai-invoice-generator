# Revenue OS v6.4 — UI Runtime Decision Engine

> **"UI is NOT a structure"**
> **"UI is a runtime decision system"**

---

## Core Principle

Transitioning the UI from a static structure mapper to a dynamic, runtime-decision-driven layout. Business events trigger state adjustments, which normalize into signals. The decision engine evaluates these signals to dynamically prioritize, position, hide, or float UI blocks.

---

## System Model

```
Signals (leads, quotes, invoices, probability)
  │
  ▼
UI Signal Normalizer (UIRevenueSignal)
  │
  ▼
Runtime Decision Engine (UIRuntimeDecision: priority, visibility, placement)
  │
  ▼
UI Graph Composer (dynamic sorting & filtering)
  │
  ▼
Renderer (DashboardOverview loops & floats TOP/HIGH items)
```

---

## Decision Parameters

- **Revenue Pressure**: `revenueProbability > 0.8` => priority 100, placement TOP, urgency HIGH.
- **Conversion Blocker**: `conversionDrop === true` => priority 90, placement TOP.
- **Engagement Low**: `engagementDecay === true` => priority 60, placement MIDDLE.

---

## Dynamic Render Rules

- **Visibility Filter**: Sections are hidden if `visibility` is false.
- **Dynamic Sorting**: Sections are sorted by placement weight (`TOP` > `MIDDLE` > `BOTTOM`) and then by priority.
- **Urgency Highlight**: Urgency `HIGH` triggers visual border signals and shadows in `DashboardOverview.js`.
