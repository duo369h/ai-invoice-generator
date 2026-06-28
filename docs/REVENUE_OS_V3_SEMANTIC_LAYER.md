# Revenue OS v3 — Semantic Safety Layer

> **"From UI-driven revenue system → semantic-consistent revenue OS"**
> **UI is not allowed to display inconsistent revenue meaning.**

---

## Core Principle

All revenue signals must be semantically consistent before reaching the UI.
A CTA must match the user's funnel stage. A price must match the behavioral segment.
A badge must be non-empty. No contradictions are permitted.

---

## System Architecture

```
UserState
   │
   ▼
Kernel (decision authority — unchanged, untouched)
   │
   ▼
Orchestrator (execution layer — pure pass-through)
   │
   ▼
Revenue Engine (strategy: raw signal generator)
   │
   ▼
Adapter Layer (UI translation)
   │
   ▼
Semantic Validator  ← NEW IN v3 (consistency enforcement)
   │
   ├── PASS (score 1.0) → output as-is
   └── HARD VIOLATION → SAFE_DEFAULT_UI (fallback)
   │
   ▼
uiHints.revenueUI (semanticScore attached)
   │
   ▼
Interpretation Engine (merge-only assembler)
   │
   ▼
UI Renderer (pure display — reads uiHints.revenueUI ONLY)
```

---

## Semantic Layer Files

| File | Role |
|------|------|
| `src/core/semantic/REVENUE_SEMANTIC_CONTRACT.ts` | Defines all `SemanticRule` types and built-in rules |
| `src/core/semantic/REVENUE_SEMANTIC_VALIDATOR.ts` | Validates adapter output, computes `semanticScore` |
| `src/core/semantic/REVENUE_FALLBACK_ENGINE.ts` | Provides `SAFE_DEFAULT_UI` for HARD violations |
| `src/debug/SEMANTIC_DEBUG_PANEL.ts` | Dev-only debug view (returns null in production) |

---

## Semantic Rules (Built-in)

### CTA Consistency

| Stage | Forbidden CTAs |
|-------|---------------|
| Awareness (ACQUIRE) | "Upgrade Plan", "Generate Invoice" |
| Conversion (CONVERT) | "Try Demo", "Upgrade Plan" |
| Monetizing (MONETIZE) | "Start Proposal", "Try Demo" |
| Expanding (EXPAND) | "Try Demo", "Start Proposal" |

### Pricing Alignment

| Stage | Required Price |
|-------|---------------|
| Awareness | $9/mo |
| Conversion | $19/mo |
| Monetizing | $29/mo |
| Expanding | $9/mo |

### Funnel Coherence

- TRAFFIC bottleneck → cannot show invoice CTA
- ACTIVE/EXPAND → cannot show upgrade-to-free-trial CTA (SOFT)

### Badge Validity
- Badge label must be non-empty (HARD)
- Badge color must be present (SOFT)

---

## Semantic Score

All adapter output now includes `semanticScore: number` (0.0 – 1.0):

| Deduction | Violation |
|-----------|-----------|
| –0.3 | CTA mismatch (HARD) |
| –0.3 | Pricing mismatch (HARD) |
| –0.4 | Funnel mismatch (HARD) |
| –0.1 | Badge color missing (SOFT) |

A score of `0.5` indicates fallback was applied.

---

## Fallback System

When HARD violations are detected:

```typescript
// SAFE_DEFAULT_UI
{
  badge:      { label: "Awareness", color: "#64748b" },
  cta:        { label: "Start Proposal", href: "/proposal/create", action: "PUSH_PROPOSAL" },
  insight:    { headline: "Continue building your revenue flow", ... },
  pricingTag: { price: "$9/mo", description: "Get started" },
  semanticScore: 0.5,
}
```

---

## Boundary Contract

### What is NEW in v3

- `REVENUE_SEMANTIC_VALIDATOR.ts` runs **inside** the Adapter before any output is delivered
- `semanticScore` is attached to every `RevenueUIAdapter` output
- HARD violations trigger automatic correction to `SAFE_DEFAULT_UI`
- CI gate now enforces CTA validity, pricing consistency, and validator presence

### What did NOT change

- Kernel: completely untouched
- Orchestrator: pure pass-through (no new logic)
- Revenue Engine v1: locked, no new fields
- UI structure: unchanged
- Routing: unchanged

---

## CI Enforcement

```bash
node scripts/validate-launch-system.ts
```

| Gate | What It Enforces |
|------|-----------------|
| `semanticScore` present on adapter output | Validator is connected |
| CTA matches strategy for all 4 stages | No contradictory CTAs reach UI |
| Price matches segment ($9/$19/$29) | No contradictory pricing reaches UI |
| `validateRevenueUI` catches ACQUIRE+Upgrade mismatch | Validator logic is correct |
| `SAFE_DEFAULT_UI` has required shape | Fallback is always valid |
| `getSafeFallbackUI()` returns valid semanticScore | Fallback engine is functional |
| Architecture Guard: no raw field access in UI | Boundary maintained |
| Orchestrator: no revenue re-computation | Deduplication maintained |
