/**
 * Orchestrator (Single Entry Point) — Corvioz v8
 *
 * Chains the Safe Growth sequential pipeline:
 * brain → strategy → safety → experiment → execution
 */

import { getRevenueMetrics, RevenueMetrics } from './brain/revenueIntelligence';
import { getStrategies, Strategy } from './strategy/strategyEngine';
import { evaluateSafety, recordGrowthExposure } from './safety/growthSafetyGuard';
import { getExperimentDecision } from './experiment/growthExperimentEngine';
import { getUIExecution, UIExecutionOutput } from './execution/uiExecutionEngine';

export interface GrowthDecision {
  ui: UIExecutionOutput;
  insights: RevenueMetrics;
  strategyPreview: Strategy[];
}

/**
 * Computes the growth and revenue optimization decision for a user.
 *
 * @param userId - Unique user identifier.
 */
export function getGrowthDecision(userId: string | null): GrowthDecision {
  // 1. Brain: Compute metrics (Read Only)
  const insights = getRevenueMetrics(userId);

  // 2. Strategy: Propose strategies
  const strategyPreview = getStrategies(insights);

  // Determine target plan from the highest-priority strategy (for safety checks)
  let targetPlan: 'pro' | 'growth' | 'studio' | null = null;
  if (strategyPreview.length > 0) {
    const sorted = [...strategyPreview].sort((a, b) => b.expected_impact - a.expected_impact);
    const topStrategy = sorted[0].strategy;
    if (topStrategy === 'upsell_soft_pro' || topStrategy === 'reduce_churn_touchpoint') {
      targetPlan = 'pro';
    } else if (topStrategy === 'upsell_value_growth') {
      targetPlan = 'growth';
    }
  }

  // 3. Safety: Enforce safety rules and block conditions
  const safetyState = evaluateSafety(
    userId,
    strategyPreview.length > 0 ? strategyPreview[0].strategy : 'none',
    insights,
    targetPlan
  );

  // 4. Experiment: Check cohort bucket and rollout flags
  const experimentDecision = getExperimentDecision(userId);

  // 5. Execution: Map to safe UI outputs
  const ui = getUIExecution(strategyPreview, safetyState, experimentDecision);

  return {
    ui,
    insights,
    strategyPreview,
  };
}

export { recordGrowthExposure };
