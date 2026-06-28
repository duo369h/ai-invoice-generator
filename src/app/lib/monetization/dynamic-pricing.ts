import type { UserValueScore } from './user-value-engine';

export type MonetizationPricingTier = 'low' | 'standard' | 'premium';

export type MonetizationPricingDecision = {
  price_tier: MonetizationPricingTier;
  reason: string;
};

export function getMonetizationPricing(score: UserValueScore): MonetizationPricingDecision {
  if (score.value_score >= 70 || score.intent_score >= 75 || score.conversion_probability >= 0.65) {
    return {
      price_tier: 'premium',
      reason: 'High-value user should see Pro pricing first.',
    };
  }

  if (score.value_score < 30 && score.intent_score < 35) {
    return {
      price_tier: 'low',
      reason: 'Low-intent user should get restricted features or delayed paywall pressure.',
    };
  }

  return {
    price_tier: 'standard',
    reason: 'Medium-value user should receive normal pricing.',
  };
}
