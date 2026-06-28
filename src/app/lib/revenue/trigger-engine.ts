'use client';

export type ConversionTrigger =
  | 'first_invoice_created'
  | 'second_invoice_attempt'
  | 'pricing_view_3_times'
  | 'idle_on_pricing_30s';

export type ConversionAction = {
  trigger: ConversionTrigger;
  action: 'show_upgrade_modal' | 'open_pricing' | 'highlight_pro' | 'start_checkout';
  target_plan: 'pro';
  message: string;
  priority: 'medium' | 'high' | 'critical';
};

const PRICING_VIEW_COUNT_KEY = 'corvioz_revenue_pricing_view_count';

export function getConversionAction(trigger: ConversionTrigger): ConversionAction {
  const actions: Record<ConversionTrigger, ConversionAction> = {
    first_invoice_created: {
      trigger,
      action: 'show_upgrade_modal',
      target_plan: 'pro',
      message: 'Your first invoice is ready. Unlock Pro to send it.',
      priority: 'high',
    },
    second_invoice_attempt: {
      trigger,
      action: 'open_pricing',
      target_plan: 'pro',
      message: 'You are creating invoices repeatedly. Upgrade to keep billing without limits.',
      priority: 'critical',
    },
    pricing_view_3_times: {
      trigger,
      action: 'highlight_pro',
      target_plan: 'pro',
      message: 'Pro is the best fit for your current workflow.',
      priority: 'high',
    },
    idle_on_pricing_30s: {
      trigger,
      action: 'start_checkout',
      target_plan: 'pro',
      message: 'Ready to continue? Start with Pro and unlock the next revenue step.',
      priority: 'medium',
    },
  };

  return actions[trigger];
}

export function recordPricingViewForTrigger() {
  if (typeof window === 'undefined') return null;

  const nextCount = Number(window.sessionStorage.getItem(PRICING_VIEW_COUNT_KEY) || 0) + 1;
  window.sessionStorage.setItem(PRICING_VIEW_COUNT_KEY, String(nextCount));

  if (nextCount >= 3) {
    return getConversionAction('pricing_view_3_times');
  }

  return null;
}

export function evaluateConversionTrigger(eventName: string, details: { invoiceCreateStarts?: number } = {}) {
  if (eventName === 'first_invoice_created' || eventName === 'invoice_create_complete') {
    return getConversionAction('first_invoice_created');
  }

  if ((eventName === 'invoice_create' || eventName === 'invoice_create_start') && (details.invoiceCreateStarts || 0) >= 2) {
    return getConversionAction('second_invoice_attempt');
  }

  if (eventName === 'pricing_view') {
    return recordPricingViewForTrigger();
  }

  if (eventName === 'idle_on_pricing_30s') {
    return getConversionAction('idle_on_pricing_30s');
  }

  return null;
}
