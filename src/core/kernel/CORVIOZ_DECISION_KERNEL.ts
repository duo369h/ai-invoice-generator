/**
 * Corvioz — Single Decision Kernel (Pure Revenue Decision Engine)
 *
 * Responsibilities:
 *   - Revenue state classification (risk levels)
 *   - Kill switch enforcement
 *   - Monetization mode assignment
 *   - Dashboard mode assignment
 *
 * Rules:
 *   - NO demo logic
 *   - NO onboarding logic
 *   - NO growth branching
 *   - NO preview routing
 *   - Pure revenue decision engine only
 */

import { isKillSwitchActive } from "../launch/LAUNCH_KILL_SWITCH.ts";

export type CorviozDecision = {
  route: "/proposal/create" | "/dashboard" | "/dashboard/activation";
  entryMode: "GUEST" | "AUTH" | "BLOCKED";
  revenueMode: "ENFORCED" | "TRACKING_ONLY" | "OFF";
  monetizationMode: "NONE" | "SOFT" | "AGGRESSIVE";
  dashboardMode: "FULL" | "READONLY";
  paywallAllowed: boolean;
  aiAttributionEnabled: boolean;
  killSwitchActive: boolean;
  reason: string;
};

export function getCorviozDecision(userState: any = {}): CorviozDecision {
  const killSwitchActive = userState?.killSwitchActive === true || isKillSwitchActive();

  // Kill switch: everything off, activation page only
  if (killSwitchActive) {
    return {
      route: "/dashboard/activation",
      entryMode: "BLOCKED",
      revenueMode: "OFF",
      monetizationMode: "NONE",
      dashboardMode: "READONLY",
      paywallAllowed: false,
      aiAttributionEnabled: false,
      killSwitchActive: true,
      reason: "kill_switch:HIGH",
    };
  }

  // Derive risk from revenue signals
  const aiScore = Number(userState?.ai_contribution_score ?? userState?.ai_score ?? 0);
  const revenueUplift = Number(userState?.revenue_uplift ?? 0);
  const revenueProof = userState?.first_revenue_proof_triggered === true ||
                       userState?.revenue_proof_triggered === true ||
                       userState?.revenue_proof === true;

  let riskLevel: "LOW" | "MEDIUM" | "HIGH" = "LOW";
  if (aiScore > 75 && revenueUplift > 0) riskLevel = "HIGH";
  else if (revenueProof) riskLevel = "MEDIUM";

  // Entry mode — purely from auth signals
  let entryMode: "GUEST" | "AUTH" | "BLOCKED" = "GUEST";
  const entryState = String(userState?.entry_state || userState?.entryState || "").toUpperCase();
  if (entryState === "BLOCKED") entryMode = "BLOCKED";
  else if (
    entryState === "AUTHENTICATED" || entryState === "AUTH" ||
    userState?.session?.access_token || userState?.user?.id || userState?.access_token
  ) {
    entryMode = "AUTH";
  }

  // Revenue route: paid users go to dashboard, all others go to proposal creation
  const isPaid = revenueProof || userState?.plan === "paid";
  const route = isPaid ? "/dashboard" : "/proposal/create";

  return {
    route,
    entryMode,
    revenueMode: riskLevel === "HIGH" ? "OFF" : riskLevel === "MEDIUM" ? "TRACKING_ONLY" : "ENFORCED",
    monetizationMode: riskLevel === "HIGH" ? "NONE" : riskLevel === "MEDIUM" ? "SOFT" : "AGGRESSIVE",
    dashboardMode: riskLevel === "HIGH" ? "READONLY" : "FULL",
    paywallAllowed: riskLevel !== "HIGH",
    aiAttributionEnabled: riskLevel !== "LOW",
    killSwitchActive: false,
    reason: `risk:${riskLevel}_kill:false`,
  };
}
