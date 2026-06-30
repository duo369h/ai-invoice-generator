/**
 * Plan State Drift Detector — Corvioz v5.2.2 Telemetry Layer
 *
 * Checks for inconsistencies in plan state storage across local domains.
 * STRICTLY READ-ONLY. No state mutations allowed.
 */

export interface PlanDriftResult {
  hasDrift: boolean;
  userId: string | null;
  genericPlan: string | null;
  suffixedPlan: string | null;
  identity: string | null;
  driftType: 'NONE' | 'STATE_MISMATCH' | 'IDENTITY_MISMATCH' | 'ORPHAN_PLAN';
}

/**
 * Evaluates the current plan state in localStorage and detects drifts.
 */
export function detectPlanStateDrift(userId: string | null): PlanDriftResult {
  if (typeof window === 'undefined') {
    return {
      hasDrift: false,
      userId,
      genericPlan: null,
      suffixedPlan: null,
      identity: null,
      driftType: 'NONE',
    };
  }

  const genericPlan = window.localStorage.getItem('corvioz_user_plan');
  const identity = window.localStorage.getItem('corvioz_identity');
  
  let suffixedPlan: string | null = null;
  if (userId) {
    suffixedPlan = window.localStorage.getItem(`corvioz_user_plan_${userId}`);
  }

  let hasDrift = false;
  let driftType: PlanDriftResult['driftType'] = 'NONE';

  if (userId && suffixedPlan && genericPlan && suffixedPlan !== genericPlan) {
    hasDrift = true;
    driftType = 'STATE_MISMATCH';
  } else if (identity && genericPlan && identity !== genericPlan) {
    hasDrift = true;
    driftType = 'IDENTITY_MISMATCH';
  } else if (!genericPlan && (suffixedPlan || identity)) {
    hasDrift = true;
    driftType = 'ORPHAN_PLAN';
  }

  return {
    hasDrift,
    userId,
    genericPlan,
    suffixedPlan,
    identity,
    driftType,
  };
}

export function recordPlanStateDrift(payload: {
  source: string;
  selectedPlan: any;
  userPlan: any;
  subscriptionPlan: any;
  billingState: any;
}) {
  const userId = typeof window !== 'undefined'
    ? window.localStorage.getItem('corvioz_user_id') || window.localStorage.getItem('corvioz_identity')
    : null;
  detectPlanStateDrift(userId);
}

