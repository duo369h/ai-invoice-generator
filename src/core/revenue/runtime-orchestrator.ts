/**
 * RDCL v3.2.2 — Runtime Orchestrator
 *
 * Wires together the passive helper layer and routes the decision
 * exclusively through decisionGateway (RDCL). No action is produced here.
 *
 * Flow: Event → Context → Helper Signals → decisionGateway(RDCL) → UI label
 */

import { getRevenueReaction } from './reaction-engine';
import { getPricingSensitivity } from './pricing-sensitivity';
import { translateRDCLOutput } from './action-engine';
import { buildRevenueContext, RevenueContext } from './context-engine';
import { resolveDecision, DecisionResult } from './decision-engine';
import { decisionGateway } from './decision-gateway';

export function beforeActionResolve(context: RevenueContext) {
  console.debug('[V3.2.2 beforeActionResolve]', context.user_tier, context.usage_level);
}

export function afterDecisionResolved(result: DecisionResult) {
  console.debug('[V3.2.2 afterDecisionResolved]', result.primaryAction, result.uiOverrideLevel);
}

export function orchestrateRevenue(eventType: string, userEvents: any[]) {
  const context = buildRevenueContext(userEvents);

  beforeActionResolve(context);

  // Collect passive signals from helper modules (these are data-only)
  const reactionObj    = getRevenueReaction(eventType);
  const sensitivityObj = getPricingSensitivity(userEvents);

  // Route decision exclusively through decisionGateway → RDCL
  // decisionGateway enforces caller guard internally
  const rawAction = decisionGateway(eventType as any, context);

  // decision-engine provides uiOverrideLevel and structured result
  const decision = resolveDecision(reactionObj.signal, context);

  afterDecisionResolved(decision);

  // Translate RDCL output token to UI label (read-only, no new decision)
  const uiLabel = translateRDCLOutput(rawAction);

  return {
    reaction:    reactionObj,
    sensitivity: sensitivityObj,
    rawAction,
    uiLabel,
    decision,
  };
}

