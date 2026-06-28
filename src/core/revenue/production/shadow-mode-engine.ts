/**
 * RDCL v3.3 — Shadow Mode Engine
 *
 * Runs RDCL in shadow mode against live traffic WITHOUT affecting any runtime
 * state, UI, or monetization output. The live decision is passed in — this
 * module only re-executes RDCL independently and compares.
 *
 * SAFETY CONTRACT:
 *   - Shadow result is NEVER returned to the caller for routing
 *   - Shadow result is ONLY written to an in-process log buffer
 *   - No UI coupling, no session mutation, no action dispatch
 *
 * RULE: Read-only observer. RDCL logic is untouched.
 */

import { RDCL } from '../RDCL';
import { buildRevenueContext } from '../context-engine';

export type Action = 'UNLOCK_PREMIUM' | 'SHOW_UPGRADE' | 'LIMIT_USAGE' | 'NO_ACTION';

export interface ShadowResult {
  event:         string;
  live_action:   Action;
  shadow_action: Action;
  match:         boolean;
  timestamp_ms:  number;
}

// ── Internal log buffer (never exposed to runtime) ────────────────────────────

const _shadowLog: ShadowResult[] = [];

/** Returns a read-only copy of the shadow log for inspection/testing. */
export function getShadowLog(): Readonly<ShadowResult[]> {
  return [..._shadowLog];
}

/** Clears the shadow log — call at session boundaries or in tests. */
export function clearShadowLog(): void {
  _shadowLog.length = 0;
}

// ── Shadow execution ──────────────────────────────────────────────────────────

const VALID_EVENTS = new Set([
  'invoice_created', 'invoice_sent', 'invoice_paid', 'quote_created',
]);

/**
 * Executes RDCL in shadow mode.
 *
 * @param event       - The live event type (e.g. "invoice_created")
 * @param userEvents  - The user event history (same as passed to live path)
 * @param live_action - The action already produced by the live RDCL call
 * @returns ShadowResult — comparison record, NEVER used for routing
 */
export function shadowExecute(
  event:       string,
  userEvents:  any[],
  live_action: Action
): ShadowResult {
  // Safety: if event is not a valid RDCL event type, shadow is NO_ACTION
  const safeEvent = VALID_EVENTS.has(event)
    ? (event as 'invoice_created' | 'invoice_sent' | 'invoice_paid' | 'quote_created')
    : null;

  let shadow_action: Action = 'NO_ACTION';
  if (safeEvent) {
    try {
      const context = buildRevenueContext(userEvents);
      // ⚠️  Shadow call — result is DISCARDED after logging, never routed
      shadow_action = RDCL(safeEvent, context);
    } catch {
      // Shadow must never crash the live path
      shadow_action = 'NO_ACTION';
    }
  }

  const result: ShadowResult = {
    event,
    live_action,
    shadow_action,
    match:        live_action === shadow_action,
    timestamp_ms: Date.now(),
  };

  // Write to internal log only — no external side effects
  _shadowLog.push(result);

  return result;
}
