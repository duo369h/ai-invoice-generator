/**
 * Pricing Deterministic Mapper — Corvioz v5.7
 *
 * Enforces pure rule-based visual translation of execution decisions.
 * MUST NOT use session, userPlan, or URL parameters directly.
 */

import { UIDecisionOutput } from '../execution';

export interface PricingMapperInput {
  uiDecision: UIDecisionOutput;
  planId: string;
}

export interface PricingMapperOutput {
  highlightedPlan: 'pro' | 'growth' | 'studio' | null;
  badge: 'RECOMMENDED' | null;
  ctaState: 'normal' | 'emphasized' | 'disabled';
  visualIntensity: number; // 0-1 scale mapping confidence
  reason: string;
}

export function mapPricingViewModel(input: PricingMapperInput): PricingMapperOutput {
  const { uiDecision, planId } = input;
  
  const isTarget = uiDecision?.targetPlan === planId;
  const showBadge = !!(isTarget && uiDecision?.ui?.showBadge);

  const target = uiDecision?.targetPlan;
  const highlightedPlan = (target === 'pro' || target === 'growth' || target === 'studio') ? target : null;

  // Consume UI Decision Translator signals directly
  const ctaState = isTarget ? (uiDecision?.ui?.ctaState || 'normal') : 'normal';
  const visualIntensity = isTarget ? (uiDecision?.ui?.visualIntensity ?? 0.0) : 0.0;

  return {
    highlightedPlan,
    badge: showBadge ? 'RECOMMENDED' : null,
    ctaState,
    visualIntensity,
    reason: uiDecision?.reason || '',
  };
}
