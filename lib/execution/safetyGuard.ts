/**
 * Safety Guard — Corvioz v5.5 Controlled Execution Layer
 *
 * Enforces rate limiting and frequency capping for UI upgrade exposures.
 * Stores exposure history in localStorage client-side.
 */

export type ExecutionType = 'modal' | 'banner';

const HISTORY_KEY_PREFIX = 'corvioz_exec_history_';
const ONE_DAY_MS = 24 * 60 * 60 * 1000;
const COOLDOWN_MS = 60 * 1000; // 1-minute (60 seconds) cooldown window between consecutive exposures

/**
 * Retrieve execution history from localStorage for a specific user.
 */
export function getExecutionHistory(userId: string): { timestamp: number; type: ExecutionType }[] {
  if (typeof window === 'undefined' || !userId) return [];
  try {
    const key = `${HISTORY_KEY_PREFIX}${userId}`;
    const stored = window.localStorage.getItem(key);
    if (!stored) return [];
    
    const parsed = JSON.parse(stored);
    if (!Array.isArray(parsed)) return [];

    const now = Date.now();
    // Only return exposures within the last 24 hours
    return parsed.filter((item: any) => 
      item &&
      typeof item.timestamp === 'number' && 
      (item.type === 'modal' || item.type === 'banner') &&
      now - item.timestamp < ONE_DAY_MS
    );
  } catch (e) {
    console.error('[SAFETY GUARD] Failed to read execution history:', e);
    return [];
  }
}

/**
 * Save execution history to localStorage for a specific user.
 */
export function saveExecutionHistory(userId: string, history: { timestamp: number; type: ExecutionType }[]): void {
  if (typeof window === 'undefined' || !userId) return;
  try {
    const key = `${HISTORY_KEY_PREFIX}${userId}`;
    window.localStorage.setItem(key, JSON.stringify(history));
  } catch (e) {
    console.warn('[SAFETY GUARD] Failed to write execution history:', e);
  }
}

/**
 * Checks if showing a specific UI exposure is allowed.
 *
 * @param userId - Current user's unique identifier
 * @param type - The type of exposure ('modal' or 'banner')
 */
export function allowUpgradeExposure(userId: string | null | undefined, type: ExecutionType): boolean {
  if (typeof window === 'undefined' || !userId) return false;

  const history = getExecutionHistory(userId);
  const now = Date.now();

  // 1. Prevent repeated exposure within 60s cooldown window
  if (history.length > 0) {
    const lastExec = history[history.length - 1];
    if (now - lastExec.timestamp < COOLDOWN_MS) {
      console.debug('[SAFETY GUARD] Blocked by cooldown window.');
      return false;
    }
  }

  // 2. Frequency limit: Max 1 modal per 24h per user
  if (type === 'modal') {
    const modalCount = history.filter(h => h.type === 'modal').length;
    if (modalCount >= 1) {
      console.debug('[SAFETY GUARD] Blocked: Max 1 modal per 24h reached.');
      return false;
    }
  }

  // 3. Frequency limit: Max 3 banners per 24h per user
  if (type === 'banner') {
    const bannerCount = history.filter(h => h.type === 'banner').length;
    if (bannerCount >= 3) {
      console.debug('[SAFETY GUARD] Blocked: Max 3 banners per 24h reached.');
      return false;
    }
  }

  return true;
}

/**
 * Records an upgrade UI exposure event.
 */
export function recordUpgradeExposure(userId: string | null | undefined, type: ExecutionType): void {
  if (typeof window === 'undefined' || !userId) return;

  const history = getExecutionHistory(userId);
  history.push({ timestamp: Date.now(), type });

  // Retain only the last 10 records for efficiency
  saveExecutionHistory(userId, history.slice(-10));
}

// Backward compatibility wrappers for existing code imports
export function allowExecution(
  userId: string | null | undefined,
  actionType: ExecutionType,
  options?: any
): boolean {
  return allowUpgradeExposure(userId, actionType);
}

export function recordExecution(userId: string | null | undefined, actionType: ExecutionType): void {
  recordUpgradeExposure(userId, actionType);
}
