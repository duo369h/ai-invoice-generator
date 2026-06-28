/**
 * Corvioz — UI Hint Schema
 *
 * All UI hints are declared here and precomputed by the Interpretation Engine.
 *
 * RULE: UI must NEVER derive hints from raw signals or state.
 *       UI ONLY renders this precomputed schema.
 *
 * revenueUI is populated via REVENUE_ADAPTER_LAYER.ts — UI must never
 * access raw RevenueIntelligence fields (revenueStrategy, funnelBottleneck,
 * pricingSuggestion, revenueProbability) directly.
 */

import type { RevenueUIAdapter } from "../revenue/REVENUE_ADAPTER_LAYER.ts";

export type UIHints = {
  /** Show the "Try a sample proposal" demo card */
  showDemoCard: boolean;
  /** Show the upgrade/paywall nudge prompt */
  showUpgradeHint: boolean;
  /** Show the revenue insight / proof section */
  showRevenueInsight: boolean;
  /** Revenue UI adapter output — precomputed, immutable for UI rendering */
  revenueUI: RevenueUIAdapter;
};
