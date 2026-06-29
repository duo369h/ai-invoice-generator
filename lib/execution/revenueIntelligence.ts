/**
 * Revenue Intelligence Layer (Brain) — Corvioz v6
 *
 * Computes raw analytical metrics, scoring probabilities, and upgrade recommendations.
 * Contains NO UI styling, signals, or design variables.
 */

import { readSignalsFromStorage } from '../monetization/upgradeTriggerEngine';
import { computeUpgradeScores } from '../monetization/upgradeScoringEngine';
import { allowUpgradeExposure } from './safetyGuard';
import { UIDecisionContext } from './index';

export interface RevenueMetrics {
  recommendedPlan: 'starter' | 'pro' | 'studio' | null;
  confidence: number;
  reason: string;
  cooldown: number;
  shouldShowUpgrade: boolean;
  intensity: 'low' | 'medium' | 'high';
}

/**
 * Computes raw monetization metrics and recommendations from user activity.
 */
export function computeRevenueMetrics(context: UIDecisionContext): RevenueMetrics {
  const user = context?.user;
  const userId = user?.id || null;
  const userPlan = user?.plan || 'free';

  // 1. Fetch default signals from storage
  const signals = readSignalsFromStorage(userPlan, !!userId);

  // 2. Read usage stats with context overrides
  const invoice_count = typeof context?.usageStats?.invoicesCount === 'number'
    ? context.usageStats.invoicesCount
    : typeof context?.usageStats?.invoice_count === 'number'
    ? context.usageStats.invoice_count
    : signals.invoice_count;

  const export_actions = typeof context?.usageStats?.exportsCount === 'number'
    ? context.usageStats.exportsCount
    : typeof context?.usageStats?.export_count === 'number'
    ? context.usageStats.export_count
    : typeof context?.usageStats?.export_actions === 'number'
    ? context.usageStats.export_actions
    : signals.export_count;

  const client_portal_usage = typeof context?.usageStats?.clientPortalViews === 'number'
    ? context.usageStats.clientPortalViews / 10
    : typeof context?.usageStats?.client_portal_usage === 'number'
    ? context.usageStats.client_portal_usage
    : (typeof window !== 'undefined' ? Number(window.localStorage.getItem('corvioz_client_portal_views') || 0) : 0) / 10;

  // 3. Compute upgrade scoring metrics using the scoring engine
  const scores = computeUpgradeScores({
    usage: {
      invoice_count,
      quote_count: typeof context?.usageStats?.quotesCount === 'number'
        ? context.usageStats.quotesCount
        : typeof context?.usageStats?.quote_count === 'number'
        ? context.usageStats.quote_count
        : signals.quote_count,
      export_count: export_actions,
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
    current_plan: userPlan,
    is_authenticated: !!userId,
  });

  const upgrade_probability = Math.max(scores.pro_score, scores.growth_score, scores.studio_score) / 100;
  const churn_risk = scores.churn_risk / 100;

  let recommendedPlan: 'starter' | 'pro' | 'studio' | null = null;
  let confidence = 0;
  let reason = '';
  let exposureType: 'banner' | 'modal' | null = null;

  // 4. Deterministic upgrade rules evaluation
  // Rule 1: Studio Plan
  if (client_portal_usage > 0.7) {
    recommendedPlan = 'studio';
    confidence = Math.round(Math.max(scores.studio_score, client_portal_usage * 100));
    reason = 'Your client portal activity is high (exceeding 70%). Studio is recommended for dedicated client management.';
    exposureType = 'modal';
  }
  // Rule 2: Pro Plan
  else if (invoice_count > 5 && export_actions > 3) {
    recommendedPlan = 'pro';
    confidence = scores.growth_score || 75;
    reason = 'Active creation and export behavior detected (over 5 invoices and 3 exports). Pro recommended.';
    exposureType = 'banner';
  }
  // Rule 3: Starter Plan
  else if (upgrade_probability > 0.25 && churn_risk < 0.7) {
    recommendedPlan = 'starter';
    confidence = Math.round(upgrade_probability * 100);
    reason = 'Strong initial conversion probability with low churn risk. Starter recommended.';
    exposureType = 'banner';
  }

  // 5. Enforce safety limit constraints (frequency checks / cooldowns)
  let shouldShowUpgrade = false;
  let cooldown = 0;

  if (userId && typeof window !== 'undefined') {
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
  }

  if (recommendedPlan && exposureType && userId) {
    // Persistent pricing page highlight does not pop up disruptive modals/banners,
    // so we skip safety capping for pricing page to ensure visual consistency.
    if (context.page === 'pricing') {
      shouldShowUpgrade = true;
    } else {
      shouldShowUpgrade = allowUpgradeExposure(userId, exposureType);
    }
  }

  const intensity = confidence > 75 ? 'high' : confidence > 25 ? 'medium' : 'low';

  return {
    recommendedPlan,
    confidence,
    reason: reason || 'Standard tier usage. No upgrade triggers met.',
    cooldown,
    shouldShowUpgrade,
    intensity,
  };
}
