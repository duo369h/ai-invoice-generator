# Corvioz Beta Growth Infrastructure Report

Date: 2026-06-22

## Scope

Implemented growth infrastructure only. No new business workflow features were added.

## Implemented

### 1. Feedback Widget

- Added a global floating feedback button.
- Added a feedback modal with rating, message, optional email, and optional screenshot capture.
- Screenshot capture uses the existing `html2canvas` dependency and excludes the feedback UI itself.
- Feedback submits through `/api/feedback`.
- Feedback is stored in Supabase table `public.beta_feedback` when `SUPABASE_SERVICE_ROLE_KEY` is configured.
- If Supabase service-role storage is not configured locally, or the migration has not been applied yet, the API returns a safe non-blocking response instead of breaking the user flow.

Files:

- `src/app/components/BetaGrowthShell.js`
- `src/app/api/feedback/route.js`
- `src/app/globals.css`
- `src/app/layout.js`
- `supabase/schema.sql`

### 2. Beta Banner

- Added a global sticky banner with the text `Corvioz Beta`.
- Added a feedback CTA that opens the feedback widget.
- Added a Metrics link to the Beta Growth dashboard.

Files:

- `src/app/components/BetaGrowthShell.js`
- `src/app/layout.js`
- `src/app/globals.css`

### 3. User Acquisition Dashboard

Tracked and persisted these events to Supabase:

- `landing_view`
- `invoice_create`
- `quote_create`
- `export_attempt`
- `pricing_view`
- `signup_start`
- `signup_complete`

Implementation details:

- Existing `trackEvent` remains the single client analytics entry point.
- Added a Supabase growth-event persistence bridge in `src/app/lib/analytics.js`.
- Added `/api/growth/events` to store whitelisted growth events in `public.growth_events`.
- Existing route-entry, export, pricing, and signup tracking paths are reused instead of duplicating business logic.

Files:

- `src/app/lib/analytics.js`
- `src/app/api/growth/events/route.js`
- `supabase/schema.sql`

### 4. Beta Metrics Dashboard

Added `/dashboard/beta-growth` with:

- Activation rate
- Export rate
- Signup rate
- Paid conversion rate
- Event counts for the acquisition funnel
- Session summary and recent event stream
- 7 / 30 / 90 day windows

Metrics source:

- `/api/beta-growth/metrics`
- Supabase table `public.growth_events`

Rate definitions:

- Activation rate: sessions with `invoice_create` or `quote_create` divided by landing sessions.
- Export rate: sessions with `export_attempt` divided by activated sessions, falling back to landing sessions.
- Signup rate: sessions with `signup_complete` divided by `signup_start`, falling back to landing sessions.
- Paid conversion rate: sessions with `payment_success` divided by `signup_complete`, falling back to landing sessions.

Files:

- `src/app/dashboard/beta-growth/page.js`
- `src/app/api/beta-growth/metrics/route.js`
- `supabase/schema.sql`

## Supabase Schema

Added:

- `public.growth_events`
- `public.beta_feedback`

Security posture:

- RLS enabled on both tables.
- Only `service_role` can manage these records.
- Client writes go through Next.js API routes.

Production requirement:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

## Verification

Commands run:

```bash
npm run lint
npm run build
```

Results:

- `npm run lint`: passed
- `npm run build`: passed
- Build output includes:
  - `/api/feedback`
  - `/api/growth/events`
  - `/api/beta-growth/metrics`
  - `/dashboard/beta-growth`

## Notes

- The repository already had extensive analytics instrumentation. This sprint reused those events and added Supabase persistence for the requested Beta growth layer.
- Local Supabase storage depends on service-role env configuration and the `growth_events` / `beta_feedback` schema being applied. The app is designed to fail open for users and show a clear unconfigured or schema-not-applied state in the dashboard.
