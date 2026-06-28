/**
 * Corvioz — Growth Signal Layer
 *
 * Signal-only layer. Does NOT decide routes.
 * Outputs probability scores and intent signals consumed by the Orchestrator.
 */

export type GrowthSuggestedAction = "VIEW_DEMO" | "START_PROPOSAL" | "GO_DASHBOARD";

export interface GrowthSignals {
  /** Intent score from 0.0 (cold/unknown) to 1.0 (high intent) */
  intentScore: number;
  /** True if user has no session, no history, no revenue signals */
  isColdStart: boolean;
  /** Recommended action — consumed by Orchestrator, NOT executed here */
  suggestedAction: GrowthSuggestedAction;
  /** Confidence in the suggestion (0.0 - 1.0) */
  confidence: number;
}

export function getGrowthSignals(userState: any = {}): GrowthSignals {
  const isPaid = userState?.revenue_proof === true ||
                 userState?.first_revenue_proof_triggered === true ||
                 userState?.revenue_proof_triggered === true;

  const isAuth = userState?.entry_state === "AUTH" ||
                 userState?.entry_state === "AUTHENTICATED" ||
                 userState?.session?.access_token ||
                 userState?.user?.id ||
                 userState?.access_token;

  const hasEngagement = userState?.proposals_created > 0 ||
                        userState?.first_proposal_win === true ||
                        userState?.ai_contribution_score > 0;

  const isColdStart = !isAuth && !hasEngagement;

  let intentScore = 0.0;
  if (isPaid) intentScore = 1.0;
  else if (isAuth && hasEngagement) intentScore = 0.7;
  else if (isAuth) intentScore = 0.4;
  else intentScore = 0.1;

  let suggestedAction: GrowthSuggestedAction = "VIEW_DEMO";
  if (isPaid) suggestedAction = "GO_DASHBOARD";
  else if (isAuth) suggestedAction = "START_PROPOSAL";

  return {
    intentScore,
    isColdStart,
    suggestedAction,
    confidence: isPaid ? 0.99 : isAuth ? 0.8 : 0.5,
  };
}
