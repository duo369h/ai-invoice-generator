/**
 * Corvioz — Revenue Strategy Feedback Tracker
 *
 * Records user selections and strategy outcomes for game-theory optimizations.
 */

export interface StrategyFeedback {
  decision: "ACCEPT" | "REJECT" | "MODIFY";
  selectedStrategy: "MAX_REVENUE" | "BALANCED" | "FAST_DEAL";
  pricingBefore: number;
  pricingAfter: number;
  clientType: "low" | "mid" | "high" | "new" | "repeat" | "long_term";
  urgency: "low" | "medium" | "high";
  cashNeed?: "low" | "medium" | "high";
  timestamp?: number;
}

const feedbackLog: StrategyFeedback[] = [];

/**
 * Logs a strategy choice feedback action.
 */
export function logStrategyFeedback(feedback: StrategyFeedback): void {
  feedbackLog.push({
    ...feedback,
    timestamp: feedback.timestamp || Date.now(),
  });
}

/**
 * Returns logged strategy feedback.
 */
export function getStrategyFeedbackLog(): StrategyFeedback[] {
  return [...feedbackLog];
}

/**
 * Clears logged feedback.
 */
export function clearStrategyFeedbackLog(): void {
  feedbackLog.length = 0;
}

// Keep old API declarations to prevent backward-compatibility compilation failures
export const logPricingFeedback = logStrategyFeedback as any;
export const getPricingFeedbackLog = getStrategyFeedbackLog as any;
export const clearPricingFeedbackLog = clearStrategyFeedbackLog as any;
