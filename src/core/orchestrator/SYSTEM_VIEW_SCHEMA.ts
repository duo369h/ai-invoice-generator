/**
 * Corvioz — System View Schema
 *
 * Locked, readonly schema definition for SystemView.
 *
 * Rules:
 *   - uiHints is frozen — no dynamic injection allowed at runtime
 *   - revenueUI is readonly — must come from REVENUE_ADAPTER_LAYER precomputation
 *   - SystemView is the single contract between the Interpretation Engine and all consumers
 *   - Schema may only be modified through architecture review
 *
 * ⚠️  SCHEMA FREEZE:
 *   Adding fields to SystemView requires updating the Interpretation Engine,
 *   the Orchestrator result type, and the CI gate accordingly.
 */

import type { CorviozDecision } from "../kernel/CORVIOZ_DECISION_KERNEL.ts";
import type { RevenueIntelligence } from "../revenue/REVENUE_INTELLIGENCE_ENGINE.ts";
import type { RevenueUIAdapter } from "../revenue/REVENUE_ADAPTER_LAYER.ts";

/**
 * Frozen UIHints — all fields are precomputed, never derived at render time.
 * UI must treat this as an immutable snapshot.
 */
export type FrozenUIHints = Readonly<{
  /** Show demo entry card — precomputed from growth signals */
  showDemoCard: boolean;
  /** Show upgrade/paywall nudge — precomputed from kernel decision */
  showUpgradeHint: boolean;
  /** Show revenue insight section — precomputed from kernel revenueMode */
  showRevenueInsight: boolean;
  /** Revenue UI values — precomputed by Adapter Layer (REVENUE_ADAPTER_LAYER.ts) */
  revenueUI: Readonly<RevenueUIAdapter>;
}>;

/**
 * Frozen SystemView — the single contract between Interpretation Engine and consumers.
 * All fields are precomputed. No dynamic injection permitted.
 */
export type FrozenSystemView = Readonly<{
  route: "/quotes/create" | "/dashboard" | "/dashboard/activation" | "/demo/proposal-preview";
  uiHints: FrozenUIHints;
  growthSignals: Readonly<{
    intentScore: number;
    isColdStart: boolean;
  }>;
  kernelDecision: Readonly<CorviozDecision>;
  /** Raw revenue intelligence — for debugging/logging only. UI must NOT read this. */
  revenueIntelligence: Readonly<RevenueIntelligence>;
}>;

/**
 * Schema version — bump this when the SystemView contract changes.
 * All consumers should validate against this version.
 */
export const SYSTEM_VIEW_SCHEMA_VERSION = "1.0.0" as const;

/**
 * Access control marker — signals that this SystemView was produced through
 * the canonical pipeline. Any SystemView not produced by getSystemView()
 * must be treated as untrusted.
 */
export const SYSTEM_VIEW_ACCESS_GATE = "INTERPRETATION_ENGINE_ONLY" as const;
