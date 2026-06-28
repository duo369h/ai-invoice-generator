export type PaywallSafetyAction = 'allow' | 'block' | 'upsell' | 'redirect' | 'paywall' | string;

export type PaywallSafetyInput = {
  funnel_step?: string;
  action_type?: string;
  recommended_action?: PaywallSafetyAction;
  paywall_action?: PaywallSafetyAction;
  intent_score?: number;
  invoice_create_count?: number;
  paywall_count_this_session?: number;
  is_first_invoice?: boolean;
};

export type PaywallSafetyResult = {
  allowed: boolean;
  softened_action?: string;
  reason: string;
};

const BLOCKING_ACTIONS = new Set(['block', 'paywall', 'hard_paywall']);
const SIGNUP_STEPS = new Set(['signup_start', 'signup_complete', 'signup', 'auth', 'registration']);
const FIRST_INVOICE_STEPS = new Set(['invoice_create_start', 'create_invoice', 'invoice_create', 'first_invoice_created']);

function toNumber(value: unknown, fallback = 0) {
  const next = Number(value ?? fallback);
  return Number.isFinite(next) ? next : fallback;
}

function clampScore(value: unknown) {
  return Math.max(0, Math.min(100, toNumber(value, 0)));
}

function normalize(value: unknown) {
  return String(value || '').trim().toLowerCase();
}

function isBlocking(action: unknown) {
  return BLOCKING_ACTIONS.has(normalize(action));
}

export function evaluatePaywallSafety(input: PaywallSafetyInput = {}): PaywallSafetyResult {
  const funnelStep = normalize(input.funnel_step);
  const actionType = normalize(input.action_type);
  const recommendedAction = normalize(input.recommended_action);
  const paywallAction = normalize(input.paywall_action || input.recommended_action);
  const intentScore = clampScore(input.intent_score);
  const invoiceCreateCount = Math.max(0, toNumber(input.invoice_create_count, 0));
  const paywallCount = Math.max(0, toNumber(input.paywall_count_this_session, 0));
  const firstInvoiceAttempt = input.is_first_invoice === true
    || invoiceCreateCount === 0
    || FIRST_INVOICE_STEPS.has(funnelStep)
    || FIRST_INVOICE_STEPS.has(actionType);

  if (SIGNUP_STEPS.has(funnelStep) || SIGNUP_STEPS.has(actionType)) {
    return {
      allowed: true,
      softened_action: 'allow',
      reason: 'Signup flow must never be blocked by monetization safety rules.',
    };
  }

  if (firstInvoiceAttempt && (isBlocking(recommendedAction) || isBlocking(paywallAction))) {
    return {
      allowed: false,
      softened_action: 'allow',
      reason: 'First invoice creation must never be blocked.',
    };
  }

  if (intentScore < 30 && (paywallAction === 'hard_paywall' || paywallAction === 'paywall' || recommendedAction === 'paywall')) {
    return {
      allowed: false,
      softened_action: 'upsell',
      reason: 'Cold users cannot receive a hard paywall before they show intent.',
    };
  }

  if (paywallCount >= 2 && (isBlocking(recommendedAction) || recommendedAction === 'upsell' || recommendedAction === 'redirect')) {
    return {
      allowed: false,
      softened_action: 'allow',
      reason: 'Paywall frequency limit reached for this session.',
    };
  }

  return {
    allowed: true,
    reason: 'Paywall action passed safety guard rules.',
  };
}
