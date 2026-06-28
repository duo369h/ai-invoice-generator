/**
 * Corvioz — Revenue Optimization Engine v2
 *
 * Directs final pricing decisions and alternative tiers based on pricing learning
 * and client profiles.
 */

import type { PricingDecision } from "./PRICING_LEARNING_ENGINE.ts";
import type { ClientProfile } from "./CLIENT_INTELLIGENCE_ENGINE.ts";

export type RevenueOptimizationOutput = {
  finalPrice: number;
  upsellItems: string[];
  riskLevel: "low" | "medium" | "high";
  suggestion: string;
  alternatives: number[];
};

/**
 * Optimizes pricing models and outputs action suggestions.
 */
export function optimizeRevenue(
  pricing: PricingDecision,
  client: ClientProfile
): RevenueOptimizationOutput {
  let finalPrice = pricing.recommendedPrice;
  const upsellItems: string[] = [];
  let riskLevel: "low" | "medium" | "high" = "medium";
  let suggestion = "Standard pricing recommended based on current market signals.";

  // 1️⃣ Scenario 1: High tier client (enterprise/premium)
  if (client.clientTier === "high") {
    // Uplift final price by 15% - 30% depending on price tolerance
    const upliftMultiplier = 1.0 + (client.priceTolerance - 1.0) * 0.5; // e.g. 1.25
    finalPrice = Math.round(pricing.recommendedPrice * upliftMultiplier);

    upsellItems.push("rush delivery fee (+ 15%)");
    upsellItems.push("branding kit premium add-on");
    upsellItems.push("priority response retainer");

    riskLevel = "low";
    suggestion = "High-tier client identified. Dynamic price uplift applied. Suggest premium add-ons.";
  }
  // 2️⃣ Scenario 2: Price sensitive client
  else if (client.clientTier === "low") {
    // Lower recommended price to keep negotiation likelihood high
    finalPrice = pricing.priceBands.low;
    upsellItems.push("extended milestone payments path");

    riskLevel = "high";
    suggestion = "Price-sensitive client identified. Recommended lower pricing and split payments to prevent churn.";
  }
  // 3️⃣ Scenario 3: Standard/Medium client
  else {
    suggestion = "Standard tier identified. Suggest Good/Better/Best 3-tier proposals.";
  }

  // Good / Better / Best alternatives
  const alternatives = [
    pricing.priceBands.low,
    pricing.priceBands.mid,
    pricing.priceBands.high,
  ];

  return {
    finalPrice,
    upsellItems,
    riskLevel,
    suggestion,
    alternatives,
  };
}
