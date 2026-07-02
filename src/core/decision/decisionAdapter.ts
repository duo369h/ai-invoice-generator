/**
 * Corvioz v5.1 Decision Read Adapter
 *
 * Compatibility layer only. This file provides a single read entry point
 * while delegating to existing engines. It does not replace, delete, or
 * collapse any engine.
 */

import { getCTA, resolveAppState, type AppState } from "../../../lib/execution/globalOrchestrator";
import { getUnifiedDecision } from "../../../lib/execution/unifiedDecisionEngine";
import { translateDecision } from "../../../lib/execution/uiTranslator";
import { evaluateRevenueDecision } from "../../app/lib/revenue/revenue-decision-engine";
import { getAuthorityOwner } from "../authority/AUTHORITY_MAP";
import { getPricingViewModel, type PricingViewModelInput } from "../pricing/pricingViewModel";
import { resolvePlanState, type PlanState, type PlanStateInput } from "../state/planStateAdapter";
import { recordDecisionTelemetry } from "../telemetry/decisionTelemetry";

export type DecisionAdapterInput = {
  userId?: string | null;
  planState?: PlanStateInput;
  pricing?: PricingViewModelInput;
  revenue?: Parameters<typeof evaluateRevenueDecision>[0];
  cta?: {
    state?: AppState;
    context?: Parameters<typeof getCTA>[1];
  };
};

export type DecisionAdapterResult = Readonly<{
  adapterVersion: "v5.1-decision-read-adapter";
  planState: PlanState;
  pricingDecision: unknown;
  revenueDecision: ReturnType<typeof evaluateRevenueDecision>;
  upgradeRecommendation: unknown;
  ctaRecommendation: string;
  delegatedEngines: readonly string[];
  authorityReferences: readonly string[];
  behaviorChange: false;
}>;

function defaultRevenueInput(plan: string): Parameters<typeof evaluateRevenueDecision>[0] {
  return {
    action_type: "adapter_read",
    funnel_step: "adapter_read",
    user_state: plan,
    intent_score: 0,
    session_state: {},
    usage_count: {},
  };
}

function defaultPricingInput(plan: string): PricingViewModelInput {
  return {
    plans: [],
    session: null,
    userPlan: plan,
    isAuthenticated: plan !== "free",
    subLoading: false,
    billingPeriod: 'monthly',
  };
}


export function readDecisionState(input: DecisionAdapterInput = {}): DecisionAdapterResult {
  const planState = resolvePlanState({
    ...input.planState,
    userId: input.userId ?? input.planState?.userId,
  });
  const userId = input.userId ?? planState.userId ?? null;

  const unifiedDecision = getUnifiedDecision(userId);
  const translatedDecision = translateDecision(unifiedDecision);
  const pricingDecision = getPricingViewModel(input.pricing ?? defaultPricingInput(planState.plan));
  const revenueDecision = evaluateRevenueDecision(input.revenue ?? defaultRevenueInput(planState.plan));
  const ctaState = input.cta?.state ?? resolveAppState({ activePlan: planState.plan });
  const ctaContext = input.cta?.context ?? "dashboard_primary";
  const ctaRecommendation = getCTA(ctaState, ctaContext);

  return {
    adapterVersion: "v5.1-decision-read-adapter",
    planState,
    pricingDecision,
    revenueDecision,
    upgradeRecommendation: {
      unifiedDecision,
      translatedDecision,
      recommendedPlan: unifiedDecision.recommendedPlan,
      highlightPlan: translatedDecision.highlightPlan,
      banner: translatedDecision.banner,
      modal: translatedDecision.modal,
    },
    ctaRecommendation,
    delegatedEngines: [
      "lib/execution/unifiedDecisionEngine.ts",
      "lib/execution/uiTranslator.ts",
      "src/core/pricing/pricingViewModel.ts",
      "src/app/lib/revenue/revenue-decision-engine.ts",
      "lib/execution/globalOrchestrator.ts",
      "src/core/state/planStateAdapter.ts",
    ],
    authorityReferences: [
      getAuthorityOwner("user_plan").canonicalPath,
      getAuthorityOwner("pricing").canonicalPath,
      getAuthorityOwner("revenue_decision").canonicalPath,
      getAuthorityOwner("cta_resolution").canonicalPath,
    ],
    behaviorChange: false,
  };
}

function stableStringify(value: unknown): string {
  try {
    return JSON.stringify(value, Object.keys(value as Record<string, unknown> || {}).sort());
  } catch (_) {
    return String(value);
  }
}

export function shadowReadDecisionState(
  label: string,
  legacySnapshot: unknown,
  input: DecisionAdapterInput = {},
  legacySource = "legacy",
  logger: Pick<Console, "info"> | null = console,
) {
  const adapterSnapshot = readDecisionState(input);
  const identical = stableStringify(legacySnapshot) === stableStringify(adapterSnapshot);
  const result = {
    label,
    legacySource,
    legacySnapshot,
    adapterSnapshot,
    identical,
    mismatchReason: identical ? null : "legacy snapshot and adapter snapshot differ; legacy result remains authoritative in v5.2",
    behaviorChange: false,
  };

  recordDecisionTelemetry({
    source: legacySource,
    decisionType: label,
    legacyOutput: legacySnapshot,
    adapterOutput: adapterSnapshot,
    tags: ["v5.2.1", "decision_adapter_shadow", "LOG_ONLY"],
  });

  if (logger && typeof logger.info === "function") {
    logger.info("[decision-adapter-shadow]", result);
  }

  return result;
}
