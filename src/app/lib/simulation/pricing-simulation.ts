import { simulateRevenueOutcome, type MonetizationRuleMode, type PricingTierConfig } from './revenue-simulator';
import type { SimulatedUserSession } from './user-behavior-simulator';

export type PricingModelType = 'freemium' | 'trial' | 'usage_based_limits';

export type PricingStrategyResult = {
  best_pricing_model: string;
  expected_revenue: number;
  risk_score: number;
};

export type PricingStrategyScenario = PricingStrategyResult & {
  pricing_tiers: Required<PricingTierConfig>;
  monetization_rule: MonetizationRuleMode;
  model_type: PricingModelType;
};

const TIER_SET: Required<PricingTierConfig>[] = [
  { low: 9, standard: 19, premium: 29 },
  { low: 9, standard: 19, premium: 19 },
  { low: 9, standard: 9, premium: 29 },
];

const MODEL_RISK: Record<PricingModelType, number> = {
  freemium: 22,
  trial: 34,
  usage_based_limits: 28,
};

const MODEL_REVENUE_MULTIPLIER: Record<PricingModelType, number> = {
  freemium: 0.92,
  trial: 1.08,
  usage_based_limits: 1,
};

function round(value: number, precision = 2) {
  const factor = 10 ** precision;
  return Math.round(value * factor) / factor;
}

function modelName(model: PricingModelType, tiers: Required<PricingTierConfig>) {
  return `${model}: $${tiers.low}/$${tiers.standard}/$${tiers.premium}`;
}

export function simulatePricingStrategies(sessions: SimulatedUserSession[]): PricingStrategyScenario[] {
  const models: PricingModelType[] = ['freemium', 'trial', 'usage_based_limits'];
  const ruleByModel: Record<PricingModelType, MonetizationRuleMode> = {
    freemium: 'soft',
    trial: 'balanced',
    usage_based_limits: 'aggressive',
  };

  return TIER_SET.flatMap((pricing_tiers) =>
    models.map((model_type) => {
      const monetization_rule = ruleByModel[model_type];
      const outcome = simulateRevenueOutcome({ sessions, monetization_rule, pricing_tiers });
      const expectedRevenue = outcome.revenue * MODEL_REVENUE_MULTIPLIER[model_type];
      const premiumPressure = pricing_tiers.premium > 24 ? 8 : 0;

      return {
        best_pricing_model: modelName(model_type, pricing_tiers),
        expected_revenue: round(expectedRevenue),
        risk_score: Math.min(100, MODEL_RISK[model_type] + premiumPressure),
        pricing_tiers,
        monetization_rule,
        model_type,
      };
    })
  );
}

export function findBestPricingStrategy(sessions: SimulatedUserSession[]): PricingStrategyResult {
  const scenarios = simulatePricingStrategies(sessions);
  const best = scenarios
    .slice()
    .sort((a, b) => (b.expected_revenue - b.risk_score * 2) - (a.expected_revenue - a.risk_score * 2))[0];

  return {
    best_pricing_model: best?.best_pricing_model || 'freemium: $9/$19/$29',
    expected_revenue: best?.expected_revenue || 0,
    risk_score: best?.risk_score || 0,
  };
}
