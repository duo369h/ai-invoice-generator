# Corvioz Workspace Implementation Specification
**Document Version:** 1.0  
**Author:** Head of Product & Senior SaaS UX Architect  
**Target Execution Agent:** Codex  
**Sprint Identifier:** Workspace Implementation Sprint 1  
**Status:** Implementation Ready  

---

## Executive Summary

This document translates the approved **Workspace Experience Architecture** into a detailed, step-by-step implementation specification. It maps the current file structure of the Corvioz repository, isolates the critical P0 user experience blockers (the middleware redirect loop and the guest draft restoration breakdown), and defines the modular components required to build the five Workspace Zones, the Business Health System, and the AI Advisor.

By executing this plan, Codex will refactor Corvioz from a traditional dashboard into an active, habit-forming workspace. 

* **Hard Constraint:** Under no circumstances should Codex modify the frozen core systems: the Revenue Kernel, the Runtime Decision Layer, the Entry Platform, Governance, Validation, Reliability, or Security. All modifications must be limited to the UI presentation, routing overrides, and client-side integration layers.

---

## Phase 1 — Current File Mapping

This section maps the existing dashboard routing, redirection, and onboarding files in the Corvioz repository and assigns an action plan for each.

```
┌────────────────────────────────────────────────────────────────────────┐
│                          CURRENT FILE MAPPING                          │
├────────────────────────────────────────────────────────────────────────┤
│ File Path                                         │ Action Plan        │
├───────────────────────────────────────────────────┼────────────────────┤
│ • middleware.js                                   │ Refactor           │
│ • src/core/entry/ENTRY_AUTHORITY.ts               │ FREEZE ❄️           │
│ • src/core/entry/entry-resolver.ts                │ FREEZE ❄️           │
│ • src/app/dashboard/page.js                       │ Refactor           │
│ • src/app/dashboard/activation/page.tsx           │ Refactor           │
│ • src/app/auth/page.js                            │ Refactor           │
│ • src/components/dashboard/Dashboard.js           │ Refactor / Split   │
│ • src/app/dashboard/components/DashboardOverview.js│ Replace / Refactor │
│ • src/app/dashboard/TierRouter.js                 │ Keep               │
│ • src/app/dashboard/starter/page.js               │ Refactor           │
│ • src/app/dashboard/growth/page.js                │ Refactor           │
│ • src/app/dashboard/studio/page.js                │ Refactor           │
│ • src/core/activation/*                           │ FREEZE ❄️           │
└───────────────────────────────────────────────────┴────────────────────┘
```

---

### File Details & Codex Instructions

1. **`middleware.js`**
   * *Purpose:* Handles URL security and path redirects.
   * *Current Role:* Intercepts `/dashboard` requests, calls `ENTRY_AUTHORITY`, and redirects unactivated users to `/dashboard/activation`.
   * *Action:* **Refactor.**
   * *Risk Level:* High (Impacts login routing and session stability).
   * *Codex Instructions:* Refactor to check for an activation bypass flag (e.g. `corvioz_activation_skipped=true` cookie or local session storage). If the flag is set, bypass the redirect loop and allow unactivated users to load the main dashboard shell in a limited mode.

2. **`src/core/entry/ENTRY_AUTHORITY.ts`**
   * *Purpose:* Server-side routing authority for activation-based routing.
   * *Current Role:* Returns `/dashboard` or `/dashboard/activation` based on `user?.hasActivated`.
   * *Action:* **FREEZE ❄️**
   * *Risk Level:* Low.
   * *Codex Instructions:* **Do NOT modify.** This is a platform foundation file. Any routing overrides must happen in the middleware or client-side routing wrapper.

3. **`src/core/entry/entry-resolver.ts`**
   * *Purpose:* Maps server-side entry authority to client routes.
   * *Current Role:* Calls `ENTRY_AUTHORITY` and returns the route.
   * *Action:* **FREEZE ❄️**
   * *Risk Level:* Low.
   * *Codex Instructions:* **Do NOT modify.**

4. **`src/app/dashboard/page.js`**
   * *Purpose:* Dashboard route entry point.
   * *Current Role:* Loads the live user session, evaluates entry insights, and renders `<Dashboard mode="live" />` wrapped in `<TierRouter>`.
   * *Action:* **Refactor.**
   * *Risk Level:* Medium.
   * *Codex Instructions:* Update to render the new Workspace Shell layout instead of the unified `<Dashboard>` component, passing parameters based on the resolved user tier.

5. **`src/app/dashboard/activation/page.tsx`**
   * *Purpose:* Guided activation page for first-time users.
   * *Current Role:* Displays three primary actions (Create Invoice, Send Quote, Add Client) and a "Skip to full workspace" button.
   * *Action:* **Refactor.**
   * *Risk Level:* Medium.
   * *Codex Instructions:* Update the "Skip to full workspace" button handler to write a bypass flag (cookie or sessionStorage) before calling `router.push('/dashboard')`, preventing the middleware redirect loop.

6. **`src/app/auth/page.js`**
   * *Purpose:* User registration and login page.
   * *Current Role:* Logs users in, checks for local storage drafts (`corvioz_pending_invoice`), and redirects to `resolveEntry(user)`.
   * *Action:* **Refactor.**
   * *Risk Level:* Medium.
   * *Codex Instructions:* Update post-auth redirect handler. If a draft invoice is found in `localStorage`, bypass the default entry route and redirect to `/invoices/create?restore=true` to allow the user to sync and complete their work.

7. **`src/components/dashboard/Dashboard.js`**
   * *Purpose:* Unified dashboard layout shell.
   * *Current Role:* Large, 328KB file containing navigation menus, tab settings, CRM screens, and billing options.
   * *Action:* **Refactor & Split.**
   * *Risk Level:* High.
   * *Codex Instructions:* Refactor by extracting layout panels into separate components: `TodayZone.js`, `MoneyZone.js`, `ClientsZone.js`, `WIPZone.js`, and `BusinessHealthZone.js`. Retain this file as a thin wrapper for layout compatibility.

8. **`src/app/dashboard/components/DashboardOverview.js`**
   * *Purpose:* Renders the primary dashboard overview content.
   * *Current Role:* Displays the onboarding checklist, safety widget, and unpaid metrics cards.
   * *Action:* **Replace / Refactor.**
   * *Risk Level:* Medium.
   * *Codex Instructions:* Replace the layout hierarchy: move metrics cards to the top, relocate the onboarding checklist below the fold, and replace passive empty lists with actionable components.

9. **`src/app/dashboard/TierRouter.js`**
   * *Purpose:* Enforces server-side tier routing boundaries.
   * *Current Role:* Client-side routing wrapper.
   * *Action:* **Keep.**
   * *Risk Level:* Low.
   * *Codex Instructions:* Keep intact. Do not introduce client-side routing decisions here.

10. **`src/core/activation/*`**
    * *Purpose:* Governs user activation rules and event triggers.
    * *Action:* **FREEZE ❄️**
    * *Risk Level:* Low.
    * *Codex Instructions:* **Do NOT modify.** This controls the core activation telemetry and is considered stable.

---

## Phase 2 — P0 Blocking UX Fix Plan

This section details the implementation plans, acceptance criteria, and test cases for resolving the two critical user experience blockers.

```
                   P0 BLOCKING UX FIX JOURNEY
                   
  🔴 SKIP REDIRECT LOOP:
  [Click Skip] ──> [Set Cookie Bypass] ──> [Allow /dashboard Access]
  
  🔴 DRAFT RESTORATION:
  [Register] ──> [Detect local draft] ──> [Redirect to /invoices/create]
```

---

### 1. Activation Skip Redirect Loop

#### Current Behavior
When an unactivated user lands on `/dashboard/activation` and clicks "Skip to full workspace", the router navigates to `/dashboard`. The middleware (`middleware.js`) intercepts the request, runs `ENTRY_AUTHORITY`, sees `user.hasActivated === false`, and redirects the user back to `/dashboard/activation`.

#### Why it Breaks Activation
The skip button is broken. Users are trapped in a loop and cannot view the dashboard shell, causing them to believe the application is frozen.

#### Files to Modify
* `middleware.js`
* `src/app/dashboard/activation/page.tsx`

#### Implementation Steps
1. **Set Bypass Flag:** In `src/app/dashboard/activation/page.tsx`, update the skip button handler:
   ```javascript
   const handleSkip = () => {
     // Set a session cookie valid for the current tab session
     document.cookie = "corvioz_activation_skipped=true; path=/; max-age=3600; SameSite=Strict";
     router.push('/dashboard');
   };
   ```
2. **Read Bypass Flag in Middleware:** Update `middleware.js` to evaluate the cookie:
   ```javascript
   export function middleware(request) {
     const { pathname } = request.nextUrl;
     if (pathname.startsWith("/dashboard")) {
       const skipCookie = request.cookies.get("corvioz_activation_skipped")?.value;
       if (skipCookie === "true") {
         return NextResponse.next(); // Allow access, bypassing redirect
       }
       // ... existing ENTRY_AUTHORITY evaluation
     }
   }
   ```

#### Acceptance Criteria
* Clicking the skip button successfully routes the user to `/dashboard`.
* The dashboard displays in a limited, unactivated state.
* Clearing browser cookies and reloading `/dashboard` redirects the user back to `/dashboard/activation`.

#### Manual Test Cases
1. Log in with a newly created, unactivated account. Confirm you are routed to `/dashboard/activation`.
2. Click "Skip to full workspace". Verify the URL changes to `/dashboard` and the workspace loads.
3. Open a new incognito window, log in, and try to navigate directly to `/dashboard`. Verify you are blocked and redirected back to `/dashboard/activation`.

---

### 2. Guest Draft Restore Failure

#### Current Behavior
A guest user creates an invoice draft. When they click signup to save progress, they complete registration on `/auth`. Post-authentication, they are routed to `/dashboard/activation` because they are a new user. The draft remains unused in `localStorage` under `corvioz_pending_invoice`.

#### Why it Hurts Conversion
The user has completed the registration form but is forced to start their invoice over again, breaking the onboarding flow.

#### Files to Modify
* `src/app/auth/page.js`
* `src/app/dashboard/page.js`

#### Implementation Steps
1. **Intercept Redirection:** In `src/app/auth/page.js`, update the successful login redirect handler:
   ```javascript
   const checkPendingDraftAndRedirect = (user) => {
     const draft = window.localStorage.getItem('corvioz_pending_invoice');
     if (draft) {
       // Append redirect parameters to trigger draft sync and restore
       router.push('/invoices/create?restore=true');
     } else {
       router.push(resolveEntry(user));
     }
   };
   ```
2. **Execute Restore & Sync:** In the invoice creator page, detect `?restore=true` query parameters. Read the local storage draft, call the Supabase API to save the record to the database under the user's ID, and clear the local storage item.

#### Acceptance Criteria
* Guest users who sign up with a draft in local storage must bypass the activation screen.
* The draft must be synced to the database and open directly in the editor.

#### Manual Test Cases
1. Access the guest invoice editor without logging in. Draft a custom line item.
2. Click "Sign up to save". Complete registration.
3. Verify that you are redirected to the editor with your draft loaded and synced to your account.

---

## Phase 3 — Workspace Shell Component Plan

The refactored dashboard shell is split into five modular zones. This section defines the component structure for each zone.

```
┌────────────────────────────────────────────────────────────────────────┐
│                        WORKSPACE ZONES INTERFACE                       │
├────────────────────────────────────────────────────────────────────────┤
│ Zone 1: <TodayZone />        ───> Urgent tasks and focus alerts.       │
│ Zone 2: <MoneyZone />        ───> Invoices, outstanding, and collections│
│ Zone 3: <ClientsZone />      ───> CRM leads and directory contacts.     │
│ Zone 4: <WIPZone />          ───> Active drafts and setups.            │
│ Zone 5: <BusinessHealthZone /> ──> Heuristic analysis and AI advice.   │
└────────────────────────────────────────────────────────────────────────┘
```

---

### 1. Zone 1 — Today (`TodayZone.js`)
* **Component Props:** `user: object`, `alerts: array`, `onAction: function`
* **Data Dependencies:** Inbound CRM leads, overdue invoices.
* **Empty State:** "All clear! You are fully caught up for the day."
* **Loading State:** Skeleton loader showing three task rows.
* **Error State:** Inline error message: "Failed to load today's actions."
* **Starter Behavior:** Displays basic setup checklists.
* **Professional Behavior:** Displays CRM lead alerts and quote view notifications.
* **Studio Behavior:** Displays client comments and milestone deadlines.
* **Upgrade Prompt:** "Unlock automated follow-up tasks with Pro Mode."
* **First Version Scope:** Simple onboarding checklist + 1 high-priority action card.

### 2. Zone 2 — Money (`MoneyZone.js`)
* **Component Props:** `invoices: array`, `payouts: array`, `isLoading: boolean`
* **Data Dependencies:** Invoices database table, Stripe payouts API.
* **Empty State:** Mockup of a payment chart with a link to connect Stripe.
* **Loading State:** Chart skeleton + metrics card skeletons.
* **Error State:** "Failed to load financial records."
* **Starter Behavior:** Displays simple Paid vs. Unpaid list.
* **Professional Behavior:** Displays aging receivables report with a "Send Reminder" button.
* **Studio Behavior:** Displays annual revenue forecasts and automatic reminder settings.
* **Upgrade Prompt:** "Remove watermarks from your PDFs."
* **First Version Scope:** Metric cards at the top + invoice list.

### 3. Zone 3 — Clients (`ClientsZone.js`)
* **Component Props:** `clients: array`, `leads: array`, `activeQuotes: array`
* **Data Dependencies:** Clients database table, CRM leads table.
* **Empty State:** Prompt to publish their Bento Profile with a copyable link.
* **Loading State:** Client listing skeleton.
* **Error State:** "Failed to load client directory."
* **Starter Behavior:** Simple Client Directory list.
* **Professional Behavior:** CRM Leads Inbox with "AI Quote" option.
* **Studio Behavior:** Portal views and client comment logs.
* **Upgrade Prompt:** "Unlock CRM leads pipeline in Pro."
* **First Version Scope:** Leads Inbox list + client count checklist.

### 4. Zone 4 — Work in Progress (`WIPZone.js`)
* **Component Props:** `drafts: array`, `profileComplete: boolean`
* **Data Dependencies:** Local storage and cloud drafts database.
* **Empty State:** "No drafts in progress."
* **Loading State:** Spinner icon.
* **Error State:** "Failed to load active drafts."
* **Starter Behavior:** Displays single local draft.
* **Professional Behavior:** Displays unlimited cloud-synced drafts.
* **Studio Behavior:** Displays shared case study templates.
* **Upgrade Prompt:** "Sync drafts to the cloud."
* **First Version Scope:** Resume Draft button + profile completeness card.

### 5. Zone 5 — Business Health (`BusinessHealthZone.js`)
* **Component Props:** `metrics: object`, `recommendations: array`
* **Data Dependencies:** Analytical heuristics engine.
* **Empty State:** "Analyzing metrics. Send your first invoice to initialize."
* **Loading State:** Spinner icon.
* **Error State:** "Failed to calculate health."
* **Starter Behavior:** Setup recommendations.
* **Professional Behavior:** Quote follow-up indicators and CRM hygiene tips.
* **Studio Behavior:** Runway metrics and client value concentration alerts.
* **Upgrade Prompt:** "Unlock Proactive Health Insights."
* **First Version Scope:** Heuristic card + 2 rule-based warning alerts.

---

## Phase 4 — Tier-Based Workspace Plan

This section defines the default layout order, lock statuses, and behaviors for the Starter, Professional, and Studio tiers.

```
┌────────────────────────────────────────────────────────────────────────┐
│                        TIER-BASED LAYOUT RULES                         │
├────────────────────────────────────────────────────────────────────────┤
│ Starter:      Money Zone  ──>  Today Zone  ──>  WIP Zone               │
│ Professional: Today Zone  ──>  Client Zone ──>  Money Zone             │
│ Studio:       Today Zone  ──>  Health Zone ──>  Money Zone             │
└────────────────────────────────────────────────────────────────────────┘
```

---

### 1. Starter Workspace Mode
* **Default Module Order:** Zone 2 (Money Metrics) ➔ Zone 1 (Checklist) ➔ Zone 4 (WIP Draft) ➔ Zone 5 (Safety tips).
* **Enabled Modules:** Invoice creator, client directory (read/write during billing), profile builder.
* **Locked Modules:** Proposals/Quotes, Leads CRM, Analytics tab, Client Portals, Automations.
* **Upgrade Prompts:** Watermark-free exports prompt triggered on 2nd invoice generation.
* **Empty State Rules:** Render Stripe linkage mockups and Bento creation links.
* **First-login:** Guided direct link to invoice creator.
* **Returning-user:** Display invoice status (Paid/Unpaid).

### 2. Professional Workspace Mode
* **Default Module Order:** Zone 1 (Alerts/Focus) ➔ Zone 3 (Leads CRM) ➔ Zone 2 (Overdue bills) ➔ Zone 4 (WIP Drafts).
* **Enabled Modules:** Quotes builder, Leads CRM, AI proposal writer, client directory, advanced invoice features (tax/discount).
* **Locked Modules:** Portal custom domains, automated reminder setups (webhooks), case studies showcase.
* **Upgrade Prompts:** Client database limit prompt triggered when active clients reach 3.
* **Empty State Rules:** Highlight Leads Inbox templates and quote-to-invoice instructions.
* **First-login:** Prompt to sync contact list and import active proposals.
* **Returning-user:** Highlight new inquiries and client quote views.

### 3. Studio Workspace Mode
* **Default Module Order:** Zone 1 (Portal comments/tasks) ➔ Zone 5 (Business Health runway) ➔ Zone 2 (Revenue forecast) ➔ Zone 3 (Portal custom domains).
* **Enabled Modules:** White-labeled portals, custom domains, automated reminder cron jobs, team collaborator seats, analytics dashboards.
* **Locked Modules:** None.
* **Upgrade Prompts:** Annual prepayment savings calculations.
* **Empty State Rules:** Mock client views and portal comments template.
* **First-login:** Connect custom domain setup page.
* **Returning-user:** Real-time portal views, comments, and task assignments.

---

## Phase 5 — Business Health v1 Plan

A rule-based, client-side evaluation engine that calculates the workspace status and returns actionable recommendations.

```
                     RULE-BASED HEALTH EVALUATION
                     
  [Overdue Ratio >= 50%] ────────────────────────> 🔴 CRITICAL RISK
  [Overdue Ratio < 50% OR Profile Incomplete] ────> 🟡 NEEDS ATTENTION
  [No Active Clients / Invoices] ────────────────> ⚪ LATENT
  [Invoices Settled & Profile Completed] ────────> 🟢 HEALTHY
```

### 1. Data Signals
* `overdueCount` (integer): Total unpaid invoices past due date.
* `overdueAmount` (float): Total value of unpaid overdue invoices.
* `averageRevenue` (float): Average monthly revenue (last 90 days).
* `profileComplete` (boolean): Has username and bio.
* `activeClients` (integer): Number of saved client records.
* `activeQuotes` (integer): Number of quotes with status = 'sent'.

---

### 2. Cascading Rule Logic
1. **Critical Risk:** If `overdueCount > 0` and `(overdueAmount / averageRevenue) >= 0.50`.
2. **Needs Attention:** If `overdueCount > 0` and `(overdueAmount / averageRevenue) < 0.50` OR `profileComplete === false`.
3. **Latent:** If `overdueCount === 0` and `activeClients === 0` and `activeQuotes === 0`.
4. **Healthy:** If `overdueCount === 0` and `activeClients > 0` and `profileComplete === true`.

---

### 3. Output Messages & CTAs
* **State: Critical Risk**
  * *Headline:* "Critical Risk: High Outstanding Balance"
  * *Text:* "You have $X in overdue invoices, representing more than 50% of your average billing. Send collection reminders to settle these balances."
  * *CTA:* "Send Reminders Now" (Triggers bulk reminder overlay).
* **State: Needs Attention**
  * *Headline:* "Setup Incomplete: Profile Bio Missing"
  * *Text:* "Your public bento profile bio is empty. Add your services and pricing details to begin capturing client leads."
  * *CTA:* "Configure Profile" (Navigates to Profile tab).
* **State: Healthy**
  * *Headline:* "Workspace Healthy"
  * *Text:* "All payments are settled and your pipeline is stable."
  * *CTA:* "View Proposals Pipeline."

---

### 4. Implementation Acceptance Criteria
* The health engine runs client-side inside a reusable React hook: `useBusinessHealth(user, invoices, clients, quotes)`.
* It evaluates rules in the exact sequence defined above.
* The output renders a color-coded status indicator (Red, Yellow, Green, Gray) with the corresponding headline, text description, and CTA.

---

## Phase 6 — AI Advisor v1 Plan

A rule-based recommendation engine that simulates AI suggestions prior to integration with the DeepSeek API.

```
┌────────────────────────────────────────────────────────────────────────┐
│                        AI ADVISOR RECOMMENDATIONS                      │
├────────────────────────────────────────────────────────────────────────┐
│ Trigger                       │ Message              │ CTA             │
├───────────────────────────────┼──────────────────────┼─────────────────┤
│ • Overdue Invoice             │ "Invoice is overdue" │ "Send Reminder" │
│ • Quote Viewed >= 2x          │ "Client is viewing"  │ "Follow Up"     │
│ • Profile has no bio          │ "Bio is empty"       │ "Write Bio"     │
│ • Local Draft Invoice Found   │ "Draft detected"     │ "Resume Draft"  │
│ • Client list = 0             │ "Save client info"   │ "Add Client"    │
└───────────────────────────────┴──────────────────────┴─────────────────┘
```

---

### Recommendation Rules

1. **Overdue Invoice Alert**
   * *Trigger:* Invoice status is 'pending' and due date is past.
   * *Message:* "Invoice #[ID] is overdue. Send a friendly reminder to prompt payment."
   * *CTA:* "Send Reminder".
   * *Availability:* Professional / Studio. (Starter sees a watermark upgrade prompt instead).
   * *Data Source:* `useDashboardData.invoices` array.

2. **Quote Follow-up Suggestion**
   * *Trigger:* Quote status is 'sent' and view count >= 2.
   * *Message:* "Client viewed proposal #[ID] twice. Follow up now to secure the project."
   * *CTA:* "Draft Follow-Up".
   * *Availability:* Professional / Studio.
   * *Data Source:* `useDashboardData.quotes` array.

3. **Incomplete Profile Prompt**
   * *Trigger:* Profile bio is empty.
   * *Message:* "Publish your Bento profile bio to start capturing inbound leads."
   * *CTA:* "Configure Profile".
   * *Availability:* All tiers.
   * *Data Source:* `useDashboardData.cardProfile` object.

4. **Continue Draft Prompt**
   * *Trigger:* Local storage draft (`corvioz_pending_invoice`) exists.
   * *Message:* "You have an unfinished draft. Continue where you left off."
   * *CTA:* "Resume Draft".
   * *Availability:* All tiers.
   * *Data Source:* `localStorage` check.

5. **Client Setup Prompt**
   * *Trigger:* Client database length = 0.
   * *Message:* "Save client contact details to auto-populate future invoices."
   * *CTA:* "Add Client".
   * *Availability:* All tiers.
   * *Data Source:* `useDashboardData.clients` array.

---

## Phase 7 — Navigation & Naming Plan

This section defines the copy and label updates required to transition the UI from dashboard metrics to a daily workspace.

```
┌────────────────────────────────────────────────────────────────────────┐
│                        NAVIGATION COPY REFRACTOR                       │
├────────────────────────────────────────────────────────────────────────┤
│ Element                   │ Current Copy       │ Proposed Copy         │
├───────────────────────────┼────────────────────┼───────────────────────┤
│ • Sidebar Header          │ Dashboard          │ Workspace             │
│ • Home Tab Label          │ Overview           │ Today                 │
│ • Revenue Tab Label       │ Analytics          │ Money                 │
│ • CRM Tab Label           │ Leads CRM          │ Inquiries             │
│ • Proposals Tab Label     │ Quotes / Estimates │ Proposals             │
└───────────────────────────┴────────────────────┴───────────────────────┘
```

---

### Copy Implementation Locations

1. **Sidebar Navigation Menu (`src/components/dashboard/Dashboard.js`):**
   * *Target:* Line 857-878.
   * *Update:* Replace navigation labels with the proposed copy.
2. **Header Bar:**
   * *Target:* Primary dashboard header.
   * *Update:* Replace `"Welcome to your Dashboard"` with `"Today's Workspace"`.
3. **Empty States:**
   * *Target:* Invoices, Quotes, and Clients empty lists.
   * *Update:* Replace `"No records found"` with action-oriented prompts (e.g. `"Add a client to begin drafting proposals"`).

---

## Phase 8 — Sprint Execution Order

A step-by-step roadmap for Codex to implement the workspace refactoring.

---

### Sprint 1 — P0 Fixes
* **Objectives:** Resolve the middleware redirect loop, restore guest drafts post-signup, and consolidate onboarding checklists.
* **Files Affected:**
  * `middleware.js`
  * `src/app/auth/page.js`
  * `src/app/dashboard/activation/page.tsx`
  * `src/app/dashboard/components/DashboardOverview.js`
* **Risk Level:** High (Impacts authentication, session handling, and routing).
* **Acceptance Criteria:**
  * Clicking "Skip" on the activation page bypasses the redirect loop and loads `/dashboard`.
  * Users signing up with a guest draft are redirected straight to the editor with their draft restored.
* **Manual Test Steps:**
  1. Create a guest invoice, sign up, and verify you land in the editor with the draft loaded.
  2. Log in with an unactivated account, click skip, and verify `/dashboard` loads successfully.
* **Build Verification Command:** `npm run build`

---

### Sprint 2 — Workspace Shell
* **Objectives:** Split `DashboardOverview.js` into modular zone components and reorganize the Starter tier layout.
* **Files Affected:**
  * `src/components/dashboard/Dashboard.js`
  * `src/app/dashboard/components/DashboardOverview.js`
  * New files: `TodayZone.js`, `MoneyZone.js`, `WIPZone.js`, `ClientsZone.js`
* **Risk Level:** High (Structural layout changes).
* **Acceptance Criteria:**
  * Workspace zones load as independent modules.
  * In Starter mode, metrics (Paid / Outstanding) render at the top, and onboarding checklists are positioned below the fold.
* **Manual Test Steps:**
  1. Log in on a Starter plan. Verify metrics cards are rendered at the top of the page.
  2. Check empty states for Invoices, Quotes, and Clients to verify templates load correctly.
* **Build Verification Command:** `npm run build`

---

### Sprint 3 — Business Guidance
* **Objectives:** Build the Business Health v1 rule engine and the rule-based AI Advisor.
* **Files Affected:**
  * New files: `BusinessHealthZone.js`, `AIAdvisor.js`
  * `src/components/dashboard/Dashboard.js`
* **Risk Level:** Medium.
* **Acceptance Criteria:**
  * Business Health displays the correct status card (Latent, Healthy, Attention, Risk) with matching CTAs.
  * AI Advisor displays recommendations based on the user's workspace data.
* **Manual Test Steps:**
  1. Set an invoice to overdue. Verify the health status updates to "Needs Attention" or "Critical Risk".
  2. Confirm the AI Advisor displays a "Send Reminder" recommendation.
* **Build Verification Command:** `npm run build`

---

### Sprint 4 — Upgrade Conversion
* **Objectives:** Apply tier-specific workspace rules and configure locked module modals.
* **Files Affected:**
  * `src/components/dashboard/Dashboard.js`
  * Modal components.
* **Risk Level:** Medium.
* **Acceptance Criteria:**
  * Starter users are blocked from opening CRM and proposals tabs, triggering the Pro upgrade modal.
  * Attempting a 2nd invoice export triggers the Pro upgrade modal.
* **Manual Test Steps:**
  1. Log in as a Starter user. Click the CRM sidebar link. Verify the Pro upgrade modal opens.
  2. Generate and download a 2nd invoice. Verify the watermark-removal upgrade modal opens.
* **Build Verification Command:** `npm run build`
