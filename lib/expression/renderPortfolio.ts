/*
 * Portfolio Expression Renderer — Corvioz v10
 *
 * Returns portfolio display configuration per plan tier.
 * Pure UI config only.
 */

import { PlanTier } from './expressionEngine';

export interface PortfolioRenderConfig {
  /** Max items to show (0 = unlimited) */
  itemLimit: number;
  /** Card layout density */
  gridColumns: 1 | 2 | 3;
  /** Whether case study detail view is enabled */
  caseStudyEnabled: boolean;
  /** Whether external link opens in client-safe preview */
  safePreviewEnabled: boolean;
  /** Whether tags/categories are shown */
  showTags: boolean;
}

export function getPortfolioRenderConfig(plan: PlanTier): PortfolioRenderConfig {
  switch (plan) {
    case 'studio':
      return {
        itemLimit: 0,
        gridColumns: 3,
        caseStudyEnabled: true,
        safePreviewEnabled: true,
        showTags: true,
      };
    case 'growth':
      return {
        itemLimit: 0,
        gridColumns: 2,
        caseStudyEnabled: true,
        safePreviewEnabled: false,
        showTags: true,
      };
    case 'pro':
      return {
        itemLimit: 3,
        gridColumns: 1,
        caseStudyEnabled: false,
        safePreviewEnabled: false,
        showTags: false,
      };
    case 'free':
    default:
      return {
        itemLimit: 1,
        gridColumns: 1,
        caseStudyEnabled: false,
        safePreviewEnabled: false,
        showTags: false,
      };
  }
}
