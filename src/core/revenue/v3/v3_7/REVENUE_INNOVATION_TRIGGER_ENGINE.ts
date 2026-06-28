/**
 * REVENUE_INNOVATION_TRIGGER_ENGINE.ts — v3.7 Innovation Trigger Engine
 *
 * Evaluates performance stability and strategy saturation limits to authorize
 * structural revenue model evolution checks.
 *
 * ❌ PROHIBITED: AI, Math.random()
 * ✅ ALLOWED: Threshold checks, volatility metrics mapping, deterministic trigger gates
 */

export interface TriggerInput {
  stabilityScore: number;                 // 0 - 100 (system conversion stability)
  revenueVolatility: number;              // 0.0 - 1.0 (recent volatility of transaction values)
  strategyWinRateSpread: number;          // Win rate difference between best and worst strategies
  totalOutcomesCount: number;
}

export interface TriggerOutput {
  allowInnovation: boolean;
  reason: string;
  intensity: "LOW" | "MEDIUM" | "HIGH";
}

/**
 * evaluateInnovationTrigger — determines if market conditions are stable enough for model innovations.
 */
export function evaluateInnovationTrigger(input: TriggerInput): TriggerOutput {
  const { stabilityScore, revenueVolatility, strategyWinRateSpread, totalOutcomesCount } = input;

  // 1️⃣ Block innovation if deal data is insufficient
  if (totalOutcomesCount < 15) {
    return {
      allowInnovation: false,
      reason: "Bootstrap phase: Insufficient deal volume (< 15 resolved outcomes) to guarantee baseline model stability.",
      intensity: "LOW",
    };
  }

  // 2️⃣ Block innovation if revenue volatility is excessively high
  if (revenueVolatility > 0.45) {
    return {
      allowInnovation: false,
      reason: `High volatility detected (${(revenueVolatility * 100).toFixed(0)}%). Prioritizing core stability over structural changes.`,
      intensity: "LOW",
    };
  }

  // 3️⃣ Allow innovation if stability score is solid and strategy spread is narrow (saturation)
  // Narrow spread (< 12%) suggests optimization bounds have converged/saturated
  const isSaturated = strategyWinRateSpread < 0.12;
  const isStable = stabilityScore >= 65;

  if (isStable && isSaturated) {
    const intensity = stabilityScore > 85 ? "HIGH" : "MEDIUM";
    return {
      allowInnovation: true,
      reason: `Strategy optimization saturated (win rate spread: ${(strategyWinRateSpread * 100).toFixed(0)}%). Evolving pricing models to capture new margins.`,
      intensity,
    };
  }

  return {
    allowInnovation: false,
    reason: "Core strategies are still actively differentiating. Standard optimization cycles remain active.",
    intensity: "LOW",
  };
}
