/**
 * Corvioz v1.6.1 — Outcome Escalation Guard
 *
 * Prevent outcome suggestions from escalating into automated executions or redirections.
 */

export function blockEscalation(signal: string) {
  const dangerous = [
    "auto_redirect",
    "auto_onboarding",
    "auto_upgrade",
    "auto_route_change"
  ];
  if (dangerous.includes(signal)) {
    throw new Error("ESCALATION PATH BLOCKED");
  }
}
