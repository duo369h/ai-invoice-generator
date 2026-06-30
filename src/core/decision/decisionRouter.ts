/**
 * Corvioz v5.3 Decision Router
 *
 * Canonical revenue brain:
 *   src/app/lib/revenue/control-plane/decision-engine.ts
 *
 * Non-canonical engines remain shadow-only. This router does not delete,
 * disable, or rewrite legacy engines.
 */

import { executeUpgradeStrategy } from "../../../lib/execution/executionEngine";
import { getUnifiedDecision } from "../../../lib/execution/unifiedDecisionEngine";
import {
  evaluateRevenueAction,
  type RevenueControlPlaneDecision,
  type RevenueControlPlaneInput,
} from "../../app/lib/revenue/control-plane/decision-engine";
import { evaluateRevenueDecision } from "../../app/lib/revenue/revenue-decision-engine";
import { recordDecisionTelemetry } from "../telemetry/decisionTelemetry";

export const CANONICAL_DECISION_ENGINE = "src/app/lib/revenue/control-plane/decision-engine.ts" as const;
export const CANONICAL_DECISION_ENGINE_EXPORT = "evaluateRevenueAction" as const;

export const SHADOW_DECISION_ENGINES = Object.freeze([
  "lib/execution/unifiedDecisionEngine.ts",
  "lib/execution/executionEngine.ts",
  "src/app/lib/revenue/revenue-decision-engine.ts",
  "src/core/pricing/pricingViewModel.ts",
  "lib/kernel/corviozKernel.ts",
] as const);

export type CanonicalRevenueDecisionInput = RevenueControlPlaneInput & {
  userId?: string | null;
};

export type ShadowDecisionSnapshot = Readonly<{
  engine: string;
  output: unknown;
  affectsRuntime: false;
}>;

export type CanonicalRevenueDecisionResult = Readonly<{
  canonicalEngine: typeof CANONICAL_DECISION_ENGINE;
  canonicalOutput: RevenueControlPlaneDecision;
  shadowOutputs: readonly ShadowDecisionSnapshot[];
  affectsRuntime: true;
}>;

function normalizeUserId(input: CanonicalRevenueDecisionInput): string | null {
  return String(input.user_id ?? input.userId ?? "").trim() || null;
}

function toAppRevenueInput(input: CanonicalRevenueDecisionInput) {
  return {
    action_type: String(input.event || ""),
    funnel_step: String(input.funnel_step || ""),
    intent_score: Number(input.intent_score ?? 0),
    user_state: String(input.user_plan ?? input.plan ?? input.user_state ?? "free"),
    usage_count: {
      invoice_create_count: Number(input.invoice_count ?? 0),
      quote_create_count: Number(input.quote_count ?? 0),
      export_pdf_count: Number(input.export_count ?? 0),
      pricing_view_count: Number(input.session_count ?? 0),
    },
    session_state: {
      pricing_view_count: Number(input.session_count ?? 0),
      export_attempt_count: Number(input.export_count ?? 0),
    },
  };
}

function captureShadowOutputs(input: CanonicalRevenueDecisionInput): ShadowDecisionSnapshot[] {
  const userId = normalizeUserId(input);
  const snapshots: ShadowDecisionSnapshot[] = [];

  try {
    snapshots.push({
      engine: "lib/execution/unifiedDecisionEngine.ts",
      output: getUnifiedDecision(userId),
      affectsRuntime: false,
    });
  } catch (error) {
    snapshots.push({
      engine: "lib/execution/unifiedDecisionEngine.ts",
      output: { error: String(error) },
      affectsRuntime: false,
    });
  }

  try {
    snapshots.push({
      engine: "lib/execution/executionEngine.ts",
      output: executeUpgradeStrategy(userId),
      affectsRuntime: false,
    });
  } catch (error) {
    snapshots.push({
      engine: "lib/execution/executionEngine.ts",
      output: { error: String(error) },
      affectsRuntime: false,
    });
  }

  try {
    snapshots.push({
      engine: "src/app/lib/revenue/revenue-decision-engine.ts",
      output: evaluateRevenueDecision(toAppRevenueInput(input)),
      affectsRuntime: false,
    });
  } catch (error) {
    snapshots.push({
      engine: "src/app/lib/revenue/revenue-decision-engine.ts",
      output: { error: String(error) },
      affectsRuntime: false,
    });
  }

  return snapshots;
}

export function getRevenueDecision(input: CanonicalRevenueDecisionInput = {}): CanonicalRevenueDecisionResult {
  const canonicalOutput = evaluateRevenueAction(input);
  const shadowOutputs = captureShadowOutputs(input);

  recordDecisionTelemetry({
    source: "src/core/decision/decisionRouter.ts:getRevenueDecision",
    decisionType: "canonical revenue decision",
    legacyOutput: shadowOutputs,
    adapterOutput: canonicalOutput,
    tags: ["CANONICAL_DECISION_ENGINE", "SHADOW_DECISION_ENGINE", "v5.3"],
  });

  return {
    canonicalEngine: CANONICAL_DECISION_ENGINE,
    canonicalOutput,
    shadowOutputs,
    affectsRuntime: true,
  };
}
