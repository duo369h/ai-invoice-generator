/**
 * Corvioz v1.4 — Cross-Layer Violation Logger
 *
 * Logs architectural layer boundary violations passively without execution block.
 */

export function logEntryViolation(event: string) {
  console.warn("[ENTRY_VIOLATION]", {
    event,
    timestamp: Date.now()
  });
}
