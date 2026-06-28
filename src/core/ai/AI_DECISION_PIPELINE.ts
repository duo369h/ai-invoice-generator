import {
  getUserAIState,
  updateFromOutcome,
  computeDecisionBias,
  type AIUserState
} from './AI_DECISION_CORE';

export interface PipelineResult {
  state: AIUserState;
  bias: number;
  output: any;
}

/**
 * AI Decision Pipeline — Single execution pipeline for all AI stages.
 * Passes the authorized caller 'AI_DECISION_CORE' to updateFromOutcome.
 */
export function runAIDecisionPipeline(
  userId: string,
  stage: "QUOTE" | "INVOICE" | "PAYMENT" | "FEEDBACK",
  context: any
): PipelineResult {
  const cleanUserId = userId || 'default';

  // 1. Load AIUserState
  const state = getUserAIState(cleanUserId);

  // 2. Compute bias
  const bias = computeDecisionBias(cleanUserId, context);

  // 3. Apply bias to flow logic based on stage
  let output: any;
  let signal: any;

  switch (stage) {
    case "QUOTE": {
      const basePrice = context?.basePrice || 1000;
      
      const suggestedPrice = Math.round(basePrice * bias);
      const strategy = state.preferred_strategy;
      const reasoning = `Pricing adjusted by unified Decision Pipeline. State bias: ${state.pricing_bias.toFixed(2)}, Strategy preference: ${strategy}.`;

      output = {
        suggestedPrice,
        confidence: 0.85,
        strategy,
        reasoning
      };
      
      signal = {
        type: 'QUOTE_CREATED',
        basePrice,
        suggestedPrice,
        strategy
      };
      break;
    }
    case "INVOICE": {
      const description = context?.description || "Freelance Services";
      let improvedDescription = description;
      if (state.preferred_strategy === 'PREMIUM') {
        improvedDescription = `${description} (Premium Execution & Source Handoff)`;
      } else if (state.preferred_strategy === 'FAST') {
        improvedDescription = `${description} (Express Deliverable)`;
      } else {
        improvedDescription = `${description} (Standard Handoff)`;
      }

      output = {
        improvedDescription,
        clarityScore: 95,
        paymentRiskReduction: 20
      };

      signal = {
        type: 'INVOICE_CREATED',
        description: improvedDescription
      };
      break;
    }
    case "PAYMENT": {
      const timing = state.urgency_sensitivity > 1.2 ? "in 1 day" : "in 3 days";
      const urgencyLevel = Math.round(state.urgency_sensitivity * 2);
      const messageSuggestion = state.preferred_strategy === 'PREMIUM'
        ? "A payment request has been issued for your premium deliverables. You can review details and complete the transaction securely."
        : "Friendly reminder: your invoice payment link is active and ready. Let us know if you have any questions!";

      output = {
        followUpTiming: timing,
        messageSuggestion,
        urgencyLevel
      };

      signal = {
        type: 'PAYMENT_REMINDER_SENT',
        urgencyLevel
      };
      break;
    }
    case "FEEDBACK": {
      const outcome = context?.outcome || 'PENDING';
      const offered = context?.priceOffered || 1000;
      const accepted = outcome === 'WON' ? offered : 0;

      output = {
        mode: "observability_only"
      };

      signal = {
        type: 'FEEDBACK_OUTCOME',
        outcome,
        priceOffered: offered,
        priceAccepted: accepted
      };
      break;
    }
  }

  // 4. Update core state with signal using authorized caller parameter
  const updatedState = updateFromOutcome(cleanUserId, signal, 'AI_DECISION_CORE');

  return {
    state: updatedState,
    bias,
    output
  };
}
