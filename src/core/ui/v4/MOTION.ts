/**
 * MOTION — Corvioz v4 Visual Authority
 *
 * Canonical animation and transition contract.
 * Every transform value, transition curve, and animation duration
 * used in CSS must be documented here as the authority record.
 *
 * NOTE: CSS `transform: translateY()` cannot consume CSS vars as function args
 * in a composable way. MOTION.ts serves as the DECISION RECORD.
 * CSS is the EXECUTION LAYER that implements these exact values.
 *
 * RULE: If a transform value exists in CSS but not here — it is UNAUTHORIZED.
 */

export const MOTION = {
  /**
   * Easing curves.
   * CSS execution: transition timing-function values.
   */
  easing: {
    /** Standard UI easing (default) */
    standard: 'cubic-bezier(0.16, 1, 0.3, 1)',
    /** Snappy micro-interaction */
    snap: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
    /** Simple ease-out */
    out: 'ease-out',
  },

  /**
   * Transition durations (ms).
   */
  duration: {
    instant: '150ms',
    fast: '200ms',
    standard: '250ms',
    smooth: '320ms',
    slow: '500ms',
  },

  /**
   * Hover lift values (translateY).
   * These are the ONLY authorized lift values for interactive elements.
   *
   * CSS execution: `transform: translateY(<value>)`
   */
  lift: {
    /** Button hover micro-lift */
    sm: '-1px',
    /** Standard card hover lift */
    md: '-4px',
    /** Featured card static elevation base */
    lg: '-8px',
    /** Featured card hover (on top of lg) */
    featuredHover: '-12px',
    /** Pricing card static base (non-featured) */
    zero: '0px',
  },

  /**
   * Scale values.
   * ONLY the pricing featured card may use scale transforms.
   * No other component may use scale in production UI.
   */
  scale: {
    /** Featured pricing card static dominance */
    featured: 'scale(1.04)',
    /** Default — no scale */
    none: 'scale(1)',
  },

  /**
   * Rotation values.
   * Used ONLY for hamburger menu icon animation.
   */
  rotation: {
    open45: 'rotate(45deg)',
    close45: 'rotate(-45deg)',
  },
} as const;
