export type MonetizationAction = 'allow' | 'block' | 'upsell' | 'redirect';

export type UpgradeTriggerInput = {
  action_type?: 'invoice_create' | 'quote_create' | 'export_pdf' | 'pricing_view' | string;
  invoice_create_count?: number;
  pricing_view_count?: number;
  intent_score?: number;
  user_state?: 'free' | 'logged_in' | 'paid' | string;
};

export type UpgradeTriggerDecision = {
  action: MonetizationAction;
  upgrade_reason: string;
};

const PAID_STATES = new Set(['paid', 'pro', 'professional', 'agency']);

function toNumber(value: unknown, fallback = 0) {
  const next = Number(value ?? fallback);
  return Number.isFinite(next) ? next : fallback;
}

function isPaid(userState?: string) {
  return PAID_STATES.has(String(userState || '').toLowerCase());
}

export function evaluateUpgradeTrigger(input: UpgradeTriggerInput = {}): UpgradeTriggerDecision {
  const actionType = String(input.action_type || '').toLowerCase();
  const invoiceCreateCount = Math.max(0, toNumber(input.invoice_create_count, 0));
  const pricingViewCount = Math.max(0, toNumber(input.pricing_view_count, 0));
  const intentScore = Math.max(0, Math.min(100, toNumber(input.intent_score, 0)));

  if (isPaid(input.user_state)) {
    return {
      action: 'allow',
      upgrade_reason: 'Paid user can continue without upgrade pressure.',
    };
  }

  if (invoiceCreateCount >= 2) {
    return {
      action: 'redirect',
      upgrade_reason: 'invoice_create_count >= 2 triggers paywall.',
    };
  }

  if (actionType === 'export_pdf') {
    return {
      action: 'block',
      upgrade_reason: 'export_pdf is blocked until upgrade.',
    };
  }

  if (actionType === 'quote_create' && intentScore > 70) {
    return {
      action: 'upsell',
      upgrade_reason: 'High-intent quote creation triggers upgrade modal.',
    };
  }

  if (actionType === 'pricing_view' && pricingViewCount >= 3) {
    return {
      action: 'upsell',
      upgrade_reason: 'Repeated pricing views trigger urgency upgrade.',
    };
  }

  return {
    action: 'allow',
    upgrade_reason: 'No automatic upgrade trigger matched.',
  };
}
