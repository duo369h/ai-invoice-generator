/**
 * Corvioz v1.6 — Runtime Influence Blocker
 *
 * Prevents execution or routing commands from issuing from the outcome layer.
 *
 * RULE:
 *   ✔ detection only
 *   ✔ no recovery logic
 */

export function blockOutcomeInfluence(signal: string) {
  const dangerousPatterns = [
    "modify_route",
    "trigger_redirect",
    "change_activation",
    "override_entry"
  ];
  if (dangerousPatterns.includes(signal)) {
    throw new Error("OUTCOME SYSTEM INFLUENCE ATTEMPT BLOCKED");
  }
}
