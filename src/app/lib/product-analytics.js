'use client';

import { sendEvent } from './analytics';

const PRODUCT_EVENTS = {
  LANDING_VIEWED: 'Landing Viewed',
  HERO_CTA_CLICK: 'Hero CTA Click',
  PRICING_CLICK: 'Pricing Click',
  SIGNUP_STARTED: 'Signup Started',
  SIGNUP_COMPLETED: 'Signup Completed',
  PROPOSAL_CREATED: 'Proposal Created',
  PROPOSAL_SENT: 'Proposal Sent',
  INVOICE_CREATED: 'Invoice Created',
  INVOICE_PAID: 'Invoice Paid',
  FEEDBACK_SUBMITTED: 'Feedback Submitted',
};

function readSessionId() {
  if (typeof window === 'undefined') return '';
  const key = 'corvioz_product_session_id';
  const existing = window.localStorage.getItem(key);
  if (existing) return existing;
  const next = globalThis.crypto?.randomUUID?.() || `session_${Date.now()}_${Math.random().toString(36).slice(2)}`;
  window.localStorage.setItem(key, next);
  return next;
}

function readUtm() {
  if (typeof window === 'undefined') return {};
  const params = new URLSearchParams(window.location.search || '');
  return {
    utm_source: params.get('utm_source') || '',
    utm_medium: params.get('utm_medium') || '',
    utm_campaign: params.get('utm_campaign') || '',
    utm_term: params.get('utm_term') || '',
    utm_content: params.get('utm_content') || '',
  };
}

function readSource(utm) {
  if (utm.utm_source) return utm.utm_source;
  if (typeof document !== 'undefined' && document.referrer) return document.referrer;
  return 'direct';
}

function readPlan() {
  if (typeof window === 'undefined') return 'free';
  return (
    window.localStorage.getItem('corvioz_selected_plan') ||
    window.sessionStorage.getItem('corvioz_selected_plan') ||
    'free'
  );
}

function readIdentity(sessionId) {
  if (typeof window === 'undefined') return sessionId || 'anonymous';
  return (
    window.localStorage.getItem('corvioz_user_id') ||
    window.localStorage.getItem('corvioz_profile_id') ||
    sessionId ||
    'anonymous'
  );
}

function normalizeEventName(name) {
  return PRODUCT_EVENTS[name] || name;
}

function buildContext(props = {}) {
  const sessionId = readSessionId();
  const utm = { ...readUtm(), ...(props.utm || {}) };
  const timestamp = props.timestamp || new Date().toISOString();
  const identity = props.identity || props.user_id || readIdentity(sessionId);

  return {
    ...props,
    identity,
    distinct_id: identity,
    session_id: props.session_id || sessionId,
    plan: props.plan || readPlan(),
    country: props.country || '',
    source: props.source || readSource(utm),
    utm,
    timestamp,
    page_path: typeof window !== 'undefined' ? window.location.pathname : '',
    page_location: typeof window !== 'undefined' ? window.location.href : '',
  };
}

export function trackProductEvent(name, props = {}) {
  const eventName = normalizeEventName(name);
  const payload = buildContext(props);

  sendEvent(eventName, payload);

  if (typeof window !== 'undefined') {
    fetch('/api/product/analytics', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event_name: eventName, properties: payload }),
      keepalive: true,
    }).catch(() => {});
  }
}

export function trackLandingViewed(props = {}) {
  trackProductEvent(PRODUCT_EVENTS.LANDING_VIEWED, props);
}

export function trackHeroCtaClick(props = {}) {
  trackProductEvent(PRODUCT_EVENTS.HERO_CTA_CLICK, props);
}

export function trackPricingClick(props = {}) {
  trackProductEvent(PRODUCT_EVENTS.PRICING_CLICK, props);
}

export function trackSignupStarted(props = {}) {
  trackProductEvent(PRODUCT_EVENTS.SIGNUP_STARTED, props);
}

export function trackSignupCompleted(props = {}) {
  trackProductEvent(PRODUCT_EVENTS.SIGNUP_COMPLETED, props);
}

export function trackFeedbackSubmitted(props = {}) {
  trackProductEvent(PRODUCT_EVENTS.FEEDBACK_SUBMITTED, props);
}

export { PRODUCT_EVENTS };
