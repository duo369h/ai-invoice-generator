/**
 * Corvioz Real Behavior Capture Layer — Event Definitions
 * Sprint C Phase 2.6
 *
 * This file defines the canonical event schema.
 * It is a TYPE DEFINITION file only.
 * No transport logic. No business logic. No analytics processing.
 */

// ─── Canonical Event Names ────────────────────────────────────────────────────

export const EVENTS = {
  LANDING_VIEW: 'LANDING_VIEW',
  CTA_CLICK: 'CTA_CLICK',
  SCROLL_DEPTH_50: 'SCROLL_DEPTH_50',
  SCROLL_DEPTH_90: 'SCROLL_DEPTH_90',
  PRICING_VIEW: 'PRICING_VIEW',
  PLAN_HOVER: 'PLAN_HOVER',
  PLAN_SELECTED: 'PLAN_SELECTED',
  CHECKOUT_STARTED: 'CHECKOUT_STARTED',
  SIGNUP_STARTED: 'SIGNUP_STARTED',
  PHOTOGRAPHER_CTA_CLICK: 'photographer_cta_click',
  SIGNUP_COMPLETED: 'signup_completed',
  DASHBOARD_ENTERED: 'DASHBOARD_ENTERED',
  BETA_FEEDBACK_CLICKED: 'beta_feedback_clicked',
  FIRST_ACTION_TAKEN: 'FIRST_ACTION_TAKEN',
  TEMPLATE_VIEWED: 'TEMPLATE_VIEWED',
  QUOTE_CREATED_INTENT: 'QUOTE_CREATED_INTENT',
  FIRST_QUOTE_CREATED: 'first_quote_created',
  SIGNUP_TO_FIRST_QUOTE_COMPLETED: 'signup_to_first_quote_completed',
  INVOICE_CREATED_INTENT: 'INVOICE_CREATED_INTENT',
  FIRST_INVOICE_CREATED: 'first_invoice_created',
  FIRST_VALUE_CREATED: 'FIRST_VALUE_CREATED',
  ONBOARDING_DROPOFF: 'ONBOARDING_DROPOFF',
} as const;

export type EventName = (typeof EVENTS)[keyof typeof EVENTS];

// ─── Core Event Shape ─────────────────────────────────────────────────────────

export type AnalyticsEvent = {
  /** Canonical event name from EVENTS constant */
  event: EventName;
  /** Unix timestamp in milliseconds */
  timestamp: number;
  /** Authenticated user ID if available */
  userId?: string;
  /** Browser session ID (persistent, see session.ts) */
  sessionId?: string;
  /** Arbitrary contextual payload — kept flat for Supabase JSONB */
  metadata?: Record<string, string | number | boolean | null>;
};

// ─── Funnel Stage Map ─────────────────────────────────────────────────────────

export type FunnelStage =
  | 'landing'
  | 'pricing'
  | 'checkout'
  | 'signup'
  | 'dashboard'
  | 'template'
  | 'document_creation';

export const EVENT_FUNNEL_STAGE: Record<EventName, FunnelStage> = {
  LANDING_VIEW: 'landing',
  CTA_CLICK: 'landing',
  SCROLL_DEPTH_50: 'landing',
  SCROLL_DEPTH_90: 'landing',
  PRICING_VIEW: 'pricing',
  PLAN_HOVER: 'pricing',
  PLAN_SELECTED: 'pricing',
  CHECKOUT_STARTED: 'checkout',
  photographer_cta_click: 'landing',
  SIGNUP_STARTED: 'signup',
  signup_completed: 'signup',
  DASHBOARD_ENTERED: 'dashboard',
  beta_feedback_clicked: 'dashboard',
  FIRST_ACTION_TAKEN: 'dashboard',
  TEMPLATE_VIEWED: 'template',
  QUOTE_CREATED_INTENT: 'document_creation',
  first_quote_created: 'document_creation',
  signup_to_first_quote_completed: 'document_creation',
  INVOICE_CREATED_INTENT: 'document_creation',
  first_invoice_created: 'document_creation',
  FIRST_VALUE_CREATED: 'document_creation',
  ONBOARDING_DROPOFF: 'dashboard',
};
