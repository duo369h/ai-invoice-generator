/**
 * Corvioz — Revenue Game Theory Engine v3
 *
 * Utilizes minimax regret rules and competitor matrix calculations
 * to suggest optimal deal strategies.
 */

export type GameTheoryInput = {
  clientBehaviorHistory: any[];
  urgency: "low" | "medium" | "high";
  competitionPressure: "low" | "medium" | "high";
  cashNeed: "low" | "medium" | "high";
};

export type GameTheoryOutput = {
  optimalStrategy: "MAX_REVENUE" | "BALANCED" | "FAST_DEAL";
  regretRisk: number; // 0 to 1 scale
  upsidePotential: number; // 0 to 1 scale
};

/**
 * Computes optimal game strategy, regret risk, and upside potential.
 */
export function getOptimalStrategy(input: GameTheoryInput): GameTheoryOutput {
  let optimalStrategy: "MAX_REVENUE" | "BALANCED" | "FAST_DEAL" = "BALANCED";
  let regretRisk = 0.3;
  let upsidePotential = 0.6;

  // Minimax regret rules
  if (input.cashNeed === "high") {
    // Immediate cash required -> FAST_DEAL optimal to minimize regret of lost deal
    optimalStrategy = "FAST_DEAL";
    regretRisk = 0.15;
    upsidePotential = 0.35;
  } else if (input.urgency === "high" && input.competitionPressure === "low") {
    // High client urgency + low competitor pressure -> MAX_REVENUE optimal to extract maximum price
    optimalStrategy = "MAX_REVENUE";
    regretRisk = 0.45;
    upsidePotential = 0.95;
  } else if (input.competitionPressure === "high") {
    // High competition -> shift towards FAST_DEAL or BALANCED depending on history
    optimalStrategy = "BALANCED";
    regretRisk = 0.55;
    upsidePotential = 0.50;
  }

  // Factor client behavior history (e.g. historical conversion rate)
  if (input.clientBehaviorHistory && input.clientBehaviorHistory.length > 0) {
    const historicalConversions = input.clientBehaviorHistory.filter((h) => h.accepted).length;
    const conversionRate = historicalConversions / input.clientBehaviorHistory.length;

    // High historical conversion -> raise potential and select MAX_REVENUE
    if (conversionRate > 0.8 && optimalStrategy === "BALANCED") {
      optimalStrategy = "MAX_REVENUE";
      upsidePotential += 0.10;
    }
  }

  return {
    optimalStrategy,
    regretRisk,
    upsidePotential,
  };
}
