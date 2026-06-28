/**
 * REVENUE_LEARNING_GATE.ts — v3.2 Learning Influence Gate (Critical Safety Layer)
 *
 * Ensures the learning system ONLY affects future recommendations —
 * never live execution or current-request decisions.
 *
 * This is the architectural firewall between:
 *   📊 Historical intelligence (ALLOWED in recommendations)
 *   ⚡ Live execution (BLOCKED from learning data)
 *
 * ❌ PROHIBITED: Learning data entering current decision execution path
 * ✅ ALLOWED: Aggregated historical stats flowing into offline recommendations
 */

export type LearningDataSource =
  | "LIVE_SESSION"          // Current request — BLOCKED from decisions
  | "IMMEDIATE_OUTCOME"     // Outcome just recorded — BLOCKED from decisions
  | "AGGREGATED_HISTORY"    // Batch-computed from past records — SAFE for recommendations
  | "MATRIX_SNAPSHOT";      // Pre-computed matrix — SAFE for recommendations

export interface LearningGateResult {
  source: LearningDataSource;
  safeToUseForDecision: boolean;    // Current execution — almost always false
  safeToUseForRecommendation: boolean; // Future bias — allowed for aggregated data
  gatePassed: boolean;
  reason: string;
}

export interface LearningGateRequest {
  source: LearningDataSource;
  dataAge?: number;         // How old the data is in milliseconds (for AGGREGATED_HISTORY)
  sampleSize?: number;      // Record count backing this data
  isCurrentSession?: boolean; // Is this data from the current user session?
}

const MAX_FRESH_DATA_AGE_MS = 5 * 60 * 1000; // 5 minutes — fresher than this = too live

/**
 * checkLearningGate — validate whether learning data is safe to use
 * in a given context.
 *
 * RULE TABLE:
 * ┌──────────────────────┬──────────────┬──────────────────────────┐
 * │ Source               │ For Decision │ For Recommendation       │
 * ├──────────────────────┼──────────────┼──────────────────────────┤
 * │ LIVE_SESSION         │ ❌ BLOCKED   │ ❌ BLOCKED               │
 * │ IMMEDIATE_OUTCOME    │ ❌ BLOCKED   │ ❌ BLOCKED               │
 * │ AGGREGATED_HISTORY   │ ❌ BLOCKED   │ ✅ ALLOWED (if aged)     │
 * │ MATRIX_SNAPSHOT      │ ❌ BLOCKED   │ ✅ ALLOWED               │
 * └──────────────────────┴──────────────┴──────────────────────────┘
 */
export function checkLearningGate(req: LearningGateRequest): LearningGateResult {
  const { source, dataAge, sampleSize = 0, isCurrentSession = false } = req;

  // Decisions are ALWAYS blocked from learning data — no exceptions
  const safeToUseForDecision = false;

  switch (source) {
    case "LIVE_SESSION":
      return {
        source,
        safeToUseForDecision,
        safeToUseForRecommendation: false,
        gatePassed: false,
        reason:
          "LIVE_SESSION data is never safe for decisions or recommendations. Outcome not yet resolved.",
      };

    case "IMMEDIATE_OUTCOME":
      return {
        source,
        safeToUseForDecision,
        safeToUseForRecommendation: false,
        gatePassed: false,
        reason:
          "IMMEDIATE_OUTCOME is too fresh. Must be batch-aggregated before influencing recommendations.",
      };

    case "AGGREGATED_HISTORY": {
      // Must be older than MAX_FRESH_DATA_AGE_MS and have meaningful sample
      const isSufficientlyAged =
        dataAge === undefined || dataAge > MAX_FRESH_DATA_AGE_MS;
      const hasSufficientSample = sampleSize >= 5;

      if (!isSufficientlyAged) {
        return {
          source,
          safeToUseForDecision,
          safeToUseForRecommendation: false,
          gatePassed: false,
          reason: `AGGREGATED_HISTORY is too recent (${dataAge}ms). Must age at least ${MAX_FRESH_DATA_AGE_MS}ms.`,
        };
      }

      if (!hasSufficientSample) {
        return {
          source,
          safeToUseForDecision,
          safeToUseForRecommendation: false,
          gatePassed: false,
          reason: `Insufficient sample size (${sampleSize}). Minimum 5 records required for recommendation bias.`,
        };
      }

      if (isCurrentSession) {
        return {
          source,
          safeToUseForDecision,
          safeToUseForRecommendation: false,
          gatePassed: false,
          reason: "Current session data must not loop back into recommendations within the same request.",
        };
      }

      return {
        source,
        safeToUseForDecision,
        safeToUseForRecommendation: true,
        gatePassed: true,
        reason: "AGGREGATED_HISTORY is aged and has sufficient sample — safe for recommendation bias only.",
      };
    }

    case "MATRIX_SNAPSHOT":
      return {
        source,
        safeToUseForDecision,
        safeToUseForRecommendation: true,
        gatePassed: true,
        reason: "MATRIX_SNAPSHOT is a pre-computed batch artifact — safe for recommendation bias only.",
      };

    default:
      return {
        source,
        safeToUseForDecision,
        safeToUseForRecommendation: false,
        gatePassed: false,
        reason: `Unknown learning source: ${source}`,
      };
  }
}

/**
 * assertLearningGate — throw if data source is not safe for its intended use.
 * Use this at the boundary of any function that touches learning data.
 */
export function assertLearningGate(
  req: LearningGateRequest,
  intent: "decision" | "recommendation"
): void {
  const result = checkLearningGate(req);

  if (intent === "decision" && result.safeToUseForDecision === false) {
    throw new Error(
      `[LEARNING_GATE] Learning data BLOCKED from decision path. Source: ${req.source}. Reason: ${result.reason}`
    );
  }

  if (intent === "recommendation" && result.safeToUseForRecommendation === false) {
    throw new Error(
      `[LEARNING_GATE] Learning data BLOCKED from recommendation. Source: ${req.source}. Reason: ${result.reason}`
    );
  }
}
