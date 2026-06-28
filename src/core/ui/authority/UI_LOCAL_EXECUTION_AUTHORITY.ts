/**
 * Corvioz — UI Local Execution Authority (v6.9.1 Recovery Patch)
 *
 * Dictates boundaries for section-level autonomous behavior (drift).
 * ❌ Prohibited from global layout mutation.
 * ✔ Allows bounded local section-level drift.
 */

export interface LocalExecutionAuthorityResult {
  sectionId: string;
  allowedActions: {
    reorder: boolean;
    emphasisShift: boolean;
    visibilitySoftToggle: boolean;
  };
  constraints: {
    maxDriftScore: number;
  };
}

export function authorizeLocalExecution(sectionId: string): LocalExecutionAuthorityResult {
  // Critical sections like header or safe_mode have strict limitations
  const isCritical = sectionId === "HEADER" || sectionId === "SAFE_MODE";

  return {
    sectionId,
    allowedActions: {
      reorder: !isCritical,
      emphasisShift: true,
      visibilitySoftToggle: !isCritical,
    },
    constraints: {
      maxDriftScore: isCritical ? 0.0 : 0.8,
    },
  };
}
