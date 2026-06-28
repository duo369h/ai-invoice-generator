# Corvioz Button Interaction Fix Report

Date: 2026-06-20

## Scope

Critical dashboard interaction fix for:

- `Create Quote` -> `/quotes/create`
- `Create Invoice` -> `/invoices/create`

Constraints followed:

- No UI redesign
- No layout changes
- No database schema changes
- Interaction and routing logic only

## Findings

### 1. Button component passes `onClick`

The shared `Button` component in `src/app/components/UIComponents.js` correctly passes `onClick` to both:

- `Link` when `href` is provided
- native `button` when no `href` is provided

No shared Button component bug was found.

### 2. Dashboard buttons receive handlers

`src/app/dashboard/components/DashboardOverview.js` renders the primary dashboard CTA buttons as native buttons:

```jsx
<button onClick={onCreateQuote} className="btn btn-primary" style={{ width: '100%' }}>Create Quote</button>
<button onClick={onCreateInvoice} className="btn btn-secondary" style={{ width: '100%' }}>Create Invoice</button>
```

The onboarding checklist also passes `step.action` into `onClick`.

### 3. Missing URL-level routes caused the interaction mismatch

Before this fix:

- The buttons opened the internal Dashboard tab/form state.
- There were no App Router pages for `/quotes/create` or `/invoices/create`.
- Users expecting URL navigation had no route-level destination.

Root cause: the dashboard create actions were state-only interactions, while the production requirement expects route navigation.

### 4. No CSS blocker found

Checked dashboard/button CSS for pointer-event and overlay issues.

Relevant button CSS only disables pointer events for disabled buttons:

```css
.btn:disabled,
.btn[aria-disabled="true"] {
  pointer-events: none;
}
```

The affected buttons are not rendered disabled. No z-index overlay or dashboard pointer-event blocker was changed.

### 5. `use client` is present

`DashboardClient.js`, `DashboardOverview.js` consumers, and shared interactive components are running through client components. Missing `use client` was not the root cause.

## Fix

### Updated Dashboard create handlers

`src/app/dashboard/DashboardClient.js` now updates the browser URL while preserving the existing internal form behavior:

- `initCreateQuote()` calls `router.push('/quotes/create', { scroll: false })`
- `initCreateInvoice()` calls `router.push('/invoices/create', { scroll: false })`

The existing tab switch and create-form state remain unchanged.

### Added route bridges

Added two thin App Router pages:

- `src/app/quotes/create/page.js`
- `src/app/invoices/create/page.js`

They reuse the same Dashboard UI and pass the initial tool:

```jsx
<DashboardClient initialTool="quote" />
<DashboardClient initialTool="invoice" />
```

This means direct URL access, refresh, and CTA navigation all land on the right create workflow.

## Files Changed

- `src/app/dashboard/DashboardClient.js`
- `src/app/quotes/create/page.js`
- `src/app/invoices/create/page.js`
- `corvioz-button-interaction-fix-report.md`

## Verification

### Build checks

```text
npm run lint
Exit: 0

npm run build
Exit: 0
```

Build route table now includes:

```text
├ ƒ /invoices/create
├ ƒ /quotes/create
```

### Local production route checks

Started local production server:

```text
npm run start -- -H 127.0.0.1 -p 3001
```

Verified route responses:

```text
curl -I -L http://127.0.0.1:3001/quotes/create
HTTP/1.1 200 OK

curl -I -L http://127.0.0.1:3001/invoices/create
HTTP/1.1 200 OK

curl -I -L http://127.0.0.1:3001/dashboard
HTTP/1.1 200 OK
```

### Render payload checks

The local rendered payload confirms:

- `/quotes/create` renders `DashboardClient` with `initialTool="quote"`
- `/invoices/create` renders `DashboardClient` with `initialTool="invoice"`

### Browser click verification

Automated browser click verification was not run because this repo does not include a local Playwright dependency in `node_modules`, and no browser automation package was installed for this sprint.

The interaction path was verified by source inspection and route-level checks:

- CTA buttons pass `onClick`.
- Handler now calls `router.push()` to the required route.
- Required routes exist and return HTTP 200.

## Expected Production Result After Deploy

- Clicking `Create Quote` navigates to `/quotes/create` and opens the quote creation workflow.
- Clicking `Create Invoice` navigates to `/invoices/create` and opens the invoice creation workflow.
- Existing Dashboard UI, layout, and styling remain unchanged.
