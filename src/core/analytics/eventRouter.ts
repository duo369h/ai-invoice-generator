/**
 * Corvioz Event Unification — Canonical Event Router
 * Sprint C Phase 2.7
 *
 * Single entry point for ALL event tracking.
 * Normalizes, deduplicates, and dispatches to storage and transports.
 */

import { type EventName } from './events';
import { normalizeEvent } from './eventNormalizer';
import { isDuplicateEvent } from './dedup';
import { getSessionId } from './session';
import { persistEvent } from './eventStore';
import { processEventForRevenueSignal } from '../revenue/revenueSignalEngine';

// ─── Network Transports (GA4, Plausible, PostHog) ───────────────────────────

function getUserId(): string | undefined {
  if (typeof window === 'undefined') return undefined;
  try {
    return localStorage.getItem('corvioz_user_id') ?? undefined;
  } catch {
    return undefined;
  }
}

export function isAnalyticsDebugEnabled(
  search = typeof window === 'undefined' ? '' : window.location.search
): boolean {
  return new URLSearchParams(search).get('debug_analytics') === '1';
}

function dispatchTransports(eventName: string, payload: any): void {
  if (typeof window === 'undefined') return;

  // 1. Console Log in development
  if (process.env.NODE_ENV !== 'production' || window.location.hostname === 'localhost') {
    console.info(`[EVENT_ROUTER DISPATCH] "${eventName}"`, payload);
  }

  // 2. Google Analytics 4 (gtag.js)
  if (typeof (window as any).gtag === 'function') {
    try {
      const gaPayload: Record<string, unknown> = {
        transport_type: 'beacon',
        ...payload.metadata,
        session_id: payload.sessionId,
        user_id: payload.userId,
      };
      if (isAnalyticsDebugEnabled()) {
        gaPayload.debug_mode = true;
      }
      (window as any).gtag('event', eventName, gaPayload);
    } catch (err) {
      console.error('[EVENT_ROUTER GA4 ERROR]', err);
    }
  }

  // 3. Plausible Analytics
  if (typeof (window as any).plausible === 'function') {
    try {
      (window as any).plausible(eventName, { props: payload.metadata });
    } catch (err) {
      console.error('[EVENT_ROUTER PLAUSIBLE ERROR]', err);
    }
  }

  // 4. PostHog Ingestion
  const posthogKey = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  const posthogHost = process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com';
  if (posthogKey && posthogHost && typeof navigator !== 'undefined') {
    try {
      const body = JSON.stringify({
        api_key: posthogKey,
        event: eventName,
        distinct_id: payload.userId || payload.sessionId || 'anonymous',
        properties: {
          ...payload.metadata,
          session_id: payload.sessionId,
        },
        timestamp: new Date(payload.timestamp).toISOString(),
      });
      const endpoint = `${posthogHost.replace(/\/$/, '')}/capture/`;
      if (typeof navigator.sendBeacon === 'function') {
        navigator.sendBeacon(endpoint, new Blob([body], { type: 'application/json' }));
      } else {
        fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body,
          keepalive: true,
        }).catch(() => {});
      }
    } catch (err) {
      console.error('[EVENT_ROUTER POSTHOG ERROR]', err);
    }
  }

  // 5. Product Analytics Ingestion Endpoint
  fetch('/api/product/analytics', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ event_name: eventName, properties: payload }),
    keepalive: true,
  }).catch(() => {});
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Single source of truth dispatcher for all analytics events in Corvioz.
 */
export function sendEvent(
  eventName: string,
  rawMetadata: Record<string, any> = {}
): void {
  try {
    // Consent check
    if (typeof window !== 'undefined') {
      const consent = localStorage.getItem('corvioz_analytics_consent');
      if (consent !== 'accepted') {
        return;
      }
    }

    // 1. Deduplicate check
    if (isDuplicateEvent(eventName, rawMetadata)) {
      return;
    }

    // 2. Normalize schema & map funnel stages
    const normalized = normalizeEvent(eventName, rawMetadata);
    
    // Attach identity properties
    const enrichedPayload = {
      event: normalized.event,
      timestamp: normalized.timestamp,
      userId: getUserId(),
      sessionId: getSessionId(),
      metadata: {
        ...normalized.metadata,
        funnel_stage: normalized.stage,
      },
    };

    // 3. Forward to database storage layer (Supabase + localStorage fallback)
    persistEvent(enrichedPayload);

    // 4. Forward to client transports (GA4, Plausible, PostHog)
    dispatchTransports(normalized.event, enrichedPayload);

    // 5. Feed into Revenue Signal Engine (Sprint C Phase 2.8 - Non-blocking & Advisory)
    try {
      processEventForRevenueSignal({
        ...enrichedPayload,
        stage: normalized.stage,
      });
    } catch (scoringErr) {
      console.error('[EVENT_ROUTER REVENUE SIGNAL ERROR]', scoringErr);
    }
  } catch (err) {
    console.error('[EVENT_ROUTER ERROR] Failed to route event:', err);
  }
}
