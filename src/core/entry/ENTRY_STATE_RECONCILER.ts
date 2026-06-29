/**
 * Corvioz v1.5 — Entry State Reconciler
 *
 * Pure normalization layer between raw entry context and revenue resolution.
 * No storage, API calls, Supabase, Paddle, pricing, or side effects.
 */

import { ENTRY_STATES } from './ENTRY_STATE';
import type {
  EntryBillingState,
  EntryIntendedAction,
  EntryRevenueContext,
  EntrySelectedPlan,
} from './ENTRY_REVENUE_CONTEXT';

type EntryState = (typeof ENTRY_STATES)[keyof typeof ENTRY_STATES];

type EntryStateReconcilerContext = Partial<EntryRevenueContext> & {
  current_route?: string | null;
  protected_route?: boolean | null;
};

export type EntryStateReconcilerOutput = {
  normalizedState: EntryState;
  normalizedRevenueContext: EntryRevenueContext;
};

const EMPTY_REVENUE_CONTEXT: EntryRevenueContext = {
  selected_plan: null,
  intended_action: null,
  billing_state: 'free',
};

function normalizeState(state: unknown): EntryState {
  if (state === ENTRY_STATES.AUTHENTICATED) return ENTRY_STATES.AUTHENTICATED;
  if (state === ENTRY_STATES.ACTIVATION_REQUIRED) return ENTRY_STATES.ACTIVATION_REQUIRED;
  return ENTRY_STATES.GUEST;
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
  if (state === 'paid' || state === 'paywall_pending') return state;
  return 'free';
}

function inferActionFromRoute(route: unknown): EntryIntendedAction {
  if (!route || typeof route !== 'string') return null;
  try {
    const url = new URL(route, 'https://corvioz.local');
    const tool = url.searchParams.get('tool');
    if (tool === 'invoice') return 'invoice';
    if (tool === 'quote' || tool === 'proposal') return 'quote';
    if (tool === 'profile' || tool === 'client') return 'profile';
  } catch (_) {
    // Fall back to legacy route matching.
  }
  if (route.includes('/invoices') || route.includes('create-invoice')) return 'invoice';
  if (route.includes('/quotes') || route.includes('create-quote')) return 'quote';
  if (route.includes('/profile') || route.includes('create-profile')) return 'profile';
  return null;
}

function isNeutralEntryRoute(route: unknown): boolean {
  if (!route || typeof route !== 'string') return true;
  return route.startsWith('/dashboard') || route.startsWith('/signup') || route.startsWith('/auth');
}

function isProtectedEntryRoute(context: EntryStateReconcilerContext): boolean {
  if (typeof context.protected_route === 'boolean') return context.protected_route;

  const route = context.current_route;
  if (!route || typeof route !== 'string') return false;

  return (
    route.startsWith('/dashboard') ||
    route.startsWith('/invoices') ||
    route.startsWith('/quotes') ||
    route === '/invoice' ||
    route.startsWith('/proposal') ||
    route.startsWith('/client') ||
    route.startsWith('/profile')
  );
}

export function reconcileEntryState(
  state: unknown,
  revenueContext: EntryStateReconcilerContext = {},
): EntryStateReconcilerOutput {
  const normalizedState = normalizeState(state);

  if (normalizedState === ENTRY_STATES.GUEST) {
    return {
      normalizedState,
      normalizedRevenueContext: { ...EMPTY_REVENUE_CONTEXT },
    };
  }

  const routeAction = inferActionFromRoute(revenueContext.current_route);
  const protectedRoute = isProtectedEntryRoute(revenueContext);
  const selectedPlan = normalizeSelectedPlan(revenueContext.selected_plan);
  const currentAction = normalizeIntendedAction(revenueContext.intended_action);

  let intendedAction = currentAction;
  if (routeAction) {
    intendedAction = routeAction;
  } else if (currentAction && !isNeutralEntryRoute(revenueContext.current_route)) {
    intendedAction = null;
  }

  let billingState = normalizeBillingState(revenueContext.billing_state);
  if (selectedPlan && billingState === 'free' && protectedRoute) {
    billingState = 'paywall_pending';
  }

  return {
    normalizedState,
    normalizedRevenueContext: {
      selected_plan: selectedPlan,
      intended_action: intendedAction,
      billing_state: billingState,
    },
  };
}
