/*
CORVIOZ SYSTEM LOCK v2.6
Analytics = transport only (network transport adapter only)
NO CROSS-LAYER LOGIC ALLOWED
NO BUSINESS INFERENCE IN RUNTIME
// V3_REVENUE_EXECUTION_LAYER_READY
// V3_MONETIZATION_CONTROLLER_READY
// V3_FEATURE_GATE_LAYER_READY
// V3_REVENUE_DECISION_STABILIZATION_LAYER_READY
// V3_CONTEXT_ENGINE_READY
// V3_CONFLICT_RESOLVER_READY
*/

'use client';

import { canActivateAnalytics } from '../../core/trust/consentManager';

export const ANALYTICS_BUILD_VERSION = 'analytics_contract_v3_2026_06_26';

function isAnalyticsDebugEnabled() {
  if (typeof window === 'undefined') return false;
  try {
    const params = new URLSearchParams(window.location.search || '');
    return (
      params.get('debug_analytics') === '1' ||
      params.get('analytics_debug') === '1' ||
      params.get('ga_debug') === '1' ||
      process.env.NEXT_PUBLIC_ANALYTICS_DEBUG === 'true'
    );
  } catch (_) {
    return false;
  }
}

function debugLog(message, details = {}) {
  if (!isAnalyticsDebugEnabled()) return;
  console.info(`[GA4 DEBUG] ${message}`, {
    analyticsBuild: ANALYTICS_BUILD_VERSION,
    dataLayerReady: Array.isArray(window.dataLayer),
    gtagReady: typeof window.gtag === 'function',
    ...details,
  });
}

function ensureDataLayer() {
  if (typeof window === 'undefined') return null;
  if (!Array.isArray(window.dataLayer)) {
    window.dataLayer = [];
  }
  return window.dataLayer;
}

/**
 * Pure network transport dispatch to GA4 and Plausible.
 * No validation, no filtering, no inference, no state mutation.
 */
export function sendEvent(name, props) {
  if (typeof window === 'undefined') return;
  if (!canActivateAnalytics()) {
    debugLog('Analytics suppressed by tracking consent', { event: name });
    return;
  }

  const dataLayer = ensureDataLayer();

  // Log to console for local audits and development review
  if (process.env.NODE_ENV !== 'production' || window.location.hostname === 'localhost') {
    console.log(`[ANALYTICS TRANSPORT] "${name}"`, props);
  }

  debugLog('Preparing event', { event: name, props });

  const gaPayload = {
    transport_type: 'beacon',
    ...props,
  };

  if (isAnalyticsDebugEnabled() && typeof gaPayload.event_callback !== 'function') {
    gaPayload.event_callback = () => debugLog('GA4 event callback confirmed', { event: name });
    gaPayload.event_timeout = gaPayload.event_timeout || 2000;
  }

  // 1. Google Analytics 4 (gtag.js)
  if (typeof window.gtag === 'function') {
    try {
      window.gtag('event', name, gaPayload);
      debugLog('gtag event dispatched', { event: name, props: gaPayload });
    } catch (err) {
      console.error('[ANALYTICS ERROR] Failed to send to Google Analytics:', err);
    }
  } else if (Array.isArray(window.dataLayer)) {
    dataLayer.push(['event', name, gaPayload]);
    debugLog('dataLayer event queued because gtag is not ready', { event: name, props: gaPayload });
  }

  // 2. Plausible Analytics
  if (typeof window.plausible === 'function') {
    try {
      window.plausible(name, { props });
    } catch (err) {
      console.error('[ANALYTICS ERROR] Failed to send to Plausible:', err);
    }
  }

  // 3. PostHog capture API. UI calls this transport through the analytics layer only.
  const posthogKey = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  const posthogHost = process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com';
  if (posthogKey && posthogHost && typeof navigator !== 'undefined') {
    try {
      const body = JSON.stringify({
        api_key: posthogKey,
        event: name,
        distinct_id: props?.identity || props?.distinct_id || props?.user_id || props?.session_id || 'anonymous',
        properties: props || {},
        timestamp: props?.timestamp || new Date().toISOString(),
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
      console.error('[ANALYTICS ERROR] Failed to send to PostHog:', err);
    }
  }
}

// Alias trackEvent to sendEvent to preserve compatibility with monetization/billing libraries
export const trackEvent = sendEvent;
