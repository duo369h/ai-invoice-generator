/**
 * REVENUE_FLOW_ALLOCATOR_ENGINE.ts — v3.5 Flow Allocator
 *
 * Directs incoming deal traffic to strategy pathways by allocating exposure percentages.
 *
 * ❌ PROHIBITED: AI, Math.random() (matrix allocation must be fully deterministic)
 * ✅ ALLOWED: Deterministic flow distribution, rule-based ratio capping
 */

export interface FlowAllocationInput {
  clientType: "new" | "repeat" | "long_term";
  prunedStrategies: string[];
  downgradedStrategies: string[];
  bestStrategyForSegment: string | null;  // e.g. "MAX_REVENUE"
}

export interface FlowAllocationOutput {
  allocation: {
    MAX_REVENUE: number;
    BALANCED: number;
    FAST_DEAL: number;
  };
  rationale: string;
}

/**
 * runFlowAllocation — determines traffic exposure ratios.
 */
export function runFlowAllocation(input: FlowAllocationInput): FlowAllocationOutput {
  const { clientType, prunedStrategies, downgradedStrategies, bestStrategyForSegment } = input;

  // Start with default baseline allocation
  const allocation = {
    MAX_REVENUE: 33,
    BALANCED: 34,
    FAST_DEAL: 33,
  };

  let rationale = "Standard baseline strategy allocation applied.";

  // 1️⃣ Cap allocations for pruned or downgraded strategies
  for (const strategy of ["MAX_REVENUE", "BALANCED", "FAST_DEAL"] as const) {
    if (prunedStrategies.includes(strategy)) {
      allocation[strategy] = 5; // Minimum exposure for historical comparison
    } else if (downgradedStrategies.includes(strategy)) {
      allocation[strategy] = 12; // Capped weight
    }
  }

  // 2️⃣ Redistribute remaining weight to the best strategy or baseline BALANCED
  const totalAllocated = allocation.MAX_REVENUE + allocation.BALANCED + allocation.FAST_DEAL;
  const remainingWeight = 100 - totalAllocated;

  if (remainingWeight !== 0) {
    // Distribute remaining weight to best strategy, if valid and not pruned/downgraded
    const targetStrategy =
      bestStrategyForSegment &&
      !prunedStrategies.includes(bestStrategyForSegment) &&
      !downgradedStrategies.includes(bestStrategyForSegment)
        ? (bestStrategyForSegment as "MAX_REVENUE" | "BALANCED" | "FAST_DEAL")
        : "BALANCED";

    allocation[targetStrategy] += remainingWeight;
    rationale = `Exposure optimized for segment performance. Boosted ${targetStrategy} by ${remainingWeight}%.`;
  }

  // 3️⃣ Customize rationale based on status
  if (prunedStrategies.length > 0 || downgradedStrategies.length > 0) {
    rationale += ` Caps enforced due to strategy underperformance (${prunedStrategies.join(", ") || "none"} pruned; ${downgradedStrategies.join(", ") || "none"} downgraded).`;
  }

  return {
    allocation,
    rationale,
  };
}
