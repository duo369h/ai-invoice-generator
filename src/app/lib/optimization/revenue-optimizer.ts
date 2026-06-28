import { optimizeFunnel, type FunnelOptimizationInput } from './funnel-optimizer';
import { optimizePaywall, type PaywallOptimizationInput } from './paywall-optimizer';
import { optimizePricing, type PricingOptimizationInput } from './pricing-optimizer';

export type ConversionOptimizationData = {
  conversion_rate?: number;
  drop_off_rate?: number;
  high_intent_leakage?: number;
  abuse_risk?: number;
  paywall_views?: number;
  upgrade_clicks?: number;
};

export type RevenueOptimizerInput = {
  funnel_data?: FunnelOptimizationInput;
  conversion_data?: ConversionOptimizationData;
  simulation_results?: {
    recommended_strategy?: string;
    projected_mrr?: number;
    conversion_rate?: number;
    bottlenecks?: string[];
  };
  pricing_data?: PricingOptimizationInput;
};

export type RevenueOptimizerResult = {
  recommended_actions: string[];
  optimized_funnel: string[];
  pricing_adjustments: string[];
  paywall_strategy: string;
};

function percent(value: unknown) {
  const next = Number(value || 0);
  const normalized = next > 1 ? next / 100 : next;
  return Math.round(normalized * 1000) / 10;
}

export function optimizeRevenueStrategy(input: RevenueOptimizerInput = {}): RevenueOptimizerResult {
  const conversionRate = input.conversion_data?.conversion_rate ?? input.simulation_results?.conversion_rate ?? 0;
  const funnel = optimizeFunnel(input.funnel_data || {
    drop_off_by_step: Object.fromEntries((input.simulation_results?.bottlenecks || []).map((step) => [step, 0.4])),
  });
  const pricing = optimizePricing({
    conversion_rate: conversionRate,
    drop_off_rate: input.conversion_data?.drop_off_rate,
    ...input.pricing_data,
  });
  const paywall = optimizePaywall({
    conversion_rate: conversionRate,
    drop_off_rate: input.conversion_data?.drop_off_rate,
    high_intent_leakage: input.conversion_data?.high_intent_leakage,
    abuse_risk: input.conversion_data?.abuse_risk,
    paywall_views: input.conversion_data?.paywall_views,
    upgrade_clicks: input.conversion_data?.upgrade_clicks,
  } satisfies PaywallOptimizationInput);

  const recommendedActions = [
    ...funnel.suggested_changes,
    pricing.pricing_strategy,
    `Set paywall strength to ${paywall.paywall_strength} at ${paywall.trigger_points.join(', ')}.`,
  ];

  if (input.simulation_results?.projected_mrr !== undefined) {
    recommendedActions.push(`Use simulation MRR baseline $${input.simulation_results.projected_mrr} to compare the next optimization cycle.`);
  }

  recommendedActions.push(`Target conversion rate improvement from ${percent(conversionRate)}% with deterministic A/B tier tests.`);

  return {
    recommended_actions: Array.from(new Set(recommendedActions)),
    optimized_funnel: funnel.steps_to_modify,
    pricing_adjustments: [`Test optimal price $${pricing.optimal_price}.`, pricing.pricing_strategy],
    paywall_strategy: `${paywall.paywall_strength}: ${paywall.trigger_points.join(', ')}`,
  };
}
