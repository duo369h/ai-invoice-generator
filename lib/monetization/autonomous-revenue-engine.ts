import { UserRevenueTruth, DecisionOutput } from './revenue-decision-engine';

export interface SimulationInput {
  proposed_prices: {
    pro: number;
    growth: number;
    studio: number;
  };
  pressure_level: "soft_banner" | "modal" | "checkout_nudge";
  elasticity_coefficient?: number;
}

export interface SimulationResult {
  predicted_revenue_change: number;      // delta in dollars (e.g. +145.20 or -24.00)
  predicted_conversion_rate: number;     // percentage (e.g. 2.45%)
  best_trigger_strategy: string;         // recommend strategy (e.g. "limit_approaching")
  best_ui_pressure_level: string;        // recommended pressure (e.g. "checkout_nudge")
  arpu_impact: number;                   // delta in ARPU (e.g. +1.45)
  base_conversion_rate: number;
  base_arpu: number;
  simulated_arpu: number;
  churn_increase_pct: number;
}

/**
 * v5 Autonomous Revenue Simulation Engine
 *
 * Simulates "what-if" revenue optimizations using pricing elasticity, funnel pressure factors,
 * and historical interaction logs.
 *
 * SAFE MODE: This system operates strictly inside a read-only sandbox. It MUST NOT modify
 * production database plans, prices, stripe/paddle webhooks, or front-end banner views.
 */
export function simulateRevenueScenario(
  truth: UserRevenueTruth,
  decision: DecisionOutput,
  historicalEvents: any[] = [],
  input: SimulationInput
): SimulationResult {
  const elasticity = input.elasticity_coefficient ?? 1.5;
  
  // Base Prices in production
  const basePrices = {
    pro: 19,
    growth: 49,
    studio: 99
  };

  // 1. Establish baseline from historical events
  let totalImpressions = 0;
  let totalConversions = 0;
  let totalRevenue = 0;

  if (historicalEvents && historicalEvents.length > 0) {
    for (const event of historicalEvents) {
      if (event.event_name === 'offer_shown' || event.event_name === 'pricing_view' || event.event_name === 'dashboard_view') {
        totalImpressions++;
      } else if (event.event_name === 'payment_success') {
        totalConversions++;
        const price = Number(event.properties?.revenue || event.properties?.price || basePrices.pro);
        totalRevenue += price;
      }
    }
  }

  // Fallback to default ratios if historical logs are sparse
  const fallbackBaseRate = 2.5; // 2.5% default conversion rate
  const baselineRate = totalImpressions > 0 ? (totalConversions / Math.max(1, totalImpressions)) * 100 : fallbackBaseRate;
  
  // Calculate average baseline ARPU
  const averageBasePrice = totalConversions > 0 ? totalRevenue / totalConversions : basePrices.pro;
  const baseArpu = (baselineRate / 100) * averageBasePrice;

  // 2. Select target plan based on current decision recommendation or default to Pro
  const targetPlan = decision.recommended_plan !== 'none' ? decision.recommended_plan : 'pro';
  const basePrice = basePrices[targetPlan] ?? basePrices.pro;
  const proposedPrice = input.proposed_prices[targetPlan] ?? basePrice;

  // 3. Elasticity Calculation: Delta in conversion based on proposed price shift
  // % change in price
  const priceDeltaRatio = (proposedPrice - basePrice) / basePrice;
  // % change in demand/conversion = -elasticity * priceDeltaRatio
  const elasticityFactor = 1 - (elasticity * priceDeltaRatio);
  // Cap elasticity factor to keep conversion positive
  const elasticRate = Math.max(0.1, baselineRate * elasticityFactor);

  // 4. Funnel Pressure Model (modal vs banner vs nudge multipliers)
  let pressureMultiplier = 1.0;
  let churnIncreasePct = 0;

  switch (input.pressure_level) {
    case 'soft_banner':
      pressureMultiplier = 1.0;
      churnIncreasePct = 0;
      break;
    case 'checkout_nudge':
      pressureMultiplier = 1.6;
      churnIncreasePct = 5; // +5% churn risk
      break;
    case 'modal':
      pressureMultiplier = 2.2;
      churnIncreasePct = 18; // +18% churn risk (irritation factor)
      break;
  }

  // Calculate simulated conversion rate
  const simulatedRate = Math.max(0.1, elasticRate * pressureMultiplier);

  // 5. ARPU Simulation
  const simulatedArpu = (simulatedRate / 100) * proposedPrice;
  const arpuImpact = simulatedArpu - baseArpu;

  // Predict overall monthly revenue change (assuming 1,000 monthly active users for normalization)
  const predictedRevenueChange = arpuImpact * 1000;

  // 6. Optimal strategy suggestion logic
  let bestTriggerStrategy = "limit_approaching";
  if (truth.churn_risk > 0.4) {
    bestTriggerStrategy = "value_retention_discount";
  } else if (decision.recommended_action === 'show_studio_offer') {
    bestTriggerStrategy = "portal_upgrade_unlock";
  } else if (decision.recommended_action === 'show_growth_offer') {
    bestTriggerStrategy = "invoice_limit_nudges";
  }

  let bestUiPressureLevel = "checkout_nudge";
  if (truth.churn_risk > 0.6) {
    bestUiPressureLevel = "soft_banner"; // Backoff pressure for churn-prone segments
  } else if (truth.upgrade_probability > 0.6) {
    bestUiPressureLevel = "modal"; // High conversion opportunity
  }

  return {
    predicted_revenue_change: Number(predictedRevenueChange.toFixed(2)),
    predicted_conversion_rate: Number(simulatedRate.toFixed(2)),
    best_trigger_strategy: bestTriggerStrategy,
    best_ui_pressure_level: bestUiPressureLevel,
    arpu_impact: Number(arpuImpact.toFixed(2)),
    base_conversion_rate: Number(baselineRate.toFixed(2)),
    base_arpu: Number(baseArpu.toFixed(2)),
    simulated_arpu: Number(simulatedArpu.toFixed(2)),
    churn_increase_pct: churnIncreasePct
  };
}
