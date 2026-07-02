/**
 * Controlled Execution Layer Engine — Corvioz v5.5
 *
 * Deterministic engine that converts scores and signals into safe UI actions.
 * Never mutates prices, billing, or subscription states.
 */

import { readSignalsFromStorage } from '../monetization/upgradeTriggerEngine';
import { computeUpgradeScores } from '../monetization/upgradeScoringEngine';

export interface ExecutionOutput {
  shouldShowBanner: boolean;
  shouldShowModal: boolean;
  recommendedPlan: 'free' | 'starter' | 'pro' | 'studio';
  confidence: number; // 0-100 percentage
  reason: string;
  cooldown: number; // remaining cooldown in seconds (0 = active/no cooldown)
}

/**
 * Evaluates the monetization recommendations and returns the safe UI execution decision.
 *
 * @param userId - Current authenticated user ID (optional)
 */
export function executeUpgradeStrategy(userId: string | null | undefined): ExecutionOutput {
  // SSR Safety Check
  if (typeof window === 'undefined' || !userId) {
    return {
      shouldShowBanner: false,
      shouldShowModal: false,
      recommendedPlan: 'free',
      confidence: 0,
      reason: 'Execution layer inactive (SSR or unauthenticated).',
      cooldown: 0,
    };
  }

  // 1. Fetch User Signals from local storage
  const signals = readSignalsFromStorage('free', true); // Assumes free base

  // Extract usage counts and features
  const invoice_count = signals.invoice_count;
  const export_actions = signals.export_count; // maps to exportsCount / corvioz_export_count
  const client_portal_usage = Number(window.localStorage.getItem('corvioz_client_portal_views') || 0) / 10;

  // 2. Compute Upgrade Scores (upgrade_probability, churn_risk)
  const scores = computeUpgradeScores({
    usage: {
      invoice_count: signals.invoice_count,
      quote_count: signals.quote_count,
      export_count: signals.export_count,
    },
    behavior: {
      scroll_depth: signals.scroll_depth,
      return_user_frequency: signals.return_user_frequency,
      time_on_page: 0,
      tab_switch_count: 0,
    },
    session: {
      pricing_view_count: signals.pricing_view_count,
    },
    intent: {},
    current_plan: signals.plan,
    is_authenticated: signals.is_authenticated,
  });

  const upgrade_probability = Math.max(scores.pro_score, scores.growth_score, scores.studio_score) / 100;
  const churn_risk = scores.churn_risk / 100;

  // Calculate Cooldown from storage
  let cooldown = 0;
  try {
    const stored = window.localStorage.getItem(`corvioz_exec_history_${userId}`);
    if (stored) {
      const history = JSON.parse(stored);
      if (Array.isArray(history) && history.length > 0) {
        const lastExec = history[history.length - 1];
        const elapsed = Date.now() - lastExec.timestamp;
        if (elapsed < 60000) {
          cooldown = Math.ceil((60000 - elapsed) / 1000);
        }
      }
    }
  } catch (_) {}

  // ─── Rule 1: Studio Rule ───
  if (client_portal_usage > 0.7) {
    return {
      shouldShowBanner: false,
      shouldShowModal: true,
      recommendedPlan: 'studio',
      confidence: Math.round(Math.max(scores.studio_score, client_portal_usage * 100)),
      reason: 'Your client portal activity is high (exceeding 70%). Studio is recommended for dedicated client management.',
      cooldown,
    };
  }

  // --- Rule 2: Pro Rule ---
  if (invoice_count > 5 && export_actions > 3) {
    return {
      shouldShowBanner: true,
      shouldShowModal: false,
      recommendedPlan: 'pro',
      confidence: scores.growth_score || 75,
      reason: 'Active creation and export behavior detected (over 5 invoices and 3 exports). Pro recommended.',
      cooldown,
    };
  }

  // --- Rule 3: Starter Rule ---
  if (upgrade_probability > 0.25 && churn_risk < 0.7) {
    return {
      shouldShowBanner: true,
      shouldShowModal: false,
      recommendedPlan: 'starter',
      confidence: Math.round(upgrade_probability * 100),
      reason: 'Strong initial conversion probability with low churn risk. Starter recommended.',
      cooldown,
    };
  }

  // Fallback: No strategy matches
  return {
    shouldShowBanner: false,
    shouldShowModal: false,
    recommendedPlan: 'free',
    confidence: 0,
    reason: 'Standard tier usage. No upgrade triggers met.',
    cooldown,
  };
}
