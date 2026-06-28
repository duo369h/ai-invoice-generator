# Corvioz Launch Preparation Sprint Report

Date: 2026-06-21
Scope: Launch blockers only, no new features, no redesign
Final Status: Not Ready

## P0 Results

### 1. CSP Google Fonts

Status: Fixed

- `middleware.js` now allows `https://fonts.googleapis.com` in `style-src`.
- `middleware.js` now allows `https://fonts.gstatic.com` in `font-src`.
- Verified production response header includes both domains.
- Verified `/pricing` browser console has 0 CSP errors and 0 warnings.

### 2. Pricing Mobile Overflow

Status: Fixed

- `/pricing` no longer has horizontal page overflow at 320px.
- `/pricing` no longer has horizontal page overflow at 375px.
- Mobile pricing navbar now avoids forcing the document wider than the viewport.
- Pricing cards and testimonial grids now stay inside the viewport.

Verified:

- 320px: `scrollWidth=320`, `clientWidth=320`, `overflow=false`
- 375px: `scrollWidth=375`, `clientWidth=375`, `overflow=false`

### 3. payment_success Terminal State

Status: Fixed

- `payment_success`, `checkout_completed`, and `payment_completed` normalize to `payment_success`.
- `payment_success` now returns terminal `allow`.
- `payment_success` does not trigger `upsell`, `soft_paywall`, upgrade prompts, or psychology layer.
- `psychology.enabled=false`
- `psychology.trigger=none`
- `paywall_trigger_map` is fully false.
- `upgrade_recommendation=none`

## P1 Results

### 1. Dashboard Mobile Navigation Responsiveness

Status: Fixed

- Dashboard sidebar/nav no longer causes page-level horizontal overflow on `/invoices/create`.
- Dashboard sidebar/nav no longer causes page-level horizontal overflow on `/quotes/create`.

Verified:

- `/invoices/create` 320px: `scrollWidth=320`, `clientWidth=320`, `overflow=false`
- `/invoices/create` 375px: `scrollWidth=375`, `clientWidth=375`, `overflow=false`
- `/quotes/create` 320px: `scrollWidth=320`, `clientWidth=320`, `overflow=false`
- `/quotes/create` 375px: `scrollWidth=375`, `clientWidth=375`, `overflow=false`

### 2. Invoice Export Flow

Status: Verified

- Clicking `Download PDF Document` on `/invoices/create` opens the export/paywall explanation UI.
- Free users are shown `Download with Watermark (Free)`.
- Clean export is presented as upgrade-only.
- No silent watermark-free premium export was observed.

### 3. Quote Export Flow

Status: Not Ready

- `/quotes/create` opens in guest/preview mode and allows quote drafting.
- Current quote UI does not expose a quote PDF export button/path.
- Static code search found `handlePdfDownload` only attached to invoice export.
- Quote list actions currently include `Edit`, `Copy Link`, `Delete`, and `Bill Loop`, but no quote PDF export.

Remaining blocker:

- Quote export cannot be manually verified because the export entry point is not present.

## Verification

- `npm run lint`: passed
- `npm run build`: passed
- Production server smoke test on `http://localhost:3133`: passed for checked routes
- CSP response header: verified
- Browser console after CSP fix: 0 errors, 0 warnings on checked pricing page
- Mobile overflow checks: passed for pricing, invoice create, quote create at 320px and 375px
- Control-plane API payment success check: passed
- Control-plane API export paywall check: passed
- Invoice export UI check: passed

## Final Recommendation

Not Ready.

P0 blockers are fixed, but launch should wait until the quote export flow is either:

1. implemented and verified through the same safe export gate as invoice export, or
2. explicitly removed from launch scope and documented as unavailable in beta.

