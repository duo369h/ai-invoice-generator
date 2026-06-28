/**
 * Corvioz — Pricing Intelligence Engine v1 (Simplified)
 *
 * Compatibility wrapper around the deterministic pricing core.
 * Excludes AI, game theory logic, external API calls, or precise probability modeling.
 */

import { deterministicPricingEngine } from "./PRICING_CORE_ENGINE.ts";

export type PricingInput = {
  jobType: "web_design" | "ui_ux" | "logo" | "invoice_system" | "marketing";
  clientType: "individual" | "small_business" | "startup" | "enterprise";
  urgency?: "low" | "medium" | "high";
  clarity?: "low" | "medium" | "high";
  budgetHint?: number;
};

export type PricingProfileMock = {
  riskPreference: "aggressive" | "balanced" | "conservative";
  sampleSize: number;
};

export type PricingOutput = {
  marketRange: {
    min: number;
    max: number;
  };
  suggestedPrice: number;
  adjustedPrice: number;
  reasoning: string[];
  confidence: "low" | "medium" | "high";

  // Backward compatibility fields to prevent compilation errors in dependent files
  recommendedPrice: number;
  priceElasticity: "LOW" | "MEDIUM" | "HIGH";
  upsell: Array<{ type: string; value: string }>;
};

/**
 * Calculates baseline pricing options and confidence indices.
 */
export function getPricingIntelligence(
  input: PricingInput,
  profile?: PricingProfileMock
): PricingOutput {
  const core = deterministicPricingEngine({
    jobType: input.jobType,
    clientType: input.clientType,
    urgency: input.urgency,
    clarity: input.clarity,
  });

  const suggestedPrice = core.adjustedPrice;
  const min = core.range.min;
  const max = core.range.max;

  // Apply learning profile shifts ONLY IF profile sample size requirements met
  let adjustedPrice = suggestedPrice;
  const reasoning = [
    `Calculated using industry baseline for ${input.jobType.replace("_", " ")} projects.`,
    `Adjusted for client type (${input.clientType}) and urgency scale (${input.urgency ?? "medium"}).`,
  ];

  if (profile && profile.sampleSize >= 3) {
    if (profile.riskPreference === "aggressive") {
      adjustedPrice = Math.round(suggestedPrice * 1.15); // +15% aggressive pricing shift
      reasoning.push("Applied aggressive risk preference profile markup (+15%).");
    } else if (profile.riskPreference === "conservative") {
      adjustedPrice = Math.round(suggestedPrice * 0.85); // -15% conservative discount shift
      reasoning.push("Applied conservative preference discount alignment (-15%).");
    }
  }

  return {
    marketRange: { min, max },
    suggestedPrice,
    adjustedPrice,
    reasoning,
    confidence: profile && profile.sampleSize >= 10 ? "high" : profile && profile.sampleSize >= 3 ? "medium" : "low",

    // Backward compatibility mapping
    recommendedPrice: adjustedPrice,
    priceElasticity: input.clientType === "enterprise" ? "LOW" : input.clientType === "individual" ? "HIGH" : "MEDIUM",
    upsell: [],
  };
}
