/**
 * Revenue Optimization Loop - Revenue Opportunity Engine — Corvioz v8
 *
 * Detects specific revenue upsells or retention opportunities (intervention signals).
 */

import { BehaviorSignals } from './behaviorTracker';
import { UserFunnelStage } from './funnelClassifier';

export interface InterventionSignals {
  opportunityDetected: boolean;
  opportunityType: 'upsell_pro' | 'upsell_growth' | 'churn_mitigation' | 'value_education' | null;
  confidence: number;
  recommendedIntervention: string;
}

/**
 * Identifies appropriate revenue opportunities based on funnel classification.
 */
export function detectRevenueOpportunities(
  funnelStage: UserFunnelStage,
  signals: BehaviorSignals
): InterventionSignals {
  console.log(`[REVENUE_LOOP_ENGINE] Evaluating opportunities for stage: ${funnelStage}`);

  let opportunityDetected = false;
  let opportunityType: InterventionSignals['opportunityType'] = null;
  let confidence = 0;
  let recommendedIntervention = 'No intervention required.';

  switch (funnelStage) {
    case 'near_conversion':
      opportunityDetected = true;
      opportunityType = 'upsell_pro';
      confidence = 85;
      recommendedIntervention = 'Trigger Pro tier discount presentation overlay.';
      break;

    case 'power_user':
      opportunityDetected = true;
      opportunityType = 'upsell_growth';
      confidence = 90;
      recommendedIntervention = 'Promote Growth team-collaboration features.';
      break;

    case 'churn_risk':
      opportunityDetected = true;
      opportunityType = 'churn_mitigation';
      confidence = 70;
      recommendedIntervention = 'Showcase free template libraries and client communication tools.';
      break;

    case 'active':
      opportunityDetected = true;
      opportunityType = 'value_education';
      confidence = 60;
      recommendedIntervention = 'Highlight billing automation benefits.';
      break;

    default:
      break;
  }

  return {
    opportunityDetected,
    opportunityType,
    confidence,
    recommendedIntervention,
  };
}
