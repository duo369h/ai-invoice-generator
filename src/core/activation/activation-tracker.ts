/**
 * Corvioz v1 — Activation Tracker (Core Engine)
 *
 * Tracks first-success events only. Never counts repeats.
 * Never scores engagement. Never infers intent.
 *
 * Storage: in-process Map for server-side use.
 * UI callers should persist via localStorage or Supabase using the returned record.
 *
 * RULE:
 *   - First success only
 *   - No repeat counting
 *   - No scoring
 */

import { ActivationEventType, ACTIVATION_MINIMUM_SET } from './activation-events';

export interface ActivationRecord {
  userId:          string;
  activationEvent: ActivationEventType;
  timestamp:       number;
}

// ── In-process state (mirrors persistent layer for server-side idempotency) ──

const _activated = new Map<string, Set<ActivationEventType>>();

function getOrCreate(userId: string): Set<ActivationEventType> {
  if (!_activated.has(userId)) _activated.set(userId, new Set());
  return _activated.get(userId)!;
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Records a first-success activation event for a user.
 * Idempotent — duplicate calls for the same user+event are silently ignored.
 *
 * @returns ActivationRecord if this was the first occurrence, null if already recorded
 */
export function trackActivation(
  userId:    string,
  eventType: ActivationEventType
): ActivationRecord | null {
  const userSet = getOrCreate(userId);

  if (userSet.has(eventType)) {
    // Already activated — do nothing
    return null;
  }

  userSet.add(eventType);

  return {
    userId,
    activationEvent: eventType,
    timestamp:       Date.now(),
  };
}

/**
 * Returns true if the user has already fired this activation event.
 */
export function hasActivated(
  userId:    string,
  eventType: ActivationEventType
): boolean {
  return _activated.get(userId)?.has(eventType) ?? false;
}

/**
 * Returns the full set of activation events a user has completed.
 */
export function getActivatedEvents(userId: string): ActivationEventType[] {
  return [...(_activated.get(userId) ?? [])];
}

/**
 * Returns true if the user has completed at least one item from
 * the minimum activation set (invoice OR quote OR client).
 */
export function isActivated(userId: string): boolean {
  const events = _activated.get(userId);
  if (!events) return false;
  return ACTIVATION_MINIMUM_SET.some(e => events.has(e));
}

/**
 * Seeds the tracker from a persisted activation record.
 * Call at session start to restore state from Supabase/localStorage.
 */
export function hydrateActivation(userId: string, events: ActivationEventType[]): void {
  const userSet = getOrCreate(userId);
  for (const e of events) userSet.add(e);
}

/** Clears state — use in tests or on explicit sign-out. */
export function resetTracker(): void {
  _activated.clear();
}
