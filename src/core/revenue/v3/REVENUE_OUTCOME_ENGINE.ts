/**
 * REVENUE_OUTCOME_ENGINE.ts — v3.1.2 Outcome Tracking Engine
 *
 * Records each deal's complete lifecycle WITHOUT AI decision pollution.
 * Pure deterministic bookkeeping: input → storage → statistical output.
 *
 * ❌ AI PROHIBITED: No AI may write to or read decision fields here.
 * ✅ ALLOWED: Outcome logging, aggregate stats, offline pattern analysis.
 */

export type StrategyUsed = "MAX_REVENUE" | "BALANCED" | "FAST_DEAL";
export type OutcomeResult = "WON" | "LOST" | "PENDING" | "REVISED";

export interface RevenueOutcomeRecord {
  user_id: string;
  proposal_id: string;
  strategy_used: StrategyUsed;
  price_offered: number;
  price_accepted?: number;       // Populated only if WON
  outcome: OutcomeResult;
  client_type: "individual" | "small_business" | "startup" | "enterprise";
  service_type: string;
  urgency: "low" | "medium" | "high";
  time_to_decision_hours?: number; // How long the client took to decide
  revision_count: number;          // How many times user revised the quote
  timestamp: number;
}

export interface OutcomeStats {
  totalRecords: number;
  winRate: number;                    // 0–1, computed from real data only
  avgAcceptedPrice: number;
  avgOfferedPrice: number;
  priceConversionRatio: number;       // accepted / offered
  strategyPerformance: Record<StrategyUsed, { winRate: number; avgDelta: number }>;
  clientTypeBreakdown: Record<string, { winRate: number; count: number }>;
  learningConfidence: "cold" | "learning" | "calibrated"; // based on sample size
}

// ─── In-memory store (replace with DB adapter in production) ──────────────
const outcomeStore: RevenueOutcomeRecord[] = [];

/**
 * recordOutcome — append a completed deal lifecycle to the outcome store.
 */
export function recordOutcome(record: RevenueOutcomeRecord): void {
  if (!record.user_id || !record.proposal_id) {
    throw new Error("OUTCOME_ENGINE: user_id and proposal_id are required.");
  }
  outcomeStore.push({ ...record, timestamp: record.timestamp || Date.now() });
}

/**
 * updateOutcome — update an existing record when an outcome is resolved.
 */
export function updateOutcome(
  proposal_id: string,
  patch: Partial<Pick<RevenueOutcomeRecord, "outcome" | "price_accepted" | "time_to_decision_hours" | "revision_count">>
): boolean {
  const idx = outcomeStore.findIndex((r) => r.proposal_id === proposal_id);
  if (idx === -1) return false;
  outcomeStore[idx] = { ...outcomeStore[idx], ...patch };
  return true;
}

/**
 * computeOutcomeStats — deterministic aggregate computation over all records.
 * NEVER uses AI estimates. Only real outcome data.
 */
export function computeOutcomeStats(userId?: string): OutcomeStats {
  const records = userId
    ? outcomeStore.filter((r) => r.user_id === userId)
    : outcomeStore;

  const resolved = records.filter((r) => r.outcome !== "PENDING");
  const won = resolved.filter((r) => r.outcome === "WON");

  const totalRecords = records.length;
  const winRate = resolved.length > 0 ? won.length / resolved.length : 0;
  const avgAcceptedPrice =
    won.length > 0
      ? won.reduce((s, r) => s + (r.price_accepted ?? 0), 0) / won.length
      : 0;
  const avgOfferedPrice =
    resolved.length > 0
      ? resolved.reduce((s, r) => s + r.price_offered, 0) / resolved.length
      : 0;
  const priceConversionRatio =
    avgOfferedPrice > 0 ? avgAcceptedPrice / avgOfferedPrice : 0;

  // Strategy breakdown
  const strategies: StrategyUsed[] = ["MAX_REVENUE", "BALANCED", "FAST_DEAL"];
  const strategyPerformance = {} as OutcomeStats["strategyPerformance"];
  for (const s of strategies) {
    const sRecords = resolved.filter((r) => r.strategy_used === s);
    const sWon = sRecords.filter((r) => r.outcome === "WON");
    const sWinRate = sRecords.length > 0 ? sWon.length / sRecords.length : 0;
    const avgDelta =
      sWon.length > 0
        ? sWon.reduce((acc, r) => acc + ((r.price_accepted ?? 0) - r.price_offered), 0) / sWon.length
        : 0;
    strategyPerformance[s] = { winRate: sWinRate, avgDelta };
  }

  // Client type breakdown
  const clientTypeBreakdown: OutcomeStats["clientTypeBreakdown"] = {};
  for (const r of resolved) {
    if (!clientTypeBreakdown[r.client_type]) {
      clientTypeBreakdown[r.client_type] = { winRate: 0, count: 0 };
    }
    clientTypeBreakdown[r.client_type].count += 1;
  }
  for (const ct of Object.keys(clientTypeBreakdown)) {
    const ctResolved = resolved.filter((r) => r.client_type === ct);
    const ctWon = ctResolved.filter((r) => r.outcome === "WON");
    clientTypeBreakdown[ct].winRate =
      ctResolved.length > 0 ? ctWon.length / ctResolved.length : 0;
  }

  // Confidence tier based on data volume
  const learningConfidence: OutcomeStats["learningConfidence"] =
    totalRecords >= 50 ? "calibrated" : totalRecords >= 10 ? "learning" : "cold";

  return {
    totalRecords,
    winRate,
    avgAcceptedPrice,
    avgOfferedPrice,
    priceConversionRatio,
    strategyPerformance,
    clientTypeBreakdown,
    learningConfidence,
  };
}

/**
 * getOutcomesByUser — retrieve all outcome records for a specific user.
 */
export function getOutcomesByUser(userId: string): RevenueOutcomeRecord[] {
  return outcomeStore.filter((r) => r.user_id === userId);
}
