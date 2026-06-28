/**
 * Corvioz — Pricing Learning Engine v2
 *
 * Tracks historical accepted/rejected prices to model price elasticity
 * and dynamic acceptance probabilities.
 */

export type PricingInput = {
  serviceType: string;
  basePrice: number;
  clientType: "individual" | "startup" | "enterprise";
  urgency: "low" | "medium" | "high";
  region: string;
};

export type PricingDecision = {
  recommendedPrice: number;
  confidence: number;
  acceptanceProbability: number;
  priceBands: {
    low: number;
    mid: number;
    high: number;
  };
};

export interface PricingHistoryRecord {
  recommendedPrice: number;
  finalPrice: number;
  accepted: boolean;
}

/**
 * Learns conversion patterns from historical pricing feedback to output optimized bands.
 */
export function getPricingLearning(
  input: PricingInput,
  history: PricingHistoryRecord[] = []
): PricingDecision {
  const base = input.basePrice;

  // 1️⃣ Heuristic base modifiers
  let clientMultiplier = 1.0;
  if (input.clientType === "enterprise") clientMultiplier = 2.0;
  else if (input.clientType === "startup") clientMultiplier = 1.4;
  else if (input.clientType === "individual") clientMultiplier = 0.8;

  let urgencyMultiplier = 1.0;
  if (input.urgency === "high") urgencyMultiplier = 1.4;
  else if (input.urgency === "low") urgencyMultiplier = 0.95;

  const initialRecommended = base * clientMultiplier * urgencyMultiplier;

  // 2️⃣ Apply price elasticity from history
  let acceptanceRate = 0.85;
  let priceAdjustment = 1.0;

  if (history.length > 0) {
    const similarTypeRecords = history.filter(
      (h) => Math.abs(h.recommendedPrice - initialRecommended) / initialRecommended < 0.3
    );

    if (similarTypeRecords.length > 0) {
      const acceptedCount = similarTypeRecords.filter((h) => h.accepted).length;
      acceptanceRate = acceptedCount / similarTypeRecords.length;

      // Adjust recommended price based on conversion rates
      if (acceptanceRate > 0.8) {
        // High acceptance -> underpriced, raise recommended price
        priceAdjustment = 1.15;
      } else if (acceptanceRate < 0.4) {
        // Low acceptance -> overpriced, decrease recommended price
        priceAdjustment = 0.85;
      }
    }
  }

  const recommendedPrice = Math.round(initialRecommended * priceAdjustment);

  // 3️⃣ Define Safe (Low), Mid, and Aggressive (High) price bands
  const lowBand = Math.round(recommendedPrice * 0.85);
  const midBand = recommendedPrice;
  const highBand = Math.round(recommendedPrice * 1.30);

  // 4️⃣ Compute confidence index based on history volume and clarity
  const confidence = history.length > 5 ? 0.95 : history.length > 0 ? 0.85 : 0.70;

  return {
    recommendedPrice,
    confidence,
    acceptanceProbability: acceptanceRate,
    priceBands: {
      low: lowBand,
      mid: midBand,
      high: highBand,
    },
  };
}
