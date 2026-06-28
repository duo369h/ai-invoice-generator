/**
 * AI Decision Overlay Layer (Disabled) — Corvioz v8.5
 *
 * Scoring logic disabled to consolidate into unifiedDecisionEngine.
 */

export interface AISignals {
  aiUpgradeProbability?: number;
  aiChurnPrediction?: number;
  aiRecommendedPlan?: 'pro' | 'growth' | 'studio';
  aiConfidenceBoost?: number;
  aiReasoning?: string[];
  aiOverrideSuggestion?: boolean;
}

/**
 * Inert fallback stub for AI decision overlay.
 */
export function enhanceDecisionWithAI(input: any): AISignals {
  return {
    aiUpgradeProbability: 0,
    aiChurnPrediction: 0,
    aiRecommendedPlan: undefined,
    aiConfidenceBoost: 0,
    aiReasoning: [],
    aiOverrideSuggestion: false,
  };
}
