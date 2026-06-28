/**
 * Corvioz v1.5 — Entry Revenue Context
 *
 * Pure client-side container for revenue intent captured before auth completes.
 * This file must not contain pricing, payment, feature-gating, or API logic.
 */

export type EntrySelectedPlan = 'starter' | 'growth' | 'studio' | null;
export type EntryIntendedAction = 'invoice' | 'quote' | 'profile' | null;
export type EntryBillingState = 'free' | 'paywall_pending' | 'paid';

export type EntryRevenueContext = {
  selected_plan: EntrySelectedPlan;
  intended_action: EntryIntendedAction;
  billing_state: EntryBillingState;
};

const ENTRY_REVENUE_CONTEXT_KEY = 'corvioz_entry_revenue_context';

const EMPTY_ENTRY_REVENUE_CONTEXT: EntryRevenueContext = {
  selected_plan: null,
  intended_action: null,
  billing_state: 'free',
};

function canUseSessionStorage() {
  return typeof window !== 'undefined' && Boolean(window.sessionStorage);
}

function normalizeSelectedPlan(plan: unknown): EntrySelectedPlan {
  if (plan === 'starter' || plan === 'growth' || plan === 'studio') return plan;
  return null;
}

function normalizeIntendedAction(action: unknown): EntryIntendedAction {
  if (action === 'invoice' || action === 'quote' || action === 'profile') return action;
  return null;
}

function normalizeBillingState(state: unknown): EntryBillingState {
  if (state === 'paywall_pending' || state === 'paid') return state;
  return 'free';
}

function normalizeEntryRevenueContext(input: Partial<EntryRevenueContext> = {}): EntryRevenueContext {
  return {
    selected_plan: normalizeSelectedPlan(input.selected_plan),
    intended_action: normalizeIntendedAction(input.intended_action),
    billing_state: normalizeBillingState(input.billing_state),
  };
}

export function readEntryRevenueContext(): EntryRevenueContext {
  if (!canUseSessionStorage()) return { ...EMPTY_ENTRY_REVENUE_CONTEXT };

  try {
    const parsed = JSON.parse(window.sessionStorage.getItem(ENTRY_REVENUE_CONTEXT_KEY) || '{}');
    return normalizeEntryRevenueContext(parsed);
  } catch (_) {
    return { ...EMPTY_ENTRY_REVENUE_CONTEXT };
  }
}

export function writeEntryRevenueContext(context: Partial<EntryRevenueContext>) {
  if (!canUseSessionStorage()) return { ...EMPTY_ENTRY_REVENUE_CONTEXT };

  const nextContext = normalizeEntryRevenueContext(context);
  window.sessionStorage.setItem(ENTRY_REVENUE_CONTEXT_KEY, JSON.stringify(nextContext));
  return nextContext;
}

export function updateEntryRevenueContext(context: Partial<EntryRevenueContext>) {
  const currentContext = readEntryRevenueContext();
  return writeEntryRevenueContext({
    ...currentContext,
    ...context,
  });
}

export function clearEntryRevenueContext() {
  if (!canUseSessionStorage()) return;
  window.sessionStorage.removeItem(ENTRY_REVENUE_CONTEXT_KEY);
}

export function isEntrySelectedPlan(value: unknown): value is Exclude<EntrySelectedPlan, null> {
  return normalizeSelectedPlan(value) !== null;
}

export function isEntryIntendedAction(value: unknown): value is Exclude<EntryIntendedAction, null> {
  return normalizeIntendedAction(value) !== null;
}
