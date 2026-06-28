/**
 * Safety Guard Layer — Corvioz v8
 *
 * Prevents aggressive or repeated monetization behavior.
 * Enforces strict frequency caps and cooldown rules.
 */

import { RevenueMetrics } from '../brain/revenueIntelligence';

export interface SafetyState {
  allowed: boolean;
  reason: string;
}

export interface ExposureRecord {
  timestamp: number;
  type: 'banner' | 'modal';
  plan: string;
}

const HISTORY_KEY_PREFIX = 'corvioz_growth_history_';
const COOLDOWN_MS = 24 * 60 * 60 * 1000; // 24-hour user fatigue cooldown

/**
 * Checks if a monetization exposure is allowed under safety fatigue constraints.
 *
 * @param userId - Unique user identifier.
 * @param strategy - Candidate strategy name.
 * @param metrics - Current revenue intelligence metrics.
 * @param targetPlan - The target upgrade plan ('pro' | 'growth' | 'studio' | null).
 */
export function evaluateSafety(
  userId: string | null,
  strategy: string,
  metrics: RevenueMetrics,
  targetPlan: string | null
): SafetyState {
  if (!userId) {
    return { allowed: false, reason: 'No authenticated user ID.' };
  }

  if (typeof window === 'undefined') {
    return { allowed: false, reason: 'SSR fallback state.' };
  }

  // 1. User in onboarding block condition (<24 hours since signup)
  const createdAtStr = window.localStorage.getItem(`corvioz_user_created_at_${userId}`);
  if (createdAtStr) {
    const elapsedOnboarding = Date.now() - new Date(createdAtStr).getTime();
    if (elapsedOnboarding < COOLDOWN_MS) {
      return { allowed: false, reason: 'User in onboarding phase (<24h cooldown).' };
    }
  }

  // 2. High churn anxiety user block condition
  if (metrics.churn_risk > 0.7) {
    return { allowed: false, reason: 'High churn anxiety user block.' };
  }

  // Read exposure history from localStorage
  const historyKey = `${HISTORY_KEY_PREFIX}${userId}`;
  let history: ExposureRecord[] = [];
  try {
    const stored = window.localStorage.getItem(historyKey);
    if (stored) {
      history = JSON.parse(stored);
    }
  } catch (_) {}

  const now = Date.now();
  const oneDayAgo = now - COOLDOWN_MS;
  const recentHistory = history.filter((h) => h.timestamp > oneDayAgo);

  // 3. Cooldown: Recent upgrade shown (any exposure in last 24h blocks subsequent ones)
  if (recentHistory.length > 0) {
    return { allowed: false, reason: 'Recent upgrade shown (within 24h cooldown).' };
  }

  // 4. Repeated exposure same plan block condition (within last 7 days)
  const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;
  const samePlanHistory = history.filter((h) => h.plan === targetPlan && h.timestamp > sevenDaysAgo);
  if (targetPlan && samePlanHistory.length > 0) {
    return { allowed: false, reason: `Repeated exposure to same plan (${targetPlan}) within 7 days.` };
  }

  // 5. Hard limit caps: maxUpsellsPerDay = 1 (modals), maxBannersPerDay = 2 (banners)
  const modalsCount = recentHistory.filter((h) => h.type === 'modal').length;
  if (modalsCount >= 1) {
    return { allowed: false, reason: 'Max upsells (modals) per day reached (limit: 1).' };
  }

  const bannersCount = recentHistory.filter((h) => h.type === 'banner').length;
  if (bannersCount >= 2) {
    return { allowed: false, reason: 'Max banners per day reached (limit: 2).' };
  }

  return { allowed: true, reason: 'Safety checks passed.' };
}

/**
 * Records a successful growth system UI exposure.
 */
export function recordGrowthExposure(userId: string, type: 'banner' | 'modal', plan: string): void {
  if (typeof window === 'undefined' || !userId) return;
  const historyKey = `${HISTORY_KEY_PREFIX}${userId}`;
  let history: ExposureRecord[] = [];
  try {
    const stored = window.localStorage.getItem(historyKey);
    if (stored) {
      history = JSON.parse(stored);
    }
  } catch (_) {}

  history.push({ timestamp: Date.now(), type, plan });

  try {
    // Retain last 20 history records to avoid storage bloat
    window.localStorage.setItem(historyKey, JSON.stringify(history.slice(-20)));
  } catch (_) {}
}
