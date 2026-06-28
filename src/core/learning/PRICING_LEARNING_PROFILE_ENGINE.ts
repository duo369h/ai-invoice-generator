/**
 * Corvioz — Pricing Learning Profile Engine v3.1
 *
 * Infers pricing profile segments based on historic strategy selections.
 */

import type { DecisionEvent } from "./REVENUE_DECISION_LOGGER.ts";

export type PricingProfile = {
  riskPreference: "aggressive" | "balanced" | "conservative";
  preferredStrategy: "HIGH_PRICE" | "BALANCED" | "FAST_DEAL";
  averageAcceptedRange: [number, number];
  confidenceLevel: "low" | "medium" | "high";
  sampleSize: number;
};

/**
 * Builds user preference profile from history.
 */
export function buildPricingProfile(history: DecisionEvent[]): PricingProfile {
  const sampleSize = history.length;

  if (sampleSize < 3) {
    return {
      riskPreference: "balanced",
      preferredStrategy: "BALANCED",
      averageAcceptedRange: [500, 2000],
      confidenceLevel: "low",
      sampleSize,
    };
  }

  const highs = history.filter((h) => h.selectedOption === "HIGH").length;
  const fasts = history.filter((h) => h.selectedOption === "FAST").length;

  const highRatio = highs / sampleSize;
  const fastRatio = fasts / sampleSize;

  let riskPreference: "aggressive" | "balanced" | "conservative" = "balanced";
  let preferredStrategy: "HIGH_PRICE" | "BALANCED" | "FAST_DEAL" = "BALANCED";

  if (fastRatio > 0.6) {
    riskPreference = "conservative";
    preferredStrategy = "FAST_DEAL";
  } else if (highRatio > 0.6) {
    riskPreference = "aggressive";
    preferredStrategy = "HIGH_PRICE";
  }

  // Calculate average accepted prices range
  const prices = history.map((h) => {
    if (h.selectedOption === "HIGH") return h.optionsShown.high;
    if (h.selectedOption === "FAST") return h.optionsShown.fast;
    return h.optionsShown.recommended;
  });

  const min = Math.min(...prices);
  const max = Math.max(...prices);

  const confidenceLevel = sampleSize >= 10 ? "high" : "medium";

  return {
    riskPreference,
    preferredStrategy,
    averageAcceptedRange: [min, max],
    confidenceLevel,
    sampleSize,
  };
}
