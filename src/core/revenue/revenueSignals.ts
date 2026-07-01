import type { ConversionEventName, IndustryIntentLevel } from '../analytics/conversionEvents';

export type RevenueSignalInput = {
  pageDepth: number;
  ctaClicks: number;
  templateUsageIntent: 'none' | 'invoice' | 'quote' | 'proposal' | 'multiple';
  pricingPageVisits: number;
  repeatVisits: number;
  industryIntentLevel: IndustryIntentLevel;
  industryMonetizationStrength: 1 | 2 | 3 | 4 | 5;
  events?: ConversionEventName[];
};

export type RevenueSignalScore = {
  score: number;
  readiness: 'cold' | 'warming' | 'high_intent' | 'checkout_ready';
  dominantSignals: string[];
  recommendedValidationFocus: string;
};

const EVENT_WEIGHTS: Record<ConversionEventName, number> = {
  VIEW_INVOICE_TEMPLATE: 8,
  VIEW_QUOTE_TEMPLATE: 10,
  VIEW_PROPOSAL_TEMPLATE: 12,
  CLICK_CREATE_QUOTE: 18,
  CLICK_CREATE_INVOICE: 16,
  CLICK_SIGNUP: 22,
  START_ONBOARDING: 28,
  COMPLETE_ONBOARDING: 36,
  VIEW_PRICING: 26,
  SELECT_PLAN: 42,
  START_CHECKOUT: 55,
};

const templateIntentWeights: Record<RevenueSignalInput['templateUsageIntent'], number> = {
  none: 0,
  invoice: 12,
  quote: 15,
  proposal: 18,
  multiple: 24,
};

const industryIntentWeights: Record<IndustryIntentLevel, number> = {
  high_intent: 18,
  medium_intent: 10,
  exploration_intent: 4,
};

function clampScore(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function getReadiness(score: number): RevenueSignalScore['readiness'] {
  if (score >= 82) return 'checkout_ready';
  if (score >= 62) return 'high_intent';
  if (score >= 36) return 'warming';
  return 'cold';
}

function getRecommendedValidationFocus(score: number, input: RevenueSignalInput): string {
  if (score >= 82) return 'Measure checkout completion and payment trust objections.';
  if (input.pricingPageVisits > 0 && input.ctaClicks === 0) return 'Improve CTA clarity before pricing handoff.';
  if (input.ctaClicks > 0 && input.repeatVisits > 1) return 'Measure signup friction and onboarding continuation.';
  if (input.templateUsageIntent === 'none') return 'Improve template preview depth and relevance.';
  return 'Measure transition from template view to revenue action.';
}

export function scoreRevenueSignals(input: RevenueSignalInput): RevenueSignalScore {
  const eventScore = (input.events ?? []).reduce((total, event) => total + EVENT_WEIGHTS[event], 0);
  const depthScore = Math.min(16, Math.max(0, input.pageDepth) * 4);
  const ctaScore = Math.min(22, Math.max(0, input.ctaClicks) * 11);
  const pricingScore = Math.min(20, Math.max(0, input.pricingPageVisits) * 12);
  const repeatScore = Math.min(12, Math.max(0, input.repeatVisits - 1) * 4);
  const templateScore = templateIntentWeights[input.templateUsageIntent];
  const industryScore = industryIntentWeights[input.industryIntentLevel] + input.industryMonetizationStrength * 3;
  const score = clampScore(depthScore + ctaScore + pricingScore + repeatScore + templateScore + industryScore + eventScore * 0.35);

  const dominantSignals: string[] = [];
  if (input.ctaClicks > 0) dominantSignals.push('cta_click');
  if (input.pricingPageVisits > 0) dominantSignals.push('pricing_view');
  if (input.repeatVisits > 1) dominantSignals.push('repeat_visit');
  if (input.templateUsageIntent !== 'none') dominantSignals.push(`${input.templateUsageIntent}_template_intent`);
  if (input.industryIntentLevel === 'high_intent') dominantSignals.push('high_intent_industry');
  if ((input.events ?? []).includes('START_CHECKOUT')) dominantSignals.push('checkout_started');

  return {
    score,
    readiness: getReadiness(score),
    dominantSignals,
    recommendedValidationFocus: getRecommendedValidationFocus(score, input),
  };
}

export function getRevenueEventWeight(event: ConversionEventName): number {
  return EVENT_WEIGHTS[event];
}
