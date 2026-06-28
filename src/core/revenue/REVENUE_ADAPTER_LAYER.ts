/**
 * Corvioz — Revenue Adapter Layer (Semantic Safety Edition)
 *
 * CRITICAL BOUNDARY: Translates raw Revenue Intelligence signals into
 * semantically validated, UI-consumable values.
 *
 * v6 upgrade: Added UI-first RevenueUI model and getRevenueUI() entry point.
 */

import { getRevenueIntelligence } from "./REVENUE_INTELLIGENCE_ENGINE.ts";
import type { RevenueIntelligence, RevenueStrategy } from "./REVENUE_INTELLIGENCE_ENGINE.ts";
import { validateRevenueUI } from "../semantic/REVENUE_SEMANTIC_VALIDATOR.ts";

export interface RevenueUIBadge {
  label: string;
  color: string;
}

export interface RevenueUICTA {
  label: string;
  href: string;
  action: string;
}

export interface RevenueUIInsight {
  headline: string;
  subtext: string;
}

export interface RevenueUIPricingTag {
  price: string;
  description: string;
}

export interface RevenueUIAdapter {
  badge: RevenueUIBadge;
  cta: RevenueUICTA;
  insight: RevenueUIInsight;
  pricingTag: RevenueUIPricingTag;
  semanticScore: number;
  probability: number;
}

// ── UI-First Model (v6) ───────────────────────────────────────────────────────
export type RevenueUI = {
  primaryCTA: {
    label: string;
    href: string;
  };
  highlight: {
    title: string;
    subtitle: string;
  };
  metric: {
    probability: number;
    label: string;
  };
  pricing: {
    display: string;
  };
};

// ── Badge mapping ─────────────────────────────────────────────────────────────
function mapBadge(strategy: RevenueStrategy): RevenueUIBadge {
  const BADGE_MAP: Record<RevenueStrategy, RevenueUIBadge> = {
    ACQUIRE:  { label: "Awareness",   color: "#64748b" },
    CONVERT:  { label: "Conversion",  color: "#f59e0b" },
    MONETIZE: { label: "Monetizing",  color: "#6366f1" },
    EXPAND:   { label: "Expanding",   color: "#10b981" },
  };
  return BADGE_MAP[strategy];
}

// ── CTA mapping ───────────────────────────────────────────────────────────────
function mapCTA(strategy: RevenueStrategy): RevenueUICTA {
  const CTA_MAP: Record<RevenueStrategy, RevenueUICTA> = {
    ACQUIRE:  { label: "Try Demo",          href: "/demo/proposal-preview", action: "SHOW_DEMO"     },
    CONVERT:  { label: "Start Proposal",    href: "/proposal/create",       action: "PUSH_PROPOSAL" },
    MONETIZE: { label: "Generate Invoice",  href: "/invoices/create",       action: "PUSH_INVOICE"  },
    EXPAND:   { label: "Upgrade Plan",      href: "/settings/billing",      action: "UPGRADE"       },
  };
  return CTA_MAP[strategy];
}

// ── Insight mapping ───────────────────────────────────────────────────────────
function mapInsight(intel: RevenueIntelligence): RevenueUIInsight {
  const INSIGHT_MAP: Record<RevenueStrategy, RevenueUIInsight> = {
    ACQUIRE: {
      headline: "Start with a live demo",
      subtext: "See how AI-optimized proposals win more clients.",
    },
    CONVERT: {
      headline: "You're ready to create your first proposal",
      subtext: `Funnel bottleneck detected: ${intel.funnelBottleneck}`,
    },
    MONETIZE: {
      headline: "Close the revenue loop — generate your invoice",
      subtext: "Proposal won. Invoice now to complete the cycle.",
    },
    EXPAND: {
      headline: "Revenue is flowing — time to scale",
      subtext: "Unlock higher capacity and advanced features.",
    },
  };
  return INSIGHT_MAP[intel.revenueStrategy];
}

// ── Pricing tag mapping ───────────────────────────────────────────────────────
function mapPricing(intel: RevenueIntelligence): RevenueUIPricingTag {
  const PRICING_MAP: Record<string, RevenueUIPricingTag> = {
    "$9":  { price: "$9/mo",  description: "Perfect for active users"         },
    "$19": { price: "$19/mo", description: "Ideal for high-intent freelancers" },
    "$29": { price: "$29/mo", description: "Best for proposal-stage users"     },
  };
  return PRICING_MAP[intel.pricingSuggestion] ?? { price: "$9/mo", description: "Get started" };
}

// ── Access gate marker ────────────────────────────────────────────────────────
export const REVENUE_ACCESS_GATE = "ADAPTER_ONLY" as const;

// ── Public API (getRawAdapterOutput & adaptRevenueToUI) ───────────────────────
export function getRawAdapterOutput(revenueIntel: RevenueIntelligence): Omit<RevenueUIAdapter, "semanticScore"> {
  return {
    badge:      mapBadge(revenueIntel.revenueStrategy),
    cta:        mapCTA(revenueIntel.revenueStrategy),
    insight:    mapInsight(revenueIntel),
    pricingTag: mapPricing(revenueIntel),
    probability: revenueIntel.revenueProbability,
  };
}

export function adaptRevenueToUI(revenueIntel: RevenueIntelligence): RevenueUIAdapter {
  const rawOutput = getRawAdapterOutput(revenueIntel);
  const validation = validateRevenueUI(rawOutput);
  if (!validation.valid && validation.corrected) {
    return validation.corrected;
  }
  return { ...rawOutput, semanticScore: validation.semanticScore };
}

// ── UI-First API (getRevenueUI) ──────────────────────────────────────────────
export function getRevenueUI(userState: any = {}): RevenueUI {
  const intel = getRevenueIntelligence(userState);
  const isKillSwitch = userState?.killSwitchActive === true;

  const badge = mapBadge(intel.revenueStrategy);
  const cta = mapCTA(intel.revenueStrategy);
  const insight = mapInsight(intel);
  const pricingTag = mapPricing(intel);

  const rawOutput = {
    badge,
    cta,
    insight,
    pricingTag,
    probability: isKillSwitch ? 0 : intel.revenueProbability,
  };

  const validation = validateRevenueUI(rawOutput);
  const validatedOutput = (!validation.valid && validation.corrected)
    ? validation.corrected
    : { ...rawOutput, semanticScore: validation.semanticScore };

  return {
    primaryCTA: {
      label: validatedOutput.cta.label,
      href: validatedOutput.cta.href,
    },
    highlight: {
      title: validatedOutput.insight.headline,
      subtitle: validatedOutput.insight.subtext,
    },
    metric: {
      probability: isKillSwitch ? 0 : validatedOutput.probability,
      label: isKillSwitch ? "BLOCKED" : validatedOutput.badge.label,
    },
    pricing: {
      display: isKillSwitch ? "—" : validatedOutput.pricingTag.price,
    },
  };
}
