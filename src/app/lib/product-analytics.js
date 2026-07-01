import { sendEvent } from '../../core/analytics/eventRouter';

const PRODUCT_EVENTS = {
  LANDING_VIEWED: 'LANDING_VIEW',
  HERO_CTA_CLICK: 'CTA_CLICK',
  PRICING_CLICK: 'PRICING_VIEW',
  SIGNUP_STARTED: 'SIGNUP_STARTED',
  SIGNUP_COMPLETED: 'SIGNUP_COMPLETED',
  PROPOSAL_CREATED: 'QUOTE_CREATED_INTENT',
  PROPOSAL_SENT: 'QUOTE_CREATED_INTENT',
  INVOICE_CREATED: 'INVOICE_CREATED_INTENT',
  INVOICE_PAID: 'INVOICE_CREATED_INTENT',
  FEEDBACK_SUBMITTED: 'CTA_CLICK',
};

/**
 * @deprecated Use eventRouter.sendEvent() directly.
 */
export function trackProductEvent(name, props = {}) {
  const eventName = PRODUCT_EVENTS[name] || name;
  sendEvent(eventName, props);
}

export function trackLandingViewed(props = {}) {
  trackProductEvent('LANDING_VIEWED', props);
}

export function trackHeroCtaClick(props = {}) {
  trackProductEvent('HERO_CTA_CLICK', props);
}

export function trackPricingClick(props = {}) {
  trackProductEvent('PRICING_CLICK', props);
}

export function trackSignupStarted(props = {}) {
  trackProductEvent('SIGNUP_STARTED', props);
}

export function trackSignupCompleted(props = {}) {
  trackProductEvent('SIGNUP_COMPLETED', props);
}

export function trackFeedbackSubmitted(props = {}) {
  trackProductEvent('FEEDBACK_SUBMITTED', props);
}

export { PRODUCT_EVENTS };
