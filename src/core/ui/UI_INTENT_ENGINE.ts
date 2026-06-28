/**
 * Corvioz — UI Intent Engine (v6.8 Governor Enforcement Edition)
 *
 * Translates raw signals and feedback loop adjustments into high-level UI intents.
 */

import type { UIRevenueSignal } from "./runtime/UI_RUNTIME_DECISION_ENGINE.ts";
import { preflightCheck } from "./governance/UI_GOVERNOR_ENFORCER.ts";

export type UIIntent =
  | "INCREASE_REVENUE_VISIBILITY"
  | "REDUCE_CONVERSION_FRICTION"
  | "PROMOTE_INVOICE_FLOW"
  | "HIGHLIGHT_LEAD_OPPORTUNITY"
  | "MAINTAIN_STABILITY";

export interface FeedbackAdjustment {
  boostIntent?: "INVOICE_FLOW" | "LEAD_OPPORTUNITY" | "REVENUE_VISIBILITY" | string;
  suppressIntent?: "ACTIVITY_FEED" | string;
}

export type UIIntentInfo = {
  intent: UIIntent;
  intentConfidence: number;
  intentSource: "signal" | "governor" | "feedback";
  governorApproval: boolean;
};

export function getUIIntents(signal: UIRevenueSignal, adjustment?: FeedbackAdjustment): UIIntentInfo[] {
  const candidateIntents: { intent: UIIntent; source: UIIntentInfo["intentSource"] }[] = [
    { intent: "MAINTAIN_STABILITY", source: "signal" },
  ];

  if (signal.revenueProbability > 0.8) {
    candidateIntents.push({ intent: "INCREASE_REVENUE_VISIBILITY", source: "signal" });
  }
  if (signal.conversionDrop) {
    candidateIntents.push({ intent: "REDUCE_CONVERSION_FRICTION", source: "signal" });
  }
  if (signal.churnRisk === "HIGH" || signal.churnRisk === "MEDIUM") {
    candidateIntents.push({ intent: "PROMOTE_INVOICE_FLOW", source: "signal" });
  }
  if (signal.engagementDecay) {
    candidateIntents.push({ intent: "HIGHLIGHT_LEAD_OPPORTUNITY", source: "signal" });
  }

  // Adjustments from feedback loop (suggested intent shifts)
  if (adjustment) {
    if (adjustment.boostIntent === "INVOICE_FLOW") {
      candidateIntents.push({ intent: "PROMOTE_INVOICE_FLOW", source: "feedback" });
    }
    if (adjustment.boostIntent === "REVENUE_VISIBILITY") {
      candidateIntents.push({ intent: "INCREASE_REVENUE_VISIBILITY", source: "feedback" });
    }
  }

  const resolvedIntents: UIIntentInfo[] = [];

  for (const item of candidateIntents) {
    const check = preflightCheck({ intent: item.intent, signal });
    if (check.allowed) {
      // Avoid duplicates, keep first source
      if (!resolvedIntents.some(r => r.intent === item.intent)) {
        resolvedIntents.push({
          intent: item.intent,
          intentConfidence: item.source === "feedback" ? 0.7 : 0.9,
          intentSource: item.source,
          governorApproval: true,
        });
      }
    } else {
      resolvedIntents.push({
        intent: item.intent,
        intentConfidence: 1.0,
        intentSource: "governor",
        governorApproval: false,
      });
    }
  }

  return resolvedIntents;
}
