'use client';

/**
 * useUpgradeTrigger — Corvioz v8.5 Unified Decision Hook
 *
 * Wraps the unifiedDecisionEngine. All local scoring and rule-based
 * calculations are completely disabled.
 */

import { useState, useEffect } from 'react';
import { getUnifiedDecision } from 'lib/execution/unifiedDecisionEngine';

interface UseUpgradeTriggerOptions {
  plan: string;
  isAuthenticated: boolean;
  signalOverrides?: any;
  enabled?: boolean;
  pageContext?: string;
  userId?: string | null;
}

interface UseUpgradeTriggerResult {
  decision: {
    should_show_upgrade: boolean;
    target_plan: 'pro' | 'growth' | 'studio' | null;
    reason: string;
    confidence: number;
    trigger_type: string;
  };
  scores: {
    pro_score: number;
    growth_score: number;
    studio_score: number;
    churn_risk: number;
    revenue_potential: number;
  };
  offer: {
    message: string;
    cta_text: string;
    offer_type: string;
  };
  isReady: boolean;
  dismiss: () => void;
}

export function useUpgradeTrigger({
  plan,
  isAuthenticated,
  enabled = true,
  pageContext = 'dashboard',
  userId = null,
}: UseUpgradeTriggerOptions): UseUpgradeTriggerResult {
  const [isReady, setIsReady] = useState(false);

  const activeUserId = userId || (typeof window !== 'undefined' ? window.sessionStorage.getItem('corvioz_analytics_user_id') : null);
  const decision = getUnifiedDecision(activeUserId);

  const mappedDecision = {
    should_show_upgrade: decision.upgradeSignal.showBanner || decision.upgradeSignal.showModal,
    target_plan: decision.recommendedPlan === 'free' ? null : decision.recommendedPlan,
    reason: decision.reason,
    confidence: Math.round(decision.confidence * 100),
    trigger_type: 'usage',
  };

  const mappedScores = {
    pro_score: decision.recommendedPlan === 'pro' ? 80 : 0,
    growth_score: decision.recommendedPlan === 'growth' ? 80 : 0,
    studio_score: decision.recommendedPlan === 'studio' ? 80 : 0,
    churn_risk: Math.round(decision.riskSignal.churnRisk * 100),
    revenue_potential: 0,
  };

  const mappedOffer = {
    message: decision.reason,
    cta_text: 'Upgrade Now',
    offer_type: decision.upgradeSignal.showModal ? 'modal' : 'soft_banner',
  };

  useEffect(() => {
    if (enabled) {
      setIsReady(true);
    }
  }, [enabled]);

  const dismiss = () => {
    if (typeof window !== 'undefined') {
      window.sessionStorage.setItem('corvioz_upgrade_trigger_dismissed', 'true');
    }
  };

  return {
    decision: mappedDecision,
    scores: mappedScores,
    offer: mappedOffer,
    isReady,
    dismiss,
  };
}
