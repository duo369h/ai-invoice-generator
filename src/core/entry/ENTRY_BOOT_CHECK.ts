/**
 * Corvioz v1.1 — Entry Sanity Check at App Boot
 *
 * Ensures that no other module attempts to bypass ENTRY_AUTHORITY on startup.
 */

export function ENTRY_BOOT_CHECK(systemModules: string[]) {
  const violations = systemModules.filter(m =>
    m.includes("entry") &&
    !m.includes("ENTRY_AUTHORITY")
  );
  if (violations.length > 0) {
    throw new Error("ENTRY SYSTEM DRIFT DETECTED: " + violations.join(", "));
  }
}
