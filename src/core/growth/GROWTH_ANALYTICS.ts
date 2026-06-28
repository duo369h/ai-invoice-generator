/**
 * Corvioz — Growth Analytics & Observation hooks
 *
 * Lightweight pure functions to observe pre-conversion behaviors.
 * Zero database side-effects.
 */

export type GrowthEvent =
  | "demo_viewed"
  | "preview_to_proposal_click"
  | "proposal_started_from_demo";

export interface GrowthTrackingMetadata {
  client_type?: string;
  source_page?: string;
  prefilled_fields?: string[];
  timestamp?: string;
}

export function trackGrowthEvent(
  event: GrowthEvent,
  metadata: GrowthTrackingMetadata = {}
): { status: "tracked"; event: GrowthEvent; payload: any } {
  const payload = {
    ...metadata,
    timestamp: metadata.timestamp || new Date().toISOString()
  };

  // Structured console log for observability / log collection agents
  console.log(`[GROWTH_OBSERVATION] Event: "${event}" — Payload: ${JSON.stringify(payload)}`);

  return {
    status: "tracked",
    event,
    payload
  };
}
