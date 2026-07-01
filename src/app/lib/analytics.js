/*
CORVIOZ SYSTEM LOCK v2.6
Analytics = transport only (network transport adapter only)
NO CROSS-LAYER LOGIC ALLOWED
NO BUSINESS INFERENCE IN RUNTIME
// V3_REVENUE_EXECUTION_LAYER_READY
// V3_MONETIZATION_CONTROLLER_READY
// V3_FEATURE_GATE_LAYER_READY
// V3_REVENUE_DECISION_STABILIZATION_LAYER_READY
// V3_CONTEXT_ENGINE_READY
// V3_CONFLICT_RESOLVER_READY
*/

import { sendEvent as canonicalSendEvent } from '../../core/analytics/eventRouter';

export const ANALYTICS_BUILD_VERSION = 'analytics_contract_v3_2026_06_26_deprecated';

/**
 * @deprecated Use eventRouter.sendEvent() instead.
 * Routed to canonical eventRouter for Single Source of Truth.
 */
export function sendEvent(name, props) {
  canonicalSendEvent(name, props);
}

export const trackEvent = sendEvent;
