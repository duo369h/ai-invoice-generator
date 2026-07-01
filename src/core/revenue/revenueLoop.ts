import { detectArpuSignals, type ArpuSignalInput, type ArpuSignalResult } from './arpuSignals';
import { evaluateUpsellOpportunity, type UpsellRecommendation } from './upsellEngine';
import { resolveRevenueLifecycleStage, type RevenueLifecycleInput, type RevenueLifecycleState } from './lifecycleMap';

export type RevenueLoopOutcome = 'accepted_upgrade' | 'continued_free' | 'dismissed' | 'not_shown' | 'unknown';

export interface RevenueLoopInput extends ArpuSignalInput, RevenueLifecycleInput {
  lastUpsellShownDaysAgo?: number;
  lastOutcome?: RevenueLoopOutcome;
}

export interface RevenueLoopResult {
  lifecycle: RevenueLifecycleState;
  arpu: ArpuSignalResult;
  upsell: UpsellRecommendation;
  feedbackState: RevenueLoopOutcome;
  nextIterationFocus: string;
}

export function runRevenueOptimizationLoop(input: RevenueLoopInput = {}): RevenueLoopResult {
  const lifecycle = resolveRevenueLifecycleStage(input);
  const arpu = detectArpuSignals(input);
  const upsell = evaluateUpsellOpportunity(input);
  const feedbackState = input.lastOutcome ?? 'unknown';

  let nextIterationFocus = 'Continue observing usage until value realization is clear.';
  if (feedbackState === 'accepted_upgrade') {
    nextIterationFocus = 'Shift from conversion pressure to retention and expansion value proof.';
  } else if (feedbackState === 'dismissed') {
    nextIterationFocus = 'Reduce prompt frequency and wait for stronger export or client-growth signals.';
  } else if (upsell.shouldSuggestUpgrade) {
    nextIterationFocus = 'Show contextual upgrade suggestion after value is created, then feed the result back into scoring.';
  } else if (lifecycle.stage === 'activation') {
    nextIterationFocus = 'Accelerate first invoice or quote creation before any paid prompt.';
  }

  return {
    lifecycle,
    arpu,
    upsell,
    feedbackState,
    nextIterationFocus,
  };
}
