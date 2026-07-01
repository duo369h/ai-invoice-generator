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
  SIGNUP_COMPLETED: 'SIGNUP_COMPLETED',
  DASHBOARD_ENTERED: 'DASHBOARD_ENTERED',
  FIRST_ACTION_TAKEN: 'FIRST_ACTION_TAKEN',
  TEMPLATE_VIEWED: 'TEMPLATE_VIEWED',
  QUOTE_CREATED_INTENT: 'QUOTE_CREATED_INTENT',
  INVOICE_CREATED_INTENT: 'INVOICE_CREATED_INTENT',
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
  SIGNUP_STARTED: 'signup',
  SIGNUP_COMPLETED: 'signup',
  DASHBOARD_ENTERED: 'dashboard',
  FIRST_ACTION_TAKEN: 'dashboard',
  TEMPLATE_VIEWED: 'template',
  QUOTE_CREATED_INTENT: 'document_creation',
  INVOICE_CREATED_INTENT: 'document_creation',
};
