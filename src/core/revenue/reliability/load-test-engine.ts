/**
 * RDCL v3.3 — Load Test Engine
 *
 * Simulates real production traffic patterns against the RDCL decision kernel.
 * DOES NOT modify RDCL. Exercises it under three canonical load scenarios.
 *
 * RULE: Read-only against RDCL. No architecture changes. No signal injection.
 */

import { RDCL } from '../RDCL';
import { buildRevenueContext } from '../context-engine';

export type Action = 'UNLOCK_PREMIUM' | 'SHOW_UPGRADE' | 'LIMIT_USAGE' | 'NO_ACTION';

export interface LoadTestResult {
  scenario: string;
  decision_trace: Action[];
  latency: number[];
  stability_score: number;
}

// ── Scenario event builders ──────────────────────────────────────────────────

function buildScenarioA() {
  // Burst Conversion Pressure: heavy invoice activity, 2 paid
  return [
    ...Array(20).fill({ type: 'invoice_created' }),
    ...Array(10).fill({ type: 'invoice_sent' }),
    ...Array(2).fill({ type: 'invoice_paid' }),
  ];
}

function buildScenarioB() {
  // Conflicting Intent User: competing signals, no clear conversion
  return [
    { type: 'invoice_created' },
    { type: 'invoice_sent' },
    { type: 'invoice_created' },
    { type: 'quote_created' },
  ];
}

function buildScenarioC() {
  // Stable Paying User: repeated paid invoices, low noise
  return [
    ...Array(8).fill({ type: 'invoice_paid' }),
    { type: 'invoice_sent' },
  ];
}

// ── Event sequence → RDCL decision trace ─────────────────────────────────────

function runTrace(events: { type: string }[]): { trace: Action[]; latency: number[] } {
  const trace: Action[] = [];
  const latency: number[] = [];
  const context = buildRevenueContext(events);

  const eventTypes: Array<'invoice_created' | 'invoice_sent' | 'invoice_paid' | 'quote_created'> =
    ['invoice_created', 'invoice_sent', 'invoice_paid', 'quote_created'];

  for (const ev of events) {
    const evType = ev.type as typeof eventTypes[number];
    if (!eventTypes.includes(evType)) continue;

    const t0 = performance.now();
    const action = RDCL(evType, context);
    const t1 = performance.now();

    trace.push(action);
    latency.push(parseFloat((t1 - t0).toFixed(3)));
  }

  return { trace, latency };
}

// ── Stability score: fraction of decisions that match the modal outcome ──────

function computeStabilityScore(trace: Action[]): number {
  if (trace.length === 0) return 1.0;
  const counts: Record<string, number> = {};
  for (const a of trace) counts[a] = (counts[a] ?? 0) + 1;
  const modal = Math.max(...Object.values(counts));
  return parseFloat((modal / trace.length).toFixed(4));
}

// ── Public API ───────────────────────────────────────────────────────────────

export function runLoadTest(): LoadTestResult[] {
  const scenarios = [
    { name: 'Scenario A — Burst Conversion Pressure', events: buildScenarioA() },
    { name: 'Scenario B — Conflicting Intent User',   events: buildScenarioB() },
    { name: 'Scenario C — Stable Paying User',        events: buildScenarioC() },
  ];

  return scenarios.map(({ name, events }) => {
    const { trace, latency } = runTrace(events);
    const stability_score = computeStabilityScore(trace);
    return {
      scenario: name,
      decision_trace: trace,
      latency,
      stability_score,
    };
  });
}
