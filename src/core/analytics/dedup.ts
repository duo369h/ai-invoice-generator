/**
 * Corvioz Event Unification — Deduplication System
 * Sprint C Phase 2.7
 *
 * Rules:
 *   - Same event + same session + <3s → ignore.
 *   - Prevent double CTA click logs.
 *   - Prevent page reload duplication.
 */

import { getSessionId } from './session';

// Memory cache for in-memory deduplication (client-side runtime)
const lastSeenEvents = new Map<string, number>();

/**
 * Checks if an event is a duplicate and should be ignored.
 * Returns true if the event should be ignored.
 */
export function isDuplicateEvent(
  eventName: string,
  metadata?: Record<string, any>
): boolean {
  if (typeof window === 'undefined') return false;

  const sessionId = getSessionId();
  
  // Create a unique cache key based on event name, session id, and key metadata properties (like cta label, plan id, path)
  const keyParts = [eventName, sessionId];
  
  if (metadata) {
    if (metadata.label) keyParts.push(String(metadata.label));
    if (metadata.planId) keyParts.push(String(metadata.planId));
    if (metadata.plan) keyParts.push(String(metadata.plan));
    if (metadata.path) keyParts.push(String(metadata.path));
  }

  const cacheKey = keyParts.join('::');
  const now = Date.now();
  const lastTime = lastSeenEvents.get(cacheKey);

  if (lastTime !== undefined) {
    const elapsed = now - lastTime;
    if (elapsed < 3000) {
      // Less than 3 seconds since last identical event — ignore!
      if (process.env.NODE_ENV !== 'production') {
        console.warn(`[DEDUP] Ignored duplicate event "${eventName}" (elapsed: ${elapsed}ms)`);
      }
      return true;
    }
  }

  // Update last seen timestamp
  lastSeenEvents.set(cacheKey, now);
  return false;
}
