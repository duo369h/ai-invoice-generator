/**
 * Decision Diff Engine — Corvioz v5.2.2 Telemetry Layer
 *
 * Compares outcomes from legacy executionEngine vs modern unifiedDecisionEngine.
 * STRICTLY READ-ONLY. No runtime mutations.
 */

import { executeUpgradeStrategy } from '../../../lib/execution/executionEngine';
import { getUnifiedDecision } from '../../../lib/execution/unifiedDecisionEngine';

export interface DecisionDiffResult {
  classification: 'MATCH' | 'MINOR_DIFF' | 'CRITICAL_DIFF';
  revenueImpactScore: number;
  legacy: {
    recommendedPlan: string;
    shouldShowBanner: boolean;
    shouldShowModal: boolean;
    confidence: number;
    reason: string;
  };
  modern: {
    recommendedPlan: string;
    shouldShowBanner: boolean;
    shouldShowModal: boolean;
    confidence: number;
    reason: string;
  };
}

/**
 * Executes both engines shadow-style and compares the outputs.
 */
export function compareUpgradeDecisions(userId: string | null): DecisionDiffResult {
  // Execute legacy engine
  const legacyOut = executeUpgradeStrategy(userId);

  // Execute modern engine
  const modernOut = getUnifiedDecision(userId);

  const legacyPlan = legacyOut.recommendedPlan as string;
  const modernPlan = modernOut.recommendedPlan as string;

  const legacyBanner = legacyOut.shouldShowBanner;
  const modernBanner = modernOut.upgradeSignal.showBanner;

  const legacyModal = legacyOut.shouldShowModal;
  const modernModal = modernOut.upgradeSignal.showModal;

  let classification: DecisionDiffResult['classification'] = 'MATCH';
  let revenueImpactScore = 0;

  if (legacyPlan !== modernPlan) {
    classification = 'CRITICAL_DIFF';
    
    // Revenue leakage score calculation
    if (modernPlan === 'pro' || modernPlan === 'studio') {
      if (legacyPlan === 'starter' || legacyPlan === 'free') {
        revenueImpactScore = 80; // High upgrade potential missed by legacy
      } else {
        revenueImpactScore = 50;
      }
    } else if (legacyPlan === 'pro' || legacyPlan === 'studio') {
      revenueImpactScore = 40; // Risk of user frustration / false positive upsell gating
    } else {
      revenueImpactScore = 50;
    }

  } else if (legacyBanner !== modernBanner || legacyModal !== modernModal) {
    classification = 'MINOR_DIFF';
    revenueImpactScore = 10;
  }

  return {
    classification,
    revenueImpactScore,
    legacy: {
      recommendedPlan: legacyPlan,
      shouldShowBanner: legacyBanner,
      shouldShowModal: legacyModal,
      confidence: legacyOut.confidence,
      reason: legacyOut.reason,
    },
    modern: {
      recommendedPlan: modernPlan,
      shouldShowBanner: modernBanner,
      shouldShowModal: modernModal,
      confidence: Math.round(modernOut.confidence * 100),
      reason: modernOut.reason,
    },
  };
}
