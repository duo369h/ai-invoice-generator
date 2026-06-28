/**
 * REVENUE_TRAJECTORY_OPTIMIZER.ts — v3.6 Trajectory Vector Optimizer
 *
 * Evaluates macro-revenue trend vectors and strategy lifecycle stages to suggest
 * long-term growth trajectories and structural strategy weight adjustments.
 *
 * ❌ PROHIBITED: AI, Math.random()
 * ✅ ALLOWED: Rules-based optimization, threshold classification, advisory adjustments
 */

import type { RevenueTrend } from "./REVENUE_EVOLUTION_ENGINE";
import type { StrategyLifecycleMetrics } from "./STRATEGY_EVOLUTION_MEMORY";

export type GrowthDirection = "REVENUE_MAXIMIZATION" | "VOLUME_ACCELERATION" | "CONVERSION_EQUILIBRIUM";

export interface TrajectoryAdjustment {
  strategy: string;
  adjustment: "INCREASE_EXPOSURE" | "REDUCE_EXPOSURE" | "HOLD";
  deltaPercent: number;
}

export interface TrajectoryOutput {
  growthDirection: GrowthDirection;
  trajectoryAdjustments: TrajectoryAdjustment[];
  rationale: string;
}

/**
 * runTrajectoryOptimization — computes long-term trajectory targets and strategy shifts.
 */
export function runTrajectoryOptimization(
  trend: RevenueTrend,
  lifecycles: Record<string, StrategyLifecycleMetrics>
): TrajectoryOutput {
  let growthDirection: GrowthDirection = "CONVERSION_EQUILIBRIUM";
  let rationale = "Maintain balanced exposures to sustain conversion rates and baseline revenue.";
  const trajectoryAdjustments: TrajectoryAdjustment[] = [];

  const maxRevenueLife = lifecycles.MAX_REVENUE;
  const fastDealLife = lifecycles.FAST_DEAL;

  // 1️⃣ Determine macro growth vector
  if (trend === "UP" || (maxRevenueLife && maxRevenueLife.lifecycleStage === "EMERGING")) {
    growthDirection = "REVENUE_MAXIMIZATION";
    rationale = "Accepted price levels are trending upwards. Shifting system bounds to capture premium value.";
    trajectoryAdjustments.push(
      { strategy: "MAX_REVENUE", adjustment: "INCREASE_EXPOSURE", deltaPercent: 15 },
      { strategy: "FAST_DEAL", adjustment: "REDUCE_EXPOSURE", deltaPercent: -10 },
      { strategy: "BALANCED", adjustment: "REDUCE_EXPOSURE", deltaPercent: -5 }
    );
  } else if (trend === "DOWN" || (fastDealLife && fastDealLife.lifecycleStage === "EMERGING")) {
    growthDirection = "VOLUME_ACCELERATION";
    rationale = "Accepted prices are decaying or volume velocity requires fast deal conversion. Shifting bounds to accelerate closure.";
    trajectoryAdjustments.push(
      { strategy: "FAST_DEAL", adjustment: "INCREASE_EXPOSURE", deltaPercent: 20 },
      { strategy: "MAX_REVENUE", adjustment: "REDUCE_EXPOSURE", deltaPercent: -15 },
      { strategy: "BALANCED", adjustment: "REDUCE_EXPOSURE", deltaPercent: -5 }
    );
  } else {
    // FLAT or STABLE
    growthDirection = "CONVERSION_EQUILIBRIUM";
    trajectoryAdjustments.push(
      { strategy: "MAX_REVENUE", adjustment: "HOLD", deltaPercent: 0 },
      { strategy: "BALANCED", adjustment: "HOLD", deltaPercent: 0 },
      { strategy: "FAST_DEAL", adjustment: "HOLD", deltaPercent: 0 }
    );
  }

  // 2️⃣ Apply overrides for declining strategies
  for (const strategy of ["MAX_REVENUE", "BALANCED", "FAST_DEAL"]) {
    const life = lifecycles[strategy];
    if (life && life.lifecycleStage === "DECLINING") {
      const idx = trajectoryAdjustments.findIndex((a) => a.strategy === strategy);
      if (idx !== -1) {
        trajectoryAdjustments[idx] = {
          strategy,
          adjustment: "REDUCE_EXPOSURE",
          deltaPercent: -15,
        };
      }
      rationale += ` Overrode exposure for ${strategy} due to high conversion decay.`;
    }
  }

  return {
    growthDirection,
    trajectoryAdjustments,
    rationale,
  };
}
