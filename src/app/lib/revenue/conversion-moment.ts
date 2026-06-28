'use client';

export type ConversionMomentKey = 'invoice_completion' | 'quote_export' | 'pricing_revisit';

export type ConversionMoment = {
  moment: ConversionMomentKey;
  monetization_type: 'paywall_opportunity' | 'hard_paywall' | 'upgrade_modal';
  action: 'show_upgrade_modal' | 'lock_and_show_pricing' | 'open_upgrade_modal';
  target_plan: 'pro';
  event_name: string;
};

export const CONVERSION_MOMENTS: Record<ConversionMomentKey, ConversionMoment> = {
  invoice_completion: {
    moment: 'invoice_completion',
    monetization_type: 'paywall_opportunity',
    action: 'show_upgrade_modal',
    target_plan: 'pro',
    event_name: 'invoice_create_complete',
  },
  quote_export: {
    moment: 'quote_export',
    monetization_type: 'hard_paywall',
    action: 'lock_and_show_pricing',
    target_plan: 'pro',
    event_name: 'quote_export',
  },
  pricing_revisit: {
    moment: 'pricing_revisit',
    monetization_type: 'upgrade_modal',
    action: 'open_upgrade_modal',
    target_plan: 'pro',
    event_name: 'pricing_view',
  },
};

export function getConversionMoment(moment: ConversionMomentKey) {
  return CONVERSION_MOMENTS[moment];
}

export function getConversionMomentForEvent(eventName: string): ConversionMoment | null {
  if (eventName === 'invoice_create_complete' || eventName === 'first_invoice_created') {
    return CONVERSION_MOMENTS.invoice_completion;
  }

  if (eventName === 'export_attempt' || eventName === 'quote_export' || eventName === 'send_quote' || eventName === 'export_share_action') {
    return CONVERSION_MOMENTS.quote_export;
  }

  if (eventName === 'pricing_view') {
    return CONVERSION_MOMENTS.pricing_revisit;
  }

  return null;
}
