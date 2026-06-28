/**
 * Corvioz — Revenue Semantic Validator
 *
 * Validates adapter output for semantic consistency before it reaches the UI.
 *
 * Principle: "UI is not allowed to display inconsistent revenue meaning."
 *
 * Rules:
 *   ✔ Runs after adaptRevenueToUI() produces output
 *   ✔ Checks CTA, pricing, funnel, and badge consistency
 *   ✔ Returns corrected output (fallback) on HARD violations
 *   ✔ Computes semanticScore (0.0 – 1.0) for all outputs
 *   ❌ Does NOT modify Kernel or routing decisions
 */

import type { RevenueUIAdapter } from "../revenue/REVENUE_ADAPTER_LAYER.ts";
import { FORBIDDEN_CTA_BY_STAGE, STAGE_PRICE_MAP } from "./REVENUE_SEMANTIC_CONTRACT.ts";
import { getSafeFallbackUI } from "./REVENUE_FALLBACK_ENGINE.ts";

export type SemanticValidationResult = {
  valid: boolean;
  violations: string[];
  semanticScore: number;
  corrected?: RevenueUIAdapter;
};

export function validateRevenueUI(
  uiRevenue: Omit<RevenueUIAdapter, "semanticScore">
): SemanticValidationResult {
  const violations: string[] = [];
  let scoreDeduction = 0.0;

  const badgeLabel = uiRevenue.badge?.label ?? "";
  const ctaLabel   = uiRevenue.cta?.label ?? "";
  const price      = uiRevenue.pricingTag?.price ?? "";

  // ── CTA consistency check ─────────────────────────────────────────────────
  const forbiddenCTAs = FORBIDDEN_CTA_BY_STAGE[badgeLabel] ?? [];
  if (forbiddenCTAs.includes(ctaLabel)) {
    violations.push(`CTA-MISMATCH [HARD]: stage '${badgeLabel}' must not show CTA '${ctaLabel}'`);
    scoreDeduction += 0.3;
  }

  // ── Pricing alignment check ───────────────────────────────────────────────
  const expectedPrice = STAGE_PRICE_MAP[badgeLabel];
  if (expectedPrice && price !== expectedPrice) {
    violations.push(`PRICING-MISMATCH [HARD]: stage '${badgeLabel}' expects '${expectedPrice}', got '${price}'`);
    scoreDeduction += 0.3;
  }

  // ── Funnel coherence check ────────────────────────────────────────────────
  if (badgeLabel === "Awareness" && ctaLabel === "Generate Invoice") {
    violations.push("FUNNEL-MISMATCH [HARD]: TRAFFIC/ACQUIRE stage cannot show invoice CTA");
    scoreDeduction += 0.4;
  }

  // ── Badge validity check ──────────────────────────────────────────────────
  if (!badgeLabel) {
    violations.push("BADGE-INVALID [HARD]: badge label is empty");
    scoreDeduction += 0.3;
  }
  if (!uiRevenue.badge?.color) {
    violations.push("BADGE-INVALID [SOFT]: badge color missing");
    scoreDeduction += 0.1;
  }

  const semanticScore = Math.max(0, 1.0 - scoreDeduction);

  // ── Hard violations → fallback ────────────────────────────────────────────
  const hasHardViolation = violations.some(v => v.includes("[HARD]"));

  if (hasHardViolation) {
    const fallback = getSafeFallbackUI();
    return {
      valid: false,
      violations,
      semanticScore,
      corrected: { ...fallback, semanticScore },
    };
  }

  return {
    valid: violations.length === 0,
    violations,
    semanticScore,
  };
}
