/**
 * Corvioz — Revenue Intelligence Engine
 *
 * PURE DETERMINISTIC SCORING ENGINE
 *
 * Rules:
 *   ✔ ONLY source of business intelligence in the Revenue OS
 *   ✔ No CI input, semantic validator dependency, or adapter validation loops
 *   ✔ Generates raw revenue signals from user state deterministically
 *   ❌ Does NOT modify Kernel routing or override Orchestrator decisions
 */

export type RevenueStrategy = "ACQUIRE" | "CONVERT" | "MONETIZE" | "EXPAND";
export type FunnelBottleneck = "TRAFFIC" | "CONVERSION" | "PAYMENT" | "RETENTION" | "NONE";
export type PricingSuggestion = "$9" | "$19" | "$29";
export type UserSegment = "ACTIVE" | "INTENT" | "PROPOSAL_CREATED" | "UNKNOWN";

export interface RevenueIntelligence {
  revenueProbability: number;
  revenueStrategy: RevenueStrategy;
  funnelBottleneck: FunnelBottleneck;
  pricingSuggestion: PricingSuggestion;
  userSegment: UserSegment;
}

export function getRevenueIntelligence(userState: any = {}): RevenueIntelligence {
  // ── User Segment ────────────────────────────────────────────────────────────
  const proposalCreated = userState?.proposals_created > 0 ||
                          userState?.proposalCreated === true;
  const invoiceCreated  = userState?.invoices_created > 0 ||
                          userState?.invoiceCreated === true;
  const isActive        = userState?.first_revenue_proof_triggered === true ||
                          userState?.revenue_proof === true;
  const hasIntent       = userState?.demoViewed === true ||
                          userState?.ai_contribution_score > 0;

  let userSegment: UserSegment = "UNKNOWN";
  if (isActive)           userSegment = "ACTIVE";
  else if (proposalCreated) userSegment = "PROPOSAL_CREATED";
  else if (hasIntent)     userSegment = "INTENT";

  // ── Revenue Probability ─────────────────────────────────────────────────────
  let revenueProbability = 0.1;
  if (isActive)           revenueProbability = 0.85;
  else if (invoiceCreated) revenueProbability = 0.7;
  else if (proposalCreated) revenueProbability = 0.5;
  else if (hasIntent)     revenueProbability = 0.35;

  // ── Revenue Strategy ────────────────────────────────────────────────────────
  let revenueStrategy: RevenueStrategy;
  if (revenueProbability >= 0.8)       revenueStrategy = "EXPAND";
  else if (revenueProbability >= 0.6)  revenueStrategy = "MONETIZE";
  else if (revenueProbability >= 0.3)  revenueStrategy = "CONVERT";
  else                                  revenueStrategy = "ACQUIRE";

  // ── Funnel Bottleneck ───────────────────────────────────────────────────────
  let funnelBottleneck: FunnelBottleneck = "NONE";
  if (!userState?.visitedLanding) {
    funnelBottleneck = "TRAFFIC";
  } else if (userState?.demoViewed && !userState?.proposalStarted) {
    funnelBottleneck = "CONVERSION";
  } else if (proposalCreated && !invoiceCreated) {
    funnelBottleneck = "PAYMENT";
  } else if (invoiceCreated && !userState?.paymentStarted) {
    funnelBottleneck = "RETENTION";
  }

  // ── Pricing Suggestion ──────────────────────────────────────────────────────
  let pricingSuggestion: PricingSuggestion = "$9";
  if (userSegment === "PROPOSAL_CREATED") pricingSuggestion = "$29";
  else if (userSegment === "INTENT")      pricingSuggestion = "$19";

  return {
    revenueProbability,
    revenueStrategy,
    funnelBottleneck,
    pricingSuggestion,
    userSegment,
  };
}
