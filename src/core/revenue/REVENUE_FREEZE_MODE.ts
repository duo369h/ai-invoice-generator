/**
 * Corvioz — Revenue Freeze Mode
 *
 * Structural lock preventing future v2/v3 from violating Revenue OS boundaries.
 *
 * This file is a compile-time and review-time contract.
 * Any attempt to set allowNewFields = true or allowDirectUIAccess = true
 * must go through architecture review.
 */

export const REVENUE_FREEZE = {
  /** New fields to RevenueIntelligence must go through the Adapter Layer, not raw engine */
  allowNewFields: false,
  /** UI may not access RevenueIntelligence raw fields directly */
  allowDirectUIAccess: false,
  /** CI validates structure only — not business rules */
  allowCIBusinessRules: false,
} as const;
