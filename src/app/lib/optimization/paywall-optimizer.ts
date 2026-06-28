export type PaywallStrength = 'soft' | 'medium' | 'hard';

export type PaywallOptimizationInput = {
  conversion_rate?: number;
  drop_off_rate?: number;
  high_intent_leakage?: number;
  abuse_risk?: number;
  paywall_views?: number;
  upgrade_clicks?: number;
};

export type PaywallOptimizationResult = {
  paywall_strength: PaywallStrength;
  trigger_points: string[];
};

function toNumber(value: unknown, fallback = 0) {
  const next = Number(value ?? fallback);
  return Number.isFinite(next) ? next : fallback;
}

function normalizeRate(value: unknown) {
  const next = toNumber(value, 0);
  return next > 1 ? next / 100 : next;
}

export function optimizePaywall(input: PaywallOptimizationInput = {}): PaywallOptimizationResult {
  const conversionRate = normalizeRate(input.conversion_rate);
  const dropOffRate = normalizeRate(input.drop_off_rate);
  const leakage = normalizeRate(input.high_intent_leakage);
  const abuseRisk = normalizeRate(input.abuse_risk);
  const paywallViews = Math.max(0, toNumber(input.paywall_views, 0));
  const upgradeClicks = Math.max(0, toNumber(input.upgrade_clicks, 0));
  const paywallClickRate = paywallViews > 0 ? upgradeClicks / paywallViews : 0;

  if (abuseRisk >= 0.7 || (leakage >= 0.35 && conversionRate >= 0.12)) {
    return {
      paywall_strength: 'hard',
      trigger_points: ['export_pdf', 'second_invoice_attempt', 'quote_send', 'high_intent_pricing_exit'],
    };
  }

  if (dropOffRate >= 0.38 || paywallClickRate < 0.08) {
    return {
      paywall_strength: 'soft',
      trigger_points: ['first_value_created', 'pricing_revisit', 'dashboard_return_visit'],
    };
  }

  return {
    paywall_strength: 'medium',
    trigger_points: ['invoice_create_count_2', 'quote_export', 'pricing_view_3_times'],
  };
}
