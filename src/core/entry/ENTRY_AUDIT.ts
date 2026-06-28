/**
 * Corvioz v1 — Entry Audit Guard
 *
 * Enforces that only ENTRY_AUTHORITY is allowed to make routing decisions.
 * Throws an error on violations.
 */

export function ENTRY_AUDIT(callers: string[]) {
  const violations = callers.filter(
    (c) => c !== "ENTRY_AUTHORITY"
  );
  if (violations.length > 0) {
    throw new Error(
      "ENTRY AUTHORITY VIOLATION DETECTED: " + violations.join(", ")
    );
  }
}
