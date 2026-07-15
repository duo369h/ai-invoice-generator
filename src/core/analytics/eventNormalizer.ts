/**
 * Corvioz Event Unification — Event Normalization Layer
 * Sprint C Phase 2.7
 *
 * Normalizes legacy event names, enforces metadata schemas,
 * and maps events to canonical funnel stages.
 */

import { EVENTS, type EventName, type FunnelStage, EVENT_FUNNEL_STAGE } from './events';

// Map of various historical/legacy event names to canonical uppercase events
const EVENT_NAME_MAPPING: Record<string, EventName> = {
  // Legacy / Product Analytics names
  'Landing Viewed': EVENTS.LANDING_VIEW,
  'landing_view': EVENTS.LANDING_VIEW,
  
  'Hero CTA Click': EVENTS.CTA_CLICK,
  'cta_click': EVENTS.CTA_CLICK,

  'photographer_cta_click': EVENTS.PHOTOGRAPHER_CTA_CLICK,
  'PHOTOGRAPHER_CTA_CLICK': EVENTS.PHOTOGRAPHER_CTA_CLICK,
  
  'Pricing Click': EVENTS.PRICING_VIEW,
  'pricing_view': EVENTS.PRICING_VIEW,
  
  'Signup Started': EVENTS.SIGNUP_STARTED,
  'signup_start': EVENTS.SIGNUP_STARTED,
  
  'Signup Completed': EVENTS.SIGNUP_COMPLETED,
  'signup_complete': EVENTS.SIGNUP_COMPLETED,
  'signup_completed': EVENTS.SIGNUP_COMPLETED,
  'SIGNUP_COMPLETED': EVENTS.SIGNUP_COMPLETED,
  
  'onboarding_start': EVENTS.DASHBOARD_ENTERED,
  'dashboard_enter': EVENTS.DASHBOARD_ENTERED,
  'DASHBOARD_ENTERED': EVENTS.DASHBOARD_ENTERED,

  'beta_feedback_clicked': EVENTS.BETA_FEEDBACK_CLICKED,
  'BETA_FEEDBACK_CLICKED': EVENTS.BETA_FEEDBACK_CLICKED,
  
  'first_action': EVENTS.FIRST_ACTION_TAKEN,
  'first_action_taken': EVENTS.FIRST_ACTION_TAKEN,
  
  'pricing_selection': EVENTS.PLAN_SELECTED,
  'plan_select': EVENTS.PLAN_SELECTED,
  'PLAN_SELECTED': EVENTS.PLAN_SELECTED,
  
  'checkout_start': EVENTS.CHECKOUT_STARTED,
  'checkout_started': EVENTS.CHECKOUT_STARTED,
  'CHECKOUT_STARTED': EVENTS.CHECKOUT_STARTED,
  
  'template_view': EVENTS.TEMPLATE_VIEWED,
  'TEMPLATE_VIEWED': EVENTS.TEMPLATE_VIEWED,
  
  'create_quote_click': EVENTS.QUOTE_CREATED_INTENT,
  'QUOTE_CREATED_INTENT': EVENTS.QUOTE_CREATED_INTENT,
  'first_quote_created': EVENTS.FIRST_QUOTE_CREATED,
  'FIRST_QUOTE_CREATED': EVENTS.FIRST_QUOTE_CREATED,
  'signup_to_first_quote_completed': EVENTS.SIGNUP_TO_FIRST_QUOTE_COMPLETED,
  'SIGNUP_TO_FIRST_QUOTE_COMPLETED': EVENTS.SIGNUP_TO_FIRST_QUOTE_COMPLETED,
  
  'create_invoice_click': EVENTS.INVOICE_CREATED_INTENT,
  'INVOICE_CREATED_INTENT': EVENTS.INVOICE_CREATED_INTENT,
  'first_invoice_created': EVENTS.FIRST_INVOICE_CREATED,
  'FIRST_INVOICE_CREATED': EVENTS.FIRST_INVOICE_CREATED,
};

// Funnel stages mapping for Phase 6 Pipeline
export const UNIFIED_FUNNEL_STAGES: Record<FunnelStage, string> = {
  landing: 'LANDING',
  pricing: 'PRICING',
  checkout: 'CHECKOUT',
  signup: 'SIGNUP',
  dashboard: 'ONBOARDING',
  template: 'LANDING',
  document_creation: 'ONBOARDING',
};

export type NormalizedEvent = {
  event: EventName;
  stage: string; // LANDING, PRICING, etc.
  timestamp: number;
  userId?: string;
  sessionId?: string;
  metadata: Record<string, string | number | boolean | null>;
};

/**
 * Normalizes any incoming event payload into the unified schema.
 */
export function normalizeEvent(
  rawEventName: string,
  rawMetadata: Record<string, any> = {}
): NormalizedEvent {
  // 1. Unify event naming
  const canonicalEvent = EVENT_NAME_MAPPING[rawEventName] || EVENT_NAME_MAPPING[rawEventName.toLowerCase()] || EVENTS.CTA_CLICK;

  // 2. Map to unified funnel stages
  const rawStage = EVENT_FUNNEL_STAGE[canonicalEvent] || 'landing';
  const unifiedStage = UNIFIED_FUNNEL_STAGES[rawStage] || 'LANDING';

  // 3. Standardize metadata structure (flattened key-value pairs)
  const metadata: Record<string, string | number | boolean | null> = {};
  
  // Extract and copy known fields, avoiding nested structures
  for (const [key, value] of Object.entries(rawMetadata)) {
    if (key === 'utm' && typeof value === 'object' && value !== null) {
      // Flatten UTM parameters
      for (const [utmKey, utmVal] of Object.entries(value)) {
        metadata[utmKey] = utmVal !== null ? String(utmVal) : null;
      }
    } else if (typeof value === 'object' && value !== null) {
      metadata[key] = JSON.stringify(value);
    } else if (
      typeof value === 'string' ||
      typeof value === 'number' ||
      typeof value === 'boolean' ||
      value === null
    ) {
      metadata[key] = value;
    }
  }

  // Ensure current path is always captured if client-side
  if (typeof window !== 'undefined' && !metadata.path) {
    metadata.path = window.location.pathname;
  }

  return {
    event: canonicalEvent,
    stage: unifiedStage,
    timestamp: Date.now(),
    metadata,
  };
}
