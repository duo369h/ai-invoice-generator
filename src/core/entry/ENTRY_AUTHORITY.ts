/**
 * Corvioz v1.5 — Entry State Machine Authority [DEPRECATED - WRAPPER ONLY]
 *
 * All decision logic has been migrated to CORVIOZ_DECISION_KERNEL.
 */

import { getCorviozDecision } from '../kernel/CORVIOZ_DECISION_KERNEL.ts';

export function ENTRY_AUTHORITY(input: any = {}) {
  const decision = getCorviozDecision(input);
  const currentPath = typeof input?.pathname === "string" ? input.pathname : "";
  const shouldRedirect = Boolean(decision.route && currentPath && decision.route !== currentPath);

  return {
    route: decision.route,
    state: decision.entryMode,
    shouldRedirect,
    source: "ENTRY_AUTHORITY"
  };
}

export function applyEntryRouteTransition(router: any, input: any = {}, options: any = {}) {
  const decision = ENTRY_AUTHORITY(input);
  if (options.onlyIfRedirect && !decision.shouldRedirect) return decision;
  const method = options.method === 'push' ? 'push' : 'replace';
  router?.[method]?.(decision.route);
  return decision;
}
