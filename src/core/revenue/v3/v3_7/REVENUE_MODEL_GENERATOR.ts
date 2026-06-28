/**
 * REVENUE_MODEL_GENERATOR.ts — v3.7 Revenue Model Generator
 *
 * Generates alternative revenue model candidates based on transaction history
 * and segment behavioral characteristics.
 *
 * ❌ PROHIBITED: AI, Math.random()
 * ✅ ALLOWED: Rules-based model generation, conversion pattern matching
 */

export type RevenueModelType = "PACKAGE_BUNDLING" | "SUBSCRIPTION_SHIFT" | "VALUE_BASED_PRICING";

export interface RevenueModel {
  modelType: RevenueModelType;
  description: string;
  expectedRevenueImpact: number; // Percentage increase (e.g. 18 for +18%)
  riskLevel: "LOW" | "MEDIUM" | "HIGH";
}

export interface GeneratorInput {
  clientType: "new" | "repeat" | "long_term";
  avgAcceptedPrice: number;
  totalResolvedCount: number;
  repeatClientRatio: number;      // 0.0 - 1.0
  isPriceSensitive: boolean;
}

export interface GeneratorOutput {
  generatedModels: RevenueModel[];
  confidence: number;
}

/**
 * generateRevenueModels — identifies alternative model fits based on transaction distribution.
 */
export function generateRevenueModels(input: GeneratorInput): GeneratorOutput {
  const { clientType, avgAcceptedPrice, totalResolvedCount, repeatClientRatio, isPriceSensitive } = input;
  const generatedModels: RevenueModel[] = [];

  // 1️⃣ Propose VALUE_BASED_PRICING if segment is highly price sensitive
  if (isPriceSensitive) {
    generatedModels.push({
      modelType: "VALUE_BASED_PRICING",
      description: "Shift pricing from labor hours to target ROI value. Reduces client friction on raw price comparisons.",
      expectedRevenueImpact: 25,
      riskLevel: "HIGH",
    });
  }

  // 2️⃣ Propose SUBSCRIPTION_SHIFT if repeat clients dominate
  if (repeatClientRatio > 0.50 || clientType === "long_term") {
    generatedModels.push({
      modelType: "SUBSCRIPTION_SHIFT",
      description: "Convert ad-hoc repeat projects into a monthly recurring support subscription. Boosts retention and predictable LTV.",
      expectedRevenueImpact: 32,
      riskLevel: "LOW",
    });
  }

  // 3️⃣ Propose PACKAGE_BUNDLING if deal sizes are small but volume is high
  if (avgAcceptedPrice < 600 && totalResolvedCount >= 8) {
    generatedModels.push({
      modelType: "PACKAGE_BUNDLING",
      description: "Bundle discrete add-on deliverables (e.g. SEO, assets, support) into a fixed package tier. Increases overall basket value.",
      expectedRevenueImpact: 18,
      riskLevel: "MEDIUM",
    });
  }

  // Default fallback if no conditions met
  if (generatedModels.length === 0) {
    generatedModels.push({
      modelType: "PACKAGE_BUNDLING",
      description: "Package standard features together to streamline price transparency.",
      expectedRevenueImpact: 10,
      riskLevel: "LOW",
    });
  }

  // Compute confidence score (0-100) based on sample sizes
  const confidence = Math.min(
    95,
    Math.round(
      Math.min(totalResolvedCount / 20, 1) * 60 +
      (repeatClientRatio > 0.3 ? 35 : 15)
    )
  );

  return {
    generatedModels,
    confidence,
  };
}
