/**
 * Corvioz — Workflow Semantic Contract
 *
 * Defines the semantic rules that govern workflow UI consistency.
 * All rules are enforced by REVENUE_SEMANTIC_VALIDATOR.ts at adapter output time.
 *
 * Principle:
 *   "UI is not allowed to display inconsistent workflow meaning."
 *
 * No UI should ever show a CTA that contradicts the user's funnel stage,
 * or a price that misaligns with their behavioral segment.
 */

export type SemanticLayer = "CTA" | "PRICING" | "FUNNEL" | "BADGE";
export type SemanticSeverity = "SOFT" | "HARD";

export type SemanticRule = {
  id: string;
  layer: SemanticLayer;
  rule: string;
  severity: SemanticSeverity;
};

// ── Built-in Semantic Rules ───────────────────────────────────────────────────

export const SEMANTIC_RULES: SemanticRule[] = [
  // CTA Consistency Rules
  {
    id: "CTA-01",
    layer: "CTA",
    rule: "ACQUIRE stage must not show 'Upgrade Plan' CTA",
    severity: "HARD",
  },
  {
    id: "CTA-02",
    layer: "CTA",
    rule: "CONVERT stage must not show 'Try Demo' CTA",
    severity: "HARD",
  },
  {
    id: "CTA-03",
    layer: "CTA",
    rule: "MONETIZE stage must not show 'Start Proposal' CTA",
    severity: "HARD",
  },
  {
    id: "CTA-04",
    layer: "CTA",
    rule: "EXPAND stage must not show 'Try Demo' CTA",
    severity: "HARD",
  },

  // Pricing Alignment Rules
  {
    id: "PRICE-01",
    layer: "PRICING",
    rule: "ACTIVE segment must suggest $9/mo only",
    severity: "HARD",
  },
  {
    id: "PRICE-02",
    layer: "PRICING",
    rule: "INTENT segment must suggest $19/mo only",
    severity: "HARD",
  },
  {
    id: "PRICE-03",
    layer: "PRICING",
    rule: "PROPOSAL_CREATED segment must suggest $29/mo only",
    severity: "HARD",
  },

  // Funnel Coherence Rules
  {
    id: "FUNNEL-01",
    layer: "FUNNEL",
    rule: "TRAFFIC bottleneck cannot show invoice CTA",
    severity: "HARD",
  },
  {
    id: "FUNNEL-02",
    layer: "FUNNEL",
    rule: "ACTIVE/EXPAND stage cannot show upgrade-to-free-trial CTA",
    severity: "SOFT",
  },

  // Badge Consistency Rules
  {
    id: "BADGE-01",
    layer: "BADGE",
    rule: "Badge must be non-empty string",
    severity: "HARD",
  },
  {
    id: "BADGE-02",
    layer: "BADGE",
    rule: "Badge must have a valid color value",
    severity: "SOFT",
  },
];

// ── CTA → Stage mapping for consistency checks ────────────────────────────────

export type ExpectedCTAAction =
  | "SHOW_DEMO"
  | "PUSH_PROPOSAL"
  | "PUSH_INVOICE"
  | "UPGRADE";

export const STAGE_CTA_MAP: Record<string, ExpectedCTAAction> = {
  Awareness:   "SHOW_DEMO",
  Conversion:  "PUSH_PROPOSAL",
  Monetizing:  "PUSH_INVOICE",
  Expanding:   "UPGRADE",
};

export const STAGE_PRICE_MAP: Record<string, string> = {
  Awareness:   "$9/mo",
  Conversion:  "$19/mo",
  Monetizing:  "$29/mo",
  Expanding:   "$9/mo",
};

export const FORBIDDEN_CTA_BY_STAGE: Record<string, string[]> = {
  Awareness:  ["Upgrade Plan", "Generate Invoice"],
  Conversion: ["Try Demo", "Upgrade Plan"],
  Monetizing: ["Start Proposal", "Try Demo"],
  Expanding:  ["Try Demo", "Start Proposal"],
};
