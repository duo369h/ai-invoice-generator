/**
 * Corvioz — Client Intelligence Layer v2
 *
 * Infers pricing tolerance, upsell probabilities, and client tiers
 * from behavioral interaction metadata and deal metrics.
 */

export type ClientSignal = {
  interactionDepth: number; // e.g. number of messages or revisions
  responseSpeed: number;     // speed index (low values = faster response)
  projectSize: number;       // scale metric of project
  budgetHint?: number;       // budget threshold
};

export type ClientProfile = {
  clientTier: "low" | "medium" | "high";
  priceTolerance: number;      // multiplier/multiplier threshold
  upsellProbability: number;   // probability index
};

/**
 * Derives client profile and price tolerance thresholds.
 */
export function getClientProfile(signal: ClientSignal): ClientProfile {
  let clientTier: "low" | "medium" | "high" = "medium";
  let priceTolerance = 1.0;
  let upsellProbability = 0.5;

  // 1️⃣ Heuristics to detect Enterprise signal
  // slow response (higher responseSpeed index) + high project size -> enterprise
  if (signal.responseSpeed > 6 && signal.projectSize > 3000) {
    clientTier = "high";
    priceTolerance = 1.5;
    upsellProbability = 0.85;
  }

  // 2️⃣ Heuristics to detect Price Sensitive signal
  // fast response + low budget -> price sensitive
  if (signal.responseSpeed <= 3 && (signal.budgetHint ?? 10000) < 1500) {
    clientTier = "low";
    priceTolerance = 0.75;
    upsellProbability = 0.20;
  }

  // 3️⃣ Refinements based on explicit budget hint
  if (signal.budgetHint && signal.budgetHint > 8000) {
    clientTier = "high";
    priceTolerance = 1.3;
    upsellProbability = 0.75;
  }

  return {
    clientTier,
    priceTolerance,
    upsellProbability,
  };
}
