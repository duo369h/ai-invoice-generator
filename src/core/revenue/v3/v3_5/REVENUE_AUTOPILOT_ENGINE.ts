import { runRevenueEvolution, type EvolutionOutcomeRecord, type EvolutionOutput } from "./REVENUE_EVOLUTION_ENGINE";
import { calculateStrategyLifecycle, type StrategyMemoryRecord, type EvolutionMemoryOutput } from "./STRATEGY_EVOLUTION_MEMORY";
import { runTrajectoryOptimization, type TrajectoryOutput } from "./REVENUE_TRAJECTORY_OPTIMIZER";

// v3.7 Model Innovation Imports
import { getModelInnovation, type RevenueModel } from "../v3_7/REVENUE_MODEL_INNOVATION_ENGINE";

export type AutopilotMode = "STABLE" | "ADJUSTING" | "EXPERIMENTING";

export interface AutopilotInput {
  totalOutcomesCount: number;
  reliableCellsCount: number;
  avgDriftScore: number;          // 0.0 - 1.0 (drift detected across segments)
  strategyPerformance: {
    FAST_DEAL: { winRate: number; avgRevenue: number; sampleSize: number };
    BALANCED: { winRate: number; avgRevenue: number; sampleSize: number };
    MAX_REVENUE: { winRate: number; avgRevenue: number; sampleSize: number };
  };
  outcomes: Array<{
    client_type: string;
    strategy_used: string;
    outcome: "WON" | "LOST" | "PENDING" | "REVISED";
    price_offered: number;
    price_accepted?: number | null;
    timestamp: number;
  }>;
  clientType: "new" | "repeat" | "long_term";
}

export interface AutopilotOutput {
  autopilotMode: AutopilotMode;
  recommendedSystemShift: {
    FAST_DEAL: number;            // Adjustment delta (e.g. -5, +10)
    BALANCED: number;
    MAX_REVENUE: number;
  };
  confidence: number;             // 0 - 100 based on total metrics
  reason: string;
  evolution: EvolutionOutput;
  trajectory: TrajectoryOutput;
  lifecycles: EvolutionMemoryOutput;
  // v3.7 Model Innovation Output Fields
  innovationModels: RevenueModel[];
  bestModel: RevenueModel | null;
  processedAt: number;
}

/**
 * runAutopilotCore — determines system mode, advisory shifts, and structural evolution paths.
 */
export function runAutopilotCore(input: AutopilotInput): AutopilotOutput {
  const { totalOutcomesCount, reliableCellsCount, avgDriftScore, strategyPerformance, outcomes, clientType } = input;

  // 1️⃣ Run evolution, strategy memory, and trajectory optimizations
  const evolution = runRevenueEvolution(outcomes as EvolutionOutcomeRecord[]);
  const lifecycles = calculateStrategyLifecycle(outcomes as StrategyMemoryRecord[]);
  const trajectory = runTrajectoryOptimization(evolution.revenueTrend, lifecycles.lifecycleMap);

  // v3.7 Model Innovation execution
  const innovation = getModelInnovation({
    outcomeHistory: outcomes,
    segmentMatrix: { reliableCells: reliableCellsCount },
    strategyEvolution: { averageDriftScore: avgDriftScore },
    revenueTrajectories: {
      revenueTrend: evolution.revenueTrend,
      growthDirection: trajectory.growthDirection,
    },
    clientType,
  });

  let mode: AutopilotMode = "STABLE";
  let reason = "System is in a stable optimized state with low drift and balanced conversions.";
  const shift = { FAST_DEAL: 0, BALANCED: 0, MAX_REVENUE: 0 };

  // 2️⃣ Determine Mode State Machine
  if (totalOutcomesCount < 10) {
    mode = "STABLE";
    reason = "Initial bootstrap phase. Insufficient resolved outcomes (< 10) to authorize autopilot adjustments.";
  } else if (avgDriftScore > 0.4 || evolution.structuralShiftDetected) {
    mode = "ADJUSTING";
    reason = evolution.structuralShiftDetected
      ? `${evolution.shiftNote} Autopilot is shifting exposure weights to align with this structural trend.`
      : `Market drift detected (drift score: ${(avgDriftScore * 100).toFixed(0)}%). Autopilot is redistributing strategy weights.`;
  } else if (reliableCellsCount < 4) {
    mode = "EXPERIMENTING";
    reason = "Exploration phase. Insufficient reliable segment matrix coverage (< 4 cells). Autopilot is scaling test exposures.";
  }

  // 3️⃣ Calculate advisory shift offsets (sum of shifts must equal 0)
  if (mode === "ADJUSTING") {
    // Incorporate trajectory adjustments if available
    const maxAdj = trajectory.trajectoryAdjustments.find(a => a.strategy === "MAX_REVENUE")?.deltaPercent ?? 0;
    const balancedAdj = trajectory.trajectoryAdjustments.find(a => a.strategy === "BALANCED")?.deltaPercent ?? 0;
    const fastDealAdj = trajectory.trajectoryAdjustments.find(a => a.strategy === "FAST_DEAL")?.deltaPercent ?? 0;

    shift.MAX_REVENUE = maxAdj;
    shift.BALANCED = balancedAdj;
    shift.FAST_DEAL = fastDealAdj;

    // Normalize sum to 0
    const sum = shift.MAX_REVENUE + shift.BALANCED + shift.FAST_DEAL;
    if (sum !== 0) {
      shift.BALANCED -= sum; // Adjust BALANCED to absorb remainder
    }
  } else if (mode === "EXPERIMENTING") {
    // Distribute allocation evenly to collect data
    shift.FAST_DEAL = 10;
    shift.MAX_REVENUE = 10;
    shift.BALANCED = -20;
  }

  // 4️⃣ Compute data confidence score
  const confidence = Math.min(
    95,
    Math.round(
      Math.min(totalOutcomesCount / 50, 1) * 40 +
      Math.min(reliableCellsCount / 12, 1) * 40 +
      (avgDriftScore < 0.2 ? 15 : 0)
    )
  );

  return {
    autopilotMode: mode,
    recommendedSystemShift: shift,
    confidence,
    reason,
    evolution,
    trajectory,
    lifecycles,
    innovationModels: innovation.candidateModels,
    bestModel: innovation.bestModel,
    processedAt: Date.now(),
  };
}
