'use client';

import { getIntentScore, type IntentScoreResult } from './intent-score';

export type DynamicPricingState = {
  pricing_mode: 'normal' | 'highlight_pro' | 'urgent_pro';
  highlighted_plan: 'none' | 'pro';
  urgency_message: string;
  stage: IntentScoreResult['stage'];
};

export function getDynamicPricingState(intent: IntentScoreResult = getIntentScore()): DynamicPricingState {
  if (intent.stage === 'hot' || intent.stage === 'ready_to_pay') {
    return {
      pricing_mode: 'urgent_pro',
      highlighted_plan: 'pro',
      urgency_message: 'Your first invoice is ready. Unlock Pro to send it.',
      stage: intent.stage,
    };
  }

  if (intent.stage === 'warm') {
    return {
      pricing_mode: 'highlight_pro',
      highlighted_plan: 'pro',
      urgency_message: '',
      stage: intent.stage,
    };
  }

  return {
    pricing_mode: 'normal',
    highlighted_plan: 'none',
    urgency_message: '',
    stage: 'cold',
  };
}
