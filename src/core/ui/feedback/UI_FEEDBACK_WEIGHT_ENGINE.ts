/**
 * Corvioz — UI Feedback Weight Engine (v6.9.1 Weight System)
 *
 * Computes signal weights based on feedback events.
 * ❌ Prohibited from modifying signal values directly.
 * ✔ Only updates weight distribution.
 */

import { mapFeedbackToWeightDelta } from "../UI_FEEDBACK_TO_WEIGHT_MAPPER.ts";

export interface FeedbackWeights {
  signalWeights: {
    revenue: number;
    conversion: number;
    churn: number;
  };
  distributionDelta: number;
}

export function calculateFeedbackWeights(feedbackEvents: any[]): FeedbackWeights {
  let revenueWeight = 1.0;
  let conversionWeight = 1.0;
  let churnWeight = 1.0;
  let distributionDelta = 0.0;
  let clicks = 0;
  let scrollDepth = 0;
  let dropoff = false;

  for (const event of feedbackEvents) {
    const type = String(event?.type || "");
    if (type.includes("click") || type === "ui_payment_flow_engaged") {
      clicks += 1;
    }
    if (event?.value?.scrollDepth !== undefined) {
      scrollDepth = Math.max(scrollDepth, Number(event.value.scrollDepth || 0));
    }
    if (type.includes("dropoff") || type.includes("friction") || type.includes("abandon")) {
      dropoff = true;
    }

    if (event.type === "ui_conversion_friction_detected") {
      conversionWeight += 0.2;
      distributionDelta += 0.1;
    } else if (event.type === "ui_churn_remedy") {
      churnWeight += 0.3;
      distributionDelta += 0.15;
    }
  }

  const delta = mapFeedbackToWeightDelta({ clicks, scrollDepth, dropoff });
  revenueWeight += delta.revenueDelta;
  conversionWeight += delta.conversionDelta;
  churnWeight += delta.churnDelta;
  distributionDelta += Math.max(delta.revenueDelta, delta.conversionDelta, delta.churnDelta, 0);

  return {
    signalWeights: {
      revenue: Number(revenueWeight.toFixed(2)),
      conversion: Number(conversionWeight.toFixed(2)),
      churn: Number(churnWeight.toFixed(2)),
    },
    distributionDelta: Number(distributionDelta.toFixed(2)),
  };
}
