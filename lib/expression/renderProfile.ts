/*
 * Profile Expression Renderer — Corvioz v10
 *
 * Returns display configuration for public profile per plan.
 * Pure UI config only — no business logic, no revenue decisions.
 */

import { PlanTier, getExpressionConfig } from './expressionEngine';

export interface ProfileRenderConfig {
  /** Layout density for the public profile page */
  layout: 'minimal' | 'standard' | 'agency' | 'business_card';
  /** Max number of services shown */
  serviceLimit: number;
  /** Max number of testimonials shown */
  testimonialLimit: number;
  /** Max number of portfolio items shown */
  portfolioLimit: number;
  /** Whether the "Available for hire" indicator is shown */
  showAvailabilityIndicator: boolean;
  /** Whether to show the "Powered by Corvioz" badge */
  showPoweredByBadge: boolean;
  /** Whether the social links section is visible */
  showSocialLinks: boolean;
  /** Whether pricing section is shown */
  showPricingSection: boolean;
  /** Badge configuration */
  badges: {
    verified: boolean;
    topRated: boolean;
    fastResponse: boolean;
  };
  /** Whether custom cover banner is rendered */
  showCustomCover: boolean;
}

export function getProfileRenderConfig(plan: PlanTier): ProfileRenderConfig {
  const expr = getExpressionConfig(plan);

  switch (plan) {
    case 'studio':
      return {
        layout: 'agency',
        serviceLimit: 0,
        testimonialLimit: 0,
        portfolioLimit: 0,
        showAvailabilityIndicator: true,
        showPoweredByBadge: false,
        showSocialLinks: true,
        showPricingSection: true,
        badges: {
          verified: expr.identity.showVerifiedBadge,
          topRated: expr.identity.showTopRatedBadge,
          fastResponse: expr.identity.showFastResponseBadge,
        },
        showCustomCover: true,
      };

    case 'growth':
      return {
        layout: 'standard',
        serviceLimit: 0,
        testimonialLimit: 0,
        portfolioLimit: 0,
        showAvailabilityIndicator: true,
        showPoweredByBadge: false,
        showSocialLinks: true,
        showPricingSection: true,
        badges: {
          verified: expr.identity.showVerifiedBadge,
          topRated: expr.identity.showTopRatedBadge,
          fastResponse: expr.identity.showFastResponseBadge,
        },
        showCustomCover: true,
      };

    case 'pro':
      return {
        layout: 'business_card',
        serviceLimit: 3,
        testimonialLimit: 0,
        portfolioLimit: 3,
        showAvailabilityIndicator: false,
        showPoweredByBadge: true,
        showSocialLinks: false,
        showPricingSection: false,
        badges: {
          verified: false,
          topRated: false,
          fastResponse: false,
        },
        showCustomCover: false,
      };

    case 'free':
    default:
      return {
        layout: 'minimal',
        serviceLimit: 1,
        testimonialLimit: 1,
        portfolioLimit: 1,
        showAvailabilityIndicator: false,
        showPoweredByBadge: true,
        showSocialLinks: false,
        showPricingSection: false,
        badges: {
          verified: false,
          topRated: false,
          fastResponse: false,
        },
        showCustomCover: false,
      };
  }
}
