/**
 * VisualLanguage — Corvioz v4 Visual Authority
 *
 * Declares the complete visual language contract.
 * All visual properties must trace back to CSS tokens defined in tokens.css.
 * No hex color, raw px value, or shadow string may appear in UI layer files.
 *
 * RULE: UI components consume CSS variables. This file documents the contract.
 */

export const VisualLanguage = {
  /**
   * Color authority: all colors must use CSS variables from tokens.css.
   * ❌ Forbidden in UI layer: '#6366f1', 'rgba(99,102,241,...)', '#fff'
   * ✅ Required: 'var(--primary)', 'var(--text-main)', 'var(--bg-card)'
   */
  colors: 'CSS_VARS_ONLY' as const,

  /**
   * Spacing authority: all spacing must use CSS variables or Tailwind-mapped vars.
   * ❌ Forbidden: '24px', '1.5rem' inline
   * ✅ Required: 'var(--space-6)', 'var(--space-4)' via CSS classes
   */
  spacing: 'CSS_VARS_ONLY' as const,

  /**
   * Typography authority: font-size, font-weight, line-height via CSS classes.
   * ❌ Forbidden in page.js: fontSize: '1.18rem', fontWeight: 800
   * ✅ Required: className="section-title", className="section-lede"
   */
  typography: 'CSS_CLASS_ONLY' as const,

  /**
   * Shadow authority: all box-shadow values from tokens.css shadow vars.
   * ❌ Forbidden: '0 8px 30px rgba(99, 102, 241, 0.35)' inline
   * ✅ Required: 'var(--shadow-lg)', 'var(--shadow-primary)'
   */
  shadows: 'CSS_VARS_ONLY' as const,

  /**
   * Transform authority: only via CSS class states.
   * ❌ Forbidden: style={{ transform: 'scale(1.04)' }}
   * ✅ Required: CSS .pricing-card.featured { transform: scale(1.04) }
   */
  transforms: 'CSS_CLASS_ONLY' as const,
} as const;
