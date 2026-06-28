# Corvioz Product Bible: Definitive Product Architecture & Design Constitution
**Document Version:** 1.0  
**Status:** Frozen & Authoritative  
**Primary Audience:** Engineering & Product Teams  

---

## Phase 8 — Executive Summary (The 5-Minute Developer Guide)

If you are a developer joining the Corvioz team, this section explains exactly how the product is designed to work and evolve.

```
                      THE CORVIOZ GOLDEN RULE
                      
  Success is NOT measured by visual creativity. Success is measured by
  whether a first-time freelancer can understand what to do within
  3 seconds and complete meaningful work within 30 seconds.
```

### Core Architecture Blueprint
1. **Not a Dashboard, but a Workspace:** Corvioz is not a passive reporting panel. It is an active operational workspace. Every screen must guide the freelancer toward their next action (e.g. sending a quote, chasing a payment, or updating client terms) rather than just displaying historical charts.
2. **Deterministic Funnel:** The user acquisition funnel relies on zero-signup value discovery:
   `Visitor` ➔ `Guest Invoice Builder` ➔ `First Free Watermarked Export` ➔ `Authentication` (restoring local draft) ➔ `Workspace Activation` ➔ `Second Export (Paywall)` ➔ `Paying User`.
3. **Operational Tiers:**
   * *Starter:* Minimal invoicing and payment tracking. Goal: "Get first client paid."
   * *Professional:* CRM leads, proposals, and follow-ups. Goal: "Increase productivity."
   * *Studio:* White-labeled client portals, webhook integrations, and automated reminder tasks. Goal: "Run a real business."
4. **Permanent Guardrail:** The backend core (Revenue Kernel, Entry Platform, Security, RLS tables) is frozen. Product evolution must focus on refining client-side zones, intelligence interfaces (AI Advisor), and friction-free payment gates.

---

## Phase 1 — Product Vision

### What is Corvioz?
Corvioz is a Freelancer Daily Business Workspace. It provides independent workers, solo business owners, and small agency teams with the core tools required to run their businesses: invoice drafting, proposal scopes, client inquiries, white-labeled gateways, and automated overdue tracking.

### Who it Serves
The primary customer profile is the North American freelancer (creative designer, developer, copywriter, or marketing consultant) who operates as a sole proprietor or small LLC. They are billing-centric, time-constrained, and experience administrative friction when managing payments.

### The Problem it Solves
Freelancers lose up to 20% of their working hours to administrative tasks and late client payments. Existing software falls into two categories:
* *Complex Accounting Tools (QuickBooks, FreshBooks):* Overwhelming layout, high subscription fees, and slow setup.
* *Passive Templates (Word docs, Excel sheets):* Lack billing status tracking, Stripe integrations, or professional portal views.

Corvioz solves this by providing a zero-setup workspace that automates invoicing, tracks client portal views in real-time, and assists with proposals.

### Why Freelancers Choose Corvioz
* **Zero-Signup Activation:** Users can draft and download a professional invoice within 30 seconds of hitting the homepage without inputting an email.
* **Bento Profile CRM:** Features an integrated public profile that captures client inquiries and feeds them directly into the user's CRM pipeline.
* **Proactive Follow-Ups:** Instead of showing blank charts, the workspace suggests pre-written scripts to follow up on proposals and collect overdue bills.

### Long-Term Product Philosophy
Corvioz is designed to remain simple and premium. It functions like an administrative assistant, helping freelancers get paid faster while keeping them focused on their billable work.

---

## Phase 2 — Product Principles

These five product principles are immutable. They serve as the design criteria for all future features.

```
┌────────────────────────────────────────────────────────────────────────┐
│                        IMMUTABLE PRODUCT PRINCIPLES                    │
├────────────────────────────────────────────────────────────────────────┐
│ 1. Workspace over Dashboard     │ Help users complete work, don't just │
│                                 │ report diagnostics.                  │
│ 2. Actions before Analytics     │ Surface the next step before showing │
│                                 │ historical charts.                   │
│ 3. Simplicity over Complexity   │ Limit inputs and reduce configuration│
│                                 │ steps.                               │
│ 4. Guidance over Reporting      │ Proactively recommend the best paths │
│                                 │ to secure cash flow.                 │
│ 5. Premium UX over Bloat        │ Optimize critical interactions over  │
│                                 │ adding generic feature lists.        │
└────────────────────────────────────────────────────────────────────────┘
```

---

## Phase 3 — Product Structure & Relationship Map

This section maps the structural flow of Corvioz, showing the relationships between every major module.

```
  ┌──────────────┐     Try without Signup      ┌──────────────────────┐
  │ 1. Landing   │ ──────────────────────────> │  2. Guest Builder    │
  └──────────────┘                             └──────────────────────┘
         │                                                │
         │ Sign In / Start Free                           │ Sign Up to Save Draft
         ▼                                                ▼
  ┌──────────────┐                             ┌──────────────────────┐
  │  3. Signup   │ <────────────────────────── │  4. Draft Restore    │
  └──────────────┘                             └──────────────────────┘
         │
         │ Evaluated by Entry Authority
         ▼
  ┌──────────────┐     Bypasses redirect loop  ┌──────────────────────┐
  │4. Activation │ ──────────────────────────> │ 5. Workspace Today   │
  └──────────────┘       via Skip cookie       └──────────────────────┘
                                                          │
                    ┌─────────────────────────────────────┴─────────────────────────────────────┐
                    ▼                                     ▼                                     ▼
        ┌──────────────────────┐              ┌──────────────────────┐              ┌──────────────────────┐
        │  6. Starter Mode     │              │  7. Professional Mode│              │    8. Studio Mode    │
        ├──────────────────────┤              ├──────────────────────┤              ├──────────────────────┤
        │ • Invoice Creation   │              │ • Client CRM Leads   │              │ • White-label Portal │
        │ • PDF Exports        │              │ • Quote Proposals    │              │ • Automated Reminder │
        │ • Basic Directory    │              │ • AI Follow-Up Logs  │              │ • Revenue Forecasts  │
        └──────────────────────┘              └──────────────────────┘              └──────────────────────┘
                    │                                     │                                     │
                    │ 2nd Export                          │ 3+ Clients                          │ Annual Saving
                    ▼                                     ▼                                     ▼
        ┌──────────────────────┐              ┌──────────────────────┐              ┌──────────────────────┐
        │ 9. Pro Upgrade Modal │              │10. Studio Upgrade Mod│              │11. Prepayment Check  │
        └──────────────────────┘              └──────────────────────┘              └──────────────────────┘
```

---

### Module Descriptions & Integrations

* **Landing:** Homepage featuring the primary value proposition and direct routes to `/auth` and `/card/demo`.
* **Signup:** Authentication page (`/auth`) that checks for local storage drafts and routes to the dashboard or editor.
* **Activation:** Guided first-action page displaying the three primary tasks (Create Invoice, Send Quote, Add Client).
* **Workspace (Today):** The central hub of the application, consisting of five zones tailored to the user's active tier.
* **Proposals (Quotes):** The creation tool for sending project scopes and milestone schedules. It converts to an invoice in a single click post-approval.
* **Invoices:** The billing editor. Features itemized entries, tax rates, payment terms, and Stripe invoice configurations.
* **Client Portal:** The client-facing page (`/portal/doc/[id]`) showing document details, payment buttons, and client comments.
* **Payment (Stripe/Paddle):** Resolves payouts and monitors subscription plans. Updates database entitlements in real-time.
* **Retention Loop:** Recurrent user habits built around invoice statuses (Sent, Opened, Paid, Overdue) and lead follow-ups.
* **Monetization Gates:** Contextual, inline upgrade triggers that appear when users encounter scaling limits (e.g. database client counts or export volume).

---

## Phase 4 — Workspace Philosophy

### 1. Daily Workflow Map
The workspace is built around the daily work rhythm of a freelancer:
1. **Open Workspace:** Review overnight client views, comment posts, or payments.
2. **Prioritize Focus:** Execute the single most important cash-flow task (e.g., chasing an overdue payment).
3. **Qualify Leads:** Review client CRM inquiries and draft proposals.
4. **Draft Milestones:** Send out project estimates and convert approved quotes to invoices.
5. **Monitor Payments:** Check invoice statuses and review automated collection schedules.

---

### 2. Workspace Zones
* **Zone 1 — Today:** Urgent tasks, alerts, and onboarding guides.
* **Zone 2 — Money:** Revenue cards, outstanding receivables, and payout schedules.
* **Zone 3 — Clients:** Client CRM leads inbox, directories, and portal configurations.
* **Zone 4 — WIP:** Local and cloud-saved invoice drafts and profile completeness checkers.
* **Zone 5 — Business Health:** Heuristic assessments and business advice cards.

---

### 3. Business Health System
The Business Health system evaluates workspace data to assess stability. It operates in four states:
* *Latent:* Newly created accounts with no transactions.
* *Healthy:* Active clients, incomplete setup checks resolved, and zero overdue invoices.
* *Needs Attention:* Overdue invoices present or profile setup incomplete.
* *Critical Risk:* Unpaid overdue balances exceeding 50% of the user's average monthly billing.

---

### 4. AI Advisor
A proactive notification assistant that delivers contextual suggestions to help freelancers manage payments and follow-ups.
* *Starter:* Guided setup recommendations (e.g. "Connect Stripe for faster payouts").
* *Professional:* Automated reminder templates and follow-up alerts based on quote view patterns.
* *Studio:* Cash runway projections, pricing recommendations, and customer concentration reports.

---

### 5. Empty State Philosophy
Empty states must follow the **Goal-Action-Safety Framework**:
1. **The Goal:** Explain the value and purpose of the module.
2. **The Action:** Provide a clear, single-click creation template.
3. **The Safety:** Offer time estimates or reassurance cards to reduce friction.

---

### 6. Naming & Navigation Philosophy
Avoid developer-centric terminology in the UI (e.g. "Kernel status" or "Entry routes"). Use action-oriented, freelancer-aligned copy:
* Sidebar: `Workspace` (replaces "Dashboard").
* Dashboard Tabs: `Today` (Focus), `Money` (Analytics), `Inquiries` (CRM Leads), `Proposals` (Quotes).

---

### 7. Starter / Professional / Studio Workspace Modes
* *Starter:* Simple, guided invoice generation and basic tracking with zero configuration clutter.
* *Professional:* Sales-driven workspace featuring leads, proposal follow-ups, and AI reminder scripts.
* *Studio:* Brand-focused control center with white-labeled custom domains, automations, and runway projections.

---

## Phase 5 — User Journey

This section outlines the step-by-step user journey, from initial landing to long-term retention.

```
┌────────────────────────────────────────────────────────────────────────┐
│                          USER JOURNEY STAGES                           │
├────────────────────────────────────────────────────────────────────────┤
│ 1. VISITOR: Reads value proposition, enters guest builder.             │
│ 2. SIGNUP: Authenticates, drafts saved locally and synced to cloud.    │
│ 3. ACTIVATION: Completes first invoice, bypasses redirect loop.        │
│ 4. FIRST EXPORT: Watermarked PDF downloaded (1st attempt is free).     │
│ 5. REPEAT USAGE: Returns within 48h to draft 2nd document.             │
│ 6. MONETIZATION: 2nd export triggers Pro upgrade inline checkout.      │
│ 7. RETENTION: Uses automated reminders and tracks client portal views. │
└────────────────────────────────────────────────────────────────────────┘
```

---

## Phase 6 — Product Roadmap

A summary of the product roadmap, showing how features are organized into subsequent releases.

```
  ┌─────────────────┐      ┌─────────────────┐      ┌─────────────────┐
  │  V1: PRODUCTION │ ───> │  V1.5: WORKSPACE│ ───> │     V2: AI      │
  └─────────────────┘      └─────────────────┘      └─────────────────┘
                                                             │
                           ┌─────────────────┐      ┌────────┴────────┐
                           │    V4: TEAM     │ <─── │ V3: AUTOMATION  │
                           └─────────────────┘      └─────────────────┘
```

* **V1 — Production Launch:** Stable release of core billing features, Stripe payment gateways, basic client directories, and the entry routing layers.
* **V1.5 — Workspace Refactoring:** Implement the 5-Zone layout shell, resolve the P0 skip loop/draft restoration blockers, and consolidate the onboarding checklists.
* **V2 — AI Integration:** Integrate the DeepSeek API into the AI Advisor, replacing rule-based recommendations with intelligent proposal generation and pricing analysis.
* **V3 — Automation Engine:** Launch automated email reminder crons, webhook integrations, and client portal comment systems.
* **V4 — Collaborative/Team OS:** Introduce team collaborator seats, shared proposal templates, and group CRM pipelines.

---

## Phase 7 — Product Constitution

These ten product rules serve as the permanent design laws for Corvioz.

1. **Workspace is Active:** Never design a screen that only displays data without providing a clear next step.
2. **Actions First:** Financial status cards and action buttons must always sit above the fold, pushing tutorials and documentation below.
3. **No Redirection Loops:** Users must never be locked out of the workspace or redirected back into checklists if they choose to skip setup.
4. **Preserve Context:** Guest drafts must always be preserved post-auth and restored directly in the editor.
5. **Soft Paywall Walls:** Always allow users to download their first invoice for free (with a watermark) to build trust.
6. **No Technical Jargon:** Never expose system terminology (e.g. "auth authority", "entry resolution", "database schema status") to the user.
7. **Actionable Empty States:** Every empty list must include a template shortcut and explain how the module benefits the user.
8. **Value-Linked Upgrades:** Upgrades must always be linked to scaling friction (e.g. database limits) rather than feature blocks.
9. **Zero-Setup Billing:** Never require credit card details or bank setups before a user can draft and preview an invoice.
10. **Consistent Pricing:** Prices must remain consistent across marketing pages, modal prompts, and checkouts.
