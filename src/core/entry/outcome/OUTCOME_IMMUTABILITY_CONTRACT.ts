/**
 * Corvioz v1.6.1 — Outcome Immutability Contract
 *
 * Asserts that the outcome systems cannot mutate any entity in the entry routing/execution domain.
 *
 * RULE:
 *   ✔ Outcome cannot mutate anything in ENTRY domain
 */

export function assertOutcomeImmutable(target: string) {
  const forbidden = [
    "ENTRY_AUTHORITY",
    "middleware",
    "activation_state",
    "routing"
  ];
  if (forbidden.includes(target)) {
    throw new Error(
      "OUTCOME IMMUTABILITY VIOLATION"
    );
  }
}
