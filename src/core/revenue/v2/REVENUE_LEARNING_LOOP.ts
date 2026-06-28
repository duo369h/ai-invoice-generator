/**
 * Corvioz — Revenue Learning Loop v2.1
 *
 * Tracks historical pricing choices and user actions to compute acceptance rates,
 * elasticity quotients, and suggest pricing adjustment signals.
 */

export type DecisionFeedback = {
  decisionId: string;
  clientType: "low" | "mid" | "high";
  serviceType: string;
  priceOffered: number;
  priceAccepted?: number;
  userAction: "ACCEPT" | "REJECT" | "EDIT";
  timestamp: number;
};

export type LearningOutput = {
  acceptanceRate: number;
  rejectionPattern: string[];
  priceElasticity: number;
  recommendedAdjustment: number;
};

/**
 * Calculates elasticity metrics and recommended price adjustments based on feedback history.
 */
export function evaluateFeedback(
  history: DecisionFeedback[] = []
): LearningOutput {
  if (history.length === 0) {
    return {
      acceptanceRate: 0.8,
      rejectionPattern: [],
      priceElasticity: 0.5,
      recommendedAdjustment: 1.0,
    };
  }

  const accepts = history.filter((h) => h.userAction === "ACCEPT");
  const rejects = history.filter((h) => h.userAction === "REJECT");
  const edits = history.filter((h) => h.userAction === "EDIT");

  const acceptanceRate = (accepts.length + edits.length * 0.5) / history.length;

  // Track patterns of reject vs accepted prices
  const rejectionPattern: string[] = [];
  let priceElasticity = 0.5;

  if (rejects.length > 0) {
    const avgRejectPrice = rejects.reduce((acc, r) => acc + r.priceOffered, 0) / rejects.length;
    rejectionPattern.push(`Rejections clustered around average of $${avgRejectPrice.toFixed(2)}`);

    // High rejects -> high price sensitivity / elasticity
    priceElasticity = 0.8;
  }

  if (edits.length > 0) {
    const avgDrift = edits.reduce((acc, e) => {
      const delta = (e.priceAccepted ?? e.priceOffered) - e.priceOffered;
      return acc + delta;
    }, 0) / edits.length;

    rejectionPattern.push(`Users manually edited quotes by average of $${avgDrift.toFixed(2)}`);
  }

  // Recommended adjustment logic
  let recommendedAdjustment = 1.0;
  if (acceptanceRate > 0.75) {
    recommendedAdjustment = 1.10; // High acceptance -> raise price by 10%
  } else if (acceptanceRate < 0.35) {
    recommendedAdjustment = 0.90; // Low acceptance -> drop price by 10%
  }

  return {
    acceptanceRate,
    rejectionPattern,
    priceElasticity,
    recommendedAdjustment,
  };
}
