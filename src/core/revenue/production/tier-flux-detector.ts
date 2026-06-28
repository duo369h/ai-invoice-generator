/**
 * RDCL v3.3 — Tier Flux Stability Detector
 *
 * Detects unstable user tier behavior: free ↔ pro oscillation, rapid
 * classification changes, and inconsistent tier inference across events.
 *
 * RULE: Operates at observation layer only. Does NOT modify RDCL, context
 * engine, or tier classification logic. Flags; never corrects.
 *
 * Instability threshold: > 2 tier changes within a 10-minute window.
 */

import { buildRevenueContext, RevenueContext } from '../context-engine';

export interface TierFluxResult {
  user_id:           string;
  tier_instability:  boolean;
  flip_count:        number;
  tier_history:      string[];
  flagged_reason?:   string;
}

// ── Configuration ─────────────────────────────────────────────────────────────

const WINDOW_MS     = 10 * 60 * 1000; // 10 minutes
const MAX_FLIPS     = 2;              // > 2 flips within window = instability

// ── Tier snapshot type ────────────────────────────────────────────────────────

interface TierSnapshot {
  tier:        string;
  snapshot_ms: number;
}

// ── Per-user tier history (in-process) ───────────────────────────────────────

const _tierHistory = new Map<string, TierSnapshot[]>();

export function resetTierHistory(): void {
  _tierHistory.clear();
}

export function resetUserTierHistory(user_id: string): void {
  _tierHistory.delete(user_id);
}

// ── Core detection ────────────────────────────────────────────────────────────

/**
 * Records a new tier observation for a user and checks for flux instability.
 *
 * @param user_id    - Stable user identifier
 * @param userEvents - Current user event stream (passed to buildRevenueContext)
 * @returns TierFluxResult with instability assessment
 */
export function detectTierFlux(
  user_id:    string,
  userEvents: any[]
): TierFluxResult {
  const now     = Date.now();
  const context: RevenueContext = buildRevenueContext(userEvents);
  const tier    = context.user_tier; // 'free' | 'pro' | 'enterprise'

  // Retrieve or initialize history
  const history = _tierHistory.get(user_id) ?? [];

  // Prune entries outside the 10-minute window
  const windowStart = now - WINDOW_MS;
  const recent      = history.filter(s => s.snapshot_ms >= windowStart);

  // Append current observation
  recent.push({ tier, snapshot_ms: now });
  _tierHistory.set(user_id, recent);

  // Count flips (adjacent tier changes within window)
  const tiers      = recent.map(s => s.tier);
  const flip_count = tiers.reduce(
    (count, t, i) => count + (i > 0 && t !== tiers[i - 1] ? 1 : 0),
    0
  );

  const tier_instability = flip_count > MAX_FLIPS;

  const result: TierFluxResult = {
    user_id,
    tier_instability,
    flip_count,
    tier_history: tiers,
  };

  if (tier_instability) {
    result.flagged_reason = (
      `Tier flipped ${flip_count} times within 10 min window ` +
      `(max=${MAX_FLIPS}). History: [${tiers.join(' → ')}]`
    );
    console.warn(`[RDCL TIER FLUX] ${result.flagged_reason} | user_id="${user_id}"`);
  }

  return result;
}

/**
 * Batch variant: evaluates tier flux across a list of (user_id, events) pairs.
 * Useful for emulator output analysis.
 */
export function detectBatchTierFlux(
  users: Array<{ user_id: string; events: any[] }>
): TierFluxResult[] {
  resetTierHistory();
  return users.map(({ user_id, events }) => detectTierFlux(user_id, events));
}
