# Design System Rules (Corvioz Design System v3)

All code generation and CSS edits must adhere to the following architecture rules to prevent UI regressions:

## 5-Layer CSS System
Every style rule must belong to one of these files in `src/app/styles/`:
1. `tokens.css`: Values only (colors, font variables, spacing, radius, shadows, theme variables). Class selectors are strictly FORBIDDEN.
2. `base.css`: Global resets, HTML/body element properties, default typography, animations.
3. `utilities.css`: Atomic helpers only (e.g., `.u-flex`, `.u-center`, `.u-gap-sm`, `.u-text-muted`, `.u-grid`). No components or structures.
4. `components.css`: Reusable component definitions (`.btn`, `.card`, `.pricing-card`, `.badge`, `.logo`, `.metric-card`, etc.). Components must be generic and not know layout structures.
5. `layouts.css`: Page structures and grids (`.navbar`, `.landing-hero`, `.section`, `.container`, `.split-section`, `.workflow-container`). Layouts must not contain typography, colors, or component styles.

## Strict Prohibitions
- NO `section { ... }` or other global tag padding/margin overrides. Use `.section` class instead.
- NO inline transform, scale, or visual layout adjustments for business logic inside React pages.
- NO `!important` flags inside base CSS styles.
- Components must NOT contain logic selectors like `popular ? scale(1.05) : none`. Use styling variants like `variant="featured"` and target them via CSS modifiers.

## Anti-Drift System Rules (MANDATORY)
ANY UI change MUST explicitly declare in the description/summary:
1. Which design system layer the styling belongs to.
2. Why it belongs in that specific layer.
3. Why it is NOT placed in any other layers.

If this declaration is missing or incomplete, the change must be rejected.
