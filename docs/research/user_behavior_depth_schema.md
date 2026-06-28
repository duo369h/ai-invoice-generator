# Corvioz Reality Instrumentation Layer v1.4.1 Schema

This document details the real usage depth metrics tracked in the database and the corresponding client/server event map for Corvioz.

---

## 1. User Behavior Depth Schema

The `public.profiles` database table is extended with 6 telemetry fields to track real business conversion behaviors:

| Database Column | Data Type | Description |
| :--- | :--- | :--- |
| `first_invoice_created_at` | `TIMESTAMPTZ` | Timestamp when the user creates their first invoice draft/document. |
| `first_client_added_at` | `TIMESTAMPTZ` | Timestamp when the user saves their first client profile coordinate. |
| `invoice_sent_timestamp` | `TIMESTAMPTZ` | Timestamp when the user sends an invoice to their client (changes status to `'sent'`). |
| `quote_sent_timestamp` | `TIMESTAMPTZ` | Timestamp when the user sends a quote proposal to their client (changes status to `'sent'`). |
| `time_to_first_export` | `INTEGER` | Duration in seconds from profile registration (`created_at`) to the first PDF export attempt. |
| `time_to_first_client_response` | `INTEGER` | Duration in seconds from profile registration (`created_at`) to the first client activity (portal comment, quote acceptance, or quote rejection). |

---

## 2. Tracking Events Map

The following map defines the exact triggers, event names, and context parameters recorded during the user lifecycle:

### Server-Recorded Database Triggers

1. **Invoice Created (`first_invoice_created_at`)**
   - **Trigger**: POST `/api/invoices`
   - **Condition**: Successful insertion of invoice row where the profile's field is null.
   - **SQL Update**: Sets `first_invoice_created_at` to `NOW()`.

2. **Client Added (`first_client_added_at`)**
   - **Trigger**: POST `/api/clients`
   - **Condition**: Successful insertion of client row where the profile's field is null.
   - **SQL Update**: Sets `first_client_added_at` to `NOW()`.

3. **Invoice Sent (`invoice_sent_timestamp`)**
   - **Trigger**: PATCH `/api/invoices`
   - **Condition**: Invoice status updated to `'sent'`.
   - **SQL Update**: Sets `invoice_sent_timestamp` to `NOW()`.

4. **Quote Sent (`quote_sent_timestamp`)**
   - **Trigger**: PATCH `/api/quotes`
   - **Condition**: Quote status updated to `'sent'`.
   - **SQL Update**: Sets `quote_sent_timestamp` to `NOW()`.

5. **First PDF Export (`time_to_first_export`)**
   - **Trigger**: POST `/api/growth/events` (ingesting `export_attempt`)
   - **Condition**: User profile has null `time_to_first_export`.
   - **SQL Update**: Sets `time_to_first_export` to `NOW() - profile.created_at` (in seconds).

6. **First Client Response (`time_to_first_client_response`)**
   - **Trigger**: Secure Portal POST comments / PATCH quote status changes (approve or decline)
   - **Condition**: User profile has null `time_to_first_client_response`.
   - **SQL Update**: Sets `time_to_first_client_response` to `NOW() - profile.created_at` (in seconds).
