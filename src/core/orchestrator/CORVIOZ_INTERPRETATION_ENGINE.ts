/**
 * Corvioz — Interpretation Engine (LOCKED — v3 Semantic Safety Edition)
 *
 * MERGE-ONLY layer. This engine does NOT compute or transform revenue fields.
 *
 * Architecture position (v3):
 *   Growth Signals → Kernel Decision → Revenue Engine → Adapter (+ Semantic Validator) → Engine → SystemView
 *
 * ⚠️  LOCK:
 *   ❌ Must NOT inline revenue field transformation
 *   ❌ Must NOT inline CTA mapping, pricing logic, or funnel logic
 *   ❌ Must NOT call validateRevenueUI() — validation runs inside Adapter
 *   ✔  Receives pre-validated, semantically consistent uiHints from Adapter
 *   ✔  Only merges precomputed signals from Growth, Kernel, and Adapter
 *   ✔  Only assembles the frozen SystemView
 *
 * v3 Semantic Safety:
 *   The Adapter now runs REVENUE_SEMANTIC_VALIDATOR internally.
 *   By the time revenueUI reaches this Engine, it is guaranteed to be
 *   semantically valid or corrected to SAFE_DEFAULT_UI.
 *
 * If you need to change revenue presentation: edit REVENUE_ADAPTER_LAYER.ts.
 * If you need to change semantic rules: edit REVENUE_SEMANTIC_CONTRACT.ts.
 * If you need to change routing: edit CORVIOZ_DECISION_KERNEL.ts.
 * This file assembles — it does not decide.
 */

import { getGrowthSignals } from "../growth/GROWTH_ENTRY_LAYER.ts";
import { getCorviozDecision } from "../kernel/CORVIOZ_DECISION_KERNEL.ts";
import type { CorviozDecision } from "../kernel/CORVIOZ_DECISION_KERNEL.ts";
import { getRevenueIntelligence } from "../revenue/REVENUE_INTELLIGENCE_ENGINE.ts";
import type { RevenueIntelligence } from "../revenue/REVENUE_INTELLIGENCE_ENGINE.ts";
import { adaptRevenueToUI } from "../revenue/REVENUE_ADAPTER_LAYER.ts";
import type { UIHints } from "../ui/UI_HINT_SCHEMA.ts";
import type { FrozenSystemView, FrozenUIHints } from "./SYSTEM_VIEW_SCHEMA.ts";

// Re-export SystemView as the canonical type for all consumers
export type SystemView = FrozenSystemView;

export function getSystemView(userState: any = {}): SystemView {
  // ── Step 1: Collect raw signals (no transformation here) ─────────────────
  const signals = getGrowthSignals(userState);
  const decision = getCorviozDecision(userState);
  const revenueIntelligence = getRevenueIntelligence(userState);

  // ── Step 2: Adapter computes revenueUI (precomputed, passed as-is) ────────
  // Engine does NOT transform revenue fields. It receives the adapter result
  // and merges it into uiHints without modification.
  const revenueUI = adaptRevenueToUI(revenueIntelligence);

  // ── Step 3: Route resolution (from Kernel + Growth, no revenue input) ─────
  let route: SystemView["route"] = decision.route as SystemView["route"];
  if (decision.killSwitchActive) {
    route = "/dashboard/activation";
  } else if (signals.isColdStart && signals.intentScore < 0.3) {
    route = "/demo/proposal-preview";
  }

  // ── Step 4: Assemble frozen UIHints — merge only, no computation ──────────
  const uiHints: FrozenUIHints = Object.freeze({
    showDemoCard:       signals.isColdStart && !decision.killSwitchActive,
    showUpgradeHint:    decision.paywallAllowed && decision.monetizationMode !== "NONE",
    showRevenueInsight: decision.revenueMode === "ENFORCED" || decision.revenueMode === "TRACKING_ONLY",
    revenueUI:          Object.freeze(revenueUI),
  });

  // ── Step 5: Return frozen SystemView ─────────────────────────────────────
  return Object.freeze({
    route,
    uiHints,
    growthSignals: Object.freeze({
      intentScore: signals.intentScore,
      isColdStart: signals.isColdStart,
    }),
    kernelDecision: Object.freeze(decision),
    revenueIntelligence: Object.freeze(revenueIntelligence),
  });
}
