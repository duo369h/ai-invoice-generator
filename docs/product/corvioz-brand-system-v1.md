# Corvioz Brand System v1 (Lightweight Systemization)

This document establishes the official brand visual system, design tokens, navigation structures, button specifications, and visual hierarchy rules for Corvioz to ensure a cohesive SaaS product experience across all marketing, auth, dashboard, and portal surfaces.

---

## 🎨 1. Design Tokens Alignment

Both the **Marketing Layer** (Landing, Pricing, Blogs) and the **App Layer** (Dashboard, Client Portal, Auth Setup) share a unified visual language powered by the following tokens in [globals.css](file:///Users/duo/Documents/想做个网站/corvioz/src/app/globals.css):

### Color Palette
- **Primary Indigo (`--primary`)**: `#4F46E5` (Hover: `#4338ca`) — Used for primary CTAs, active states, focus outlines, and primary brand accents.
- **Accent Cyan (`--accent`)**: `#06B6D4` (Hover: `--accent-hover`) — Used for secondary highlights, badge status tags, and decorative gradients.
- **Base Background (`--bg-page`)**: 
  - *Light Mode*: `#f8fafc` (Slate-50)
  - *Dark Mode*: Radial gradient overlay from top + `#0B0F17` (Deep dark canvas)
- **Surface/Card Background (`--bg-card` / `--bg-surface`)**:
  - *Light Mode*: `#ffffff` (White card container)
  - *Dark Mode*: `#111827` (Slate-900)
- **Borders (`--border`)**:
  - *Light Mode*: `#e2e8f0` (Slate-200)
  - *Dark Mode*: `#1f2937` (Slate-800)

### Spacing & Layout Scales
- **Common Radius System**:
  - `--radius-lg`: `8px` — Used for all modular layouts, form cards, and dialog wrappers.
  - `--radius-md`: `8px` — Used for input boxes, button containers, and list rows.
  - `--radius-sm`: `8px` — Unified scale for badges, tags, and small utility slots.
- **Shadow Scale**:
  - `var(--shadow-sm)`: Slight elevation for input groups.
  - `var(--shadow-md)`: Default resting card shadows.
  - `var(--shadow-lg)`: Hover cards, active popovers, and dialogs.
  - `var(--shadow-glow)`: Indigo/Cyan glow outlines reserved for featured cards and premium activations.

---

## 🖼️ 2. Logo Usage System

The branding mark and title must be rendered using a single, reusable component to prevent layout shifts or visual inconsistencies:

### Component Definition
- Rendered via **`<Logo />`** (with helper sub-component **`<BrandMark />`**).
- **SVG Coordinates**: Rendered in a strict `32x32` viewBox.
- **Click Behavior**: The entire logo container (symbol + text) is wrapped in a Next.js `<Link>` pointing to the homepage (`/`).
- **Hover Behavior**: Handled globally in CSS (`.logo-container:hover`) with a standard opacity drop (`opacity: 0.85`), removing all text underlines.
- **Visual Baseline**: 
  - Spacing between SVG mark and text: `8px`.
  - Font Weight: `800`.
  - Letter Spacing: `-0.02em`.
  - Color: Inherits `var(--text-main)` dynamically, adapting instantly to light/dark themes.

---

## 🧭 3. Navbar System Rules

Standardized headers are enforced on all public and protected marketing endpoints:

- **Logo Placement**: Fixed to the top-left corner (`justify-content: space-between`).
- **Logo Size Rules**:
  - Landing and general public pages: `<Logo size={24} />`
  - Dashboard workspace sidebar and small headers: `<Logo size={20} />`
- **Responsiveness**: 
  - Standard desktop padding: `padding: 0 2rem;`.
  - Mobile layout override (screens < 480px): Reducer padding `padding: 0 1rem;` injected globally in CSS to prevent navigation button clipping.
  - Inline padding declarations are strictly prohibited to allow override inheritance.

---

## 🔘 4. Button System Standardization

Buttons are divided into two main categories to guide user interaction pathways:

```
┌────────────────────────────────────────────────────────┐
│ Primary: Start Free (Conversion) / Send Invoice (Action)│
│ Secondary: View Details / Copy Links / Cancel Actions  │
└────────────────────────────────────────────────────────┘
```

### Style Rules
1. **Primary Buttons (`.btn-primary` / `<Button variant="primary">`)**:
   - Background: `var(--btn-primary-bg)` (`#4F46E5`)
   - Text color: `var(--btn-primary-text)` (`#ffffff`)
   - Border radius: `8px` (`var(--radius-md)`)
   - Font weight: `600`
   - Shadow: `var(--shadow-sm)`
   - Hover state: `transform: translateY(-1px)`, increased shadow, and background shift to `#4338ca`.

2. **Secondary Buttons (`.btn-secondary` / `<Button variant="secondary">`)**:
   - Background: `var(--btn-secondary-bg)` (`#ffffff` / surface)
   - Border: `1px solid var(--border)`
   - Text color: `var(--text-main)`
   - Border radius: `8px` (`var(--radius-md)`)
   - Font weight: `600`
   - Hover state: `transform: translateY(-1px)`, background shift to `var(--btn-secondary-hover-bg)`.

3. **Google Sign-in Buttons (`.btn-google` / `<Button variant="google">`)**:
   - Background: `var(--btn-secondary-bg)`
   - Border: `1px solid var(--border)`
   - Text color: `var(--text-main)`
   - Width: `100%` (stretches to card width)
   - Hover state: `transform: translateY(-1px)`, border hover color shift.

4. **Disabled/Loading States**:
   - Opacity: `0.6`
   - Cursor: `not-allowed`
   - Hover transforms are disabled.

---

## 📊 5. Marketing Layer vs. Workspace App Strategy

While the page objectives differ, the overall brand identity remains identical:

### Landing (Conversion Layer)
- **Objective**: Drive high-converting paths, explain value in 5 seconds, and direct users to `/pricing` or `/dashboard`.
- **Styling**: Uses bold typography gradients, larger font sizes (`4.5rem` on hero headings), prominent badge kickers, and extensive card grids showcasing live product mockups.

### Dashboard (Execution Layer)
- **Objective**: Simplify user workflows (leads list, milestone estimates, itemized billing invoices).
- **Styling**: Uses strict grid tables, responsive sidebars, smaller font sizes (`1.1rem` for card titles), and actionable form groups.
- **Consistency**: Uses the same slate borders, background tokens, card styling, and primary indigo buttons to make the transition from landing page to workspace feel like a single, seamless product.

---

## 📈 6. SEO + UI Consistency Rules

- **Heading Hierarchy**:
  - **H1**: Restricted to a single declaration per page (e.g. Hero titles).
  - **H2**: Section headers (`.section-title` in marketing, card headings in dashboard).
  - **H3**: Card grid items, itemized tables, or sidebar widgets.
- **Metadata**: Unified using Next.js Metadata API. Title configurations follow standard formatting: `[Feature/Page Title] | Corvioz`.
- **OG Images**: Configured programmatically using centralized SVG/PNG assets at root to ensure social shares render clean cards.

---

## 📦 7. Reusable Components List

All components are located in [UIComponents.js](file:///Users/duo/Documents/想做个网站/corvioz/src/app/components/UIComponents.js):

- **`<Logo />`**: Handles unified logo rendering and click-to-home behavior.
- **`<BrandMark />`**: Isolates the SVG mark for standalone placement (e.g. footer background decorations).
- **`<Button />`**: Generic button wrapper supporting primary, secondary, and google checkouts.
- **`<Card />`**: Resting container applying standard background, borders, and hover elevations.
- **`<Badge />`**: Small pills signaling status, plans, or kicker tags.
- **`<Section />`**: Marketing section block ensuring consistent vertical padding.
- **`<Hero />`**: Hero section with layout configurations.
- **`<PricingCard />`**: Flat pricing cards with popular highlighting.
- **`<MetricCard />`**: Dashboard overview indicators.

---

## ⚠️ 8. Resolved Inconsistencies & Migration Notes

### Historical Issues Fixed
1. **Logo redundancy**: Removed inline copy-paste SVG code across `/auth`, `/pricing`, `/client`, `/freelancers`, `/terms`, `/privacy`, `/refund-policy`, `/contact`, and programmatic SEO page layouts. All routes now import and render `<Logo />`.
2. **Button Radius Mismatch**: Base `.btn` classes in `globals.css` used `6px` radius and `500` font weight, while React `<Button>` used `8px` radius and `600` weight. These have been synchronized to `var(--radius-md)` (`8px`) and `600` weight globally.
3. **Responsive Navbar Padding**: Navbar padding overrides have been removed from pages, relying on the unified media queries inside `globals.css`.

### Verification Routine
To maintain compilation safety, any new feature addition must satisfy:
```bash
# Verify static code and react syntax compatibility
npm run lint

# Compile next.js bundle and verify routing structures
npm run build
```
No inline styles should override custom color/padding variables.
