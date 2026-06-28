/**
 * REVENUE_STRATEGY_SEGMENT_ENGINE.ts — v3.2 Strategy × Segment Matrix Engine
 *
 * Computes (client_type × strategy_used) → performance matrix
 * from REAL historical outcome data. No AI, no estimation.
 *
 * ❌ PROHIBITED: Live session data, AI inference, external API calls
 * ✅ ALLOWED: Aggregate stats from resolved outcome records only
 */

import type { RevenueOutcomeRecord, StrategyUsed } from "./REVENUE_OUTCOME_ENGINE";

export type ClientType =
  | "individual"
  | "small_business"
  | "startup"
  | "enterprise";

export interface StrategyCell {
  winRate: number;       // 0–1, from real outcomes
  avgPrice: number;      // avg accepted price for WON deals
  sampleSize: number;    // number of resolved records for this cell
  confidence: "none" | "low" | "medium" | "high";
}

export type StrategyMatrix = {
  [client in ClientType]?: {
    MAX_REVENUE: StrategyCell;
    BALANCED: StrategyCell;
    FAST_DEAL: StrategyCell;
  };
};

export interface SegmentMatrixResult {
  matrix: StrategyMatrix;
  totalRecordsUsed: number;
  computedAt: number;
  maturityLevel: "bootstrapping" | "partial" | "mature";
}

const STRATEGIES: StrategyUsed[] = ["MAX_REVENUE", "BALANCED", "FAST_DEAL"];
const CLIENT_TYPES: ClientType[] = ["individual", "small_business", "startup", "enterprise"];

function getConfidence(samples: number): StrategyCell["confidence"] {
  if (samples >= 20) return "high";
  if (samples >= 8) return "medium";
  if (samples >= 3) return "low";
  return "none";
}

function emptyCell(): StrategyCell {
  return { winRate: 0, avgPrice: 0, sampleSize: 0, confidence: "none" };
}

/**
 * buildStrategyMatrix — compute the cross-product performance matrix.
 * Pass in a snapshot of resolved outcome records (not live session data).
 *
 * @param resolvedOutcomes — only PASS records where outcome !== 'PENDING'
 */
export function buildStrategyMatrix(
  resolvedOutcomes: RevenueOutcomeRecord[]
): SegmentMatrixResult {
  const matrix: StrategyMatrix = {};
  let totalRecordsUsed = 0;

  for (const ct of CLIENT_TYPES) {
    const ctRow: StrategyMatrix[ClientType] = {
      MAX_REVENUE: emptyCell(),
      BALANCED: emptyCell(),
      FAST_DEAL: emptyCell(),
    };

    for (const strategy of STRATEGIES) {
      const cellRecords = resolvedOutcomes.filter(
        (r) =>
          r.client_type === ct &&
          r.strategy_used === strategy &&
          r.outcome !== "PENDING"
      );

      if (cellRecords.length === 0) {
        ctRow[strategy] = emptyCell();
        continue;
      }

      const won = cellRecords.filter((r) => r.outcome === "WON");
      const winRate = won.length / cellRecords.length;
      const avgPrice =
        won.length > 0
          ? won.reduce((s, r) => s + (r.price_accepted ?? 0), 0) / won.length
          : 0;

      ctRow[strategy] = {
        winRate: parseFloat(winRate.toFixed(3)),
        avgPrice: parseFloat(avgPrice.toFixed(2)),
        sampleSize: cellRecords.length,
        confidence: getConfidence(cellRecords.length),
      };

      totalRecordsUsed += cellRecords.length;
    }

    matrix[ct] = ctRow;
  }

  // Maturity: how many cells have at least "low" confidence
  const allCells = CLIENT_TYPES.flatMap((ct) =>
    STRATEGIES.map((s) => matrix[ct]?.[s])
  ).filter(Boolean) as StrategyCell[];

  const calibratedCells = allCells.filter((c) => c.confidence !== "none").length;
  const totalCells = CLIENT_TYPES.length * STRATEGIES.length;
  const calibrationRatio = calibratedCells / totalCells;

  const maturityLevel: SegmentMatrixResult["maturityLevel"] =
    calibrationRatio >= 0.75
      ? "mature"
      : calibrationRatio >= 0.25
      ? "partial"
      : "bootstrapping";

  return {
    matrix,
    totalRecordsUsed,
    computedAt: Date.now(),
    maturityLevel,
  };
}

/**
 * getCellForSegment — extract a single matrix cell for a (client_type, strategy) pair.
 */
export function getCellForSegment(
  matrix: StrategyMatrix,
  clientType: ClientType,
  strategy: StrategyUsed
): StrategyCell {
  return matrix[clientType]?.[strategy] ?? emptyCell();
}

/**
 * getBestStrategyForSegment — returns which strategy has the highest winRate
 * for a given client_type in the matrix. Falls back to "BALANCED" if no data.
 */
export function getBestStrategyForSegment(
  matrix: StrategyMatrix,
  clientType: ClientType
): { strategy: StrategyUsed; cell: StrategyCell } {
  const row = matrix[clientType];
  if (!row) return { strategy: "BALANCED", cell: emptyCell() };

  let best: StrategyUsed = "BALANCED";
  let bestWinRate = -1;

  for (const s of STRATEGIES) {
    const cell = row[s];
    if (cell.confidence !== "none" && cell.winRate > bestWinRate) {
      bestWinRate = cell.winRate;
      best = s;
    }
  }

  return { strategy: best, cell: row[best] ?? emptyCell() };
}
