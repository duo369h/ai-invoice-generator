/**
 * PRICING_VISUAL_RULES — Corvioz v4 Visual Authority
 *
 * Single source of truth for pricing card visual hierarchy.
 * CSS must derive from these constants. No UI file may define
 * visual weight outside this module.
 *
 * Layer: v4/authority → consumed by components.css via CSS vars
 */

export const PRICING_VISUAL_RULES = {
  /** Free tier: visually de-emphasized (dimmed, no shadow) */
  free: {
    opacity: 0.6,
    shadow: 'none',
    background: 'transparent',
    scale: 1,
    translateY: 0,
  },

  /** Starter tier: baseline prominence */
  starter: {
    opacity: 1,
    shadow: 'var(--shadow-md)',
    background: 'var(--bg-card)',
    scale: 1,
    translateY: 0,
  },

  /** Pro tier: static visual dominance — elevated and scaled */
  pro: {
    opacity: 1,
    shadow: '0 30px 70px rgba(99, 102, 241, 0.25)',
    background: 'var(--bg-card)',
    scale: 1.04,
    translateY: -8,
    border: '2px solid var(--primary)',
    zIndex: 20,
  },

  /** Studio tier: future plan — visually ghosted */
  studio: {
    opacity: 0.5,
    shadow: 'none',
    background: 'transparent',
    borderStyle: 'dashed',
    scale: 1,
    translateY: 0,
  },

  /** Hover: ONLY micro-lift. Must NOT change plan priority. */
  hover: {
    translateY: -4,
    shadow: '0 16px 40px rgba(0, 0, 0, 0.12)',
    zIndex: 30,
  },

  /** Featured hover: micro-lift on top of static elevation */
  featuredHover: {
    translateY: -12,
    shadow: '0 35px 80px rgba(99, 102, 241, 0.3)',
    zIndex: 35,
  },
} as const;

export type PlanTier = keyof typeof PRICING_VISUAL_RULES;
