/**
 * Telemetry Aggregator — Corvioz v5.2.2 Telemetry Layer
 *
 * Prepares and aggregates telemetry logs.
 * PURE OBSERVER PATTERN.
 */

import { TelemetryLog } from './decisionTelemetry';

export interface TelemetrySummary {
  totalChecks: number;
  diffs: {
    matchCount: number;
    minorDiffCount: number;
    criticalDiffCount: number;
    mismatchRate: number;
  };
  drifts: {
    totalDriftCount: number;
    stateMismatchCount: number;
    identityMismatchCount: number;
    orphanPlanCount: number;
    driftRate: number;
  };
  averages: {
    avgRevenueImpactScore: number;
  };
  contexts: Record<string, { total: number; criticalDiffs: number; drifts: number }>;
}

/**
 * Aggregates logs into a structured summary report.
 */
export function aggregateTelemetryLogs(logs: TelemetryLog[]): TelemetrySummary {
  const totalChecks = logs.length;
  
  let matchCount = 0;
  let minorDiffCount = 0;
  let criticalDiffCount = 0;

  let totalDriftCount = 0;
  let stateMismatchCount = 0;
  let identityMismatchCount = 0;
  let orphanPlanCount = 0;

  let sumRevenueImpact = 0;
  const contexts: TelemetrySummary['contexts'] = {};

  logs.forEach((log) => {
    // Diff counts
    const classification = log.decisionDiff.classification;
    if (classification === 'MATCH') matchCount++;
    else if (classification === 'MINOR_DIFF') minorDiffCount++;
    else if (classification === 'CRITICAL_DIFF') criticalDiffCount++;

    sumRevenueImpact += log.decisionDiff.revenueImpactScore;

    // Drift counts
    if (log.drift.hasDrift) {
      totalDriftCount++;
      const type = log.drift.driftType;
      if (type === 'STATE_MISMATCH') stateMismatchCount++;
      else if (type === 'IDENTITY_MISMATCH') identityMismatchCount++;
      else if (type === 'ORPHAN_PLAN') orphanPlanCount++;
    }

    // Context tracking
    const ctx = log.context;
    if (!contexts[ctx]) {
      contexts[ctx] = { total: 0, criticalDiffs: 0, drifts: 0 };
    }
    contexts[ctx].total++;
    if (classification === 'CRITICAL_DIFF') contexts[ctx].criticalDiffs++;
    if (log.drift.hasDrift) contexts[ctx].drifts++;
  });

  const mismatchRate = totalChecks > 0 ? (minorDiffCount + criticalDiffCount) / totalChecks : 0;
  const driftRate = totalChecks > 0 ? totalDriftCount / totalChecks : 0;
  const avgRevenueImpactScore = totalChecks > 0 ? sumRevenueImpact / totalChecks : 0;

  return {
    totalChecks,
    diffs: {
      matchCount,
      minorDiffCount,
      criticalDiffCount,
      mismatchRate: Math.round(mismatchRate * 100) / 100,
    },
    drifts: {
      totalDriftCount,
      stateMismatchCount,
      identityMismatchCount,
      orphanPlanCount,
      driftRate: Math.round(driftRate * 100) / 100,
    },
    averages: {
      avgRevenueImpactScore: Math.round(avgRevenueImpactScore * 10),
    },
    contexts,
  };
}
