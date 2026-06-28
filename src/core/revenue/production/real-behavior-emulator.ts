/**
 * RDCL v3.3 — Real User Behavior Load Emulator
 *
 * Generates realistic SaaS behavioral entropy patterns — NOT synthetic fixed
 * sequences. Emulates the five entropy classes that RDCL must survive in prod:
 *
 *   1. Plan switching mid-session
 *   2. Invoice burst creation
 *   3. Idle → return cycles (session gaps)
 *   4. Partial feature usage (incomplete workflow)
 *   5. Conflicting cross-session signals
 *
 * RULE: Read-only against RDCL. Exercises it; never modifies it.
 */

import { RDCL } from '../RDCL';
import { buildRevenueContext } from '../context-engine';

export type RevenueEvent =
  | 'invoice_created'
  | 'invoice_sent'
  | 'invoice_paid'
  | 'quote_created';

export type Action = 'UNLOCK_PREMIUM' | 'SHOW_UPGRADE' | 'LIMIT_USAGE' | 'NO_ACTION';

export interface EmulatorResult {
  scenario:          string;
  event_stream:      RevenueEvent[];
  rdcl_actions:      Action[];
  instability_score: number;
}

// ── Entropy helpers ───────────────────────────────────────────────────────────

/** Deterministic pseudo-shuffle (seeded — reproducible across runs) */
function seededShuffle<T>(arr: T[], seed: number): T[] {
  const out = [...arr];
  let s = seed;
  for (let i = out.length - 1; i > 0; i--) {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    const j = Math.abs(s) % (i + 1);
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/** Repeat an item N times */
const repeat = <T>(item: T, n: number): T[] => Array(n).fill(item);

// ── Scenario event stream builders ────────────────────────────────────────────

/** E1: Plan switching mid-session — starts as free, behaves like paid */
function buildPlanSwitchStream(): RevenueEvent[] {
  return [
    ...repeat<RevenueEvent>('quote_created', 3),   // free-tier behaviour
    'invoice_created',
    'invoice_sent',
    'invoice_paid',                                // mid-session upgrade signal
    'invoice_created',
    'invoice_sent',
  ];
}

/** E2: Invoice burst — rapid mass creation, stress test context aggregation */
function buildBurstStream(): RevenueEvent[] {
  return [
    ...repeat<RevenueEvent>('invoice_created', 15),
    ...repeat<RevenueEvent>('invoice_sent', 8),
    'invoice_paid',
  ];
}

/** E3: Idle → return — interleaved with inactive gaps (quote gaps = idle proxy) */
function buildIdleReturnStream(): RevenueEvent[] {
  return [
    'invoice_created',
    'quote_created',   // idle period (gap)
    'quote_created',   // idle period
    'invoice_sent',    // return
    'invoice_created',
    'quote_created',   // idle again
    'invoice_paid',    // strong return signal
  ];
}

/** E4: Partial feature usage — incomplete workflow, no clear conversion */
function buildPartialUsageStream(): RevenueEvent[] {
  return seededShuffle<RevenueEvent>(
    [
      'invoice_created',
      'quote_created',
      'invoice_created',
      'quote_created',
      'invoice_created',
    ],
    42
  );
}

/** E5: Cross-session conflict — signals from different intent states */
function buildCrossSessionStream(): RevenueEvent[] {
  return [
    'invoice_paid',    // session 1: strong paid signal
    'quote_created',   // session 2: back to exploring
    'invoice_created', // session 2: light usage
    'invoice_paid',    // session 3: paid again
    'quote_created',   // session 3: but also quoting
    'invoice_sent',    // session 3: final intent signal
  ];
}

// ── Instability score ─────────────────────────────────────────────────────────

/**
 * Measures behavioral instability: the fraction of adjacent action pairs
 * that flip (change). A perfectly stable user has score 0.0; a maximally
 * unstable one flips on every step, scoring 1.0.
 */
function computeInstabilityScore(actions: Action[]): number {
  if (actions.length < 2) return 0.0;
  let flips = 0;
  for (let i = 1; i < actions.length; i++) {
    if (actions[i] !== actions[i - 1]) flips++;
  }
  return parseFloat((flips / (actions.length - 1)).toFixed(4));
}

// ── Runner ────────────────────────────────────────────────────────────────────

function runScenario(
  name: string,
  stream: RevenueEvent[]
): EmulatorResult {
  const context = buildRevenueContext(stream.map(type => ({ type })));
  const rdcl_actions: Action[] = stream.map(event => RDCL(event, context));
  return {
    scenario:          name,
    event_stream:      stream,
    rdcl_actions,
    instability_score: computeInstabilityScore(rdcl_actions),
  };
}

// ── Public API ────────────────────────────────────────────────────────────────

export function runBehaviorEmulator(): EmulatorResult[] {
  return [
    runScenario('E1 — Plan Switch Mid-Session',        buildPlanSwitchStream()),
    runScenario('E2 — Invoice Burst',                  buildBurstStream()),
    runScenario('E3 — Idle → Return Cycle',            buildIdleReturnStream()),
    runScenario('E4 — Partial Feature Usage',          buildPartialUsageStream()),
    runScenario('E5 — Cross-Session Signal Conflict',  buildCrossSessionStream()),
  ];
}
