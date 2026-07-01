/**
 * Corvioz Revenue Signal Engine — Guardrails & Invariant Enforcer
 * Sprint C Phase 2.8
 *
 * Ensures deterministic scoring bounds, protects against division by zero or NaN,
 * and enforces strict architectural decoupling (No UI/Pricing mutations).
 */

export const MIN_REVENUE_SCORE = 0;
export const MAX_REVENUE_SCORE = 100;

/**
 * Clamps raw revenue intent score strictly within [0, 100] bounds.
 */
export function clampRevenueScore(rawScore: number): number {
  if (typeof rawScore !== 'number' || Number.isNaN(rawScore) || !Number.isFinite(rawScore)) {
    return MIN_REVENUE_SCORE;
  }
  return Math.max(MIN_REVENUE_SCORE, Math.min(MAX_REVENUE_SCORE, Math.round(rawScore)));
}

/**
 * Safely executes any revenue signal calculation, catching exceptions to ensure
 * the tracking pipeline is NEVER blocked or broken by scoring logic.
 */
export function executeSafely<T>(computation: () => T, fallback: T): T {
  try {
    return computation();
  } catch (err) {
    if (process.env.NODE_ENV !== 'production') {
      console.error('[REVENUE_SIGNAL_GUARDRAILS ERROR] Computation failure:', err);
    }
    return fallback;
  }
}

/**
 * Validates whether metadata or payload contains valid structures before scoring.
 */
export function isValidSignalPayload(payload: any): boolean {
  if (!payload || typeof payload !== 'object') return false;
  if (typeof payload.event !== 'string' || !payload.event.trim()) return false;
  return true;
}
