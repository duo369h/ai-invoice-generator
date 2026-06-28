/**
 * Corvioz — UI Feedback Scorer
 *
 * Converts feedback events into bounded signal scores only.
 */

export type UIFeedbackScore = {
  engagementScore: number;
  dropoffDetected: boolean;
  ctaEffectiveness: number;
};

function clamp01(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(1, Number(value.toFixed(2))));
}

export function scoreFeedback(events: any[] = []): UIFeedbackScore {
  if (!Array.isArray(events) || events.length === 0) {
    return {
      engagementScore: 0,
      dropoffDetected: false,
      ctaEffectiveness: 0,
    };
  }

  let engagement = 0;
  let ctaViews = 0;
  let ctaActions = 0;
  let dropoffs = 0;

  for (const event of events) {
    const type = String(event?.type || "");
    if (type.includes("view") || type.includes("hover")) engagement += 0.1;
    if (type.includes("click") || type.includes("engaged")) engagement += 0.25;
    if (type.includes("cta_view")) ctaViews += 1;
    if (type.includes("cta_click") || type.includes("payment_flow_engaged")) ctaActions += 1;
    if (type.includes("dropoff") || type.includes("friction") || type.includes("abandon")) dropoffs += 1;
  }

  return {
    engagementScore: clamp01(engagement / Math.max(1, events.length * 0.25)),
    dropoffDetected: dropoffs > 0,
    ctaEffectiveness: clamp01(ctaActions / Math.max(1, ctaViews)),
  };
}

export { scoreFeedback as getFeedbackScore };
