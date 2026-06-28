/**
 * Corvioz — UI Stability Engine
 *
 * Computes stability indicators, mutation risks, and layout volatility
 * based on runtime signal intensity and mutations count.
 */

import type { UIRevenueSignal } from "./UI_RUNTIME_DECISION_ENGINE.ts";

export type UIStabilityInfo = {
  stabilityScore: number;
  mutationRisk: "LOW" | "MEDIUM" | "HIGH";
  layoutVolatility: "STABLE" | "MODERATE" | "VOLATILE";
};

export function calculateUIStability(signal: UIRevenueSignal, mutationsCount: number): UIStabilityInfo {
  let stabilityScore = 1.0;

  // Layout changes degrade stability score
  stabilityScore -= mutationsCount * 0.15;

  if (signal.churnRisk === "HIGH") {
    stabilityScore -= 0.2;
  }
  if (signal.engagementDecay) {
    stabilityScore -= 0.1;
  }

  stabilityScore = Math.max(0, Math.min(1.0, stabilityScore));

  const mutationRisk = stabilityScore > 0.8
    ? "LOW"
    : stabilityScore > 0.5
      ? "MEDIUM"
      : "HIGH";

  const layoutVolatility = stabilityScore > 0.85
    ? "STABLE"
    : stabilityScore > 0.6
      ? "MODERATE"
      : "VOLATILE";

  return {
    stabilityScore: Number(stabilityScore.toFixed(2)),
    mutationRisk,
    layoutVolatility,
  };
}
