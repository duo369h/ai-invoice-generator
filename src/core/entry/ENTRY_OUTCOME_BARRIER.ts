/**
 * Corvioz v1.6.1 — Entry Outcome Boundary Barrier
 *
 * Block any outcome-to-entry crossing calls at runtime.
 */

export function enforceBoundary(callPath: string) {
  if (callPath.includes("outcome -> entry")) {
    throw new Error(
      "CRITICAL: OUTCOME-ENTRY CROSSING DETECTED"
    );
  }
}
