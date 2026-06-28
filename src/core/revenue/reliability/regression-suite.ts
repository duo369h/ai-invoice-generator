/**
 * RDCL v3.3 — Regression Test Suite
 *
 * Ensures the RDCL kernel does not regress under new context patterns,
 * noisy signals, mixed-tier users, or high-volume sequences.
 *
 * RULE: RDCL is the system under test. This suite is additive — no RDCL changes.
 */

import { RDCL } from '../RDCL';
import { buildRevenueContext } from '../context-engine';
import { filterTrace, resetSafetySession } from './safety-layer';
import { Action } from './load-test-engine';

export interface RegressionReport {
  passed: boolean;
  failed_cases: string[];
}

// ── Test case definition ──────────────────────────────────────────────────────

interface RegressionCase {
  name: string;
  run: () => string | null; // returns failure message or null (pass)
}

// ── Helper: assert RDCL output for a single (event, events) input ─────────────

function assertDecision(
  label: string,
  event: 'invoice_created' | 'invoice_sent' | 'invoice_paid' | 'quote_created',
  events: any[],
  expected: Action
): string | null {
  const context = buildRevenueContext(events);
  const actual = RDCL(event, context);
  if (actual !== expected) {
    return `FAILED [${label}]: expected="${expected}" actual="${actual}"`;
  }
  return null;
}

// ── Regression cases ──────────────────────────────────────────────────────────

const REGRESSION_CASES: RegressionCase[] = [
  // ── TC-01: Same input → same output (determinism guarantee) ───────────────
  {
    name: 'TC-01: Determinism — invoice_paid × 3 always → UNLOCK_PREMIUM',
    run() {
      const events = Array(3).fill({ type: 'invoice_paid' });
      const results = new Set<string>();
      const context = buildRevenueContext(events);
      for (let i = 0; i < 30; i++) results.add(RDCL('invoice_paid', context));
      if (results.size > 1) {
        return `FAILED [TC-01]: Non-deterministic output: [${[...results].join(', ')}]`;
      }
      return null;
    },
  },

  // ── TC-02: Multi-signal conflict → single action (no dual-output) ──────────
  {
    name: 'TC-02: Multi-signal conflict — paid + created → single dominant action',
    run() {
      const events = [
        { type: 'invoice_paid' },
        { type: 'invoice_created' },
        { type: 'invoice_sent' },
      ];
      return assertDecision('TC-02', 'invoice_paid', events, 'UNLOCK_PREMIUM');
    },
  },

  // ── TC-03: Context drift — adding noisy events must not flip stable output ─
  {
    name: 'TC-03: Context drift — noisy quote events must not flip paid→UNLOCK_PREMIUM',
    run() {
      const baseEvents = Array(5).fill({ type: 'invoice_paid' });
      const noisyEvents = [
        ...baseEvents,
        ...Array(10).fill({ type: 'quote_created' }),
        { type: 'invoice_created' },
      ];
      return assertDecision('TC-03', 'invoice_paid', noisyEvents, 'UNLOCK_PREMIUM');
    },
  },

  // ── TC-04: High load — stable latency (all calls < 10ms) ──────────────────
  {
    name: 'TC-04: High load — 200 decisions must complete < 10ms p99',
    run() {
      const events = Array(5).fill({ type: 'invoice_sent' });
      const context = buildRevenueContext(events);
      const latencies: number[] = [];
      for (let i = 0; i < 200; i++) {
        const t0 = performance.now();
        RDCL('invoice_sent', context);
        latencies.push(performance.now() - t0);
      }
      const p99 = [...latencies].sort((a, b) => a - b)[Math.floor(200 * 0.99)];
      if (p99 > 10) {
        return `FAILED [TC-04]: p99 latency=${p99.toFixed(3)}ms exceeds 10ms budget`;
      }
      return null;
    },
  },

  // ── TC-05: Zero events → always NO_ACTION ─────────────────────────────────
  {
    name: 'TC-05: Empty context — quote_created with no history → NO_ACTION',
    run() {
      return assertDecision('TC-05', 'quote_created', [], 'NO_ACTION');
    },
  },

  // ── TC-06: Safety layer — SHOW_UPGRADE capped at 1 per session ────────────
  {
    name: 'TC-06: Safety layer — repeated SHOW_UPGRADE suppressed after first',
    run() {
      resetSafetySession();
      const trace: Action[] = ['SHOW_UPGRADE', 'SHOW_UPGRADE', 'SHOW_UPGRADE'];
      const { safe_trace } = filterTrace(trace);
      const upgradeCount = safe_trace.filter(a => a === 'SHOW_UPGRADE').length;
      if (upgradeCount > 1) {
        return `FAILED [TC-06]: SHOW_UPGRADE appeared ${upgradeCount} times after safety filter (max=1)`;
      }
      return null;
    },
  },

  // ── TC-07: Mixed-tier user — enterprise-level paid count → UNLOCK_PREMIUM ─
  {
    name: 'TC-07: Mixed-tier — 6× paid (enterprise tier) → UNLOCK_PREMIUM',
    run() {
      const events = [
        ...Array(6).fill({ type: 'invoice_paid' }),
        ...Array(3).fill({ type: 'quote_created' }),
        { type: 'invoice_created' },
      ];
      return assertDecision('TC-07', 'invoice_paid', events, 'UNLOCK_PREMIUM');
    },
  },
];

// ── Public API ────────────────────────────────────────────────────────────────

export function runRegressionSuite(): RegressionReport {
  const failed_cases: string[] = [];

  for (const tc of REGRESSION_CASES) {
    const result = tc.run();
    if (result) failed_cases.push(result);
  }

  return {
    passed: failed_cases.length === 0,
    failed_cases,
  };
}
