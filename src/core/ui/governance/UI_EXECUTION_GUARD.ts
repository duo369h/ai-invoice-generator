/**
 * Corvioz — UI Execution Guard (v6.9.0 Final Pre-Render Gate)
 *
 * Final pre-render authority gate.
 * Output structure conforms to the unified Governance format:
 * { decision: "ALLOW | BLOCK | REWRITE", reason: string, overrides?: any }
 *
 * Capabilities:
 * - Rewrite intent
 * - Block mutation
 * - Override feedback
 */

import type { UIRevenueSignal } from "../runtime/UI_RUNTIME_DECISION_ENGINE.ts";
import type { UIStabilityInfo } from "../runtime/UI_STABILITY_ENGINE.ts";
import { authorizeLocalMutation } from "./UI_LOCAL_MUTATION_AUTHORITY.ts";

export interface GovernanceDecision {
  decision: "ALLOW" | "BLOCK" | "REWRITE";
  reason: string;
  overrides?: any;
}

export interface LayoutConfiguration {
  resolvedSectionTypes: string[];
  priorityAdjustments: Record<string, number>;
  visibilityOverrides: Record<string, boolean>;
  ctaOverrides: Record<string, any>;
  emphasisOverrides: Record<string, number>;
}

const INTENT_SECTION_MAPPING: Record<string, string[]> = {
  INCREASE_REVENUE_VISIBILITY: ["FOCUS", "SYSTEM", "IMPACT"],
  REDUCE_CONVERSION_FRICTION: ["FOCUS", "DEMO"],
  PROMOTE_INVOICE_FLOW: ["INVOICES", "ACTIONS", "FLOW"],
  HIGHLIGHT_LEAD_OPPORTUNITY: ["LEADS", "ONBOARDING"],
  MAINTAIN_STABILITY: ["HEADER", "ACTIVITY"],
};

export function enforceExecution(
  intents: any[],
  mutations: any[],
  feedbackSignals: any,
  signal: UIRevenueSignal,
  stability: UIStabilityInfo
): GovernanceDecision {
  let decision: "ALLOW" | "BLOCK" | "REWRITE" = "ALLOW";
  let reason = "Execution guard pre-render validation passed";

  // 1️⃣ Override/Sanitize Feedback
  let sanitizedFeedback = feedbackSignals;
  if (feedbackSignals?.modifiesIntent || feedbackSignals?.modifiesMutation) {
    sanitizedFeedback = null; // Override / drop feedback attempts to modify layouts
  }

  // 2️⃣ Rewrite Intents dynamically based on signal/business priorities
  let activeIntents = [...intents];
  if (signal.churnRisk === "HIGH") {
    decision = "REWRITE";
    reason = "High churn risk detected, rewriting intents to prioritize PROMOTE_INVOICE_FLOW";
    // Ensure PROMOTE_INVOICE_FLOW is present and at the top
    const invoiceIntent = { intent: "PROMOTE_INVOICE_FLOW", weight: 1.0 };
    activeIntents = [invoiceIntent, ...activeIntents.filter(i => i.intent !== "PROMOTE_INVOICE_FLOW")];
  }

  const resolvedSectionTypes: string[] = ["HEADER"];
  const priorityAdjustments: Record<string, number> = {};
  const visibilityOverrides: Record<string, boolean> = {};
  const ctaOverrides: Record<string, any> = {};
  const emphasisOverrides: Record<string, number> = {};

  // Resolve rewritten intents to sections
  for (const info of activeIntents) {
    const types = INTENT_SECTION_MAPPING[info.intent] || [];
    for (const t of types) {
      if (!resolvedSectionTypes.includes(t)) {
        resolvedSectionTypes.push(t);
      }
    }
  }

  // Apply rewritten intent-based priorities
  for (const info of activeIntents) {
    const types = INTENT_SECTION_MAPPING[info.intent] || [];
    const index = activeIntents.indexOf(info);
    for (const type of types) {
      const current = priorityAdjustments[type] || 0;
      const boost = (activeIntents.length - index) * 8;
      priorityAdjustments[type] = Math.max(current, boost);
    }
  }

  // 3️⃣ Bounded Local Mutations Check
  const isConstrained = stability.stabilityScore < 0.6;
  if (isConstrained) {
    decision = "REWRITE";
    reason = "LOW stability score: constrained mutation adjustments enforced";
  }

  // Process allowed mutations via Local Mutation Authority
  for (const proposal of mutations) {
    let localProps = {
      priority: proposal.metric === "revenue_visibility_boost" ? 20 : 0,
      visibility: proposal.metric === "low_engagement_collapse" ? false : undefined,
      emphasis: 2,
    };

    // Apply low stability constraints on priority boosts
    if (isConstrained && localProps.priority > 0) {
      localProps.priority = Math.min(10, localProps.priority); // Constrain priority boost
    }

    const auth = authorizeLocalMutation(proposal.metric, localProps);

    if (auth.allowedAdjustments.priority !== undefined) {
      if (proposal.metric === "revenue_visibility_boost") {
        priorityAdjustments["FOCUS"] = (priorityAdjustments["FOCUS"] || 0) + auth.allowedAdjustments.priority;
      }
    }
    if (auth.allowedAdjustments.visibility !== undefined) {
      if (proposal.metric === "low_engagement_collapse") {
        visibilityOverrides["ACTIVITY"] = auth.allowedAdjustments.visibility;
      }
    }
    if (auth.allowedAdjustments.emphasis !== undefined) {
      emphasisOverrides["FOCUS"] = auth.allowedAdjustments.emphasis;
    }
  }

  // Hard execution boundary: enforce that HEADER is always visible and cannot be hidden
  visibilityOverrides["HEADER"] = true;
  priorityAdjustments["HEADER"] = 100;

  return {
    decision,
    reason,
    overrides: {
      layout: {
        resolvedSectionTypes,
        priorityAdjustments,
        visibilityOverrides,
        ctaOverrides,
        emphasisOverrides,
      },
    },
  };
}
