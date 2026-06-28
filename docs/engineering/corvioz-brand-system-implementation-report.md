# Corvioz Brand System v1 Implementation Report

Generated: 2026-06-20

## Executive Status

Brand System v1 is now enforced at the shared UI component layer for the highest-impact primitives:

- `<Logo />`
- `<Button />` with `primary`, `secondary`, and `google` variants
- `<Card />`
- `<Badge />`
- global `.navbar`, `.logo-container`, `.btn`, `.card`, and `.badge` CSS foundations

The implementation was intentionally scoped to design-system enforcement and component reuse. No new product features were added, and no architecture refactor was performed.

## Components Unified

### Logo

Unified duplicated Corvioz brand mark SVG usage into the shared `<Logo />` / `<BrandMark />` components.

Updated pages/components:

- `src/app/payment-instructions/page.js`
- `src/app/components/ProgrammaticSeoPage.js`
- `src/app/components/TemplateSeoPage.js`
- `src/app/components/SeoMoneyPage.js`
- `src/app/components/MatrixSeoPage.js`
- `src/app/components/MatrixCountryPage.js`

Verification:

- Remaining `viewBox="0 0 32 32"` brand SVG usage is limited to `src/app/components/UIComponents.js` and app icon assets.
- SEO template navbars now import and render `<Logo />` instead of maintaining their own SVG copies.

### Button System

Moved `<Button />` away from inline visual styling and hover mutation logic.

Current enforcement:

- `variant="primary"` maps to `.btn.btn-primary`
- `variant="secondary"` maps to `.btn.btn-secondary`
- `variant="google"` maps to `.btn.btn-google`
- `size="sm"` maps to `.btn-sm`
- `size="lg"` maps to `.btn-lg`
- disabled states are handled globally via `.btn:disabled` and `.btn[aria-disabled="true"]`

Updated usage:

- Auth page Google sign-in and magic-link submit now use `<Button />`.
- Pricing navbar and plan CTA buttons now use `<Button />`.
- Landing page was already using `<Button />` and now inherits the tokenized class system.

### Card System

Updated `<Card />` to rely on the global `.card` styling instead of duplicating visual styles inside the component.

Current enforcement:

- background: `var(--bg-card)`
- border: `var(--border)`
- radius: `var(--radius-lg)`
- shadow: `var(--shadow-md)` / `var(--shadow-lg)`
- glow hover support via `.hover-glow`

### Badge System

Updated `<Badge />` to use global class variants:

- `.badge-primary`
- `.badge-accent`
- `.badge-success`
- `.badge-warning`

Badge radius now uses `var(--radius-pill)`.

### Navbar System

Navbar remains globally defined through `.navbar`, `.nav-links`, `.nav-link`, and `.logo-container`.

Improvements:

- Logo wordmark styling is centralized in `.logo-wordmark`.
- Repeated navbar logo SVGs were removed from SEO template pages.
- Auth, pricing, landing, and SEO navbars now align around shared primitives.

## Design Token Enforcement

Updated token layer:

- Added `--radius-pill` to global CSS.
- Confirmed standard radius tokens resolve to `8px`:
  - `--radius-sm`
  - `--radius-md`
  - `--radius-lg`
- Confirmed primary and accent brand colors:
  - `--primary: #4F46E5`
  - `--accent: #06B6D4`
- Added `shadow.glow` to `src/app/design-system/tokens.js`.

Updated global component styling:

- `.btn`
- `.btn-primary`
- `.btn-secondary`
- `.btn-google`
- `.btn-sm`
- `.btn-lg`
- `.card`
- `.badge`
- `.logo-container`
- `.logo-wordmark`

## Legacy Styles Removed

Removed or replaced:

- duplicated inline Logo SVGs in SEO and payment pages
- inline visual style construction inside `<Button />`
- inline hover style mutation inside `<Button />`
- inline visual style construction inside `<Card />`
- inline variant style construction inside `<Badge />`
- duplicate `.btn-google` CSS block
- hardcoded `6px` form input radius in the base input system

## Inconsistencies Fixed

- Auth page now uses shared `<Logo />`, `<Badge />`, and `<Button />`.
- Pricing page core CTAs now use shared `<Button />`.
- SEO page navbars now use shared `<Logo />`.
- Button hover, disabled, size, and variant behavior now comes from global Brand System classes.
- Logo wordmark letter spacing is centralized and no longer duplicated inline in SEO templates.

## Remaining Risks

These are intentionally not fully rewritten in this sprint because the instruction was to avoid redesign and architecture refactor:

- Dashboard, portal, and public profile still contain many layout-specific inline styles for dense product UI.
- Some local card-like sections still use `className="card"` plus inline padding/background overrides.
- Some historical CSS sections still contain local radii for specialized UI mockups, pricing toggles, pills, skeletons, and modal/detail surfaces.
- Email HTML still has inline brand colors and radii because email clients require inline styles; this should be treated separately from app UI CSS.
- Several SEO/page templates still use direct `Link className="btn ..."` in low-risk CTA locations. The shared CSS now enforces those visually, but not every call site has been converted to `<Button />`.

## Verification

Passed:

- `npm run lint`
- `npm run build`

Build evidence:

- Next.js production build compiled successfully.
- TypeScript completed successfully.
- Static generation completed for 955 pages.
- Core routes including `/`, `/auth`, `/dashboard`, `/pricing`, `/client`, `/card/[username]`, `/portal/[token]`, `/sitemap.xml`, and `/robots.txt` remained available in the production build route table.

## Final Readiness Call

Brand System v1 is enforceable at the shared primitive layer and applied to the highest-impact entry surfaces.

Not every historical inline style across the full app has been eliminated. The remaining work is cleanup debt, not a blocker for the shared Brand System v1 primitives now being the source of truth.
