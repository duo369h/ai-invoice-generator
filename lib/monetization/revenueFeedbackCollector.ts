/**
 * Revenue Feedback Collector — Corvioz v3
 *
 * Captures, buffers, and dispatches revenue and conversion events.
 * It persists events client-side in `localStorage` (for local optimization loops)
 * and dispatches them to both standard analytics (`trackEvent`) and the Supabase
 * `revenue_events` database via server API.
 */

import { trackEvent } from '@/app/lib/analytics';

export interface RevenueEvent {
  id: string;
  event_name: 'offer_shown' | 'cta_click' | 'checkout_start' | 'payment_success' | 'payment_failed' | 'drop_off' | 'execution_exposure' | 'upgrade_impression' | 'upgrade_dismiss';
  session_id: string;
  user_id?: string | null;
  page_path: string;
  trigger_type?: string;
  target_plan?: string;
  offer_type?: string;
  properties?: any;
  created_at: string;
}

const STORAGE_KEY = 'corvioz_revenue_events';
const MAX_LOCAL_EVENTS = 1000;

/**
 * Generate a random UUID for client-side events if crypto is not fully available
 */
function generateUUID(): string {
  if (typeof window !== 'undefined' && window.crypto && window.crypto.randomUUID) {
    return window.crypto.randomUUID();
  }
  return 'rev-' + Date.now() + '-' + Math.random().toString(16).slice(2, 10);
}

/**
 * Retrieve all locally stored revenue events
 */
export function getRevenueEventsFromStorage(): RevenueEvent[] {
  if (typeof window === 'undefined') return [];
  try {
    const data = window.localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    console.warn('[REVENUE FEEDBACK] Failed to read from localStorage:', e);
    return [];
  }
}

/**
 * Clear locally stored revenue events
 */
export function clearRevenueEventsFromStorage(): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch (e) {
    console.warn('[REVENUE FEEDBACK] Failed to clear localStorage:', e);
  }
}

/**
 * Track a revenue feedback event
 */
export function trackRevenueEvent(
  eventData: Omit<RevenueEvent, 'id' | 'created_at'>
): void {
  const newEvent: RevenueEvent = {
    ...eventData,
    id: generateUUID(),
    created_at: new Date().toISOString(),
  };

  // 1. Persist to localStorage (with rotation to avoid storage limits)
  if (typeof window !== 'undefined') {
    try {
      const events = getRevenueEventsFromStorage();
      events.push(newEvent);
      
      // Keep only last N events
      if (events.length > MAX_LOCAL_EVENTS) {
        events.shift();
      }
      
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(events));
    } catch (e) {
      console.warn('[REVENUE FEEDBACK] Local storage write failed:', e);
    }

    // 2. Dispatch to server-side API (inserts into Supabase table)
    fetch('/api/monetization/revenue-events', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(newEvent),
      keepalive: true,
    }).catch((err) => {
      // Degrade gracefully, don't crash the UI on network issues
      console.debug('[REVENUE FEEDBACK] Server log skipped/failed:', err);
    });
  }

  // 3. Dispatch to standard analytics bridge
  try {
    trackEvent(newEvent.event_name, {
      revenue_event_id: newEvent.id,
      session_id: newEvent.session_id,
      user_id: newEvent.user_id,
      page_path: newEvent.page_path,
      trigger_type: newEvent.trigger_type,
      target_plan: newEvent.target_plan,
      offer_type: newEvent.offer_type,
      ...newEvent.properties,
    });
  } catch (err) {
    // Analytics failures should never block product flow
  }
}

// ─── Helpers for specific monetization milestones ─────────────────────────────

export function recordOfferShown(
  session_id: string,
  user_id: string | null | undefined,
  targetPlan: string,
  offerType: string,
  triggerType: string,
  pagePath: string,
  properties?: any
): void {
  trackRevenueEvent({
    event_name: 'offer_shown',
    session_id,
    user_id: user_id || null,
    page_path: pagePath,
    trigger_type: triggerType,
    target_plan: targetPlan,
    offer_type: offerType,
    properties,
  });
}

export function recordCtaClick(
  session_id: string,
  user_id: string | null | undefined,
  targetPlan: string,
  offerType: string,
  pagePath: string,
  properties?: any
): void {
  trackRevenueEvent({
    event_name: 'cta_click',
    session_id,
    user_id: user_id || null,
    page_path: pagePath,
    target_plan: targetPlan,
    offer_type: offerType,
    properties,
  });
}

export function recordCheckoutStart(
  session_id: string,
  user_id: string | null | undefined,
  targetPlan: string,
  pagePath: string,
  properties?: any
): void {
  trackRevenueEvent({
    event_name: 'checkout_start',
    session_id,
    user_id: user_id || null,
    page_path: pagePath,
    target_plan: targetPlan,
    properties,
  });
}

export function recordPaymentSuccess(
  session_id: string,
  user_id: string | null | undefined,
  targetPlan: string,
  revenue: number,
  properties?: any
): void {
  trackRevenueEvent({
    event_name: 'payment_success',
    session_id,
    user_id: user_id || null,
    page_path: typeof window !== 'undefined' ? window.location.pathname : '',
    target_plan: targetPlan,
    properties: {
      ...properties,
      revenue,
    },
  });
}

export function recordPaymentFailure(
  session_id: string,
  user_id: string | null | undefined,
  targetPlan: string,
  error?: string,
  properties?: any
): void {
  trackRevenueEvent({
    event_name: 'payment_failed',
    session_id,
    user_id: user_id || null,
    page_path: typeof window !== 'undefined' ? window.location.pathname : '',
    target_plan: targetPlan,
    properties: {
      ...properties,
      error,
    },
  });
}

export function recordDropOff(
  session_id: string,
  user_id: string | null | undefined,
  step: string,
  reason?: string,
  properties?: any
): void {
  trackRevenueEvent({
    event_name: 'drop_off',
    session_id,
    user_id: user_id || null,
    page_path: typeof window !== 'undefined' ? window.location.pathname : '',
    properties: {
      ...properties,
      drop_off_step: step,
      reason,
    },
  });
}

export function trackExecutionExposure(
  session_id: string,
  user_id: string | null | undefined,
  targetPlan?: string,
  properties?: any
): void {
  trackRevenueEvent({
    event_name: 'execution_exposure',
    session_id,
    user_id: user_id || null,
    page_path: typeof window !== 'undefined' ? window.location.pathname : '',
    target_plan: targetPlan,
    properties,
  });
}

export function trackUpgradeImpression(
  session_id: string,
  user_id: string | null | undefined,
  targetPlan?: string,
  offerType?: string,
  properties?: any
): void {
  trackRevenueEvent({
    event_name: 'upgrade_impression',
    session_id,
    user_id: user_id || null,
    page_path: typeof window !== 'undefined' ? window.location.pathname : '',
    target_plan: targetPlan,
    offer_type: offerType,
    properties,
  });
}

export function trackUpgradeDismiss(
  session_id: string,
  user_id: string | null | undefined,
  targetPlan?: string,
  offerType?: string,
  properties?: any
): void {
  trackRevenueEvent({
    event_name: 'upgrade_dismiss',
    session_id,
    user_id: user_id || null,
    page_path: typeof window !== 'undefined' ? window.location.pathname : '',
    target_plan: targetPlan,
    offer_type: offerType,
    properties,
  });
}
