/**
 * Corvioz Revenue Signal Engine — Industry Weight Adjuster
 * Sprint C Phase 2.8
 *
 * Provides deterministic weighting adjustments based on user industry or vertical.
 * PURE DATA & DETERMINISTIC LOOKUP ONLY.
 */

export type IndustryCategory =
  | 'freelance'
  | 'agency'
  | 'consulting'
  | 'saas'
  | 'ecommerce'
  | 'enterprise'
  | 'general';

/**
 * Deterministic multipliers representing monetization velocity & typical ARPU weight by industry.
 */
export const INDUSTRY_WEIGHT_MULTIPLIERS: Record<IndustryCategory, number> = {
  freelance: 1.0,
  agency: 1.3,
  consulting: 1.25,
  saas: 1.4,
  ecommerce: 1.35,
  enterprise: 1.6,
  general: 1.0,
};

/**
 * Normalizes string input to known industry category.
 */
export function normalizeIndustryCategory(input?: string | null): IndustryCategory {
  if (!input) return 'general';
  const clean = input.toLowerCase().trim();
  if (clean.includes('agency') || clean.includes('studio')) return 'agency';
  if (clean.includes('enterprise') || clean.includes('corporate')) return 'enterprise';
  if (clean.includes('saas') || clean.includes('software')) return 'saas';
  if (clean.includes('ecom') || clean.includes('retail') || clean.includes('store')) return 'ecommerce';
  if (clean.includes('consult')) return 'consulting';
  if (clean.includes('freelance') || clean.includes('solo') || clean.includes('creator')) return 'freelance';
  return 'general';
}

/**
 * Returns the deterministic industry weight multiplier based on raw industry string or category.
 */
export function getIndustryWeightMultiplier(industryInput?: string | null): number {
  const category = normalizeIndustryCategory(industryInput);
  return INDUSTRY_WEIGHT_MULTIPLIERS[category] ?? 1.0;
}
