# Corvioz Reality Layer v1.4 (Behavior-Based Revenue Engine) Report

This report documents the design, architecture, and implementation of **Corvioz Reality Layer v1.4**, transitioning the platform's monetization model from a strict PDF export-based paywall to a comprehensive, behavior-driven monetization engine. 

By tracking real client interaction loops and analyzing workflow pressure points, the system identifies and presents contextual upgrade suggestions for both the **Pro** and **Studio** plans without breaking the core free workflow.

---

## 1. Client Reality Loop Tracking (Part 1)

Rather than relying on simulated state, v1.4 tracks the exact lifecycle of client interactions. We whitelisted and instrumented **8 core behavior events** in the database to map real-life customer interaction:

| Event Name | Trigger Context | Description |
| :--- | :--- | :--- |
| `invoice_sent` | `src/app/api/invoices/route.js` | Emitted when invoice status is updated to `'sent'`. |
| `invoice_viewed` | `src/app/api/portal/token/[token]/route.js` | Emitted on Portal GET when the client opens their secure invoice portal. |
| `client_response_received` | `src/app/api/portal/token/[token]/route.js` | Emitted on Portal POST when a client submits feedback/comments on an invoice/quote. |
| `quote_sent` | `src/app/api/quotes/route.js` | Emitted when quote status is updated to `'sent'`. |
| `quote_status_pending` | `src/app/api/portal/token/[token]/route.js` | Emitted on Portal GET when a client opens a quote in the `'sent'` status. |
| `quote_accepted` | `src/app/api/portal/token/[token]/route.js` | Emitted on Portal PATCH when the client accepts a quote proposal. |
| `quote_rejected` | `src/app/api/portal/token/[token]/route.js` | Emitted on Portal PATCH when the client declines a quote proposal. |
| `invoice_edited` | `src/components/dashboard/Dashboard.js` | Emitted on the client-side when saving a modified version of an existing invoice. |

### Technical Highlights:
- **Server-Side Telemetry**: Designed `recordServerGrowthEvent` in [supabase.js](file:///Users/duo/Documents/想做个网站/corvioz/src/app/lib/supabase.js) using the service role client. This allows secure telemetry writes directly from public client portal API routes, where the client does not have a user authentication token.
- **Decline Quote flow**: Added a declining flow in [PortalClientView.js](file:///Users/duo/Documents/想做个网站/corvioz/src/app/components/PortalClientView.js). Clients can reject quote proposals, which calls the PATCH endpoint, updates the status to `'declined'`, records `quote_rejected`, and displays a declined timeline indicator.
- **Invoice Edit Counter**: Modified the local document saving logic in the dashboard to track document edit cycles. It parses the invoice notes' JSON metadata block (`%%META%%...%%ENDMETA%%`), increments the `edit_count` on save, and triggers the `invoice_edited` behavior.

---

## 2. Workflow Pressure Triggers (Part 2)

We implemented four non-blocking, dismissible monetization insight panels within the dashboard's Overview tab:

```
+-----------------------------------------------------------------------------------------+
|  🧠 Workspace Intelligence & Insights                                                   |
|                                                                                         |
|  💡 Invoice #INV-001 has been sent for over 24h with no response. Upgrade to Pro...     |
|  ⚡ Quote #QT-002 has been pending client action for over 48h. Upgrade to Pro...          |
|  📝 You have revised invoice #INV-003 multiple times. Upgrade to Pro to prevent...       |
|  🏢 You are managing 3 active clients. Upgrade to Studio for multi-client workflows...  |
+-----------------------------------------------------------------------------------------+
```

### Trigger Breakdown:
1. **Invoice No Response (> 24h)**:
   - **Condition**: Invoice in `'sent'` or `'pending'` status created > 24 hours ago, with no client comments recorded.
   - **Prompt**: *"Invoice #{invoice_number} has been sent for over 24 hours with no response. Upgrade to Pro to automate payment reminders."*
   - **Action/Telemetry**: Tracks `pending_event` on render; dismiss status persists in `localStorage` (`corvioz_no_resp_inv_dismissed`).
2. **Quote Pending (> 48h)**:
   - **Condition**: Quote in `'sent'` status created > 48 hours ago.
   - **Prompt**: *"Quote #{quote_number} has been pending client action for over 48 hours. Upgrade to Pro to activate signature capture and portal tracking."*
   - **Action/Telemetry**: Tracks `pending_event` on render; dismiss status persists in `localStorage` (`corvioz_quote_pend_dismissed`).
3. **Heavy Revision (edit_count $\ge$ 3)**:
   - **Condition**: Invoice edit counter $\ge 3$ inside metadata.
   - **Prompt**: *"You have revised invoice #{invoice_number} multiple times. Pro users use professional proposal workflows to lock milestone scopes and prevent revision fatigue. Upgrade to Pro"*
   - **Action/Telemetry**: Tracks `revision_event` on render; dismiss status persists in `localStorage` (`corvioz_inv_edit_dismissed`).
4. **Multi-Client Active ($\ge$ 2)**:
   - **Condition**: User has registered 2 or more distinct client profiles.
   - **Prompt**: *"You are managing {clients.length} active clients. Adopt a professional business layer: upgrade to Studio for multi-client workflows, overdue timeline lists, and follow-up reminders. Upgrade to Studio"*
   - **Action/Telemetry**: Tracks `multi_client_event` on render; dismiss status persists in `localStorage` (`corvioz_client_cnt_dismissed`).

---

## 3. Studio Premium Value (Part 3)

The **Studio** tier (using internal Paddle subscription ID `'agency'`) represents the ultimate professional business layer for freelancers scaling to small agencies. 

We created the [StudioSpace.js](file:///Users/duo/Documents/想做个网站/corvioz/src/app/dashboard/components/StudioSpace.js) workspace control center consisting of **4 specialized sub-tabs**:

### 1. Multi-Client Pipeline (Kanban)
- Visually organizes active client contracts into 5 pipeline columns: **Inbound Leads** $\rightarrow$ **Proposals Sent** $\rightarrow$ **Active Work** $\rightarrow$ **Overdue Accounts** $\rightarrow$ **Paid & Settled**.
- Cards indicate amounts, client details, and transaction links.

### 2. Client Tracking Directory
- Consolidates all clients into a single index.
- Tracks critical lifetime value metrics (**LTV**), **Outstanding Balance**, **Invoice Counts**, and **Client State** (e.g., *Active Project*, *Ready to Bill*, *Invoice Overdue*).

### 3. Overdue Invoice Tracker
- A prioritized, red-flag list of unpaid invoices past their due dates.
- Visual badges calculate exact "Days Overdue".
- Provides convenient CTAs: **Copy Private Portal Link** and **Go to Follow-up Reminders**.

### 4. Communications & Follow-ups
- A custom-tailored invoice reminder email composer.
- Enables selecting soft, firm, or urgent templates with copy-to-clipboard support.
- Includes a **Simulate Automated Reminders** engine for testing client notifications (emits `client_activity_event`).

---

## 4. Pricing Trigger Expansion (Part 4)

We expanded the telemetry system beyond PDF download counts to capture actions across the entire workflow:

- `client_activity_event`: Emitted when copying templates or simulating automated reminders in the Studio Space tab.
- `revision_event`: Emitted when the heavy revision suggestion banner is loaded.
- `pending_event`: Emitted when outstanding invoice or quote suggestion banners are loaded.
- `multi_client_event`: Emitted when the multi-client suggestion banner is loaded.

---

## 5. Technical Modifications

- **`src/app/lib/analytics.js`**: Whitelisted the 11 new behavioral and trigger events.
- **`src/app/api/growth/events/route.js`**: Configured growth database ingestion to accept the new event typings.
- **`src/app/lib/supabase.js`**: Created `recordServerGrowthEvent` using the service role client.
- **`src/app/api/portal/token/[token]/route.js`**: Integrated portal lifecycle event triggers (GET/POST/PATCH) and added quote rejection action.
- **`src/app/components/PortalClientView.js`**: Added decline CTA button and action logic.
- **`src/app/api/invoices/route.js`** & **`src/app/api/quotes/route.js`**: Added status tracking to record sent triggers.
- **`src/components/dashboard/Dashboard.js`**:
  - Integrated the sidebar **Studio Space** navigation.
  - Linked locked access to `PricingUpsellModal` for free/pro users.
  - Embedded invoice save edit-counting hook.
- **`src/app/dashboard/components/DashboardOverview.js`**: Coded the intelligence suggestion banners, dismissal persistence, and trigger telemetry emitters.
- **`src/app/dashboard/components/StudioSpace.js`**: Created the entire Kanban, metrics table, overdue tracker, and communication template composer.
- **`src/styles/icons.js`**: Added `studio: Sparkles` configuration.

---

## 6. Build & Lint Verification

We ran a full compile check to verify that these deep integrations did not create any structural regression:
- **TypeScript & Next Lint**: Clear.
- **Production Build (`npm run build`)**: Success. Prerendered **977 static pages** with 0 errors.

---

## 7. Sandbox & Safe Rollout Guardrails

1. **Dismissible Warnings**: Suggested Pro/Studio triggers are informational callouts rather than hard locks. The user is never blocked from editing, sending, or managing data, which respects the freelancing flow.
2. **Sandbox Flag**: Developers can load `/demo` or turn on sandbox mode, unlocking full access to the Studio Control Center to inspect features without active Paddle subscriptions.
3. **No-Double Logging**: Trigger telemetry events are guarded using React hooks to avoid duplicate event emissions on multiple components mounts during a single session.
