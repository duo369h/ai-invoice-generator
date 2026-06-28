/**
 * REVENUE_MODEL_SIMULATION_ENGINE.ts — v3.7 Model Simulation Engine
 *
 * Runs deterministic projection simulations for generated candidate models,
 * estimating revenue uplift, close rate deltas, and churn risk factors.
 *
 * ❌ PROHIBITED: AI, Math.random()
 * ✅ ALLOWED: Formulaic simulations, relative uplift scaling, outcome forecasting
 */

import type { RevenueModel } from "./REVENUE_MODEL_GENERATOR";

export interface SimulationResult {
  model: string;
  projectedRevenue: number;     // Projected monthly/annual revenue under this model
  churnRisk: number;            // 0 - 100 risk scale
  conversionRate: number;       // Estimated win rate (0.0 - 1.0)
}

export interface SimulationOutput {
  simulations: SimulationResult[];
  simulatedAt: number;
}

/**
 * simulateRevenueModels — forecasts pricing and volume outputs for each model type.
 */
export function simulateRevenueModels(
  models: RevenueModel[],
  baselineRevenue: number,
  baselineWinRate: number
): SimulationOutput {
  const simulations: SimulationResult[] = [];

  for (const m of models) {
    let projectedRevenue = baselineRevenue;
    let churnRisk = 20; // Default baseline risk
    let conversionRate = baselineWinRate;

    switch (m.modelType) {
      case "VALUE_BASED_PRICING":
        // High ticket, lower win rate, medium-high churn/rejection risk
        projectedRevenue = baselineRevenue * 1.25;
        conversionRate = Math.max(0.20, baselineWinRate - 0.12);
        churnRisk = 55;
        break;

      case "SUBSCRIPTION_SHIFT":
        // Predictable revenue LTV, slightly lower upfront conversion, lowest long-term churn risk
        projectedRevenue = baselineRevenue * 1.15; // recurrent LTV uplift
        conversionRate = Math.max(0.30, baselineWinRate - 0.05);
        churnRisk = 15;
        break;

      case "PACKAGE_BUNDLING":
        // Standard basket value increase, stable conversions, low-medium risk
        projectedRevenue = baselineRevenue * 1.18;
        conversionRate = baselineWinRate; // Unchanged win rate due to packaging transparency
        churnRisk = 25;
        break;
    }

    simulations.push({
      model: m.modelType,
      projectedRevenue: parseFloat(projectedRevenue.toFixed(2)),
      churnRisk,
      conversionRate: parseFloat(conversionRate.toFixed(3)),
    });
  }

  return {
    simulations,
    simulatedAt: Date.now(),
  };
}
