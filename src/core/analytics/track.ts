/**
 * Corvioz Real Behavior Capture Layer — Track Functions
 * Sprint C Phase 2.6
 *
 * Public tracking API consumed by all frontend surfaces.
 * Each function maps to one canonical event name from events.ts.
 *
 * Rules:
 *   - Reads userId from Supabase auth session (non-blocking)
 *   - Reads sessionId from session.ts
 *   - Persists via eventStore.ts (Supabase + local fallback)
 *   - Does NOT modify UI state
 *   - Does NOT throw or block caller
 */

import { EVENTS, type EventName, type AnalyticsEvent } from './events';
import { getSessionId } from './session';
import { persistEvent } from './eventStore';

// ─── Internal Helpers ─────────────────────────────────────────────────────────

function getUserId(): string | undefined {
  if (typeof window === 'undefined') return undefined;
  try {
    // Read cached user id written by auth layer to localStorage
    return localStorage.getItem('corvioz_user_id') ?? undefined;
  } catch {
    return undefined;
  }
}

function buildEvent(
  event: EventName,
  metadata?: Record<string, string | number | boolean | null>,
): AnalyticsEvent {
  return {
    event,
    timestamp: Date.now(),
    userId: getUserId(),
    sessionId: getSessionId(),
    metadata: metadata ?? undefined,
  };
}

function capture(
  event: EventName,
  metadata?: Record<string, string | number | boolean | null>,
): void {
  try {
    persistEvent(buildEvent(event, metadata));
  } catch {
    // Silent — never crash the UI
  }
}

// ─── Public Track Functions ───────────────────────────────────────────────────

/** General-purpose tracker for arbitrary canonical events */
export function track(
  event: EventName,
  metadata?: Record<string, string | number | boolean | null>,
): void {
  capture(event, metadata);
}

/** Landing page became visible */
export function trackPageView(path?: string): void {
  capture(EVENTS.LANDING_VIEW, { path: path ?? (typeof window !== 'undefined' ? window.location.pathname : '') });
}

/** User clicked any CTA button */
export function trackClick(label: string, path?: string): void {
  capture(EVENTS.CTA_CLICK, {
    label,
    path: path ?? (typeof window !== 'undefined' ? window.location.pathname : ''),
  });
}

/** CTA specifically mapped to growth or upgrade surfaces */
export function trackCTA(label: string, surface: string): void {
  capture(EVENTS.CTA_CLICK, { label, surface });
}

/** Signup flow was started */
export function trackSignup(): void {
  capture(EVENTS.SIGNUP_STARTED);
}

/** Pricing page became visible */
export function trackPricingView(source?: string): void {
  capture(EVENTS.PRICING_VIEW, { source: source ?? 'direct' });
}

/** Checkout flow was initiated */
export function trackCheckoutStart(planId: string): void {
  capture(EVENTS.CHECKOUT_STARTED, { planId });
}

/** User hovered over a pricing plan */
export function trackPlanHover(planId: string): void {
  capture(EVENTS.PLAN_HOVER, { planId });
}

/** User selected a pricing plan */
export function trackPlanSelected(planId: string): void {
  capture(EVENTS.PLAN_SELECTED, { planId });
}

/** Signup was completed successfully */
export function trackSignupComplete(method?: string): void {
  capture(EVENTS.SIGNUP_COMPLETED, { method: method ?? 'email' });
}

/** Dashboard was entered for the first time in the session */
export function trackDashboardEnter(): void {
  capture(EVENTS.DASHBOARD_ENTERED);
}

/** First meaningful action taken inside the dashboard */
export function trackFirstAction(action: string): void {
  capture(EVENTS.FIRST_ACTION_TAKEN, { action });
}

/** Template page was viewed */
export function trackTemplateView(templateType: string, industry?: string): void {
  capture(EVENTS.TEMPLATE_VIEWED, { templateType, industry: industry ?? 'generic' });
}

/** User showed intent to create a quote */
export function trackQuoteCreatedIntent(source?: string): void {
  capture(EVENTS.QUOTE_CREATED_INTENT, { source: source ?? 'dashboard' });
}

/** User showed intent to create an invoice */
export function trackInvoiceCreatedIntent(source?: string): void {
  capture(EVENTS.INVOICE_CREATED_INTENT, { source: source ?? 'dashboard' });
}

/** Scroll depth reached 50% of page */
export function trackScrollDepth50(path?: string): void {
  capture(EVENTS.SCROLL_DEPTH_50, { path: path ?? (typeof window !== 'undefined' ? window.location.pathname : '') });
}

/** Scroll depth reached 90% of page */
export function trackScrollDepth90(path?: string): void {
  capture(EVENTS.SCROLL_DEPTH_90, { path: path ?? (typeof window !== 'undefined' ? window.location.pathname : '') });
}
