import { createServiceSupabaseClient } from './supabase';

export const PRODUCT_ANALYTICS_EVENTS = new Set([
  'Landing Viewed',
  'Hero CTA Click',
  'Pricing Click',
  'Signup Started',
  'Signup Completed',
  'Proposal Created',
  'Proposal Sent',
  'Invoice Created',
  'Invoice Paid',
  'Feedback Submitted',
]);

function cleanString(value, max = 500) {
  if (typeof value !== 'string') return '';
  return value.trim().slice(0, max);
}

function toSnakeEvent(name) {
  return cleanString(name, 120).toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
}

function normalizeProperties(properties = {}) {
  const utm = properties.utm && typeof properties.utm === 'object' ? properties.utm : {};
  const timestamp = cleanString(properties.timestamp, 80) || new Date().toISOString();

  return {
    ...properties,
    identity: cleanString(properties.identity || properties.distinct_id || properties.user_id || 'anonymous', 160),
    plan: cleanString(properties.plan || 'free', 80),
    country: cleanString(properties.country || '', 120),
    source: cleanString(properties.source || 'direct', 300),
    utm,
    timestamp,
  };
}

export async function capturePostHogEvent(eventName, properties) {
  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY || process.env.POSTHOG_PROJECT_API_KEY;
  const host = process.env.NEXT_PUBLIC_POSTHOG_HOST || process.env.POSTHOG_HOST || 'https://us.i.posthog.com';
  if (!key || !host || typeof fetch !== 'function') return { sent: false, reason: 'posthog_not_configured' };

  try {
    const response = await fetch(`${host.replace(/\/$/, '')}/capture/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        api_key: key,
        event: eventName,
        distinct_id: properties.identity,
        properties,
        timestamp: properties.timestamp,
      }),
    });

    if (!response.ok) return { sent: false, reason: `posthog_${response.status}` };
    return { sent: true };
  } catch (error) {
    console.error('PostHog capture failed:', error);
    return { sent: false, reason: 'posthog_request_failed' };
  }
}

export async function recordProductAnalyticsEvent({
  eventName,
  userId = null,
  sessionId = '',
  pagePath = '',
  pageLocation = '',
  source = '',
  properties = {},
}) {
  if (!PRODUCT_ANALYTICS_EVENTS.has(eventName)) {
    return { stored: false, reason: 'invalid_event' };
  }

  const normalized = normalizeProperties({
    ...properties,
    source: source || properties.source,
  });

  const posthog = await capturePostHogEvent(eventName, normalized);
  const writer = createServiceSupabaseClient();
  if (!writer) return { stored: false, reason: 'service_role_not_configured', posthog };

  const eventMapping = {
    'Landing Viewed': 'LANDING_VIEW',
    'Hero CTA Click': 'CTA_CLICK',
    'Pricing Click': 'PRICING_VIEW',
    'Signup Started': 'SIGNUP_STARTED',
    'Signup Completed': 'SIGNUP_COMPLETED',
    'Proposal Created': 'QUOTE_CREATED_INTENT',
    'Proposal Sent': 'QUOTE_CREATED_INTENT',
    'Invoice Created': 'INVOICE_CREATED_INTENT',
    'Invoice Paid': 'INVOICE_CREATED_INTENT',
    'Feedback Submitted': 'CTA_CLICK',
  };
  
  const canonicalName = eventMapping[eventName] || 'CTA_CLICK';

  const payload = {
    event: canonicalName,
    session_id: cleanString(sessionId || normalized.session_id || '', 160),
    user_id: userId || null,
    metadata: {
      ...normalized,
      page_path: cleanString(pagePath || normalized.page_path || '', 500),
      page_location: cleanString(pageLocation || normalized.page_location || '', 1000),
      source: cleanString(source || normalized.source || 'direct', 300),
      funnel_stage: 'LANDING',
    },
    created_at: normalized.timestamp ? new Date(normalized.timestamp).toISOString() : new Date().toISOString(),
  };

  const { error } = await writer.from('analytics_events').insert(payload);
  if (error) {
    console.warn('[ServerAnalytics] Insert to analytics_events failed:', error.message);
    return { stored: false, reason: error.message, posthog };
  }

  return { stored: true, posthog };
}
