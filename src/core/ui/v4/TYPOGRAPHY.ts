/**
 * TYPOGRAPHY — Corvioz v4 Visual Authority
 *
 * Canonical type scale definitions.
 * All typography is applied via CSS class names.
 * No font-size, font-weight, or line-height may appear as inline styles.
 */

export const TYPOGRAPHY = {
  classes: {
    /** Page-level hero heading */
    heroTitle: 'hero-title',
    /** Hero subtitle / lead paragraph */
    heroLede: 'hero-lede',
    /** Section eyebrow / kicker label */
    sectionKicker: 'section-kicker',
    /** Section primary heading */
    sectionTitle: 'section-title',
    /** Section supporting text */
    sectionLede: 'section-lede',
    /** Card heading */
    cardTitle: 'card-title',
    /** Card body text */
    cardBody: 'card-body',
    /** Pricing plan name */
    planName: 'plan-name',
    /** Pricing price figure */
    priceStrong: 'price-line',
  },

  /**
   * Scale contract (CSS vars only — actual values live in tokens.css).
   * These are documentation references, not runtime values.
   */
  scale: {
    xs: 'var(--text-xs)',
    sm: 'var(--text-sm)',
    base: 'var(--text-base)',
    lg: 'var(--text-lg)',
    xl: 'var(--text-xl)',
    '2xl': 'var(--text-2xl)',
    '3xl': 'var(--text-3xl)',
    hero: 'clamp(2.8rem, 6vw, 5.2rem)',
  },
} as const;
