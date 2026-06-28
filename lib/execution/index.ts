/**
 * Controlled Execution Layer — Unified Decision Engine Entry (v8.5)
 *
 * Exposes getUIDecision as a compatibility wrapper that delegates 100%
 * of decisions to getUnifiedDecision and translateDecision.
 */

import { getUnifiedDecision } from './unifiedDecisionEngine';
import { translateDecision } from './uiTranslator';

export interface UIDecisionContext {
  user?: {
    id?: string | null;
    plan?: string | null;
  } | null;
  usageStats?: any;
  planData?: any;
  page?: string;
}

export interface UIDecisionOutput {
  shouldShowUpgrade: boolean;
  targetPlan: 'pro' | 'growth' | 'studio' | null;
  confidence: number;
  reason: string;
  cooldown?: number;
  ui: {
    highlightPlan: string | null;
    showBadge: boolean;
    intensity: 'low' | 'medium' | 'high';
    ctaState: 'normal' | 'emphasized' | 'disabled';
    visualIntensity: number;
    badgeText?: string | null;
    planOrder?: string[];
    pricingCardHighlight?: string | null;
    dashboardCardVisible?: boolean;
  };
  aiSignals?: any;
  revenueLoop?: any;
}

/**
 * Compatibility wrapper for getUIDecision.
 */
export function getUIDecision(context: UIDecisionContext): UIDecisionOutput {
  const userId = context?.user?.id || null;
  
  // Delegate entirely to unifiedDecisionEngine
  const decision = getUnifiedDecision(userId);
  const ui = translateDecision(decision);

  const targetPlan = decision.recommendedPlan === 'free' ? null : decision.recommendedPlan;

  return {
    shouldShowUpgrade: decision.upgradeSignal.showBanner || decision.upgradeSignal.showModal,
    targetPlan,
    confidence: Math.round(decision.confidence * 100),
    reason: decision.reason,
    ui: {
      highlightPlan: targetPlan,
      showBadge: targetPlan !== null,
      intensity: decision.confidence > 0.45 ? 'medium' : 'low',
      ctaState: targetPlan !== null ? 'emphasized' : 'normal',
      visualIntensity: decision.confidence,
      badgeText: targetPlan !== null ? 'RECOMMENDED' : null,
      planOrder: ['free', 'pro', 'growth', 'studio'],
      pricingCardHighlight: targetPlan,
      dashboardCardVisible: !decision.riskSignal.isChurnBlocked,
    },
  };
}
