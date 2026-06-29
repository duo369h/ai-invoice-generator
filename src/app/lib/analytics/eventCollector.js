/*
CORVIOZ SYSTEM LOCK v2.6
Event Pipeline = fact only (write-only ledger)
NO CROSS-LAYER LOGIC ALLOWED
NO BUSINESS INFERENCE IN RUNTIME
*/

'use client';

import { sendEvent } from '../analytics';
import { validateEvent as validateEventRaw } from '../../../../events/eventValidator';

/**
 * Concept 1: validateEvent()
 * Validates the event type and metadata using the strict schemas of the validation layer.
 */
export function validateEvent(name, props) {
  const payload = {
    event_type: name,
    metadata: props,
    caller: 'event-collector',
    timestamp: new Date().toISOString(),
  };
  return validateEventRaw(payload);
}

/**
 * Concept 2: routeEvent()
 * Transport-only layer to Plausible/GA4 and the database backend.
 */
export function routeEvent(validatedEvent) {
  const { event_type, metadata, timestamp } = validatedEvent;

  // V3_REVENUE_STATE_ENGINE_HOOK (DO NOT IMPLEMENT YET)
  // V3_REVENUE_MAPPING_LAYER_READY
  // V3_BILLING_ABSTRACTION_READY
  // V3_REVENUE_REACTION_ENGINE_READY
  // V3_SIGNAL_BUS_READY
  // V3_PRICING_SENSITIVITY_LAYER_READY
  // V3_REVENUE_EXECUTION_LAYER_READY
  // V3_MONETIZATION_CONTROLLER_READY
  // V3_FEATURE_GATE_LAYER_READY
  // V3_REVENUE_DECISION_STABILIZATION_LAYER_READY
  // V3_CONTEXT_ENGINE_READY
  // V3_CONFLICT_RESOLVER_READY

  // Route to Plausible / GA4 via sendEvent in analytics.js
  sendEvent(event_type, metadata);

  void timestamp;
}

/**
 * Concept 3: emitEvent()
 * Main entry point for the pure write-only ledger event pipeline.
 */
export function emitEvent(name, props = {}) {
  if (typeof window === 'undefined') return;

  // Register on window for test verification/compatibility layers
  if (typeof window !== 'undefined') {
    window.__corvioz_track_event = emitEvent;
  }

  // 1. Validate
  let validated;
  try {
    validated = validateEvent(name, props);
  } catch (error) {
    console.error(`[Event Pipeline Ingestion Error] ${error.message}`);
    throw error;
  }

  // 2. Route
  routeEvent(validated);
}
