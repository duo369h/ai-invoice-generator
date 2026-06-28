# Corvioz UI & Design System 2.0 Specification

**Date:** 2026-06-20  
**Version:** 2.0  
**Status:** Implemented  

This document details the architecture, design tokens, and components that make up the unified **Corvioz UI System 2.0**.

---

## 1. Design Tokens Core

All visual properties are centralized under `src/styles/tokens/` to ensure full consistency across marketing (landing pages) and product (dashboard, client portal) layers.

### 1.1. Spacing System (`spacing.js`)
Centralized spacing increments to maintain layout rhythm and consistent padding.
- `xs`: `4px` (subtle gap)
- `sm`: `8px` (button gap)
- `md`: `12px` (small card gap)
- `lg`: `16px` (standard padding)
- `xl`: `24px` (large padding/card spacing)
- `2xl`: `32px` (section spacing)
- `3xl`: `48px` (hero spacing)

### 1.2. Border Radius (`radius.js`)
Cohesive corners to align branding curvature.
- `sm`: `6px` (badges, inputs)
- `md`: `8px` (standard buttons, small cards)
- `lg`: `12px` (dialogs, main panels)
- `pill`: `999px` (fully rounded elements)

### 1.3. Shadows & Glows (`shadows.js`)
Interactive depth variables supporting glassmorphism and modern focus states.
- `sm`: `var(--shadow-sm)`
- `md`: `var(--shadow-md)`
- `lg`: `var(--shadow-lg)`
- `glow`: `var(--shadow-glow)` (premium focal points)

### 1.4. Semantic Color Palette (`colors.js`)
Direct CSS Variable integration mapping light/dark modes automatically.
- `page`: `var(--bg-page)`
- `card`: `var(--bg-card)`
- `panel`: `var(--btn-secondary-bg)`
- `border`: `var(--border)`
- `textMain`: `var(--text-main)`
- `textMuted`: `var(--text-muted)`
- `primary`: `var(--primary)`
- `accent`: `var(--accent)`
- `success`: `var(--success)`
- `warning`: `var(--warning)`
- `danger`: `var(--danger)`

### 1.5. Typography Scale (`typography.js`)
Consolidated font scaling and weights.
- `sans`: `var(--font-sans)`
- `mono`: `var(--font-mono)`
- Weights: `normal` (400), `medium` (500), `semibold` (600), `bold` (700), `extrabold` (850).

---

## 2. Standardized UI Components

Standard components are located in `src/components/ui/` and exported via a single entrypoint: `src/components/ui/index.js`.

### 2.1. Button (`Button.js`)
Provides standard variants (`primary`, `secondary`, `google`, `danger`) and supports client‑side loading indicators, disabled states, and Next.js routing integration.

### 2.2. Card (`Card.js`)
Wrapper component with standard borders, paddings, and background layers conforming to `colors.js` and `radius.js`.

### 2.3. Badge (`Badge.js`)
Renders status labels and category pill tags with standard colors.

### 2.4. Input & Form Elements (`Input.js`)
Contains custom styled `Input`, `TextArea`, and `Select` components with proper focus rings, active states, and dark mode compliance.

### 2.5. Table (`Table.js`)
Grid and item list layout system (`Table`, `TableHeader`, `TableBody`, `TableRow`, `TableCell`) with uniform border lines and spacing.

### 2.6. Modal (`Modal.js`)
Overlay popups with clean blur backdrops (`backdropFilter: 'blur(5px)'`).

### 2.7. Container (`Container.js`)
Layout helper implementing `dashboardTokens.shellPadding` (`40px 48px`) to ensure identical margins on all page dashboards, previews, and empty states.
