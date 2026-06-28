/**
 * RDCL v3.2.2 — RDCL Stability Guard
 *
 * Enforces that revenue decisions ONLY originate from RDCL.
 * Tracks:
 *  - Non-RDCL invocation attempts (throws + logs)
 *  - Duplicate decision attempts within same call stack (warns)
 *
 * Import ONLY in decision-gateway.ts. Do NOT import elsewhere.
 */

let lastDecisionSource: string = "RDCL";
let decisionCallCount: number = 0;

/**
 * Call this guard BEFORE executing any revenue action.
 * @param source - The module/caller attempting to produce an action.
 * @throws Error if source is not "RDCL"
 */
export function guard(source: string): void {
  if (source !== "RDCL") {
    console.warn(
      `[RDCL GUARD] NON-RDCL ACCESS ATTEMPT BLOCKED — caller: "${source}"`
    );
    throw new Error(
      `DECISION LEAK OUTSIDE RDCL — caller "${source}" attempted to produce a revenue action. ` +
      `All decisions must flow through decision-gateway.ts with source="RDCL".`
    );
  }

  // Duplicate decision detection (warns but does not throw — idempotent calls are allowed)
  decisionCallCount++;
  if (decisionCallCount > 1 && lastDecisionSource === source) {
    console.warn(
      `[RDCL GUARD] Duplicate decision attempt detected (call #${decisionCallCount}). ` +
      `Ensure events are not being double-emitted.`
    );
  }

  lastDecisionSource = source;
}

/**
 * Resets the guard state — call between isolated test cycles or session boundaries.
 * DO NOT call in production request handlers.
 */
export function resetGuard(): void {
  lastDecisionSource = "RDCL";
  decisionCallCount = 0;
}
