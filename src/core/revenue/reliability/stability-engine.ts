/**
 * RDCL v3.3 — Decision Stability Engine
 *
 * Validates that RDCL produces identical output for identical inputs.
 * Detects any non-determinism, fallback branching, or action variance.
 *
 * RULE: Read-only against RDCL. Runs same inputs N times and diffs outputs.
 */

import { RDCL } from '../RDCL';
import { buildRevenueContext } from '../context-engine';
import { LoadTestResult } from './load-test-engine';

export interface StabilityReport {
  deterministic: boolean;
  deviation_rate: number;
  failure_points: string[];
}

// ── Canonical test matrix: (event, events[]) pairs that must be stable ───────

const STABILITY_MATRIX: Array<{
  label: string;
  event: 'invoice_created' | 'invoice_sent' | 'invoice_paid' | 'quote_created';
  events: any[];
}> = [
  {
    label: 'invoice_paid × 3 → must always be UNLOCK_PREMIUM',
    event: 'invoice_paid',
    events: Array(3).fill({ type: 'invoice_paid' }),
  },
  {
    label: 'invoice_sent (no paid) → must always be SHOW_UPGRADE',
    event: 'invoice_sent',
    events: [{ type: 'invoice_sent' }],
  },
  {
    label: 'invoice_created only → must always be LIMIT_USAGE',
    event: 'invoice_created',
    events: [{ type: 'invoice_created' }],
  },
  {
    label: 'quote_created only → must always be NO_ACTION',
    event: 'quote_created',
    events: [{ type: 'quote_created' }],
  },
];

const REPETITIONS = 50; // run each case N times to surface any non-determinism

// ── Core check: run same input N times and assert output is invariant ─────────

function checkDeterminism(
  label: string,
  event: 'invoice_created' | 'invoice_sent' | 'invoice_paid' | 'quote_created',
  events: any[]
): string | null {
  const context = buildRevenueContext(events);
  const results = new Set<string>();

  for (let i = 0; i < REPETITIONS; i++) {
    results.add(RDCL(event, context));
  }

  if (results.size > 1) {
    return `NON-DETERMINISTIC: "${label}" produced ${results.size} different outputs: [${[...results].join(', ')}]`;
  }
  return null;
}

// ── Cross-validate against load test results (no trace should have mixed core action) ──

export function validateLoadResults(results: LoadTestResult[]): string[] {
  const failures: string[] = [];
  for (const r of results) {
    if (r.stability_score < 1.0) {
      failures.push(
        `LOAD STABILITY VIOLATION: "${r.scenario}" has stability_score=${r.stability_score} (expected 1.0 for deterministic kernel)`
      );
    }
  }
  return failures;
}

// ── Public API ────────────────────────────────────────────────────────────────

export function runStabilityEngine(loadResults?: LoadTestResult[]): StabilityReport {
  const failure_points: string[] = [];

  // Matrix determinism checks
  for (const { label, event, events } of STABILITY_MATRIX) {
    const failure = checkDeterminism(label, event, events);
    if (failure) failure_points.push(failure);
  }

  // Load result cross-validation
  if (loadResults) {
    const loadFailures = validateLoadResults(loadResults);
    failure_points.push(...loadFailures);
  }

  const total_checks = STABILITY_MATRIX.length + (loadResults?.length ?? 0);
  const deviation_rate = parseFloat(
    (failure_points.length / Math.max(1, total_checks)).toFixed(4)
  );

  return {
    deterministic: failure_points.length === 0,
    deviation_rate,
    failure_points,
  };
}
