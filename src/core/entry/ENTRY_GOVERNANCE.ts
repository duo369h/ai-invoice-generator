/**
 * Corvioz v1.3 — Entry Decision Ownership Governance
 *
 * Ensures only authorized callers execute entry decisions.
 */

export function assertEntryOwnership(caller: string) {
  const allowed = [
    "ENTRY_AUTHORITY",
    "middleware",
    "dashboard-ui"
  ];
  if (!allowed.includes(caller)) {
    throw new Error("ENTRY OWNERSHIP VIOLATION");
  }
}
