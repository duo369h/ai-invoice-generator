/**
 * REVENUE_STRATEGY_LEARNING_MATRIX.ts — v3.2 Closed Loop
 *
 * Builds: (client_type × strategy) → performance score matrix
 * from REAL resolved outcome data sourced from revenue_outcomes.
 *
 * Client types here use Strategy Engine's taxonomy: "new" | "repeat" | "long_term"
 * (distinct from the segment engine which uses "individual" | "startup" | etc.)
 *
 * ❌ PROHIBITED: AI, random(), prediction, external inference
 * ✅ ALLOWED: Deterministic weighted scoring from resolved historical records
 *
 * Safety rule: sampleSize < 5 → cell is IGNORED (anti-hallucination guard)
 */

export type LearningClientType = "new" | "repeat" | "long_term";
export type LearningStrategy = "MAX_REVENUE" | "BALANCED" | "FAST_DEAL";

export interface LearningMatrixCell {
  winRate: number;           // WON / total resolved, from real data only
  avgRevenue: number;        // avg price_accepted for WON deals
  sampleSize: number;        // resolved record count for this cell
  score: number;             // composite weighted score (0–100)
  reliable: boolean;         // sampleSize >= 5 — only reliable cells are used
}

export type LearningMatrix = {
  [client in LearningClientType]: {
    MAX_REVENUE: LearningMatrixCell;
    BALANCED: LearningMatrixCell;
    FAST_DEAL: LearningMatrixCell;
  };
};

export interface LearningMatrixSnapshot {
  matrix: LearningMatrix;
  totalRecordsUsed: number;
  reliableCells: number;      // Cells with sampleSize >= 5
  matrixVersion: number;      // Monotonic counter, incremented on each rebuild
  builtAt: number;
}

// ─── Raw record type (matches revenue_outcomes DB row subset) ────────────────
export interface OutcomeRow {
  client_type: string;        // May be segment type — mapped to learning type
  strategy_used: string;
  outcome: "WON" | "LOST" | "PENDING" | "REVISED";
  price_offered: number;
  price_accepted?: number | null;
}

const STRATEGIES: LearningStrategy[] = ["MAX_REVENUE", "BALANCED", "FAST_DEAL"];
const CLIENT_TYPES: LearningClientType[] = ["new", "repeat", "long_term"];
const MIN_RELIABLE_SAMPLE = 5;

// Score weight constants — tunable, never AI-derived
const WEIGHT_WIN_RATE = 0.6;
const WEIGHT_REVENUE = 0.4;

function emptyCell(): LearningMatrixCell {
  return { winRate: 0, avgRevenue: 0, sampleSize: 0, score: 0, reliable: false };
}

/**
 * mapToLearningClientType — translates segment client types to strategy engine types.
 * "individual" / "small_business" → "new"
 * "startup" → "repeat"
 * "enterprise" → "long_term"
 */
export function mapToLearningClientType(raw: string): LearningClientType {
  switch (raw) {
    case "new":
    case "individual":
    case "small_business":
      return "new";
    case "repeat":
    case "startup":
      return "repeat";
    case "long_term":
    case "enterprise":
      return "long_term";
    default:
      return "new";
  }
}

/**
 * computeWeightedScore — deterministic composite score for a matrix cell.
 * winRate weighted at 60%, normalized revenue at 40%.
 * Revenue is normalized against the max avg revenue across ALL cells in the matrix.
 */
function computeWeightedScore(
  winRate: number,
  avgRevenue: number,
  maxAvgRevenue: number
): number {
  const normalizedRevenue = maxAvgRevenue > 0 ? avgRevenue / maxAvgRevenue : 0;
  return parseFloat(
    (WEIGHT_WIN_RATE * winRate * 100 + WEIGHT_REVENUE * normalizedRevenue * 100).toFixed(1)
  );
}

/**
 * buildLearningMatrix — compute the full learning matrix from a resolved outcome dataset.
 *
 * @param outcomes — array of resolved outcome rows (outcome !== 'PENDING')
 * @param existingVersion — current matrix version (incremented by 1)
 */
export function buildLearningMatrix(
  outcomes: OutcomeRow[],
  existingVersion = 0
): LearningMatrixSnapshot {
  const resolved = outcomes.filter((r) => r.outcome !== "PENDING");

  // Step 1: Build raw cells
  const rawMatrix: LearningMatrix = {} as LearningMatrix;
  let maxAvgRevenue = 0;

  for (const ct of CLIENT_TYPES) {
    rawMatrix[ct] = {
      MAX_REVENUE: emptyCell(),
      BALANCED: emptyCell(),
      FAST_DEAL: emptyCell(),
    };

    for (const strategy of STRATEGIES) {
      const cellRows = resolved.filter(
        (r) =>
          mapToLearningClientType(r.client_type) === ct &&
          r.strategy_used === strategy
      );

      if (cellRows.length === 0) continue;

      const won = cellRows.filter((r) => r.outcome === "WON");
      const winRate = won.length / cellRows.length;
      const avgRevenue =
        won.length > 0
          ? won.reduce((s, r) => s + (r.price_accepted ?? 0), 0) / won.length
          : 0;

      rawMatrix[ct][strategy] = {
        winRate: parseFloat(winRate.toFixed(3)),
        avgRevenue: parseFloat(avgRevenue.toFixed(2)),
        sampleSize: cellRows.length,
        score: 0, // computed after we know maxAvgRevenue
        reliable: cellRows.length >= MIN_RELIABLE_SAMPLE,
      };

      if (avgRevenue > maxAvgRevenue) maxAvgRevenue = avgRevenue;
    }
  }

  // Step 2: Compute weighted scores now that maxAvgRevenue is known
  let reliableCells = 0;
  let totalRecordsUsed = 0;

  for (const ct of CLIENT_TYPES) {
    for (const strategy of STRATEGIES) {
      const cell = rawMatrix[ct][strategy];
      if (cell.sampleSize > 0) {
        cell.score = computeWeightedScore(cell.winRate, cell.avgRevenue, maxAvgRevenue);
        totalRecordsUsed += cell.sampleSize;
      }
      if (cell.reliable) reliableCells += 1;
    }
  }

  return {
    matrix: rawMatrix,
    totalRecordsUsed,
    reliableCells,
    matrixVersion: existingVersion + 1,
    builtAt: Date.now(),
  };
}

/**
 * getBestCellForClient — return the highest-scoring reliable cell for a given client type.
 * Returns null if no reliable cells exist for this client type.
 */
export function getBestCellForClient(
  snapshot: LearningMatrixSnapshot,
  clientType: LearningClientType
): { strategy: LearningStrategy; cell: LearningMatrixCell } | null {
  const row = snapshot.matrix[clientType];
  let best: { strategy: LearningStrategy; cell: LearningMatrixCell } | null = null;

  for (const strategy of STRATEGIES) {
    const cell = row[strategy];
    if (!cell.reliable) continue; // sampleSize < 5 → skip
    if (best === null || cell.score > best.cell.score) {
      best = { strategy, cell };
    }
  }

  return best;
}
