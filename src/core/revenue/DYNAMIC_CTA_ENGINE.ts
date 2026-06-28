/**
 * Corvioz — Dynamic CTA Engine
 *
 * Translates RevenueIntelligence into a human-facing CTA string and action.
 *
 * Rules:
 *   ✔ Consumes RevenueIntelligence only
 *   ✔ Outputs label + href + action for UI rendering
 *   ❌ Does NOT affect routing
 *   ❌ Does NOT interact with Kernel or Orchestrator
 */

import type { RevenueIntelligence, RevenueStrategy } from "./REVENUE_INTELLIGENCE_ENGINE.ts";

export interface DynamicCTA {
  label: string;
  href: string;
  action: string;
}

const CTA_MAP: Record<RevenueStrategy, DynamicCTA> = {
  ACQUIRE: {
    label: "Try Demo",
    href: "/demo/proposal-preview",
    action: "SHOW_DEMO",
  },
  CONVERT: {
    label: "Start Proposal",
    href: "/proposal/create",
    action: "PUSH_PROPOSAL",
  },
  MONETIZE: {
    label: "Generate Invoice",
    href: "/invoices/create",
    action: "PUSH_INVOICE",
  },
  EXPAND: {
    label: "Upgrade Plan",
    href: "/settings/billing",
    action: "UPGRADE",
  },
};

export function getDynamicCTA(revenueIntel: RevenueIntelligence): DynamicCTA {
  return CTA_MAP[revenueIntel.revenueStrategy];
}
