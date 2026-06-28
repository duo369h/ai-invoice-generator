/**
 * Experiment Layer (Controlled Rollout Engine) — Corvioz v8
 *
 * Checks user cohort buckets, rollouts, and rollback flags.
 */

export interface ExperimentDecision {
  allowed: boolean;
  experimentId: string | null;
  rolloutPercent: number;
}

/**
 * Computes the experiment decision for a user cohort bucket.
 *
 * @param userId - Unique user identifier.
 */
export function getExperimentDecision(userId: string | null): ExperimentDecision {
  if (!userId) {
    return { allowed: false, experimentId: null, rolloutPercent: 0 };
  }

  // Rollback flag checks: checks both client localStorage override and environment variable
  const isRollbackActive = typeof window !== 'undefined' && 
    (window.localStorage.getItem('corvioz_growth_rollback') === 'true' ||
     process.env.NEXT_PUBLIC_GROWTH_ROLLBACK === 'true');

  if (isRollbackActive) {
    return {
      allowed: false,
      experimentId: 'rollback_active',
      rolloutPercent: 0,
    };
  }

  // Deterministic hash of the userId to assign a cohort bucket (0 to 99)
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = (hash << 5) - hash + userId.charCodeAt(i);
    hash |= 0; // Convert to 32-bit integer
  }
  const bucket = Math.abs(hash) % 100;

  // A/B test with 50% rollout cohort allocation
  const rolloutPercent = 50;
  const isAllowed = bucket < rolloutPercent;

  return {
    allowed: isAllowed,
    experimentId: 'v8_safe_growth_ab',
    rolloutPercent,
  };
}
