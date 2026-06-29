/**
 * Unified Decision Engine — Corvioz v8.5
 *
 * Single deterministic brain for upgrade, pricing, and UI decisions.
 * No scoring or thresholds allowed outside this layer.
 */

export interface UnifiedDecision {
  recommendedPlan: 'free' | 'starter' | 'pro' | 'studio';
  confidence: number; // 0-1
  upgradeSignal: {
    showBanner: boolean;
    showModal: boolean;
    highlightPlan: string | null;
  };
  riskSignal: {
    churnRisk: number;
    isChurnBlocked: boolean;
  };
  reason: string;
}

/**
 * Computes the single unified decision for a user.
 *
 * @param userId - Unique user identifier.
 */
export function getUnifiedDecision(userId: string | null): UnifiedDecision {
  // SSR / Anonymous Safety Check
  if (typeof window === 'undefined' || !userId) {
    return {
      recommendedPlan: 'free',
      confidence: 0,
      upgradeSignal: {
        showBanner: false,
        showModal: false,
        highlightPlan: null,
      },
      riskSignal: {
        churnRisk: 0.1,
        isChurnBlocked: false,
      },
      reason: 'Execution layer inactive (anonymous or server-side).',
    };
  }

  // Enforce isolation monitoring
  window.__IN_UI_DECISION_ENGINE__ = true;

  try {
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

    // Check if intent is stored in intent-store (localStorage)
    let intentDetected = false;
    try {
      intentDetected = window.localStorage.getItem('corvioz_selected_plan') !== null ||
                       window.localStorage.getItem('corvioz_intended_route') !== null;
    } catch (_) {}

    // 2. Deterministic Plan & Confidence Logic
    let recommendedPlan: 'free' | 'starter' | 'pro' | 'studio' = 'free';
    let confidence = 0.0;
    let reason = 'Standard free tier usage.';

    // Rule: studio → client_portal heavy usage
    if (clientPortalViews > 5) {
      recommendedPlan = 'studio';
      confidence = Math.min(1.0, 0.5 + (clientPortalViews - 5) * 0.1);
      reason = `Heavy client portal usage detected (${clientPortalViews} views). Studio plan recommended for client portal operations.`;
    }
    // Rule: pro -> repeated usage + exports + invoices
    else if (invoicesCount > 5 && exportPdf > 2) {
      recommendedPlan = 'pro';
      confidence = Math.min(1.0, 0.4 + (invoicesCount - 5) * 0.05 + (exportPdf - 2) * 0.05);
      reason = `Active invoicing and export volume detected (${invoicesCount} invoices, ${exportPdf} PDF exports). Pro plan recommended.`;
    }
    // Rule: starter -> usage + intent detected
    else if (invoicesCount > 0 || quotesCount > 0 || pricingViewed > 0 || intentDetected) {
      recommendedPlan = 'starter';
      const usageScore = (invoicesCount > 0 ? 0.2 : 0) + (quotesCount > 0 ? 0.1 : 0);
      const intentScore = (pricingViewed > 0 ? 0.1 : 0) + (intentDetected ? 0.2 : 0);
      confidence = Math.min(1.0, 0.15 + usageScore + intentScore);
      reason = 'Workflow activity or upgrade intent detected. Starter plan recommended.';
    }

    // 3. Churn Risk Evaluation
    // Churn risk increases with lack of core usage
    let churnRisk = 0.15;
    if (invoicesCount === 0 && quotesCount === 0) {
      churnRisk = 0.75; // high churn risk due to zero creation activity
    } else if (invoicesCount < 2) {
      churnRisk = 0.45;
    }
    
    const isChurnBlocked = churnRisk >= 0.7;

    // 4. Upgrade Exposure Signals Capping
    // banner only if confidence > 0.25
    const showBanner = confidence > 0.25;
    // modal only if confidence > 0.45 AND churnRisk < 0.7
    const showModal = confidence > 0.45 && churnRisk < 0.7;
    // highlight only if plan != free
    const highlightPlan = recommendedPlan !== 'free' ? recommendedPlan : null;

    return {
      recommendedPlan,
      confidence,
      upgradeSignal: {
        showBanner,
        showModal,
        highlightPlan,
      },
      riskSignal: {
        churnRisk,
        isChurnBlocked,
      },
      reason,
    };
  } finally {
    window.__IN_UI_DECISION_ENGINE__ = false;
  }
}
