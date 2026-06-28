import { evaluateAutonomousMonetization } from '../monetization/orchestrator';
import type { SimulatedAction, SimulatedUserSession } from './user-behavior-simulator';

export type MonetizationRuleMode = 'aggressive' | 'balanced' | 'soft';

export type PricingTierConfig = {
  low?: number;
  standard?: number;
  premium?: number;
};

export type RevenueSimulationInput = {
  sessions: SimulatedUserSession[];
  monetization_rule?: MonetizationRuleMode;
  pricing_tiers?: PricingTierConfig;
};

export type RevenueSimulationOutcome = {
  total_users: number;
  conversions: number;
  revenue: number;
  arpu: number;
  drop_off_by_step: Record<string, number>;
};

const DEFAULT_PRICING: Required<PricingTierConfig> = {
  low: 9,
  standard: 19,
  premium: 29,
};

const RULE_MULTIPLIER: Record<MonetizationRuleMode, { conversion: number; dropOff: number }> = {
  aggressive: { conversion: 0.92, dropOff: 1.35 },
  balanced: { conversion: 1, dropOff: 1 },
  soft: { conversion: 0.82, dropOff: 0.72 },
};

function round(value: number, precision = 2) {
  const factor = 10 ** precision;
  return Math.round(value * factor) / factor;
}

function actionCounts(actions: SimulatedAction[]) {
  return actions.reduce<Record<SimulatedAction, number>>((counts, action) => {
    counts[action] = (counts[action] || 0) + 1;
    return counts;
  }, {} as Record<SimulatedAction, number>);
}

function firstMonetizedAction(actions: SimulatedAction[]) {
  return actions.find((action) => action === 'export_pdf' || action === 'invoice_create' || action === 'quote_create' || action === 'pricing_view') || 'landing_view';
}

function priceForTier(tier: string, pricing: Required<PricingTierConfig>) {
  if (tier === 'premium') return pricing.premium;
  if (tier === 'low') return pricing.low;
  return pricing.standard;
}

export function simulateRevenueOutcome(input: RevenueSimulationInput): RevenueSimulationOutcome {
  const pricing = { ...DEFAULT_PRICING, ...(input.pricing_tiers || {}) };
  const rule = input.monetization_rule || 'balanced';
  const multiplier = RULE_MULTIPLIER[rule];
  const dropOffByStep: Record<string, number> = {};

  let conversions = 0;
  let revenue = 0;

  input.sessions.forEach((session, index) => {
    const counts = actionCounts(session.actions);
    const decision = evaluateAutonomousMonetization({
      action_type: firstMonetizedAction(session.actions),
      user_state: 'free',
      invoice_created_count: counts.invoice_create || 0,
      quote_created_count: counts.quote_create || 0,
      export_actions: counts.export_pdf || 0,
      pricing_page_visits: counts.pricing_view || 0,
      session_time: session.session_length,
      return_user_frequency: session.user_type === 'high_intent' ? 3 : session.user_type === 'medium_intent' ? 1 : 0,
    });

    const frictionPenalty = decision.final_action === 'block' ? 0.18 : decision.final_action === 'redirect' ? 0.08 : 0;
    const probability = Math.max(0, Math.min(0.98, session.conversion_probability * multiplier.conversion - frictionPenalty));
    const deterministicThreshold = ((index * 37 + 17) % 100) / 100;

    if (deterministicThreshold < probability) {
      conversions += 1;
      revenue += priceForTier(decision.pricing_tier, pricing);
    } else {
      const dropStep = firstMonetizedAction(session.actions);
      dropOffByStep[dropStep] = (dropOffByStep[dropStep] || 0) + multiplier.dropOff;
    }
  });

  const totalUsers = input.sessions.length;
  return {
    total_users: totalUsers,
    conversions,
    revenue: round(revenue),
    arpu: round(totalUsers > 0 ? revenue / totalUsers : 0),
    drop_off_by_step: Object.fromEntries(Object.entries(dropOffByStep).map(([step, value]) => [step, round(value, 0)])),
  };
}

export { DEFAULT_PRICING };
