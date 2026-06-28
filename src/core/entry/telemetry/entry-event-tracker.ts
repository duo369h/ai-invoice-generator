/**
 * READ ONLY SYSTEM
 * MUST NOT affect routing, activation, or RDCL
 */

/**
 * Corvioz v1.2 — Entry Event Tracker
 *
 * Observability layer tracking user landing paths.
 *
 * RULE:
 *   ✔ NO decision logic
 *   ✔ NO routing influence
 *   ✔ PURE observability layer
 */

export interface EntryEvent {
  userId:     string;
  entryRoute: string;
  timestamp:  number;
}

export function trackEntryEvent(event: EntryEvent) {
  // Pure mapping/monitoring payload returned for logging
  const payload = {
    userId:     event.userId,
    entryRoute: event.entryRoute,
    timestamp:  event.timestamp,
    source:     "ENTRY_TELEMETRY",
  };

  console.log(`[ENTRY_TELEMETRY] Event tracked: ${JSON.stringify(payload)}`);
  return payload;
}
