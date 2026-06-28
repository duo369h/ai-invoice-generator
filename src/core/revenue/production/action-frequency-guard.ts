/**
 * RDCL v3.3 — Action Frequency Guard
 *
 * Prevents monetization UI overload by enforcing a maximum of 1 monetization
 * action per user per 30-second window.
 *
 * SAFETY CONTRACT:
 *   - Operates at the decision/logging layer ONLY
 *   - NO UI coupling, NO session storage writes, NO network calls
 *   - The caller decides whether to act on the result — this guard only advises
 *
 * RULE: Stateful per user (in-process map). Safe for server-side usage.
 */

export interface FrequencyCheckResult {
  user_id:           string;
  action_allowed:    boolean;
  suppressed_reason?: string;
}

// ── Configuration ─────────────────────────────────────────────────────────────

const WINDOW_MS = 30_000; // 30 seconds

/** Actions that count toward the monetization frequency window */
const MONETIZATION_ACTIONS = new Set([
  'SHOW_UPGRADE',
  'LIMIT_USAGE',
]);

// ── Per-user state (in-process only — not persisted) ─────────────────────────

interface UserRecord {
  last_monetization_ms: number;
  action_count_in_window: number;
}

const _userMap = new Map<string, UserRecord>();

/** Resets all frequency state — use in tests or between integration cycles. */
export function resetFrequencyGuard(): void {
  _userMap.clear();
}

/** Resets a single user's frequency record. */
export function resetUserRecord(user_id: string): void {
  _userMap.delete(user_id);
}

// ── Core guard logic ──────────────────────────────────────────────────────────

/**
 * Checks whether a monetization action is permitted for a given user.
 *
 * @param user_id - Stable identifier for the user (e.g. session ID or DB ID)
 * @param action  - The RDCL action being considered (e.g. "SHOW_UPGRADE")
 * @returns FrequencyCheckResult — caller must honor action_allowed before dispatching
 */
export function checkActionFrequency(
  user_id: string,
  action:  string
): FrequencyCheckResult {
  // Non-monetization actions are always allowed — skip window tracking
  if (!MONETIZATION_ACTIONS.has(action)) {
    return { user_id, action_allowed: true };
  }

  const now  = Date.now();
  const rec  = _userMap.get(user_id);

  if (!rec) {
    // First monetization action for this user — always allowed
    _userMap.set(user_id, {
      last_monetization_ms:   now,
      action_count_in_window: 1,
    });
    return { user_id, action_allowed: true };
  }

  const elapsed = now - rec.last_monetization_ms;

  if (elapsed < WINDOW_MS) {
    // Within the 30-second window — suppress
    return {
      user_id,
      action_allowed:    false,
      suppressed_reason: (
        `Action "${action}" suppressed: last monetization was ${Math.round(elapsed / 1000)}s ago ` +
        `(window=${WINDOW_MS / 1000}s). Retry after ${Math.ceil((WINDOW_MS - elapsed) / 1000)}s.`
      ),
    };
  }

  // Window expired — reset record and allow
  _userMap.set(user_id, {
    last_monetization_ms:   now,
    action_count_in_window: 1,
  });

  return { user_id, action_allowed: true };
}

/**
 * Returns current window state for a user (useful for dashboards / diagnostics).
 * Returns null if no record exists (user has not triggered any monetization action).
 */
export function getUserFrequencyState(
  user_id: string
): { last_monetization_ms: number; action_count_in_window: number } | null {
  return _userMap.get(user_id) ?? null;
}
