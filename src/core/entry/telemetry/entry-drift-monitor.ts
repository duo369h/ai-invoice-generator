/**
 * READ ONLY SYSTEM
 * MUST NOT affect routing, activation, or RDCL
 */

/**
 * Corvioz v1.2 — Entry Drift Monitor
 *
 * Observational safety layer to monitor and log routing bypass attempts.
 *
 * RULE:
 *   🚨 observation only
 *   🚨 must NOT block execution
 */

export interface DriftDetectionResult {
  driftDetected: boolean;
  violations:    string[];
}

export function detectEntryDrift(events: {
  userId:             string;
  requestedRoute:     string;
  expectedRoute:      string;
  isBypassAttempt:    boolean;
  isDirectAccessLeak: boolean;
}[]): DriftDetectionResult {
  const violations: string[] = [];

  for (const e of events) {
    if (e.isBypassAttempt) {
      violations.push(`User "${e.userId}" attempted bypass from expected "${e.expectedRoute}" to "${e.requestedRoute}"`);
    }
    if (e.isDirectAccessLeak) {
      violations.push(`User "${e.userId}" leaked direct access on route "${e.requestedRoute}"`);
    }
  }

  const driftDetected = violations.length > 0;

  if (driftDetected) {
    console.warn(`[ENTRY_DRIFT_MONITOR] Drift detected! Violations count: ${violations.length}`);
  }

  return {
    driftDetected,
    violations,
  };
}
