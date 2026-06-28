/**
 * Corvioz v1.6 — Hard Block Outcome to Entry Dependency Guard
 *
 * Enforces runtime-level boundary check ensuring the outcome layer does not import key entry modules.
 *
 * RULE:
 *   ✔ Outcome layer is READ ONLY
 *   ✔ No cross import into entry system
 */

export function assertOutcomeIsolation(importPath: string) {
  const forbidden = [
    "ENTRY_AUTHORITY",
    "middleware",
    "dashboard/page",
    "activation-flow"
  ];
  if (forbidden.some(f => importPath.includes(f))) {
    throw new Error(
      "OUTCOME LAYER VIOLATION: cannot import entry system"
    );
  }
}
