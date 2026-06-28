/**
 * RDCL v3.3 — Production Decision Divergence Tracker
 *
 * Reads the shadow mode log and computes divergence metrics.
 * Logs CRITICAL cases only — never intervenes in live decisions.
 *
 * RULE: Observational only. Zero side effects on runtime or RDCL.
 */

import { getShadowLog, ShadowResult } from './shadow-mode-engine';

export interface DivergenceReport {
  total_events:   number;
  divergence_rate: number;
  critical_cases: string[];
}

// ── Divergence severity classifier ────────────────────────────────────────────

/**
 * A case is CRITICAL when shadow and live disagree on a high-stakes action:
 *   - Live says UNLOCK_PREMIUM but shadow says SHOW_UPGRADE or LIMIT_USAGE
 *   - Live says NO_ACTION but shadow says UNLOCK_PREMIUM (missed revenue signal)
 */
function isCriticalDivergence(r: ShadowResult): boolean {
  if (r.match) return false;
  // Premium unlock disagreement is always critical
  if (r.live_action === 'UNLOCK_PREMIUM' || r.shadow_action === 'UNLOCK_PREMIUM') return true;
  // Missed signal: live thinks nothing to do, shadow sees pressure
  if (r.live_action === 'NO_ACTION' && r.shadow_action !== 'NO_ACTION') return true;
  return false;
}

function formatCritical(r: ShadowResult): string {
  return (
    `CRITICAL DIVERGENCE at t=${r.timestamp_ms}: ` +
    `event="${r.event}" live="${r.live_action}" shadow="${r.shadow_action}"`
  );
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Computes divergence metrics from the current shadow log.
 * Call after a session or batch run of shadowExecute() calls.
 */
export function computeDivergence(): DivergenceReport {
  const log = getShadowLog();
  const total_events = log.length;

  if (total_events === 0) {
    return { total_events: 0, divergence_rate: 0, critical_cases: [] };
  }

  const diverged = log.filter(r => !r.match);
  const critical_cases = log
    .filter(isCriticalDivergence)
    .map(formatCritical);

  const divergence_rate = parseFloat(
    (diverged.length / total_events).toFixed(4)
  );

  // Log critical cases to console — observation only, no intervention
  for (const msg of critical_cases) {
    console.error(`[RDCL DIVERGENCE TRACKER] ${msg}`);
  }

  return {
    total_events,
    divergence_rate,
    critical_cases,
  };
}

/**
 * Runs divergence tracking on an explicit set of shadow results.
 * Use this when you want to inspect a specific batch without reading global log.
 */
export function computeDivergenceFromBatch(
  batch: ShadowResult[]
): DivergenceReport {
  const total_events = batch.length;
  if (total_events === 0) {
    return { total_events: 0, divergence_rate: 0, critical_cases: [] };
  }

  const diverged      = batch.filter(r => !r.match);
  const critical_cases = batch.filter(isCriticalDivergence).map(formatCritical);
  const divergence_rate = parseFloat((diverged.length / total_events).toFixed(4));

  return { total_events, divergence_rate, critical_cases };
}
