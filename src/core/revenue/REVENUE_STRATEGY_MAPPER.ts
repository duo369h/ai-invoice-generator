/**
 * Corvioz — Revenue Strategy Mapper
 *
 * Maps RevenueIntelligence output to concrete UI strategy actions.
 *
 * Rules:
 *   ✔ Consumes RevenueIntelligence as input
 *   ✔ Outputs primaryAction, secondaryAction, uiHint
 *   ❌ Does NOT produce routes
 *   ❌ Does NOT interact with Kernel or Orchestrator
 */

import type { RevenueIntelligence, RevenueStrategy } from "./REVENUE_INTELLIGENCE_ENGINE.ts";

export type StrategyAction =
  | "SHOW_DEMO"
  | "PUSH_PROPOSAL"
  | "PUSH_INVOICE"
  | "UPGRADE";

export interface StrategyMap {
  primaryAction: StrategyAction;
  secondaryAction: StrategyAction | null;
  uiHint: string;
}

const STRATEGY_MAP: Record<RevenueStrategy, StrategyMap> = {
  ACQUIRE: {
    primaryAction: "SHOW_DEMO",
    secondaryAction: null,
    uiHint: "Show the user what's possible before asking them to commit.",
  },
  CONVERT: {
    primaryAction: "PUSH_PROPOSAL",
    secondaryAction: "SHOW_DEMO",
    uiHint: "User has intent — move them to create their first proposal.",
  },
  MONETIZE: {
    primaryAction: "PUSH_INVOICE",
    secondaryAction: "PUSH_PROPOSAL",
    uiHint: "Proposal is won — convert to invoice to close the revenue loop.",
  },
  EXPAND: {
    primaryAction: "UPGRADE",
    secondaryAction: "PUSH_INVOICE",
    uiHint: "Revenue is flowing — offer expanded capacity or plan upgrade.",
  },
};

export function mapRevenueStrategy(intel: RevenueIntelligence): StrategyMap {
  return STRATEGY_MAP[intel.revenueStrategy];
}
