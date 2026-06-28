import { simulateRevenueOutcome, type MonetizationRuleMode, type PricingTierConfig } from './revenue-simulator';
import type { SimulatedUserSession } from './user-behavior-simulator';

export type PaywallSensitivityResult = {
  conversion_rate: number;
  churn_risk: number;
  revenue_impact: number;
};

export type PaywallSensitivityScenario = PaywallSensitivityResult & {
  strategy: MonetizationRuleMode;
};

const CHURN_RISK: Record<MonetizationRuleMode, number> = {
  aggressive: 0.34,
  balanced: 0.18,
  soft: 0.09,
};

function round(value: number, precision = 4) {
  const factor = 10 ** precision;
  return Math.round(value * factor) / factor;
}

export function simulatePaywallSensitivity(
  sessions: SimulatedUserSession[],
  strategy: MonetizationRuleMode = 'balanced',
  pricing_tiers?: PricingTierConfig
): PaywallSensitivityResult {
  const baseline = simulateRevenueOutcome({ sessions, monetization_rule: 'balanced', pricing_tiers });
  const outcome = simulateRevenueOutcome({ sessions, monetization_rule: strategy, pricing_tiers });
  const conversionRate = outcome.total_users > 0 ? outcome.conversions / outcome.total_users : 0;
  const revenueImpact = baseline.revenue > 0 ? (outcome.revenue - baseline.revenue) / baseline.revenue : 0;

  return {
    conversion_rate: round(conversionRate),
    churn_risk: CHURN_RISK[strategy],
    revenue_impact: round(revenueImpact),
  };
}

export function comparePaywallSensitivity(
  sessions: SimulatedUserSession[],
  pricing_tiers?: PricingTierConfig
): PaywallSensitivityScenario[] {
  return (['aggressive', 'balanced', 'soft'] as MonetizationRuleMode[]).map((strategy) => ({
    strategy,
    ...simulatePaywallSensitivity(sessions, strategy, pricing_tiers),
  }));
}
