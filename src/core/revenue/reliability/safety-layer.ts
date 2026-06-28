/**
 * RDCL v3.3 — Revenue Safety Layer (CRITICAL)
 *
 * Prevents aggressive monetization loops, UI spam, and conflicting feature gates.
 * When multiple actions are triggered simultaneously, picks ONLY the safest one
 * and suppresses all aggressive monetization actions.
 *
 * Priority (safest → most aggressive):
 *   1. UNLOCK_PREMIUM  (safe — rewards completed conversion)
 *   2. SHOW_UPGRADE    (medium — single soft prompt)
 *   3. LIMIT_USAGE     (high pressure — hard gate)
 *   4. NO_ACTION       (baseline)
 *
 * RULE: No RDCL modifications. This layer filters RDCL output only.
 */

import { Action } from './load-test-engine';

export interface SafetyDecision {
  /** The single safe action selected */
  safe_action: Action;
  /** All actions that were suppressed */
  suppressed: Action[];
  /** Whether the safety layer intervened */
  intervened: boolean;
}

// ── Safety priority map: lower = safer ───────────────────────────────────────

const SAFETY_PRIORITY: Record<Action, number> = {
  UNLOCK_PREMIUM: 1, // safest — user already converted
  SHOW_UPGRADE:   2, // soft prompt — acceptable once
  LIMIT_USAGE:    3, // high pressure — suppress if alternatives exist
  NO_ACTION:      4, // baseline
};

// ── Session-level spam guard ──────────────────────────────────────────────────

const _sessionActionHistory: Action[] = [];
let _upgradeShownCount = 0;
const MAX_UPGRADE_PER_SESSION = 1;

/**
 * Resets session-level spam guard state.
 * Call at session boundary or in tests.
 */
export function resetSafetySession(): void {
  _sessionActionHistory.length = 0;
  _upgradeShownCount = 0;
}

// ── Core safety filter ────────────────────────────────────────────────────────

/**
 * Given a set of candidate actions from RDCL (may include duplicates from
 * multiple event passes), returns the single safest action and suppresses rest.
 */
export function applySafetyLayer(actions: Action[]): SafetyDecision {
  if (actions.length === 0) {
    return { safe_action: 'NO_ACTION', suppressed: [], intervened: false };
  }

  // Deduplicate
  const unique = [...new Set(actions)];

  // If only one action, apply spam guard only
  if (unique.length === 1) {
    const action = unique[0];
    return applySpamGuard(action, []);
  }

  // Sort by safety priority (ascending = safest first)
  const sorted = [...unique].sort(
    (a, b) => SAFETY_PRIORITY[a] - SAFETY_PRIORITY[b]
  );

  const chosen = sorted[0];
  const suppressed = sorted.slice(1);

  const result = applySpamGuard(chosen, suppressed);
  return { ...result, intervened: true };
}

function applySpamGuard(action: Action, suppressed: Action[]): SafetyDecision {
  // Prevent repeated upgrade prompts in same session
  if (action === 'SHOW_UPGRADE') {
    if (_upgradeShownCount >= MAX_UPGRADE_PER_SESSION) {
      // Downgrade to NO_ACTION to prevent spam
      return {
        safe_action: 'NO_ACTION',
        suppressed: [action, ...suppressed],
        intervened: true,
      };
    }
    _upgradeShownCount++;
  }

  _sessionActionHistory.push(action);

  return {
    safe_action: action,
    suppressed,
    intervened: suppressed.length > 0 || false,
  };
}

/**
 * Validates a sequence of RDCL actions from a load test trace through the safety layer.
 * Returns filtered safe sequence and intervention log.
 */
export function filterTrace(trace: Action[]): {
  safe_trace: Action[];
  interventions: string[];
} {
  resetSafetySession();
  const safe_trace: Action[] = [];
  const interventions: string[] = [];

  for (let i = 0; i < trace.length; i++) {
    const result = applySafetyLayer([trace[i]]);
    safe_trace.push(result.safe_action);
    if (result.intervened) {
      interventions.push(
        `Step ${i}: ${trace[i]} → ${result.safe_action} (suppressed: [${result.suppressed.join(', ')}])`
      );
    }
  }

  return { safe_trace, interventions };
}
