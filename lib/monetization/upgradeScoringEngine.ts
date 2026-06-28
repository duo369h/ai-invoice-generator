/**
 * Upgrade Scoring Engine — Corvioz v2
 *
 * Pure function that computes multi-dimensional scores (Pro, Growth, Studio,
 * Churn Risk, Revenue Potential) based on usage, behavior, session, and intent signals.
 *
 * NO network calls, NO side effects. Safe for both SSR and client execution.
 */
import { getEngineConfig } from './upgradeTriggerEngine';

export interface UsageSignals {
  invoice_count: number;
  quote_count: number;
  export_count: number;
}

export interface BehaviorSignals {
  scroll_depth: number;           // 0–100 percent
  return_user_frequency: number;  // number of return dashboard visits
  time_on_page?: number;          // active time on page in seconds
  tab_switch_count?: number;      // number of times user switched tabs
}

export interface SessionSignals {
  pricing_view_count: number;
  session_duration?: number;      // current session duration in seconds
  last_active_time?: number;      // epoch timestamp
}

export interface IntentSignals {
  user_goal?: string;             // e.g. 'invoice', 'quote', 'explore'
  clicked_feature?: string;       // e.g. 'export_pdf', 'client_portal'
  selected_plan?: string;         // plan chosen or clicked by user
}

export interface ScoringInputs {
  usage: UsageSignals;
  behavior: BehaviorSignals;
  session: SessionSignals;
  intent: IntentSignals;
  current_plan: string;           // 'free' | 'pro' | 'growth' | 'studio' | 'agency'
  is_authenticated: boolean;
}

export interface ScoringOutput {
  pro_score: number;              // 0–100 probability
  growth_score: number;           // 0–100 probability
  studio_score: number;           // 0–100 probability
  churn_risk: number;             // 0–100 risk
  revenue_potential: number;      // 0–100 potential customer lifetime value / willingness to pay
}

export function computeUpgradeScores(inputs: ScoringInputs): ScoringOutput {
  const plan = (inputs.current_plan || 'free').toLowerCase();
  
  const config = getEngineConfig();
  const usageMult = config?.weights?.usage_multiplier ?? 1.0;
  const behaviorMult = config?.weights?.behavior_multiplier ?? 1.0;
  const intentMult = config?.weights?.intent_multiplier ?? 1.0;
  const churnRiskMult = config?.weights?.churn_risk_multiplier ?? 1.0;

  // If already at maximum studio/agency level, scores for lower tiers should be 0
  const isStudioOrAbove = plan === 'studio' || plan === 'agency';
  const isGrowthOrAbove = isStudioOrAbove || plan === 'growth';
  const isProOrAbove = isGrowthOrAbove || plan === 'pro';

  // ─── 1. PRO SCORE ───
  let pro_score = 0;
  if (!isProOrAbove) {
    let usagePoints = 0;
    // Invoice triggers
    if (inputs.usage.invoice_count === 1) usagePoints += 20;
    else if (inputs.usage.invoice_count === 2) usagePoints += 50;
    else if (inputs.usage.invoice_count >= 3) usagePoints += 90;

    // Export triggers
    if (inputs.usage.export_count === 1) usagePoints += 60;
    else if (inputs.usage.export_count >= 2) usagePoints += 85;

    // Quote triggers
    if (inputs.usage.quote_count === 1) usagePoints += 30;
    else if (inputs.usage.quote_count >= 2) usagePoints += 70;

    let behaviorPoints = 0;
    if (inputs.behavior.return_user_frequency === 1) behaviorPoints += 15;
    else if (inputs.behavior.return_user_frequency === 2) behaviorPoints += 35;
    else if (inputs.behavior.return_user_frequency >= 3) behaviorPoints += 60;

    if (inputs.behavior.scroll_depth >= 75) behaviorPoints += 30;
    else if (inputs.behavior.scroll_depth >= 50) behaviorPoints += 15;

    if (inputs.behavior.time_on_page && inputs.behavior.time_on_page >= 180) behaviorPoints += 30;
    else if (inputs.behavior.time_on_page && inputs.behavior.time_on_page >= 60) behaviorPoints += 15;

    if (inputs.behavior.tab_switch_count && inputs.behavior.tab_switch_count >= 3) behaviorPoints += 15;

    let sessionPoints = 0;
    if (inputs.session.pricing_view_count === 1) sessionPoints += 40;
    else if (inputs.session.pricing_view_count >= 2) sessionPoints += 75;

    let intentPoints = 0;
    if (inputs.intent.clicked_feature === 'export_pdf') intentPoints += 40;
    if (inputs.intent.selected_plan === 'pro') intentPoints += 60;
    if (inputs.intent.user_goal === 'invoice' || inputs.intent.user_goal === 'quote') intentPoints += 15;

    pro_score = Math.max(
      usagePoints * usageMult,
      behaviorPoints * behaviorMult,
      sessionPoints * behaviorMult,
      intentPoints * intentMult
    );
    pro_score = Math.min(100, Math.round(pro_score));
  }

  // ─── 2. GROWTH SCORE ───
  let growth_score = 0;
  if (!isGrowthOrAbove) {
    let score = 0;
    // Invoices count
    if (inputs.usage.invoice_count >= 10) score += 85;
    else if (inputs.usage.invoice_count >= 5) score += 50;
    else if (inputs.usage.invoice_count >= 3) score += 25;

    // Quotes count
    if (inputs.usage.quote_count >= 5) score += 75;
    else if (inputs.usage.quote_count >= 2) score += 30;

    // Exports count
    if (inputs.usage.export_count >= 10) score += 80;
    else if (inputs.usage.export_count >= 5) score += 40;

    // Return visits
    if (inputs.behavior.return_user_frequency >= 5) score += 75;
    else if (inputs.behavior.return_user_frequency >= 3) score += 40;

    // Pricing views
    if (inputs.session.pricing_view_count >= 3) score += 70;
    else if (inputs.session.pricing_view_count >= 2) score += 45;

    // Explicit intent
    if (inputs.intent.selected_plan === 'growth') score += 70;

    // Pro baseline boost
    if (plan === 'pro') {
      score += 30;
    }

    growth_score = Math.min(100, Math.round(score * usageMult));
  }

  // ─── 3. STUDIO SCORE ───
  let studio_score = 0;
  if (!isStudioOrAbove) {
    let score = 0;
    // Invoices count
    if (inputs.usage.invoice_count >= 20) score += 90;
    else if (inputs.usage.invoice_count >= 15) score += 50;
    else if (inputs.usage.invoice_count >= 10) score += 25;

    // Quotes count
    if (inputs.usage.quote_count >= 10) score += 80;
    else if (inputs.usage.quote_count >= 5) score += 30;

    // Exports count
    if (inputs.usage.export_count >= 20) score += 90;
    else if (inputs.usage.export_count >= 10) score += 45;

    // Return visits
    if (inputs.behavior.return_user_frequency >= 8) score += 80;
    else if (inputs.behavior.return_user_frequency >= 5) score += 40;

    // Pricing views
    if (inputs.session.pricing_view_count >= 4) score += 70;
    else if (inputs.session.pricing_view_count >= 3) score += 40;

    // Explicit intent
    if (inputs.intent.selected_plan === 'studio' || inputs.intent.selected_plan === 'agency') score += 80;

    // Growth baseline boost
    if (plan === 'growth') {
      score += 40;
    } else if (plan === 'pro') {
      score += 15;
    }

    studio_score = Math.min(100, Math.round(score * Math.max(usageMult, behaviorMult)));
  }

  // ─── 4. CHURN RISK ───
  let churn_risk = 0;
  let risk = 0;
  if (!inputs.is_authenticated) {
    risk += 15; // unauthenticated users have slightly higher risk
  }
  // Visits without using the product
  if (inputs.behavior.return_user_frequency >= 3 && inputs.usage.invoice_count === 0) {
    risk += 40;
  }
  // Viewing pricing page multiple times on free plan without upgrading
  if (inputs.session.pricing_view_count >= 3 && plan === 'free') {
    risk += 20;
  }
  // Highly distracted / active session but low scroll depth
  if (inputs.behavior.scroll_depth < 30 && (inputs.behavior.time_on_page || 0) > 60) {
    risk += 25;
  }
  // High tab switches (comparing / distracted)
  if (inputs.behavior.tab_switch_count && inputs.behavior.tab_switch_count >= 5) {
    risk += 20;
  }
  // Visited many times but created very few invoices
  if (inputs.behavior.return_user_frequency >= 4 && inputs.usage.invoice_count <= 2) {
    risk += 30;
  }
  churn_risk = Math.min(100, Math.round(risk * churnRiskMult));

  // ─── 5. REVENUE POTENTIAL ───
  let potential = 0;
  // Volume based potential
  potential += inputs.usage.invoice_count * 2.5;
  potential += inputs.usage.quote_count * 3.0;
  potential += inputs.usage.export_count * 2.0;
  potential = Math.min(40, potential);

  // Return user frequency
  potential += Math.min(25, inputs.behavior.return_user_frequency * 5);

  // Pricing intent
  potential += Math.min(30, inputs.session.pricing_view_count * 15);

  // Authenticated state
  if (inputs.is_authenticated) {
    potential += 15;
  }

  // Selected plan boost
  if (inputs.intent.selected_plan) {
    potential += 20;
  }

  const revenue_potential = Math.min(100, Math.round(potential * intentMult));

  return {
    pro_score,
    growth_score,
    studio_score,
    churn_risk,
    revenue_potential,
  };
}
