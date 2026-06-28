/**
 * Strategy Layer (Planning Engine) — Corvioz v8
 *
 * Converts analytical metrics into possible revenue strategies.
 * STRICTLY NO UI decisions, triggering actions, or direct thresholds.
 * ONLY suggestions.
 */

import { RevenueMetrics } from '../brain/revenueIntelligence';

export interface Strategy {
  strategy: string;
  expected_impact: number;
  risk: number;
}

/**
 * Suggests revenue optimization strategy candidates based on input metrics.
 * @param metrics - Raw mathematical metrics from the brain layer.
 */
export function getStrategies(metrics: RevenueMetrics): Strategy[] {
  const strategies: Strategy[] = [];

  // Strategy 1: Soft Upsell to Pro tier
  if (metrics.upgrade_probability > 0.35 && metrics.engagement_score > 0.4) {
    strategies.push({
      strategy: 'upsell_soft_pro',
      expected_impact: 0.08,
      risk: 0.1,
    });
  }

  // Strategy 2: Upsell to Growth tier for highly active power users
  if (metrics.engagement_score > 0.75) {
    strategies.push({
      strategy: 'upsell_value_growth',
      expected_impact: 0.12,
      risk: 0.15,
    });
  }

  // Strategy 3: Reduce churn touchpoint for high-risk users
  if (metrics.churn_risk > 0.6) {
    strategies.push({
      strategy: 'reduce_churn_touchpoint',
      expected_impact: 0.05,
      risk: 0.02,
    });
  }

  // Strategy 4: Loyalty retention benefits/discount offers for high-LTV users
  if (metrics.ltv > 100) {
    strategies.push({
      strategy: 'loyalty_retention',
      expected_impact: 0.03,
      risk: 0.01,
    });
  }

  return strategies;
}
