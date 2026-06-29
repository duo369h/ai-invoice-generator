/**
 * Corvioz v1 — Entry Routing System
 *
 * Public API for user entry decision, metrics, and authority audit.
 */

export { resolveEntry } from './entry-resolver';
export { ENTRY_AUTHORITY, applyEntryRouteTransition } from './ENTRY_AUTHORITY';
export {
  ENTRY_STATES,
  getEntryState,
  isAuthenticatedUser,
  isGuestUser,
  isActivationRequired,
} from './ENTRY_STATE';
export {
  clearEntryRevenueContext,
  isEntryIntendedAction,
  isEntrySelectedPlan,
  readEntryRevenueContext,
  updateEntryRevenueContext,
  writeEntryRevenueContext,
} from './ENTRY_REVENUE_CONTEXT';
export type {
  EntryBillingState,
  EntryIntendedAction,
  EntryRevenueContext,
  EntrySelectedPlan,
} from './ENTRY_REVENUE_CONTEXT';
export { resolveRevenueEntry } from './ENTRY_REVENUE_RESOLVER';
export type {
  EntryRevenueDecision,
  EntryRevenueResolverInput,
  EntryRevenueRoute,
} from './ENTRY_REVENUE_RESOLVER';
export { reconcileEntryState } from './ENTRY_STATE_RECONCILER';
export type { EntryStateReconcilerOutput } from './ENTRY_STATE_RECONCILER';
export { applyPaymentEventToRevenueContext, canAccessFeature } from './ENTRY_PAYMENT_BRIDGE';
export type {
  EntryPaymentBridgeResult,
  EntryPaymentEvent,
  EntryPaymentEventType,
} from './ENTRY_PAYMENT_BRIDGE';
export { ENTRY_AUDIT } from './ENTRY_AUDIT';
export { logEntryDecision, getEntryMetrics, clearEntryMetrics } from './entry-metrics';
export type { EntryRoutingMetric } from './entry-metrics';
export { assertEntryOwnership } from './ENTRY_GOVERNANCE';
export { ENTRY_SYSTEM_CONTRACT } from './ENTRY_SYSTEM_CONTRACT';
export { assertLayerIntegrity } from './ENTRY_LAYER_GUARD';
export { logEntryViolation } from './ENTRY_AUDIT_LOG';
export { ENTRY_SYSTEM_FROZEN, ENTRY_VERSION } from './ENTRY_FREEZE_FLAG';
export { ENTRY_SYSTEM_BOUNDARY_MAP } from './ENTRY_SYSTEM_BOUNDARY_MAP';
export { enforceBoundary } from './ENTRY_OUTCOME_BARRIER';
export { OUTCOME_EVOLUTION_LOCK } from './OUTCOME_EVOLUTION_LOCK';
export * from './outcome';
