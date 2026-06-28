import { comparePaywallSensitivity } from './paywall-sensitivity';
import { findBestPricingStrategy } from './pricing-simulation';
import { simulateRevenueOutcome } from './revenue-simulator';
import { generateSyntheticUserSessions, type UserBehaviorSimulationOptions } from './user-behavior-simulator';

export type RevenueSimulationRunnerOptions = UserBehaviorSimulationOptions & {
  months?: number;
};

export type RevenueSimulationRunnerResult = {
  recommended_strategy: string;
  projected_mrr: number;
  conversion_rate: number;
  bottlenecks: string[];
};

function round(value: number, precision = 4) {
  const factor = 10 ** precision;
  return Math.round(value * factor) / factor;
}

function bottlenecksFromDropOff(dropOffByStep: Record<string, number>) {
  return Object.entries(dropOffByStep)
    .sort((a, b) => b[1] - a[1])
    .filter(([, count]) => count > 0)
    .slice(0, 3)
    .map(([step]) => step);
}

export function runRevenueSimulation(options: RevenueSimulationRunnerOptions = {}): RevenueSimulationRunnerResult {
  const sessions = generateSyntheticUserSessions(options);
  const pricing = findBestPricingStrategy(sessions);
  const paywallScenarios = comparePaywallSensitivity(sessions);
  const bestPaywall = paywallScenarios
    .slice()
    .sort((a, b) => (b.revenue_impact - b.churn_risk) - (a.revenue_impact - a.churn_risk))[0];
  const outcome = simulateRevenueOutcome({ sessions, monetization_rule: bestPaywall?.strategy || 'balanced' });
  const months = Math.max(1, Math.floor(options.months || 1));
  const conversionRate = outcome.total_users > 0 ? outcome.conversions / outcome.total_users : 0;

  return {
    recommended_strategy: `${bestPaywall?.strategy || 'balanced'} paywall + ${pricing.best_pricing_model}`,
    projected_mrr: round(pricing.expected_revenue / months, 2),
    conversion_rate: round(conversionRate),
    bottlenecks: bottlenecksFromDropOff(outcome.drop_off_by_step),
  };
}
