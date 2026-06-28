/**
 * OBSERVABILITY ONLY
 * DO NOT USE FOR DECISION MAKING
 *
 * Corvioz — Revenue Strategy Engine v3.3
 *
 * v3.2: applyLearningBias() + getStrategyWithClosedLoop()
 * v3.3: getStrategyWithBiasInjection() — segment behavioral bias layer
 *
 * Flow:
 *   baseStrategy = ruleBasedDecision()        (execution-stable, unchanged)
 *   learningHint = closedLoopMatrix()          (v3.2 — history-driven)
 *   segmentBias  = behavioralSegmentMatrix()   (v3.3 — NEW segment-level bias)
 *
 * ❌ PROHIBITED: Importing REVENUE_OUTCOME_ENGINE directly (CI enforced)
 * ❌ PROHIBITED: Any layer overriding base rule engine decision
 * ✅ ALLOWED: Accepting pre-computed snapshots as optional advisory inputs
 */

import {
  applyLearningBias,
  recommendStrategy,
  type StrategyRecommendation,
} from "./REVENUE_STRATEGY_RECOMMENDER";
import type { StrategyMatrix, ClientType } from "./REVENUE_STRATEGY_SEGMENT_ENGINE";
// v3.2 Closed Loop
import {
  applySoftBias,
  getLearningRecommendation,
} from "./REVENUE_LEARNING_RECOMMENDER";
import type { LearningMatrixSnapshot } from "./REVENUE_STRATEGY_LEARNING_MATRIX";
// v3.3 Segment Bias Injection
import {
  getBiasForSegment,
  type StrategyBiasOutput,
  type UserSegment,
} from "./REVENUE_STRATEGY_BIAS_ENGINE";
import type { SegmentMatrixSnapshot } from "./REVENUE_SEGMENT_MATRIX_ENGINE";

// v3.5 Autopilot Engines imports
import { runAutopilotCore, type AutopilotMode } from "./v3_5/REVENUE_AUTOPILOT_ENGINE";
import { runStrategyPruning } from "./v3_5/REVENUE_STRATEGY_PRUNING_ENGINE";
import { runFlowAllocation } from "./v3_5/REVENUE_FLOW_ALLOCATOR_ENGINE";
import { runDriftAutocorrect } from "./v3_5/REVENUE_STRATEGY_DRIFT_AUTOCORRECTOR";
import { runExperimentScaling } from "./v3_5/REVENUE_EXPERIMENT_SCALER";

export type StrategyType = "MAX_REVENUE" | "BALANCED" | "FAST_DEAL";

export type StrategyInput = {
  clientType: "new" | "repeat" | "long_term";
  urgency: "low" | "medium" | "high";
  cashNeed: "low" | "medium" | "high";
  relationshipValue: number;
  priceOptions: {
    max: number;
    balanced: number;
    fastDeal: number;
  };
};

export type StrategyDecision = {
  strategy: StrategyType;
  recommendedPrice: number;
  expectedWinRate: number;
  reasoning: string;
  // v3.2 prior layer: advisory weight from REVENUE_STRATEGY_RECOMMENDER
  recommendationWeight?: {
    suggestedStrategy: StrategyType;
    confidence: number;
    reason: string;
    aligned: boolean;
  };
  // v3.2 closed loop: advisory hint from REVENUE_LEARNING_RECOMMENDER
  learningHint?: {
    suggestedStrategy: StrategyType;
    confidence: number;
    reason: string;
    aligned: boolean;
    dataSignals: {
      winRate: number;
      avgRevenue: number;
      sampleSize: number;
    };
    matrixVersion: number;
  };
  // v3.3 segment bias: behavioral segment advisory from REVENUE_STRATEGY_BIAS_ENGINE
  segmentBias?: {
    userSegment: UserSegment;
    suggestedStrategy: StrategyType;
    confidence: number;        // 0–100
    aligned: boolean;          // true if bias agrees with base strategy
    basedOn: "historical outcomes"; // always this value — no AI
  };
  // v3.5 autopilot: advisory portfolio allocation and state checks
  autopilotMetadata?: {
    mode: AutopilotMode;
    allocations: {
      MAX_REVENUE: number;
      BALANCED: number;
      FAST_DEAL: number;
    };
    pruned: string[];
    downgraded: string[];
    driftDetected: "LOW" | "MEDIUM" | "HIGH";
    statusMessage: string;
    // v3.6 Evolution Layer
    revenueTrend: "UP" | "FLAT" | "DOWN";
    growthDirection: "REVENUE_MAXIMIZATION" | "VOLUME_ACCELERATION" | "CONVERSION_EQUILIBRIUM";
    emergingStrategies: string[];
    decliningStrategies: string[];
    // v3.7 Model Innovation Layer
    innovationModels?: Array<{
      modelType: "PACKAGE_BUNDLING" | "SUBSCRIPTION_SHIFT" | "VALUE_BASED_PRICING";
      description: string;
      expectedRevenueImpact: number;
      riskLevel: "LOW" | "MEDIUM" | "HIGH";
    }>;
    bestModel?: {
      modelType: "PACKAGE_BUNDLING" | "SUBSCRIPTION_SHIFT" | "VALUE_BASED_PRICING";
      description: string;
      expectedRevenueImpact: number;
      riskLevel: "LOW" | "MEDIUM" | "HIGH";
    } | null;
  };
};

/**
 * getStrategyDecisions — base rule-based strategy computation (unchanged from v3).
 * Returns the three strategy options. No learning data involved here.
 */
export function getStrategyDecisions(input: StrategyInput): StrategyDecision[] {
  const { max, balanced, fastDeal } = input.priceOptions;

  // 1️⃣ Strategy A: MAX_REVENUE
  let maxWinRate = 0.45;
  if (input.urgency === "high") maxWinRate += 0.15;
  if (input.relationshipValue > 0.7) maxWinRate += 0.10;

  const maxReasoning = `Optimized for maximum value capture. Leverages client urgency (${input.urgency}) and relationship value (${Math.round(input.relationshipValue * 100)}%).`;

  // 2️⃣ Strategy B: BALANCED
  let balancedWinRate = 0.70;
  if (input.clientType === "repeat") balancedWinRate += 0.10;
  if (input.cashNeed === "high") balancedWinRate -= 0.05;

  const balancedReasoning = `Optimized for value-conversion equilibrium. Highly effective for ${input.clientType} relationships.`;

  // 3️⃣ Strategy C: FAST_DEAL
  let fastWinRate = 0.90;
  if (input.cashNeed === "high") fastWinRate += 0.05;

  const fastReasoning = `Optimized for fast conversion and cash acceleration. Designed to satisfy immediate cash demands (${input.cashNeed}).`;

  return [
    {
      strategy: "MAX_REVENUE",
      recommendedPrice: max,
      expectedWinRate: Math.min(0.95, maxWinRate),
      reasoning: maxReasoning,
    },
    {
      strategy: "BALANCED",
      recommendedPrice: balanced,
      expectedWinRate: Math.min(0.95, balancedWinRate),
      reasoning: balancedReasoning,
    },
    {
      strategy: "FAST_DEAL",
      recommendedPrice: fastDeal,
      expectedWinRate: Math.min(0.99, fastWinRate),
      reasoning: fastReasoning,
    },
  ];
}

// ─────────────────────────────────────────────────────────────────────────────
// v3.2 LEARNING BIAS LAYER
// Appended AFTER base decisions. Never modifies strategy or price.
// ─────────────────────────────────────────────────────────────────────────────

// Map strategy engine client type to segment engine client type
function mapClientType(ct: StrategyInput["clientType"]): ClientType {
  switch (ct) {
    case "new":       return "individual";
    case "repeat":    return "small_business";
    case "long_term": return "enterprise";
    default:          return "small_business";
  }
}

/**
 * getStrategyWithLearning — combines base rule decisions with learning bias.
 *
 * @param input          — standard StrategyInput
 * @param matrix         — pre-computed StrategyMatrix (MATRIX_SNAPSHOT). Pass null
 *                         to use fallback rules only.
 * @param matrixAge      — age of the matrix in ms (for gate validation)
 *
 * Returns the same StrategyDecision[] but with `recommendationWeight` appended
 * to each decision. The EXECUTION SYSTEM still selects the final strategy —
 * this is advisory metadata only.
 */
export function getStrategyWithLearning(
  input: StrategyInput,
  matrix: StrategyMatrix | null,
  matrixAge?: number
): StrategyDecision[] {
  // Step 1: Get base decisions (unchanged logic)
  const baseDecisions = getStrategyDecisions(input);

  // Step 2: Compute learning recommendation (gate-guarded)
  const segmentClientType = mapClientType(input.clientType);
  const recommendation: StrategyRecommendation = recommendStrategy(
    segmentClientType,
    input.urgency,
    matrix,
    matrixAge
  );

  // Step 3: Append bias to each decision WITHOUT changing strategy/price
  return baseDecisions.map((decision) => {
    const biased = applyLearningBias(decision.strategy, recommendation);
    return {
      ...decision,
      recommendationWeight: biased.recommendationWeight,
    };
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// v3.2 CLOSED LOOP — Learning Bias Injection
// Wires: baseStrategy = ruleBasedDecision() → applySoftBias(base, learningHint)
// Final strategy is ALWAYS the base rule decision. Learning is advisory only.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * getStrategyWithClosedLoop — full closed-loop execution.
 *
 * @param input           — standard StrategyInput
 * @param matrixSnapshot  — pre-built LearningMatrixSnapshot. Pass null for cold start.
 * @param segmentMatrix   — optional segment matrix for v3.2 prior layer
 * @param matrixAge       — age of snapshot in ms (gate validation)
 *
 * Flow:
 *   baseStrategy = getStrategyDecisions(input)          ← UNCHANGED rule engine
 *   learningHint = getLearningRecommendation(snapshot)  ← matrix-driven, gate-guarded
 *   result       = applySoftBias(base, learningHint)    ← base NEVER changed
 */
export function getStrategyWithClosedLoop(
  input: StrategyInput,
  matrixSnapshot: LearningMatrixSnapshot | null,
  segmentMatrix: StrategyMatrix | null = null,
  matrixAge?: number
): StrategyDecision[] {
  // Step 1: Base rule decisions (execution-stable, unchanged)
  const baseDecisions = getStrategyDecisions(input);

  // Step 2a: v3.2 prior — segment-based recommendation weight
  const segmentClientType = mapClientType(input.clientType);
  const v32PriorRecommendation: StrategyRecommendation = recommendStrategy(
    segmentClientType,
    input.urgency,
    segmentMatrix,
    matrixAge
  );

  // Step 2b: v3.2 closed loop — learning matrix recommendation
  let learningRec = null;
  if (matrixSnapshot) {
    learningRec = getLearningRecommendation(
      input.clientType,
      input.urgency,
      "general", // service type reserved for future filtering
      matrixSnapshot
    );
  }

  // Step 3: Merge into decisions — base strategy is NEVER mutated
  return baseDecisions.map((decision) => {
    const biased = applyLearningBias(decision.strategy, v32PriorRecommendation);
    const result: StrategyDecision = {
      ...decision,
      recommendationWeight: biased.recommendationWeight,
    };

    if (learningRec) {
      const softBiased = applySoftBias(decision.strategy, learningRec);
      result.learningHint = softBiased.learningHint;
    }

    return result;
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// v3.3 SEGMENT BIAS INJECTION
// Adds behavioral UserSegment bias as advisory layer on top of v3.2 closed loop.
// baseStrategy is NEVER changed. All layers are advisory metadata only.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * getStrategyWithBiasInjection — v3.3 full stack: base rules + v3.2 hints + v3.3 segment bias.
 *
 * @param input             — standard StrategyInput
 * @param userSegment       — behavioral segment of the client (from USER_SEGMENT_ENGINE or manual)
 * @param biasOutput        — pre-built StrategyBiasOutput (BIAS_SNAPSHOT). Pass null for cold start.
 * @param matrixSnapshot    — v3.2 learning matrix. Pass null for cold start.
 * @param segmentMatrix     — v3.2 prior segment matrix. Pass null for cold start.
 * @param matrixAge         — age of snapshot in ms
 *
 * Advisory stack (all layered, none overriding):
 *   Layer 1: base rule engine → strategy (EXECUTION-STABLE)
 *   Layer 2: v3.2 prior       → recommendationWeight (segment engine advisory)
 *   Layer 3: v3.2 CL          → learningHint (learning matrix advisory)
 *   Layer 4: v3.3             → segmentBias (behavioral segment advisory) ← NEW
 */
export function getStrategyWithBiasInjection(
  input: StrategyInput,
  userSegment: UserSegment,
  biasOutput: StrategyBiasOutput | null,
  matrixSnapshot: LearningMatrixSnapshot | null = null,
  segmentMatrix: StrategyMatrix | null = null,
  matrixAge?: number
): StrategyDecision[] {
  // Layer 1+2+3: v3.2 full closed loop (base rules + prior + learning hint)
  const closedLoopDecisions = getStrategyWithClosedLoop(
    input,
    matrixSnapshot,
    segmentMatrix,
    matrixAge
  );

  // Layer 4: v3.3 segment bias injection
  if (!biasOutput) return closedLoopDecisions;

  const bias = getBiasForSegment(biasOutput, userSegment);

  return closedLoopDecisions.map((decision) => {
    const result: StrategyDecision = { ...decision };

    if (bias) {
      result.segmentBias = {
        userSegment,
        suggestedStrategy: bias.strategy as StrategyType,
        confidence: bias.confidence,
        aligned: bias.strategy === decision.strategy,
        basedOn: "historical outcomes",
      };
    }

    return result;
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// v3.5 AUTOPILOT ADJUSTMENT LAYER
// Integrates base rules (execution-stable), bias, learning, and v3.5 autopilot.
// ─────────────────────────────────────────────────────────────────────────────

export interface AutopilotHistoricalData {
  outcomes: Array<{
    client_type: string;
    strategy_used: string;
    outcome: "WON" | "LOST" | "PENDING" | "REVISED";
    price_offered: number;
    price_accepted?: number | null;
    timestamp: number;
  }>;
  segmentMatrix: SegmentMatrixSnapshot;
}

/**
 * getStrategyWithAutopilot — v3.5 full portfolio autopilot pipeline.
 */
export function getStrategyWithAutopilot(
  input: StrategyInput,
  userSegment: UserSegment,
  historicalData: AutopilotHistoricalData | null,
  biasOutput: StrategyBiasOutput | null = null,
  matrixSnapshot: LearningMatrixSnapshot | null = null,
  segmentMatrix: StrategyMatrix | null = null,
  matrixAge?: number
): StrategyDecision[] {
  // Step 1: Base decisions with v3.3 Segment Bias Layer
  const baseDecisions = getStrategyWithBiasInjection(
    input,
    userSegment,
    biasOutput,
    matrixSnapshot,
    segmentMatrix,
    matrixAge
  );

  if (!historicalData) {
    return baseDecisions;
  }

  const { outcomes, segmentMatrix: segMatrix } = historicalData;

  // 1️⃣ Run Strategy Pruning Check
  const pruneMetrics = ["MAX_REVENUE", "BALANCED", "FAST_DEAL"].map((strat) => {
    const stratOutcomes = outcomes.filter((o) => o.strategy_used === strat && o.outcome !== "PENDING");
    const won = stratOutcomes.filter((o) => o.outcome === "WON");
    const winRate = stratOutcomes.length > 0 ? won.length / stratOutcomes.length : 0;
    const totalRev = won.reduce((sum, o) => sum + (o.price_accepted ?? o.price_offered), 0);
    return {
      strategy: strat,
      winRate,
      sampleSize: stratOutcomes.length,
      totalAcceptedRevenue: totalRev,
    };
  });
  const pruning = runStrategyPruning(pruneMetrics);

  // 2️⃣ Run Drift Check
  const driftInput = outcomes.map((o) => ({
    strategy_used: o.strategy_used,
    outcome: o.outcome,
    timestamp: o.timestamp,
  }));
  const drift = runDriftAutocorrect(driftInput);

  // 3️⃣ Run Autopilot Core for Mode and Shifts
  const totalOutcomesCount = outcomes.filter((o) => o.outcome !== "PENDING").length;
  const reliableCellsCount = segMatrix.reliableCells;
  
  // Calculate average drift score from the drift corrector
  const driftScores = Object.values(drift.driftMetrics).map((m) => Math.abs(m.driftScore));
  const avgDriftScore = driftScores.length > 0 ? driftScores.reduce((s, v) => s + v, 0) / driftScores.length : 0;

  const strategyPerformance = {
    FAST_DEAL: (() => {
      const m = pruneMetrics.find((pm) => pm.strategy === "FAST_DEAL") || { winRate: 0, sampleSize: 0, totalAcceptedRevenue: 0 };
      const wonCount = outcomes.filter((o) => o.strategy_used === "FAST_DEAL" && o.outcome === "WON").length;
      return {
        winRate: m.winRate,
        avgRevenue: wonCount > 0 ? m.totalAcceptedRevenue / wonCount : 0,
        sampleSize: m.sampleSize,
      };
    })(),
    BALANCED: (() => {
      const m = pruneMetrics.find((pm) => pm.strategy === "BALANCED") || { winRate: 0, sampleSize: 0, totalAcceptedRevenue: 0 };
      const wonCount = outcomes.filter((o) => o.strategy_used === "BALANCED" && o.outcome === "WON").length;
      return {
        winRate: m.winRate,
        avgRevenue: wonCount > 0 ? m.totalAcceptedRevenue / wonCount : 0,
        sampleSize: m.sampleSize,
      };
    })(),
    MAX_REVENUE: (() => {
      const m = pruneMetrics.find((pm) => pm.strategy === "MAX_REVENUE") || { winRate: 0, sampleSize: 0, totalAcceptedRevenue: 0 };
      const wonCount = outcomes.filter((o) => o.strategy_used === "MAX_REVENUE" && o.outcome === "WON").length;
      return {
        winRate: m.winRate,
        avgRevenue: wonCount > 0 ? m.totalAcceptedRevenue / wonCount : 0,
        sampleSize: m.sampleSize,
      };
    })(),
  };

  const autopilot = runAutopilotCore({
    totalOutcomesCount,
    reliableCellsCount,
    avgDriftScore,
    strategyPerformance,
    outcomes,
    clientType: input.clientType,
  });

  // 4️⃣ Run Flow Allocator for Strategy exposure allocation
  // Determine best strategy for the segment using v3.3 bias or fallback
  const bestStrategyForSegment = biasOutput?.recommendedStrategyBias[userSegment] || "BALANCED";
  const flow = runFlowAllocation({
    clientType: input.clientType,
    prunedStrategies: pruning.prunedStrategies,
    downgradedStrategies: pruning.downgradedStrategies,
    bestStrategyForSegment,
  });

  // 5️⃣ Determine Drift Level label
  const driftLevel = avgDriftScore > 0.4 ? "HIGH" : avgDriftScore > 0.2 ? "MEDIUM" : "LOW";

  // Gather emerging and declining strategies (Task 5)
  const emergingStrategies = Object.values(autopilot.lifecycles.lifecycleMap)
    .filter((l) => l.lifecycleStage === "EMERGING")
    .map((l) => l.strategy);
  const decliningStrategies = Object.values(autopilot.lifecycles.lifecycleMap)
    .filter((l) => l.lifecycleStage === "DECLINING")
    .map((l) => l.strategy);

  // 6️⃣ Append autopilot advisory details (never overrides base decisions)
  return baseDecisions.map((decision) => {
    return {
      ...decision,
      autopilotMetadata: {
        mode: autopilot.autopilotMode,
        allocations: flow.allocation,
        pruned: pruning.prunedStrategies,
        downgraded: pruning.downgradedStrategies,
        driftDetected: driftLevel,
        statusMessage: autopilot.reason,
        revenueTrend: autopilot.evolution.revenueTrend,
        growthDirection: autopilot.trajectory.growthDirection,
        emergingStrategies,
        decliningStrategies,
        // v3.7 Model Innovation Layer additions
        innovationModels: autopilot.innovationModels,
        bestModel: autopilot.bestModel,
      },
    };
  });
}
