/**
 * Revenue Optimization Loop - ARPU Optimizer — Corvioz v8
 *
 * Estimates the expected Average Revenue Per User (ARPU) uplift per intervention suggestion.
 */

import { InterventionSignals } from './revenueEngine';

export interface ARPUOptimizationOutput {
  expectedUplift: number; // calculated uplift in dollars
  upliftScore: number;    // normalized score 0-100
}

/**
 * Computes the expected ARPU uplift score based on intervention confidence and opportunity value.
 */
export function computeArpuUplift(opportunity: InterventionSignals): ARPUOptimizationOutput {
  if (!opportunity.opportunityDetected || !opportunity.opportunityType) {
    return { expectedUplift: 0.0, upliftScore: 0 };
  }

  let baseARPUIncrease = 0; // value in dollars per month
  let conversionProbability = opportunity.confidence / 100;

  switch (opportunity.opportunityType) {
    case 'upsell_pro':
      baseARPUIncrease = 15; // Upgrade from Free to Pro
      break;
    case 'upsell_growth':
      baseARPUIncrease = 35; // Upgrade to Growth
      break;
    case 'churn_mitigation':
      baseARPUIncrease = 5;  // Prevents cancellation/loss of core engagement value
      break;
    case 'value_education':
      baseARPUIncrease = 8;  // Medium-term upsell target
      break;
  }

  const expectedUplift = parseFloat((baseARPUIncrease * conversionProbability).toFixed(2));
  const upliftScore = Math.round(conversionProbability * 100);

  console.log(
    `[REVENUE_LOOP_ARPU] Computed uplift for ${opportunity.opportunityType}: $${expectedUplift}/mo (Score: ${upliftScore})`
  );

  return {
    expectedUplift,
    upliftScore,
  };
}
