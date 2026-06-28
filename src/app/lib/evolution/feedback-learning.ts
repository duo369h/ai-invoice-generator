export type RevenueFeedbackInput = {
  expected_revenue?: number;
  actual_revenue?: number;
  current_weights?: Record<string, number>;
  intent_model?: Record<string, number>;
};

export type RevenueFeedbackLearningResult = {
  revenue_error: number;
  adjusted_weights: Record<string, number>;
  refined_intent_model: Record<string, number>;
};

const DEFAULT_WEIGHTS: Record<string, number> = {
  invoice_created_count: 0.24,
  quote_created_count: 0.18,
  export_actions: 0.2,
  pricing_page_visits: 0.16,
  session_time: 0.1,
  return_user_frequency: 0.12,
};

function toNumber(value: unknown, fallback = 0) {
  const next = Number(value ?? fallback);
  return Number.isFinite(next) ? next : fallback;
}

function clamp(value: number, min = 0, max = 1) {
  return Math.max(min, Math.min(max, value));
}

function normalizeWeights(weights: Record<string, number>) {
  const total = Object.values(weights).reduce((sum, value) => sum + Math.max(0, value), 0) || 1;
  return Object.fromEntries(Object.entries(weights).map(([key, value]) => [key, Math.round((Math.max(0, value) / total) * 10000) / 10000]));
}

export function learnFromRevenueFeedback(input: RevenueFeedbackInput = {}): RevenueFeedbackLearningResult {
  const expected = Math.max(0, toNumber(input.expected_revenue, 0));
  const actual = Math.max(0, toNumber(input.actual_revenue, expected));
  const revenueError = expected > 0 ? (actual - expected) / expected : 0;
  const learningRate = 0.08;
  const weights = { ...DEFAULT_WEIGHTS, ...(input.current_weights || {}) };
  const intentModel = { ...weights, ...(input.intent_model || {}) };

  const adjustedWeights = normalizeWeights({
    ...weights,
    export_actions: clamp(weights.export_actions + revenueError * learningRate),
    pricing_page_visits: clamp(weights.pricing_page_visits + revenueError * learningRate * 0.7),
    invoice_created_count: clamp(weights.invoice_created_count + revenueError * learningRate * 0.5),
    session_time: clamp(weights.session_time - revenueError * learningRate * 0.25),
  });

  const refinedIntentModel = normalizeWeights({
    ...intentModel,
    pricing_page_visits: clamp((intentModel.pricing_page_visits || DEFAULT_WEIGHTS.pricing_page_visits) + revenueError * learningRate),
    export_actions: clamp((intentModel.export_actions || DEFAULT_WEIGHTS.export_actions) + revenueError * learningRate),
    return_user_frequency: clamp((intentModel.return_user_frequency || DEFAULT_WEIGHTS.return_user_frequency) - Math.min(0, revenueError) * learningRate),
  });

  return {
    revenue_error: Math.round(revenueError * 10000) / 10000,
    adjusted_weights: adjustedWeights,
    refined_intent_model: refinedIntentModel,
  };
}
