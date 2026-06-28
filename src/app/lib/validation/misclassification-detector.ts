export type MisclassificationAction = 'allow' | 'block' | 'upsell' | 'redirect' | 'paywall' | string;

export type MisclassificationSample = {
  intent_score?: number;
  value_score?: number;
  funnel_step?: string;
  action_type?: string;
  recommended_action?: MisclassificationAction;
  pricing_action?: string;
  paywall_action?: string;
  export_attempt_count?: number;
};

export type MisclassificationInput = MisclassificationSample | {
  samples?: MisclassificationSample[];
};

export type MisclassificationResult = {
  false_positive_rate: number;
  false_negative_rate: number;
  warning: string[];
};

const MONETIZATION_ACTIONS = new Set(['block', 'upsell', 'redirect', 'paywall', 'hard_paywall']);
const BLOCKING_ACTIONS = new Set(['block', 'paywall', 'hard_paywall']);

function toNumber(value: unknown, fallback = 0) {
  const next = Number(value ?? fallback);
  return Number.isFinite(next) ? next : fallback;
}

function clampScore(value: unknown) {
  return Math.max(0, Math.min(100, toNumber(value, 0)));
}

function normalize(value: unknown) {
  return String(value || '').trim().toLowerCase();
}

function getSamples(input: MisclassificationInput = {}) {
  if ('samples' in input && Array.isArray(input.samples)) return input.samples;
  return [input as MisclassificationSample];
}

function roundRate(value: number) {
  return Math.round(value * 1000) / 1000;
}

export function detectMisclassification(input: MisclassificationInput = {}): MisclassificationResult {
  const samples = getSamples(input).filter(Boolean);
  if (samples.length === 0) {
    return {
      false_positive_rate: 0,
      false_negative_rate: 0,
      warning: [],
    };
  }

  let falsePositiveCount = 0;
  let falseNegativeCount = 0;
  let monetizedCount = 0;
  let highIntentCount = 0;
  const warnings = new Set<string>();

  samples.forEach((sample) => {
    const intentScore = clampScore(sample.intent_score);
    const valueScore = clampScore(sample.value_score);
    const actionType = normalize(sample.action_type);
    const funnelStep = normalize(sample.funnel_step);
    const recommendedAction = normalize(sample.recommended_action);
    const pricingAction = normalize(sample.pricing_action);
    const paywallAction = normalize(sample.paywall_action);
    const exportAttempts = Math.max(0, toNumber(sample.export_attempt_count, 0));
    const isExportUser = actionType.includes('export') || funnelStep.includes('export') || exportAttempts > 0;
    const isMonetized = MONETIZATION_ACTIONS.has(recommendedAction) || MONETIZATION_ACTIONS.has(paywallAction);
    const isBlocked = BLOCKING_ACTIONS.has(recommendedAction) || BLOCKING_ACTIONS.has(paywallAction);
    const isPromoted = isMonetized || pricingAction.includes('pro') || pricingAction.includes('premium');
    const highIntent = intentScore >= 70 || valueScore >= 70;

    if (isMonetized) monetizedCount += 1;
    if (highIntent) highIntentCount += 1;

    if (highIntent && isBlocked) {
      falsePositiveCount += 1;
      warnings.add('High-intent user is being blocked; soften to upsell or redirect unless this is a paid export moment.');
    }

    if (intentScore <= 30 && valueScore <= 35 && isPromoted) {
      falsePositiveCount += 1;
      warnings.add('Low-intent user is being promoted too early; delay monetization until activation intent increases.');
    }

    if (isExportUser && exportAttempts <= 1 && intentScore < 70 && isBlocked) {
      falsePositiveCount += 1;
      warnings.add('Export user may be paywalled too early; allow first value or use a soft upsell.');
    }

    if (highIntent && !isMonetized) {
      falseNegativeCount += 1;
      warnings.add('High-intent user is allowed without monetization; consider checkout redirect or Pro upsell.');
    }
  });

  return {
    false_positive_rate: roundRate(falsePositiveCount / Math.max(1, monetizedCount || samples.length)),
    false_negative_rate: roundRate(falseNegativeCount / Math.max(1, highIntentCount || samples.length)),
    warning: Array.from(warnings),
  };
}
