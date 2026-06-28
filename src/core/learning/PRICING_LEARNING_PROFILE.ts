/**
 * Corvioz — Pricing Learning Profile Layer v3
 *
 * Persists and computes user pricing style behaviors based on past decisions.
 * Restricts calculations to non-intrusive metadata profile estimations.
 */

export type TrackedEvent = {
  id: string;
  action: "accepted" | "rejected" | "chose_fast_deal" | "chose_high_price";
  price: number;
  timestamp: number;
};

export type UserPricingProfile = {
  userType: "aggressive" | "balanced" | "conservative";
  preferredRange: [number, number];
  sampleSize: number;
};

// Internal persistent log layer in-memory
const eventLogs: TrackedEvent[] = [];

/**
 * Tracks a user pricing interaction.
 */
export function trackPricingEvent(event: Omit<TrackedEvent, "timestamp">): void {
  if (!eventLogs.some((e) => e.id === event.id)) {
    eventLogs.push({
      ...event,
      timestamp: Date.now(),
    });
  }
}

/**
 * Resolves user pricing style and sample counts.
 */
export function getUserPricingProfile(): UserPricingProfile {
  const sampleSize = eventLogs.length;

  if (sampleSize === 0) {
    return {
      userType: "balanced",
      preferredRange: [500, 2000],
      sampleSize: 0,
    };
  }

  const accepts = eventLogs.filter((e) => e.action === "accepted" || e.action === "chose_high_price");
  const highs = eventLogs.filter((e) => e.action === "chose_high_price");
  const fasts = eventLogs.filter((e) => e.action === "chose_fast_deal");

  let userType: "aggressive" | "balanced" | "conservative" = "balanced";
  if (highs.length / sampleSize > 0.4) {
    userType = "aggressive";
  } else if (fasts.length / sampleSize > 0.4) {
    userType = "conservative";
  }

  const prices = eventLogs.map((e) => e.price);
  const min = Math.min(...prices);
  const max = Math.max(...prices);

  return {
    userType,
    preferredRange: [min, max],
    sampleSize,
  };
}

/**
 * Resolves localized learning profile messages.
 */
export function getLearningStateMessage(sampleSize: number): string {
  if (sampleSize === 0) {
    return "We don’t know your pricing style yet.";
  }
  if (sampleSize <= 5) {
    return "We are learning your pricing behavior.";
  }
  return "We now adapt suggestions based on your past decisions.";
}
