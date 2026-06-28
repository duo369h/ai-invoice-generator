/**
 * Corvioz Pricing Core Engine v3.1.1
 *
 * Deterministic pricing primitive.
 * No AI imports, no ML inference, no external API calls.
 */

export type PricingCoreJobType =
  | "web_design"
  | "ui_ux"
  | "logo"
  | "invoice_system"
  | "marketing";

export type PricingCoreClientType =
  | "individual"
  | "small_business"
  | "startup"
  | "enterprise";

export type PricingCoreInput = {
  jobType: PricingCoreJobType;
  clientType: PricingCoreClientType;
  urgency?: "low" | "medium" | "high";
  clarity?: "low" | "medium" | "high";
};

export type PricingCoreOutput = {
  basePrice: number;
  adjustedPrice: number;
  range: {
    min: number;
    max: number;
  };
};

const BASE_PRICE: Record<PricingCoreJobType, number> = {
  web_design: 800,
  ui_ux: 600,
  logo: 200,
  invoice_system: 1200,
  marketing: 500,
};

const CLIENT_MULTIPLIER: Record<PricingCoreClientType, number> = {
  individual: 0.8,
  small_business: 1.2,
  startup: 1.5,
  enterprise: 2.2,
};

const URGENCY_MULTIPLIER = {
  low: 1.0,
  medium: 1.2,
  high: 1.5,
} as const;

const CLARITY_MULTIPLIER = {
  high: 1.0,
  medium: 1.2,
  low: 1.4,
} as const;

export function deterministicPricingEngine(input: PricingCoreInput): PricingCoreOutput {
  const basePrice = BASE_PRICE[input.jobType] ?? BASE_PRICE.marketing;
  const clientMultiplier = CLIENT_MULTIPLIER[input.clientType] ?? CLIENT_MULTIPLIER.small_business;
  const urgencyMultiplier = URGENCY_MULTIPLIER[input.urgency ?? "medium"];
  const clarityMultiplier = CLARITY_MULTIPLIER[input.clarity ?? "medium"];
  const adjustedPrice = Math.round(basePrice * clientMultiplier * urgencyMultiplier * clarityMultiplier);

  return {
    basePrice,
    adjustedPrice,
    range: {
      min: Math.round(adjustedPrice * 0.8),
      max: Math.round(adjustedPrice * 1.3),
    },
  };
}
