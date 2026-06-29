/**
 * Corvioz — Revenue Fallback Engine
 *
 * Provides the SAFE_DEFAULT_UI output when semantic validation fails.
 *
 * Rules:
 *   ✔ Always returns a semantically valid, self-consistent UI state
 *   ✔ Used ONLY when REVENUE_SEMANTIC_VALIDATOR detects HARD violations
 *   ❌ Never used as the primary output path
 */

import type { RevenueUIAdapter } from "../revenue/REVENUE_ADAPTER_LAYER.ts";

export const SAFE_DEFAULT_UI: Omit<RevenueUIAdapter, "semanticScore"> = Object.freeze({
  badge: Object.freeze({
    label: "Awareness",
    color: "#64748b",
  }),
  cta: Object.freeze({
    label: "Start Proposal",
    href: "/dashboard?tool=quote&mode=create",
    action: "PUSH_PROPOSAL",
  }),
  insight: Object.freeze({
    headline: "Continue building your revenue flow",
    subtext: "Create a proposal to start winning clients.",
  }),
  pricingTag: Object.freeze({
    price: "$9/mo",
    description: "Get started",
  }),
  probability: 0.1,
});

export function getSafeFallbackUI(): RevenueUIAdapter {
  return {
    ...SAFE_DEFAULT_UI,
    semanticScore: 0.5,
  };
}
