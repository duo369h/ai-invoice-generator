/**
 * COLOR_SYSTEM — Corvioz v4 Visual Authority
 *
 * Canonical color token registry.
 * Maps semantic color names to their CSS variable references.
 * This is the ONLY source of color decisions in Corvioz.
 *
 * ❌ NEVER add hex codes here.
 * ✅ ALWAYS reference var(--token-name) from tokens.css.
 */

export const COLOR_SYSTEM = {
  // Brand
  primary: 'var(--primary)',
  primaryGlow: 'var(--primary-glow)',
  primaryHover: 'var(--primary-hover)',

  // Accent
  accent: 'var(--accent)',
  accentGlow: 'var(--accent-glow)',

  // Success / Status
  success: 'var(--success)',
  successText: 'var(--success-text)',
  successGlow: 'var(--success-glow)',
  danger: 'var(--danger)',
  dangerText: 'var(--danger-text)',
  warning: 'var(--warning)',

  // Backgrounds
  bgPage: 'var(--bg-page)',
  bgMain: 'var(--bg-main)',
  bgSurface: 'var(--bg-surface)',
  bgCard: 'var(--bg-card)',
  hero: 'var(--hero-bg)',

  // Text
  textMain: 'var(--text-main)',
  textMuted: 'var(--text-muted)',
  textSoft: 'var(--text-soft)',

  // Borders
  border: 'var(--border)',
  borderHover: 'var(--border-hover)',
  borderFocus: 'var(--border-focus)',

  // Buttons
  btnPrimaryBg: 'var(--btn-primary-bg)',
  btnPrimaryText: 'var(--btn-primary-text)',
  btnSecondaryBg: 'var(--btn-secondary-bg)',

  // Misc
  white: 'var(--white)',
  black: 'var(--black)',
} as const;

export type ColorToken = keyof typeof COLOR_SYSTEM;
