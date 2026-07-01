/**
 * Corvioz Real Behavior Capture Layer — Event Store
 * Sprint C Phase 2.6
 *
 * Writes events to Supabase `analytics_events` table.
 * Falls back to localStorage queue when Supabase is unavailable.
 * Async-safe, non-blocking, fire-and-forget.
 */

import type { AnalyticsEvent } from './events';

const LOCAL_QUEUE_KEY = 'corvioz_analytics_queue';
const MAX_LOCAL_QUEUE = 100;

// ─── Supabase Write ───────────────────────────────────────────────────────────

async function writeToSupabase(event: AnalyticsEvent): Promise<boolean> {
  try {
    const { createBrowserSupabaseClient } = await import('../../app/lib/supabase-client');
    const supabase = createBrowserSupabaseClient();

    const { error } = await supabase.from('analytics_events').insert({
      event: event.event,
      user_id: event.userId ?? null,
      session_id: event.sessionId ?? null,
      metadata: event.metadata ?? null,
      created_at: new Date(event.timestamp).toISOString(),
    });

    if (error) {
      if (process.env.NODE_ENV !== 'production') {
        console.warn('[EventStore] Supabase write failed:', error.message);
      }
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

// ─── Local Fallback Queue ─────────────────────────────────────────────────────

function enqueueLocally(event: AnalyticsEvent): void {
  if (typeof window === 'undefined') return;
  try {
    const raw = localStorage.getItem(LOCAL_QUEUE_KEY);
    const queue: AnalyticsEvent[] = raw ? JSON.parse(raw) : [];
    // Cap queue size to avoid unbounded growth
    if (queue.length >= MAX_LOCAL_QUEUE) queue.shift();
    queue.push(event);
    localStorage.setItem(LOCAL_QUEUE_KEY, JSON.stringify(queue));
  } catch {
    // Storage full or unavailable — discard silently
  }
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Persist an analytics event.
 * Attempts Supabase write; falls back to local queue.
 * Non-blocking — callers do not await this.
 */
export function persistEvent(event: AnalyticsEvent): void {
  writeToSupabase(event).then((ok) => {
    if (!ok) enqueueLocally(event);
  });
}

/**
 * Returns all locally-queued events (fallback buffer).
 */
export function getLocalEventQueue(): AnalyticsEvent[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(LOCAL_QUEUE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}
