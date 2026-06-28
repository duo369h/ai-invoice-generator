/**
 * Execution Layer (UI Translator) — Corvioz v8
 *
 * Translates active strategies into safe UI display outputs.
 * STRICTLY NO pricing modifications, plan changes, or user intent inferences.
 * Only execute if safety and experiment gates allow and strategy risk < 0.3.
 */

import { Strategy } from '../strategy/strategyEngine';
import { SafetyState } from '../safety/growthSafetyGuard';
import { ExperimentDecision } from '../experiment/growthExperimentEngine';

export interface UIExecutionOutput {
  banner: 'none' | 'soft_upgrade' | 'value_hint';
  modal: null | 'upgrade_hint';
  highlightPlan: 'pro' | 'growth' | 'studio' | null;
  uiIntensity: 'low' | 'medium';
}

/**
 * Computes the safe visual display variables based on strategy, safety, and experiment state.
 *
 * @param strategies - Suggested strategies from strategyEngine.
 * @param safetyState - Allowed status and explanation from safetyGuard.
 * @param experimentDecision - Experiment enrollment parameters.
 */
export function getUIExecution(
  strategies: Strategy[],
  safetyState: SafetyState,
  experimentDecision: ExperimentDecision
): UIExecutionOutput {
  const defaultOutput: UIExecutionOutput = {
    banner: 'none',
    modal: null,
    highlightPlan: null,
    uiIntensity: 'low',
  };

  // 1. Strict verification: Block if safety is rejected or experiment cohort is excluded
  if (!safetyState.allowed || !experimentDecision.allowed) {
    return defaultOutput;
  }

  // 2. Filter strategies with risk < 0.3
  const safeStrategies = strategies.filter((s) => s.risk < 0.3);
  if (safeStrategies.length === 0) {
    return defaultOutput;
  }

  // 3. Select the best strategy (highest expected impact)
  const sorted = [...safeStrategies].sort((a, b) => b.expected_impact - a.expected_impact);
  const selected = sorted[0];

  // 4. Map strategy candidate to UI execution properties
  switch (selected.strategy) {
    case 'upsell_soft_pro':
      return {
        banner: 'soft_upgrade',
        modal: null,
        highlightPlan: 'pro',
        uiIntensity: 'medium',
      };
    case 'upsell_value_growth':
      return {
        banner: 'soft_upgrade',
        modal: null,
        highlightPlan: 'growth',
        uiIntensity: 'medium',
      };
    case 'reduce_churn_touchpoint':
      return {
        banner: 'value_hint',
        modal: null,
        highlightPlan: 'pro',
        uiIntensity: 'low',
      };
    case 'loyalty_retention':
      return {
        banner: 'value_hint',
        modal: null,
        highlightPlan: null,
        uiIntensity: 'low',
      };
    default:
      return defaultOutput;
  }
}
