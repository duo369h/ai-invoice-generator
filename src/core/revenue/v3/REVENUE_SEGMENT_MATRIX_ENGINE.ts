/**
 * REVENUE_SEGMENT_MATRIX_ENGINE.ts — v3.3 Segment × Strategy Matrix
 *
 * The "learning brain" of the system.
 * Builds a matrix keyed by USER behavioral segment (not just client_type):
 *   PRICE_SENSITIVE × FAST_DEAL → { winRate, avgRevenue }
 *   VALUE_SEEKER    × BALANCED  → { winRate, avgRevenue }
 *   FAST_CLOSER     × FAST_DEAL → { winRate, avgRevenue }
 *   HIGH_VALUE      × MAX_REVENUE → { winRate, avgRevenue }
 *
 * Distinct from REVENUE_STRATEGY_SEGMENT_ENGINE (v3.2) which uses client_type taxonomy.
 * This engine uses the BEHAVIORAL segment taxonomy from USER_SEGMENT_ENGINE.
 *
 * ❌ PROHIBITED: AI, random(), external API, override of rule engine
 * ✅ ALLOWED: Deterministic aggregation, matrix computation, advisory output
 */

import type { UserSegment, BiasStrategy } from "./REVENUE_STRATEGY_BIAS_ENGINE";

export interface SegmentMatrixCell {
  winRate: number;          // WON / resolved, from real data
  avgRevenue: number;       // avg accepted price on WON deals
  sampleSize: number;
  reliable: boolean;        // sampleSize >= 5
}

export type SegmentStrategyMatrix = {
  [segment in UserSegment]?: {
    FAST_DEAL: SegmentMatrixCell;
    BALANCED: SegmentMatrixCell;
    MAX_REVENUE: SegmentMatrixCell;
  };
};

export interface SegmentMatrixSnapshot {
  matrix: SegmentStrategyMatrix;
  totalRecords: number;
  reliableCells: number;
  matrixHealth: "cold" | "learning" | "operational";  // Based on reliable cell count
  computedAt: number;
}

// Input row — from revenue_outcomes table with segment annotation
export interface SegmentOutcomeRow {
  user_segment: UserSegment;
  strategy_used: BiasStrategy;
  outcome: "WON" | "LOST" | "PENDING" | "REVISED";
  price_offered: number;
  price_accepted?: number | null;
}

const SEGMENTS: UserSegment[] = ["PRICE_SENSITIVE", "VALUE_SEEKER", "FAST_CLOSER", "HIGH_VALUE"];
const STRATEGIES: BiasStrategy[] = ["MAX_REVENUE", "BALANCED", "FAST_DEAL"];
const MIN_SAMPLES = 5;

function emptyCell(): SegmentMatrixCell {
  return { winRate: 0, avgRevenue: 0, sampleSize: 0, reliable: false };
}

/**
 * buildSegmentMatrix — build the full (UserSegment × Strategy) matrix.
 * Only uses resolved outcomes. Cells with < 5 samples are marked unreliable.
 */
export function buildSegmentMatrix(outcomes: SegmentOutcomeRow[]): SegmentMatrixSnapshot {
  const resolved = outcomes.filter((r) => r.outcome !== "PENDING");
  const matrix: SegmentStrategyMatrix = {};
  let totalRecords = resolved.length;
  let reliableCells = 0;

  for (const segment of SEGMENTS) {
    matrix[segment] = {
      MAX_REVENUE: emptyCell(),
      BALANCED: emptyCell(),
      FAST_DEAL: emptyCell(),
    };

    for (const strategy of STRATEGIES) {
      const cellRows = resolved.filter(
        (r) => r.user_segment === segment && r.strategy_used === strategy
      );
      const won = cellRows.filter((r) => r.outcome === "WON");
      const sampleSize = cellRows.length;
      const winRate = sampleSize > 0 ? won.length / sampleSize : 0;
      const avgRevenue =
        won.length > 0
          ? won.reduce((s, r) => s + (r.price_accepted ?? 0), 0) / won.length
          : 0;
      const reliable = sampleSize >= MIN_SAMPLES;

      matrix[segment]![strategy] = {
        winRate: parseFloat(winRate.toFixed(3)),
        avgRevenue: parseFloat(avgRevenue.toFixed(2)),
        sampleSize,
        reliable,
      };

      if (reliable) reliableCells++;
    }
  }

  const maxPossibleCells = SEGMENTS.length * STRATEGIES.length;
  const healthRatio = reliableCells / maxPossibleCells;

  return {
    matrix,
    totalRecords,
    reliableCells,
    matrixHealth:
      healthRatio >= 0.6 ? "operational" : healthRatio >= 0.2 ? "learning" : "cold",
    computedAt: Date.now(),
  };
}

/**
 * getBestStrategyForSegment — the primary consumer interface.
 * Returns the strategy with the highest win rate among reliable cells.
 * Returns null if no reliable cells exist for this segment.
 */
export function getBestStrategyForUserSegment(
  snapshot: SegmentMatrixSnapshot,
  segment: UserSegment
): { strategy: BiasStrategy; winRate: number; avgRevenue: number; sampleSize: number } | null {
  const row = snapshot.matrix[segment];
  if (!row) return null;

  let best: { strategy: BiasStrategy; winRate: number; avgRevenue: number; sampleSize: number } | null = null;

  for (const strategy of STRATEGIES) {
    const cell = row[strategy];
    if (!cell.reliable) continue;
    if (best === null || cell.winRate > best.winRate) {
      best = { strategy, winRate: cell.winRate, avgRevenue: cell.avgRevenue, sampleSize: cell.sampleSize };
    }
  }

  return best;
}

/**
 * getSegmentMatrixRow — get all three strategy cells for a segment.
 * Useful for the UI transparency layer.
 */
export function getSegmentMatrixRow(
  snapshot: SegmentMatrixSnapshot,
  segment: UserSegment
): Array<{ strategy: BiasStrategy; winRate: number; avgRevenue: number; sampleSize: number; reliable: boolean }> {
  const row = snapshot.matrix[segment];
  if (!row) return [];

  return STRATEGIES.map((strategy) => ({
    strategy,
    winRate: row[strategy].winRate,
    avgRevenue: row[strategy].avgRevenue,
    sampleSize: row[strategy].sampleSize,
    reliable: row[strategy].reliable,
  }));
}
