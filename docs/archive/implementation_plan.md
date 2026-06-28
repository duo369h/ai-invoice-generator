# Corvioz Reality Instrumentation Layer v1.4.1 Implementation Plan

This plan details the design and implementation of the **Corvioz Reality Instrumentation Layer v1.4.1**, focused on recording real business milestones instead of operation logs, purging simulated user behaviors, expanding PDF export to include business context, and aligning the Studio tab with the realities of running a service business.

---

## User Review Required

> [!IMPORTANT]
> - **Schema Migration**: This update introduces 6 new metrics columns to the `public.profiles` database table. A SQL migration script is appended to `supabase/schema.sql`.
> - **Removal of Simulators**: Simulated behaviors (such as automated collections timeline nudges) are replaced by manual/real actions.
> - **PDF Export Modal**: Free and Pro users will now see a select menu asking for their export purpose ("draft", "client send", "final invoice", "revision export") before generating a PDF.

## Open Questions

> [!NOTE]
> No critical open questions remain. We will proceed to implement the backend/frontend changes.

---

## Proposed Changes

### Database Schema Update
#### [MODIFY] [schema.sql](file:///Users/duo/Documents/想做个网站/corvioz/supabase/schema.sql)
- Add columns to the `public.profiles` table:
  - `first_invoice_created_at` (`TIMESTAMPTZ`)
  - `first_client_added_at` (`TIMESTAMPTZ`)
  - `invoice_sent_timestamp` (`TIMESTAMPTZ`)
  - `quote_sent_timestamp` (`TIMESTAMPTZ`)
  - `time_to_first_export` (`INTEGER` - seconds from profile created_at to first export)
  - `time_to_first_client_response` (`INTEGER` - seconds from profile created_at to first client feedback)
- Add matching `ALTER TABLE` statements at the bottom of the schema file.

### Backend Telemetry Helper & API Routes
#### [MODIFY] [supabase.js](file:///Users/duo/Documents/想做个网站/corvioz/src/app/lib/supabase.js)
- Implement `trackProfileMetric(supabase, userId, field)` helper to safely and lazily update profiles metrics using the service role client.

#### [MODIFY] [invoices/route.js](file:///Users/duo/Documents/想做个网站/corvioz/src/app/api/invoices/route.js)
- Trigger `trackProfileMetric` for `first_invoice_created_at` on successful POST.
- Trigger `trackProfileMetric` for `invoice_sent_timestamp` on status PATCH to `'sent'`.

#### [MODIFY] [clients/route.js](file:///Users/duo/Documents/想做个网站/corvioz/src/app/api/clients/route.js)
- Trigger `trackProfileMetric` for `first_client_added_at` on successful POST (insert only).

#### [MODIFY] [quotes/route.js](file:///Users/duo/Documents/想做个网站/corvioz/src/app/api/quotes/route.js)
- Trigger `trackProfileMetric` for `quote_sent_timestamp` on status PATCH to `'sent'`.

#### [MODIFY] [growth/events/route.js](file:///Users/duo/Documents/想做个网站/corvioz/src/app/api/growth/events/route.js)
- Trigger `trackProfileMetric` for `time_to_first_export` on POST where event is `export_attempt`.

#### [MODIFY] [portal/token/[token]/route.js](file:///Users/duo/Documents/想做个网站/corvioz/src/app/api/portal/token/[token]/route.js)
- Trigger `trackProfileMetric` for `time_to_first_client_response` on POST comment or PATCH approval/rejection.

#### [NEW] [invoices/remind/route.js](file:///Users/duo/Documents/想做个网站/corvioz/src/app/api/invoices/remind/route.js)
- Create a new POST endpoint `/api/invoices/remind` that triggers a real payment reminder email to the client using Resend, and logs it.

### Frontend Modals & Studio Space
#### [MODIFY] [Dashboard.js](file:///Users/duo/Documents/想做个网站/corvioz/src/components/dashboard/Dashboard.js)
- Add `exportPurposeRequest` state.
- Create `ExportPurposeModal` overlay prompting users for purpose: `'draft'`, `'client send'`, `'final invoice'`, or `'revision export'`.
- Pass purpose and metadata (`sent_to_client`, `client_context_id`, `follow_up_state`) to the telemetry payload of `export_attempt`.

#### [MODIFY] [StudioSpace.js](file:///Users/duo/Documents/想做个网站/corvioz/src/app/dashboard/components/StudioSpace.js)
- Remove simulated auto reminders and replace with a real `/api/invoices/remind` call via `handleSendReminder`.
- Remove any references to synthetic client actions.
- Rename tab labels to match running a service business: "Multi-Client Pipeline" -> "Client Status Board", "Client Directory" -> "Client Tracking Directory".

---

## Verification Plan

### Automated Tests
- Run `npm run verify:schema` to verify that the modified SQL schema passes static assertion tests.
- Compile production bundle using `npm run build` to verify no TypeScript or Next.js build regressions.

### Manual Verification
- Test PDF export in the browser. Verify the "Select Export Purpose" modal triggers, asks for the purpose, logs it, and continues the download.
- Test sending reminder in the Studio Space tab. Check that a real reminder request is dispatched to the backend API and does not crash.
