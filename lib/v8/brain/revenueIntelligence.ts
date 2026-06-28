/**
 * Revenue Intelligence Layer (Brain) — Corvioz v8
 *
 * Computes raw analytical metrics and scores.
 * STRICTLY NO UI logic, recommendations, or thresholds affecting UI.
 * Pure math + aggregation.
 */

export interface RevenueMetrics {
  ltv: number;
  churn_risk: number;
  upgrade_probability: number;
  arpu_score: number;
  engagement_score: number;
}

/**
 * Computes pure mathematical metrics based on local usage data.
 * @param userId - Unique identifier of the authenticated user.
 */
export function getRevenueMetrics(userId: string | null): RevenueMetrics {
  // SSR Safety Check
  if (typeof window === 'undefined' || !userId) {
    return {
      ltv: 0,
      churn_risk: 0,
      upgrade_probability: 0,
      arpu_score: 0,
      engagement_score: 0
    };
  }

  // 1. Gather usage signals from localStorage
  let invoicesCount = 0;
  let clientsCount = 0;
  let quotesCount = 0;
  try {
    const stats = JSON.parse(window.localStorage.getItem('corvioz_usage_stats') || '{}');
    invoicesCount = Number(stats.invoicesCount || stats.invoice_count || 0);
    clientsCount = Number(stats.clientsCount || stats.client_count || 0);
    quotesCount = Number(stats.quotesCount || stats.quote_count || 0);
  } catch (_) {}

  const exportPdf = Number(window.localStorage.getItem('corvioz_export_count') || 0);
  const pricingViewed = Number(window.localStorage.getItem('corvioz_pricing_view_count') || 0);
  const clientPortalViews = Number(window.localStorage.getItem('corvioz_client_portal_views') || 0);

  // Retrieve current user plan
  const userPlan = window.localStorage.getItem(`corvioz_user_plan_${userId}`) || 'free';

  // 2. Compute Engagement Score (0.0 to 1.0)
  const rawEngagement = (invoicesCount * 0.15) + (clientsCount * 0.2) + (exportPdf * 0.1) + (quotesCount * 0.1);
  const engagement_score = Math.min(1.0, rawEngagement);

  // 3. Compute Churn Risk (0.0 to 1.0)
  let baseChurn = 1.0 - engagement_score;
  if (userPlan !== 'free') {
    baseChurn *= 0.5; // Paid users have reduced default churn risk
  }
  const churn_risk = Math.max(0.0, Math.min(1.0, baseChurn));

  // 4. Compute Upgrade Probability (0.0 to 1.0)
  let rawUpgradeProb = (engagement_score * 0.7) + (pricingViewed * 0.1) + (clientPortalViews * 0.05);
  if (userPlan !== 'free') {
    rawUpgradeProb *= 0.4; // Multi-stage upgrading is naturally lower probability
  }
  const upgrade_probability = Math.max(0.0, Math.min(0.95, rawUpgradeProb));

  // 5. Compute LTV (Lifetime Value)
  let ltv = 0;
  if (userPlan === 'pro') {
    ltv = 15 * 12;
  } else if (userPlan === 'growth') {
    ltv = 49 * 12;
  } else if (userPlan === 'studio' || userPlan === 'agency') {
    ltv = 99 * 12;
  }

  // 6. Compute ARPU Score (0.0 to 1.0)
  const arpu_score = Math.min(1.0, (ltv / 1200) + (upgrade_probability * 0.3));

  return {
    ltv,
    churn_risk,
    upgrade_probability,
    arpu_score,
    engagement_score
  };
}
