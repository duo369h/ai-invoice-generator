/**
 * Corvioz — Entry Revenue Resolver [DEPRECATED - WRAPPER ONLY]
 *
 * All decision logic has been migrated to CORVIOZ_DECISION_KERNEL.
 */

import { getCorviozDecision } from '../kernel/CORVIOZ_DECISION_KERNEL.ts';

export type EntryRevenueRoute = '/dashboard' | '/invoice' | '/quote' | '/profile' | '/dashboard/activation' | '/quotes/create';

export type EntryRevenueResolverInput = {
  entry_state: 'GUEST' | 'AUTHENTICATED' | 'ACTIVATION_REQUIRED';
  revenue_context?: any;
};

export type EntryRevenueDecision = {
  route: EntryRevenueRoute;
  billing_state: string;
  reason: string;
};

export function resolveRevenueEntry(input: EntryRevenueResolverInput): EntryRevenueDecision {
  const decision = getCorviozDecision(input?.revenue_context || input);
  
  return {
    route: decision.route,
    billing_state: decision.paywallAllowed ? 'free' : 'locked',
    reason: decision.reason,
  };
}
