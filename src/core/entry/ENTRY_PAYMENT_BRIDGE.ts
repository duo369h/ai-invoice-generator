/**
 * Corvioz Sprint 2 — Entry Payment Bridge
 *
 * Maps payment lifecycle events onto ENTRY_REVENUE_CONTEXT shape.
 * No pricing, UI, routing, API, Paddle, Supabase, or persistence logic.
 */

import type { EntryBillingState, EntryRevenueContext } from './ENTRY_REVENUE_CONTEXT';

export type EntryPaymentEventType =
  | 'payment_succeeded'
  | 'payment_failed'
  | 'subscription_started'
  | 'subscription_canceled';

export type EntryPaymentEvent = EntryPaymentEventType | {
  type?: unknown;
  event_type?: unknown;
  event?: unknown;
};

export type EntryPaymentBridgeResult = {
  processed: boolean;
  event_type: EntryPaymentEventType | null;
  revenue_context: EntryRevenueContext;
  reason: string;
};

const EMPTY_REVENUE_CONTEXT: EntryRevenueContext = {
  selected_plan: null,
  intended_action: null,
  billing_state: 'free',
};

const PAYMENT_EVENT_BILLING_STATE: Record<EntryPaymentEventType, EntryBillingState> = {
  payment_succeeded: 'paid',
  subscription_started: 'paid',
  payment_failed: 'free',
  subscription_canceled: 'free',
};

function normalizePaymentEventType(event: EntryPaymentEvent): EntryPaymentEventType | null {
  const value = typeof event === 'string'
    ? event
    : event?.type || event?.event_type || event?.event;

  if (
    value === 'payment_succeeded' ||
    value === 'payment_failed' ||
    value === 'subscription_started' ||
    value === 'subscription_canceled'
  ) {
    return value;
  }

  return null;
}

function normalizeBillingState(state: unknown): EntryBillingState {
  if (state === 'paid' || state === 'paywall_pending') return state;
  return 'free';
}

function normalizeRevenueContext(context: Partial<EntryRevenueContext> = {}): EntryRevenueContext {
  return {
    selected_plan:
      context.selected_plan === 'starter' || context.selected_plan === 'growth' || context.selected_plan === 'studio'
        ? context.selected_plan
        : null,
    intended_action:
      context.intended_action === 'invoice' || context.intended_action === 'quote' || context.intended_action === 'profile'
        ? context.intended_action
        : null,
    billing_state: normalizeBillingState(context.billing_state),
  };
}

export function applyPaymentEventToRevenueContext(
  event: EntryPaymentEvent,
  context: Partial<EntryRevenueContext> = EMPTY_REVENUE_CONTEXT,
): EntryPaymentBridgeResult {
  const eventType = normalizePaymentEventType(event);
  const revenueContext = normalizeRevenueContext(context);

  if (!eventType) {
    return {
      processed: false,
      event_type: null,
      revenue_context: revenueContext,
      reason: 'unsupported_payment_event',
    };
  }

  return {
    processed: true,
    event_type: eventType,
    revenue_context: {
      ...revenueContext,
      billing_state: PAYMENT_EVENT_BILLING_STATE[eventType],
    },
    reason: `payment_event:${eventType}`,
  };
}

export function canAccessFeature(userState: EntryRevenueContext | EntryBillingState | null | undefined): boolean {
  const billingState = typeof userState === 'string' ? userState : userState?.billing_state;
  return billingState === 'paid';
}
