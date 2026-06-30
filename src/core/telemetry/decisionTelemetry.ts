/**
 * Telemetry Collector — Corvioz v5.2.2 Telemetry Layer
 *
 * Buffer and persist shadow telemetry comparisons in-memory and local storage.
 * STRICTLY OBSERVER PATTERN. Does not mutate application behavior.
 */

import { detectPlanStateDrift, PlanDriftResult } from './planStateDrift';
import { compareUpgradeDecisions, DecisionDiffResult } from './decisionDiffEngine';

export interface TelemetryLog {
  timestamp: number;
  context: string;
  userId: string | null;
  drift: PlanDriftResult;
  decisionDiff: DecisionDiffResult;
}

const MEMORY_LIMIT = 200;
let inMemoryLogs: TelemetryLog[] = [];

/**
 * Gets all collected logs from memory and localStorage.
 */
export function getTelemetryLogs(): TelemetryLog[] {
  if (typeof window === 'undefined') {
    return inMemoryLogs;
  }
  try {
    const stored = window.localStorage.getItem('corvioz_shadow_telemetry');
    const parsed = stored ? JSON.parse(stored) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch (_) {
    return inMemoryLogs;
  }
}

/**
 * Performs shadow checks, logs mismatch/drift metrics, and persists results.
 */
export function logShadowTelemetry(context: string, userId: string | null): void {
  // SSR Safeguard
  if (typeof window === 'undefined') {
    return;
  }

  try {
    const drift = detectPlanStateDrift(userId);
    const decisionDiff = compareUpgradeDecisions(userId);

    const logEntry: TelemetryLog = {
      timestamp: Date.now(),
      context,
      userId,
      drift,
      decisionDiff,
    };

    // Console warning reporting for diagnostic traceability
    if (decisionDiff.classification === 'CRITICAL_DIFF') {
      console.warn(
        `[SHADOW TELEMETRY ALERT] Critical Decision Discrepancy in context "${context}". Legacy recommends "${decisionDiff.legacy.recommendedPlan}" but Unified recommends "${decisionDiff.modern.recommendedPlan}". Revenue Impact Score: ${decisionDiff.revenueImpactScore}/100.`
      );
    }
    if (drift.hasDrift) {
      console.warn(
        `[SHADOW TELEMETRY ALERT] State Drift Detected in context "${context}" (Type: ${drift.driftType}). Suffixed Plan: "${drift.suffixedPlan || 'none'}", Generic Plan: "${drift.genericPlan || 'none'}", Identity: "${drift.identity || 'none'}".`
      );
    }

    // Update localStorage log database
    let logs = getTelemetryLogs();
    logs.push(logEntry);
    if (logs.length > MEMORY_LIMIT) {
      logs = logs.slice(logs.length - MEMORY_LIMIT);
    }
    
    window.localStorage.setItem('corvioz_shadow_telemetry', JSON.stringify(logs));
    inMemoryLogs = logs;
  } catch (e) {
    console.error('[SHADOW TELEMETRY ERROR] Logging failed:', e);
  }
}

export function recordDecisionTelemetry(payload: {
  source: string;
  decisionType: string;
  legacyOutput?: any;
  adapterOutput?: any;
  tags?: string[];
}) {
  const userId = typeof window !== 'undefined'
    ? window.localStorage.getItem('corvioz_user_id') || window.localStorage.getItem('corvioz_identity')
    : null;
  logShadowTelemetry(payload.source, userId);
}

