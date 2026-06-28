'use client';

import { getIntentScore, type IntentScoreResult } from './intent-score';

export type PaywallActionType = 'none' | 'show_upgrade_modal' | 'lock_export_send' | 'show_pricing_modal';

export type PaywallContext = {
  userPlan?: string | null;
  invoiceCreateStarts?: number;
  quoteCreateStarts?: number;
  action?: 'invoice_create_start' | 'quote_create_start' | 'export_invoice' | 'send_quote' | 'export_share' | string;
  intent?: IntentScoreResult;
};

export type PaywallDecision = {
  should_paywall: boolean;
  action: PaywallActionType;
  reason: string;
  target_plan: 'pro';
  intent_score: number;
  stage: IntentScoreResult['stage'];
};

function isPaidPlan(userPlan?: string | null) {
  return ['pro', 'professional', 'agency'].includes(String(userPlan || 'free').toLowerCase());
}

function decision(context: PaywallContext, shouldPaywall: boolean, action: PaywallActionType, reason: string): PaywallDecision {
  const intent = context.intent || getIntentScore();
  return {
    should_paywall: shouldPaywall,
    action,
    reason,
    target_plan: 'pro',
    intent_score: intent.intent_score,
    stage: intent.stage,
  };
}

export function evaluateRevenuePaywall(context: PaywallContext): PaywallDecision {
  if (isPaidPlan(context.userPlan)) {
    return decision(context, false, 'none', 'paid_plan_active');
  }

  if ((context.invoiceCreateStarts || 0) >= 2) {
    return decision(context, true, 'show_upgrade_modal', 'invoice_create_start_threshold');
  }

  if ((context.quoteCreateStarts || 0) >= 2) {
    return decision(context, true, 'lock_export_send', 'quote_create_start_threshold');
  }

  if (context.action === 'export_invoice' || context.action === 'send_quote' || context.action === 'export_share') {
    return decision(context, true, 'lock_export_send', 'export_or_send_requires_paywall_check');
  }

  const intent = context.intent || getIntentScore();
  if (intent.intent_score > 60) {
    return decision({ ...context, intent }, true, 'show_pricing_modal', 'high_intent_unpaid_user');
  }

  return decision({ ...context, intent }, false, 'none', 'no_paywall_rule_matched');
}

export function incrementPaywallCounter(counterName: 'invoice_create_start' | 'quote_create_start') {
  if (typeof window === 'undefined') return 0;
  const key = `corvioz_revenue_counter_${counterName}`;
  const nextValue = Number(window.sessionStorage.getItem(key) || 0) + 1;
  window.sessionStorage.setItem(key, String(nextValue));
  return nextValue;
}

export function getPaywallCounters() {
  if (typeof window === 'undefined') {
    return { invoiceCreateStarts: 0, quoteCreateStarts: 0 };
  }

  return {
    invoiceCreateStarts: Number(window.sessionStorage.getItem('corvioz_revenue_counter_invoice_create_start') || 0),
    quoteCreateStarts: Number(window.sessionStorage.getItem('corvioz_revenue_counter_quote_create_start') || 0),
  };
}
