import { UpgradeDecision } from './upgradeTriggerEngine';

export interface UserRevenueTruth {
  ltv_30d: number;
  churn_risk: number;
  upgrade_probability: number;
  predicted_revenue_30d?: number;
}

export interface UserBehaviorSignals {
  feature_stickiness: {
    invoice: number;
    quote: number;
    client_portal: number;
  };
  export_usage: number;
  usage_intensity: number;
}

export interface DecisionConfig {
  growth_export_threshold?: number;
  studio_intensity_threshold?: number;
}

export interface DecisionOutput {
  recommended_action: "show_pro_upgrade" | "show_growth_offer" | "show_studio_offer" | "no_action";
  recommended_plan: "pro" | "growth" | "studio" | "none";
  confidence: number;
  reasoning: string;
  suggested_ui_strategy: "soft_banner" | "modal" | "checkout_nudge" | "none";
}

/**
 * v4.5 Decision Layer — Safe Recommendation System
 *
 * Combines LTV & churn predictions (Truth Layer v4), user behavior signals,
 * and rule-based fallback flags (v3 Engine) to produce non-executed suggestions.
 *
 * CRITICAL UI SAFEGUARD: This module is purely analytical. It MUST NOT mutate production pricing,
 * show modals, or make user-facing UI changes directly.
 */
export function evaluateRevenueDecision(
  truth: UserRevenueTruth,
  behavior: UserBehaviorSignals,
  v3Output: UpgradeDecision,
  config: DecisionConfig = {}
): DecisionOutput {
  const growthThreshold = config.growth_export_threshold ?? 5;
  const studioThreshold = config.studio_intensity_threshold ?? 0.8;

  // 1. Studio Recommendation
  if (
    behavior.feature_stickiness.client_portal > 0.7 &&
    behavior.usage_intensity > studioThreshold
  ) {
    return {
      recommended_action: "show_studio_offer",
      recommended_plan: "studio",
      confidence: Math.round(truth.upgrade_probability * 100),
      reasoning: `High client portal stickiness (${behavior.feature_stickiness.client_portal.toFixed(2)}) and scaled usage intensity (${behavior.usage_intensity.toFixed(2)}) indicate need for professional Studio features.`,
      suggested_ui_strategy: truth.churn_risk > 0.5 ? "checkout_nudge" : "modal"
    };
  }

  // 2. Growth Recommendation
  if (
    behavior.feature_stickiness.invoice > 0.6 &&
    behavior.export_usage > growthThreshold
  ) {
    return {
      recommended_action: "show_growth_offer",
      recommended_plan: "growth",
      confidence: Math.round(truth.upgrade_probability * 100),
      reasoning: `Core invoice stickiness is high (${behavior.feature_stickiness.invoice.toFixed(2)}) with active document exports (${behavior.export_usage}). Recommend Growth upgrade.`,
      suggested_ui_strategy: "modal"
    };
  }

  // 3. Pro Recommendation
  if (
    truth.upgrade_probability > 0.25 &&
    truth.churn_risk < 0.6 &&
    truth.ltv_30d > 10
  ) {
    return {
      recommended_action: "show_pro_upgrade",
      recommended_plan: "pro",
      confidence: Math.round(truth.upgrade_probability * 100),
      reasoning: `Upgrade probability is high (${(truth.upgrade_probability * 100).toFixed(0)}%) with low churn risk (${truth.churn_risk.toFixed(2)}) and positive LTV outlook ($${truth.ltv_30d.toFixed(2)}).`,
      suggested_ui_strategy: "soft_banner"
    };
  }

  // 4. Default fallback: use v3 engine output to align recommendations
  if (v3Output.should_show_upgrade && v3Output.target_plan) {
    const planMap = {
      pro: "show_pro_upgrade",
      growth: "show_growth_offer",
      studio: "show_studio_offer"
    } as const;

    const action = planMap[v3Output.target_plan] || "no_action";

    return {
      recommended_action: action,
      recommended_plan: v3Output.target_plan,
      confidence: v3Output.confidence,
      reasoning: `v3 engine triggered upgrade based on: ${v3Output.reason}`,
      suggested_ui_strategy: v3Output.confidence > 80 ? "modal" : "soft_banner"
    };
  }

  return {
    recommended_action: "no_action",
    recommended_plan: "none",
    confidence: 0,
    reasoning: "User behavior signals and conversion model indicate no immediate upgrade action is required.",
    suggested_ui_strategy: "none"
  };
}

/**
 * Helper to compute v4 User Revenue Truth metrics from raw signals and scoring outputs
 */
export function computeUserRevenueTruth(
  signals: any,
  scores: any
): UserRevenueTruth {
  const baseLtv = (scores.revenue_potential / 100) * 45;
  const upgradeProb = Math.max(scores.pro_score, scores.growth_score, scores.studio_score) / 100;
  
  return {
    ltv_30d: Math.max(0, baseLtv),
    churn_risk: Math.min(1.0, Math.max(0, scores.churn_risk / 100)),
    upgrade_probability: Math.min(1.0, Math.max(0, upgradeProb)),
    predicted_revenue_30d: upgradeProb * (signals.plan === 'free' ? 19 : signals.plan === 'pro' ? 49 : 99)
  };
}

/**
 * Helper to compute User Behavior Signals from raw signals and session metrics
 */
export function computeUserBehaviorSignals(
  signals: any
): UserBehaviorSignals {
  // Stickiness modeled on usage volume vs plan limits
  const invoiceStickiness = Math.min(1.0, signals.invoice_count / 3);
  const quoteStickiness = Math.min(1.0, signals.quote_count / 5);
  // Client portal interaction boosts portal stickiness
  const portalStickiness = signals.clicked_feature === 'client_portal' || signals.clicked_feature === 'portal_opened' ? 0.9 : 0.2;
  
  // Total actions normalized
  const totalUsage = signals.invoice_count + signals.quote_count + signals.export_count;
  const usageIntensity = Math.min(1.5, totalUsage / 10);

  return {
    feature_stickiness: {
      invoice: invoiceStickiness,
      quote: quoteStickiness,
      client_portal: portalStickiness
    },
    export_usage: signals.export_count,
    usage_intensity: usageIntensity
  };
}
