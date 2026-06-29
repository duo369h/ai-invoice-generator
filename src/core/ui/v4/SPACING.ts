/**
 * SPACING — Corvioz v4 Visual Authority
 *
 * Canonical spacing scale.
 * All layout spacing is applied via CSS variables or utility classes.
 * No raw px/rem values may appear as inline styles in UI files.
 */

export const SPACING = {
  /**
   * Spacing token map (values defined in tokens.css).
   * Reference only — do not use these strings directly in JSX style props.
   */
  tokens: {
    1: 'var(--space-1)',   // 4px
    2: 'var(--space-2)',   // 8px
    3: 'var(--space-3)',   // 12px
    4: 'var(--space-4)',   // 16px
    5: 'var(--space-5)',   // 20px
    6: 'var(--space-6)',   // 24px
    8: 'var(--space-8)',   // 32px
    10: 'var(--space-10)', // 40px
    12: 'var(--space-12)', // 48px
    16: 'var(--space-16)', // 64px
    20: 'var(--space-20)', // 80px
    24: 'var(--space-24)', // 96px
  },

  /**
   * Section padding standards.
   * Applied via .section class in layouts.css, not inline.
   */
  section: {
    default: 'var(--space-12) var(--space-6)',
    hero: '96px 24px 72px',
    compact: 'var(--space-8) var(--space-6)',
  },
} as const;
