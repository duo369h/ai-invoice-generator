/**
 * Corvioz Real Behavior Capture Layer — Session Management
 * Sprint C Phase 2.6
 *
 * Generates, persists, and tracks session identity for behavior capture.
 * No UI. No business logic. Pure session identity.
 */

const SESSION_KEY = 'corvioz_session_id';
const SESSION_START_KEY = 'corvioz_session_start';
const SESSION_TIMEOUT_MS = 30 * 60 * 1000; // 30 min inactivity

function generateSessionId(): string {
  const rand = () => Math.random().toString(36).slice(2);
  return `s_${rand()}${rand()}_${Date.now()}`;
}

/**
 * Returns the persistent session ID for this browser session.
 * Creates a new one if none exists or if the session has timed out.
 */
export function getSessionId(): string {
  if (typeof window === 'undefined') return 'ssr';

  try {
    const stored = sessionStorage.getItem(SESSION_KEY);
    const startStr = sessionStorage.getItem(SESSION_START_KEY);

    if (stored && startStr) {
      const elapsed = Date.now() - parseInt(startStr, 10);
      if (elapsed < SESSION_TIMEOUT_MS) {
        return stored;
      }
    }

    // New or expired session
    const id = generateSessionId();
    sessionStorage.setItem(SESSION_KEY, id);
    sessionStorage.setItem(SESSION_START_KEY, String(Date.now()));
    return id;
  } catch {
    return 'fallback_session';
  }
}

/**
 * Returns session duration in seconds since session start.
 */
export function getSessionDurationSeconds(): number {
  if (typeof window === 'undefined') return 0;
  try {
    const startStr = sessionStorage.getItem(SESSION_START_KEY);
    if (!startStr) return 0;
    return Math.round((Date.now() - parseInt(startStr, 10)) / 1000);
  } catch {
    return 0;
  }
}
