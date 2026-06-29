/**
 * SURFACES — Corvioz v4 Visual Authority
 *
 * Canonical surface / background contract.
 * Every `rgba()` background value in CSS must trace to a token declared here.
 *
 * RULE: No raw rgba() or hex color may appear in components.css or layouts.css.
 * All surface colors must be CSS variables defined in tokens.css.
 */

export const SURFACES = {
  /**
   * Wireframe / mockup skeleton surfaces.
   * Used in ProductPreview and screenshot gallery mockups.
   */
  wireframe: {
    /** Default skeleton bar background */
    bar: 'var(--surface-wireframe-bar)',
    /** Accent skeleton bar (slightly brighter) */
    accent: 'var(--surface-wireframe-accent)',
    /** Placeholder region background (blueprint panel) */
    placeholderBg: 'var(--surface-wireframe-placeholder-bg)',
    /** Placeholder region border (dashed blueprint border) */
    placeholderBorder: 'var(--surface-wireframe-placeholder-border)',
    /** Window dot highlight */
    windowDot: 'var(--surface-window-dot)',
  },

  /**
   * Status badge surfaces.
   */
  status: {
    /** Paid / success badge background */
    paid: 'var(--surface-paid-bg)',
    /** Success glow (already in tokens) */
    successGlow: 'var(--success-glow)',
  },

  /**
   * Dark overlay surfaces (product preview cards, screenshot backgrounds).
   */
  dark: {
    /** Dark card overlay for product-preview-card */
    card: 'var(--surface-dark-card)',
    /** Dark overlay for screenshot window mockup */
    overlay: 'var(--surface-dark-overlay)',
    /** Workflow container radial gradient bg */
    workflow: 'var(--surface-workflow-bg)',
  },

  /**
   * Landing nav surfaces.
   */
  nav: {
    /** Landing navbar frosted glass background */
    landingBg: 'var(--navbar-landing-bg)',
    /** Landing navbar border */
    landingBorder: 'var(--navbar-landing-border)',
  },
} as const;
