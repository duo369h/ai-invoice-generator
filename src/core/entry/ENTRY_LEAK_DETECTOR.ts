/**
 * Corvioz v1.1 — Runtime Entry Leak Detector
 *
 * Scans code snippets or module structures to detect bypasses of ENTRY_AUTHORITY.
 */

const forbiddenPatterns = [
  "hasActivated",
  "isActivated",
  "tierCheck",
  "resolveEntry",
  "/dashboard"
];

/**
 * Checks a code block for forbidden entry patterns.
 * Throws a CRITICAL ERROR if any leak is detected.
 */
export function detectEntryLeak(code: string): string[] {
  const leaks = forbiddenPatterns.filter(p => code.includes(p));
  if (leaks.length > 0) {
    throw new Error(
      `CRITICAL ENTRY LEAK DETECTED: Forbidden patterns [${leaks.join(", ")}] found in bypassed evaluation context.`
    );
  }
  return leaks;
}
