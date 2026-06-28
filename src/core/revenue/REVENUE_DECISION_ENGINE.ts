/**
 * Corvioz — Revenue Decision Engine v1
 *
 * Directs revenue decision routing, recommended pricing points,
 * contextual reasoning, and suggested upsell additions.
 */

import type { PricingOutput, PricingInput } from "../pricing/PRICING_INTELLIGENCE_ENGINE.ts";

export type DecisionAction = "ACCEPT" | "NEGOTIATE" | "INCREASE_PRICE" | "ADD_SCOPE";

export interface RevenueDecision {
  recommendedAction: DecisionAction;
  pricingSuggestion: {
    recommended: number;
    safe: number;
    aggressive: number;
  };
  reasoning: string[];
  revenueImpact: {
    ifAccept: string;
    riskLevel: "LOW" | "MEDIUM" | "HIGH";
  };
  upsell: string[];
}

/**
 * Derives actionable revenue decisions and pricing tiers.
 */
export function getRevenueDecision(
  pricing: PricingOutput,
  context: PricingInput
): RevenueDecision {
  const recommended = pricing.recommendedPrice;
  const safe = Math.round(recommended * 0.95);
  const aggressive = Math.round(recommended * 1.25);

  const reasoning: string[] = [];
  const upsell: string[] = [];

  // Determine reasoning logs based on inputs
  if (context.clientType === "enterprise") {
    reasoning.push("Enterprise client → higher willingness to pay");
  } else if (context.clientType === "startup") {
    reasoning.push("Startup client → moderate budget scale, premium design emphasis");
  }

  if (context.clarity === "low") {
    reasoning.push("Scope unclear → add buffer pricing to cover requirements volatility");
  }

  if (context.urgency === "high") {
    reasoning.push("High urgency → +20% rush fee premium recommended");
  }

  if (pricing.priceElasticity === "LOW") {
    reasoning.push("Low price elasticity → strong price-setting leverage");
  }

  // Populate suggested upsell packages
  for (const up of pricing.upsell) {
    if (up.type === "branding_addon") {
      upsell.push("Add branding package (+ $300)");
    } else if (up.type === "scope_risk_premium") {
      upsell.push("Add scope risk premium (+ 20%)");
    } else if (up.type === "rush_fee") {
      upsell.push("Add rush fee (+ 50%)");
    }
  }

  // Fallbacks if no default upsells present
  if (upsell.length === 0) {
    upsell.push("Add revision package (+ 15%)");
    upsell.push("Add post-launch maintenance retainer");
  }

  // Determine recommended action based on risk profile
  let recommendedAction: DecisionAction = "ACCEPT";
  if (pricing.priceElasticity === "LOW" || context.clientType === "enterprise") {
    recommendedAction = "INCREASE_PRICE";
  } else if (context.clarity === "low") {
    recommendedAction = "ADD_SCOPE";
  } else if (context.urgency === "high" && pricing.priceElasticity === "MEDIUM") {
    recommendedAction = "NEGOTIATE";
  }

  // Determine risk level and revenue impact
  let riskLevel: "LOW" | "MEDIUM" | "HIGH" = "MEDIUM";
  if (context.clientType === "enterprise") {
    riskLevel = "LOW";
  } else if (context.clientType === "individual") {
    riskLevel = "HIGH";
  }

  const uplift = Math.round(((aggressive - recommended) / recommended) * 100);
  const ifAccept = `+${uplift > 0 ? uplift : 32}% revenue yield increase`;

  return {
    recommendedAction,
    pricingSuggestion: {
      recommended,
      safe,
      aggressive,
    },
    reasoning,
    revenueImpact: {
      ifAccept,
      riskLevel,
    },
    upsell,
  };
}
