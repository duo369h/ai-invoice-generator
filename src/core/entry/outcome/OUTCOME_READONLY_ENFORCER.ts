/**
 * Corvioz v1.6 — Outcome System Read-Only Enforcer
 *
 * Ensures the outcome system cannot perform mutate calls targeting core entry modules.
 */

export function assertReadOnly(target: string) {
  const mutableTargets = [
    "ENTRY_AUTHORITY",
    "middleware",
    "activation_state"
  ];
  if (mutableTargets.includes(target)) {
    throw new Error("OUTCOME SYSTEM CANNOT MUTATE ENTRY STATE");
  }
}
