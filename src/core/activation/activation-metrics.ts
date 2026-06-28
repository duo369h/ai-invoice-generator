/**
 * Corvioz v1 — Activation Metrics Logger
 *
 * Records timing of first success events only.
 * NO engagement scoring. NO retention modeling. NO behavioral inference.
 *
 * Output shape mirrors what would be written to the analytics/events table.
 * Caller is responsible for persisting the record to Supabase.
 */

import { ActivationEventType, ACTIVATION_MINIMUM_SET } from './activation-events';

export interface ActivationMetrics {
  user_id:                 string;
  /** Unix timestamp (ms) when user first created an invoice. null if not yet. */
  first_invoice_time:      number | null;
  /** Unix timestamp (ms) when user first created a quote. null if not yet. */
  first_quote_time:        number | null;
  /** Unix timestamp (ms) when user first added a client. null if not yet. */
  first_client_time:       number | null;
  /** True only when at least one of invoice/quote/client is recorded. */
  activation_completed:    boolean;
  /** Duration (ms) from session start to first activation event. null if not activated. */
  time_to_activation_ms:   number | null;
}

// ── In-process metrics store ──────────────────────────────────────────────────

interface MetricsRecord {
  session_start_ms:   number;
  first_invoice_time: number | null;
  first_quote_time:   number | null;
  first_client_time:  number | null;
}

const _metrics = new Map<string, MetricsRecord>();

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Initializes a metrics session for a user.
 * Call at session start (login or page load for a new session).
 */
export function startMetricsSession(userId: string): void {
  if (!_metrics.has(userId)) {
    _metrics.set(userId, {
      session_start_ms:   Date.now(),
      first_invoice_time: null,
      first_quote_time:   null,
      first_client_time:  null,
    });
  }
}

/**
 * Records the timestamp of a first-success activation event.
 * Idempotent — subsequent calls for the same event are ignored.
 */
export function recordActivationTime(
  userId:    string,
  eventType: ActivationEventType
): void {
  const rec = _metrics.get(userId);
  if (!rec) return; // session not started — caller must call startMetricsSession first

  const now = Date.now();

  if (eventType === 'first_invoice_created' && rec.first_invoice_time === null) {
    rec.first_invoice_time = now;
  } else if (eventType === 'first_quote_created' && rec.first_quote_time === null) {
    rec.first_quote_time = now;
  } else if (eventType === 'first_client_created' && rec.first_client_time === null) {
    rec.first_client_time = now;
  }
}

/**
 * Returns the current activation metrics snapshot for a user.
 * Returns null if no session has been started.
 */
export function getActivationMetrics(userId: string): ActivationMetrics | null {
  const rec = _metrics.get(userId);
  if (!rec) return null;

  const activation_completed =
    rec.first_invoice_time !== null ||
    rec.first_quote_time   !== null ||
    rec.first_client_time  !== null;

  const first_event_time = [
    rec.first_invoice_time,
    rec.first_quote_time,
    rec.first_client_time,
  ]
    .filter((t): t is number => t !== null)
    .sort((a, b) => a - b)[0] ?? null;

  const time_to_activation_ms =
    first_event_time !== null
      ? first_event_time - rec.session_start_ms
      : null;

  return {
    user_id:               userId,
    first_invoice_time:    rec.first_invoice_time,
    first_quote_time:      rec.first_quote_time,
    first_client_time:     rec.first_client_time,
    activation_completed,
    time_to_activation_ms,
  };
}

/**
 * Returns true if the user activated within the target time budget (60 seconds).
 */
export function activatedWithinTarget(
  userId:        string,
  targetMs:      number = 60_000
): boolean {
  const m = getActivationMetrics(userId);
  if (!m || m.time_to_activation_ms === null) return false;
  return m.time_to_activation_ms <= targetMs;
}

/** Clears metrics state — use in tests or on sign-out. */
export function resetMetrics(): void {
  _metrics.clear();
}
