/**
 * Corvioz — UI Governor Enforcer (v6.9.0 Bounded Growth Edition)
 *
 * SINGLE governance layer. Validates and annotates inputs before execution.
 * ❌ Prohibited from executing layout decisions.
 * ✔ Outputs a unified GovernanceDecision with ALLOW, ALLOW_WITH_CONSTRAINTS, or BLOCK.
 */

import type { UIRevenueSignal } from "../runtime/UI_RUNTIME_DECISION_ENGINE.ts";
import type { UIStabilityInfo } from "../runtime/UI_STABILITY_ENGINE.ts";

export type GovernanceAction = "ALLOW" | "ALLOW_WITH_CONSTRAINTS" | "BLOCK";

export interface GovernorDecision {
  decision: GovernanceAction;
  reason: string;
  overrides?: any;
}

export interface GovernanceContext {
  intents: any[];
  mutations: any[];
  signal: UIRevenueSignal;
  stability: UIStabilityInfo;
}

/**
 * Internal preflight check — returns whether the given input should be allowed.
 */
export function preflightCheck(input: any = {}): { allowed: boolean; constrained?: boolean } {
  if (input?.blocked === true) return { allowed: false };
  
  // Under v6.9.0 growth rebalance, low stability score does not block mutations entirely; it constrains them.
  if (input?.stability?.stabilityScore !== undefined && input.stability.stabilityScore < 0.6) {
    return { allowed: true, constrained: true };
  }
  
  if (input?.targetSection === "HEADER" || input?.targetSection === "SAFE_MODE") {
    return { allowed: false };
  }
  return { allowed: true };
}

/**
 * Validates a single intent.
 */
export function allowIntent(intent: any, context: any = {}): GovernorDecision {
  const preflight = preflightCheck({ intent, ...context });
  if (!preflight.allowed) {
    return { decision: "BLOCK", reason: "Governor preflight blocked intent" };
  }
  if (!intent) {
    return { decision: "BLOCK", reason: "Intent is missing" };
  }
  const signal = context?.signal;
  if (signal?.churnRisk === "HIGH" && intent === "PROMOTE_INVOICE_FLOW") {
    return { decision: "ALLOW", reason: "High churn risk allows invoice-flow intent" };
  }
  return { decision: "ALLOW", reason: "Intent passed governor" };
}

/**
 * Validates a single mutation proposal.
 */
export function allowMutation(mutation: any, context: any = {}): GovernorDecision {
  const preflight = preflightCheck({ ...mutation, ...context });
  if (!preflight.allowed) {
    return { decision: "BLOCK", reason: "Governor preflight blocked mutation" };
  }

  // If stability is low, return ALLOW_WITH_CONSTRAINTS instead of BLOCK
  if (preflight.constrained) {
    return {
      decision: "ALLOW_WITH_CONSTRAINTS",
      reason: "Low stability score constrains UI mutation priority boosts",
    };
  }

  return { decision: "ALLOW", reason: "Mutation passed governor" };
}

/**
 * Validates a feedback event.
 */
export function allowFeedback(event: any): GovernorDecision {
  if (event?.modifiesIntent || event?.modifiesMutation || event?.modifiesUIGraph) {
    return { decision: "BLOCK", reason: "Feedback is log-only and cannot modify intent, mutation, or UI graph" };
  }
  return { decision: "ALLOW", reason: "Feedback passed governor" };
}

/**
 * runGovernance — unified single-pass governance.
 *
 * Consolidates allowIntent + allowMutation + allowFeedback into one call.
 * Returns the unified GovernanceDecision format.
 */
export function runGovernance(ctx: GovernanceContext): GovernorDecision {
  const validatedIntents: any[] = [];
  const validatedMutations: any[] = [];
  let containsConstraints = false;

  for (const info of ctx.intents) {
    const r = allowIntent(info.intent, { signal: ctx.signal });
    if (r.decision !== "BLOCK") {
      validatedIntents.push(info);
    }
  }

  for (const mutation of ctx.mutations) {
    const r = allowMutation(mutation, { signal: ctx.signal, stability: ctx.stability });
    if (r.decision === "ALLOW_WITH_CONSTRAINTS") {
      containsConstraints = true;
      // Constrained mutations are allowed but marked
      validatedMutations.push({ ...mutation, constrained: true });
    } else if (r.decision === "ALLOW") {
      validatedMutations.push(mutation);
    }
  }

  const overallDecision: GovernanceAction =
    validatedIntents.length === 0 && ctx.intents.length > 0
      ? "BLOCK"
      : containsConstraints
        ? "ALLOW_WITH_CONSTRAINTS"
        : "ALLOW";

  return {
    decision: overallDecision,
    reason: overallDecision === "BLOCK"
      ? "All intents blocked by governor"
      : overallDecision === "ALLOW_WITH_CONSTRAINTS"
        ? "Governance passed with bounded constraints"
        : "Governance preflight passed",
    overrides: {
      validatedIntents,
      validatedMutations,
      stability: ctx.stability,
    },
  };
}
