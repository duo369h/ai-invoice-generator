# Corvioz Dashboard Unified Architecture Specification

**Date:** 2026-06-20  
**Version:** 1.0  
**Status:** Implemented  

This document details the refactored unified **Dashboard Architecture** which consolidated multiple route-specific dashboard panels into a single reusable core component (`Dashboard.js`) running under different operation modes.

---

## 1. Unified Operation Modes

The system operates under three distinct states controlled by the `mode` prop on the unified `<Dashboard mode={...} />` component:

```typescript
type DashboardMode = 'live' | 'demo' | 'preview';
```

### 1.1. Live Mode (`mode="live"`)
- **Route:** `/dashboard`, `/invoices/create`, `/quotes/create`
- **Data Hook:** Connects to the real Supabase client and backend APIs (`/api/invoices`, `/api/quotes`, etc.).
- **Permissions:** Full read/write access. All mutations hit the live database.
- **Redirects:** Authenticates the user and redirects to `/auth` if no valid session or signup intent exists.

### 1.2. Demo Mode (`mode="demo"`)
- **Route:** `/demo`
- **Data Hook:** Uses rich, preset baseline mock data stored in local state.
- **Permissions:** Full read/write access simulated inside browser state (no network requests). Allows full creation/deletion of leads, quotes, invoices, and profile updates.
- **Reset State:** Displays a warning banner showing "DEMO SANDBOX MODE" with an option to "Reset Demo Data" which resets browser state back to original presets.

### 1.3. Preview Mode (`mode="preview"`)
- **Route:** `/` (Embedded inside the landing page ProductPreview section)
- **Data Hook:** Reads read-only baseline mock data in local state.
- **Permissions:** Zero mutations allowed. All interactive fields are disabled.
- **Navigation Safeguards:** 
  - Prevents tabs switching and routing triggers.
  - Captures clicks and intercepts them using standard React handlers: `onClickCapture={previewMode ? (e) => { e.preventDefault(); e.stopPropagation(); } : undefined}`.
- **Visual Parity:** Renders the exact actual Dashboard UI shell, metrics, sidebar, and layout spacing identical to production without scaled or cropped screenshots.

---

## 2. Core Architecture Files

### 2.1. Unified State Hook: `src/hooks/useDashboardData.js`
Manages standard dashboard entities: `user`, `leads`, `quotes`, `invoices`, `clients`, and `cardProfile`.
- Leverages React state and standard fetch calls for `live` mode.
- Intercepts mutating actions (`saveQuote`, `saveInvoice`, `deleteQuote`, etc.) and performs local-only modifications in `demo` mode.
- Exposes `resetDemoData()` to reset local states.

### 2.3. Unified Permission Hook: `src/hooks/useDashboardMode.js`
Translates the operation mode into feature toggle flags:
- `isLive`: mode is live
- `isDemo`: mode is demo
- `isPreview`: mode is preview
- `isReadOnly`: mode is preview
- `isInteractive`: mode is not preview
- `isResettable`: mode is demo
- `allowNavigation`: mode is not preview
- `allowMutations`: mode is not preview

---

## 3. Benefits of the Unified System
1. **Single Source of Truth:** Any change to a sidebar item, metric card styling, or bento profile layout instantly reflects in production, the interactive demo page, and the landing page mockup.
2. **Reduced Bundle Size:** Eliminates old route-specific duplications.
3. **Enhanced Customer Trust:** The product preview on the home page matches the actual product perfectly.
