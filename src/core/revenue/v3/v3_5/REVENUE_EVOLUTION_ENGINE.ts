/**
 * REVENUE_EVOLUTION_ENGINE.ts — v3.6 Revenue Evolution Layer
 *
 * Analyzes time-series outcomes to calculate structural revenue vectors,
 * identify pricing trend directions, and trigger evolution adjustments.
 *
 * ❌ PROHIBITED: AI, Math.random()
 * ✅ ALLOWED: Trend slope computation, structural shift checks, advisory actions
 */

export type RevenueTrend = "UP" | "FLAT" | "DOWN";
export type EvolutionAction = "SCALE_EXPOSURE" | "HOLD" | "SHIFT_WEIGHTS" | "EVOLVE_PRICE_BAND";

export interface EvolutionOutcomeRecord {
  client_type: string;
  strategy_used: string;
  outcome: "WON" | "LOST" | "PENDING" | "REVISED";
  price_offered: number;
  price_accepted?: number | null;
  timestamp: number;
}

export interface EvolutionOutput {
  revenueTrend: RevenueTrend;
  acceptedPriceDeltaPct: number;  // % change in average accepted price
  structuralShiftDetected: boolean;
  shiftNote: string;
  evolutionActions: EvolutionAction[];
  processedAt: number;
}

/**
 * runRevenueEvolution — computes trend lines and checks for structural pricing shifts.
 */
export function runRevenueEvolution(records: EvolutionOutcomeRecord[]): EvolutionOutput {
  const resolved = records
    .filter((r) => r.outcome === "WON")
    .sort((a, b) => b.timestamp - a.timestamp); // Newest first

  if (resolved.length < 6) {
    return {
      revenueTrend: "FLAT",
      acceptedPriceDeltaPct: 0,
      structuralShiftDetected: false,
      shiftNote: "Insufficient resolved winning deals (< 6) to establish a trend baseline.",
      evolutionActions: ["HOLD"],
      processedAt: Date.now(),
    };
  }

  // Split resolved deals into two equal-sized halves for trend comparison
  const halfSize = Math.floor(resolved.length / 2);
  const recentDeals = resolved.slice(0, halfSize);
  const baselineDeals = resolved.slice(halfSize, halfSize * 2);

  const avgRecentPrice = recentDeals.reduce((sum, r) => sum + (r.price_accepted ?? r.price_offered), 0) / recentDeals.length;
  const avgBaselinePrice = baselineDeals.reduce((sum, r) => sum + (r.price_accepted ?? r.price_offered), 0) / baselineDeals.length;

  const acceptedPriceDeltaPct = avgBaselinePrice > 0
    ? parseFloat((((avgRecentPrice - avgBaselinePrice) / avgBaselinePrice) * 100).toFixed(1))
    : 0;

  // 1️⃣ Determine revenue trend direction
  let revenueTrend: RevenueTrend = "FLAT";
  if (acceptedPriceDeltaPct >= 5) {
    revenueTrend = "UP";
  } else if (acceptedPriceDeltaPct <= -5) {
    revenueTrend = "DOWN";
  }

  // 2️⃣ Detect structural shifts (e.g. client type distribution or higher price bounds acceptance)
  let structuralShiftDetected = false;
  let shiftNote = "No significant structural shifts detected in accepted prices.";
  const evolutionActions: EvolutionAction[] = [];

  const recentMaxRevWins = recentDeals.filter((r) => r.strategy_used === "MAX_REVENUE").length;
  const baselineMaxRevWins = baselineDeals.filter((r) => r.strategy_used === "MAX_REVENUE").length;

  if (recentMaxRevWins > baselineMaxRevWins + 1) {
    structuralShiftDetected = true;
    shiftNote = "Structural shift detected: Clients are increasingly accepting MAX_REVENUE premium pricing.";
    evolutionActions.push("SCALE_EXPOSURE");
  } else if (revenueTrend === "DOWN") {
    structuralShiftDetected = true;
    shiftNote = "Structural shift detected: Average accepted price has decayed. Re-calibrating base pricing bounds.";
    evolutionActions.push("EVOLVE_PRICE_BAND", "SHIFT_WEIGHTS");
  } else {
    evolutionActions.push("HOLD");
  }

  return {
    revenueTrend,
    acceptedPriceDeltaPct,
    structuralShiftDetected,
    shiftNote,
    evolutionActions,
    processedAt: Date.now(),
  };
}
