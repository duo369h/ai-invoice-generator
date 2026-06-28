/**
 * Corvioz — UI Authority Layer (v6.8.3 Governance Unified Edition)
 *
 * Enforces authority boundaries and checks before rendering.
 * Output structure conforms to the unified Governance format.
 */

export interface GovernanceDecision {
  decision: "ALLOW" | "BLOCK" | "REWRITE";
  reason: string;
  overrides?: any;
}

/**
 * Validates that structural boundaries are not violated.
 */
export function validateAuthority(originalSections: any[], mutatedSections: any[]): GovernanceDecision {
  const criticalTypes = ["HEADER", "SAFE_MODE"];

  for (const crit of criticalTypes) {
    const orig = originalSections.find(s => s.type === crit);
    if (!orig) continue;

    const mutated = mutatedSections.find(s => s.type === crit);
    if (!mutated) {
      return {
        decision: "REWRITE",
        reason: `Critical section ${crit} was deleted, forcing fallback`,
      };
    }
    if (mutated.uiDecision?.visibility === false) {
      return {
        decision: "REWRITE",
        reason: `Critical section ${crit} visibility was disabled, forcing fallback`,
      };
    }
  }

  return {
    decision: "ALLOW",
    reason: "Authority boundaries check passed",
  };
}
