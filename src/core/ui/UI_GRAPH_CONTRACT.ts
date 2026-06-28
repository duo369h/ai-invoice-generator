/**
 * Corvioz — UI Graph Contract
 *
 * Defines the strict, single data contract for UI components.
 * UI components are forbidden from depending on the Orchestrator, Kernel,
 * or Route system directly.
 */

import type { RevenueUI } from "../revenue/REVENUE_ADAPTER_LAYER.ts";
import type { UIRevenueSignal, UIRuntimeDecision } from "./runtime/UI_RUNTIME_DECISION_ENGINE.ts";
import type { UIStabilityInfo } from "./runtime/UI_STABILITY_ENGINE.ts";

export type WorkspaceHints = {
  showDemoCard: boolean;
  showRevenueInsight: boolean;
};

export type OnboardingHints = {
  showUpgradeHint: boolean;
};

export type Section = {
  type: string;
  id: string;
  props: any;
  uiDecision: UIRuntimeDecision;
};

export type UIGraph = {
  sections: Section[];
  revenueUI: RevenueUI;
  workspaceHints: WorkspaceHints;
  onboardingHints: OnboardingHints;
  onboardingUI: any;
  feedUI: any;
  uiDecision: UIRuntimeDecision;
  signals: UIRevenueSignal;
  growthMutation: {
    proposalsCount: number;
    expectedUplift: number;
    confidence: number;
  };
  uiStability: UIStabilityInfo;
};
