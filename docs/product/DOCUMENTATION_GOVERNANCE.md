# Corvioz Documentation Governance: Re-organizing Project Knowledge
**Document Version:** 1.0  
**Role:** Documentation Architect  
**Status:** Approved for Repository Structure Refactoring  

---

## Executive Summary

As Corvioz moves from active product planning to implementation, managing documentation becomes key to development speed. The repository currently contains numerous Markdown files, including blueprints, audit reports, setup checklists, and growth simulations. Without a clear governance system, this information risks becoming duplicate, contradictory, or difficult to find.

This document establishes the **Documentation Governance System** for Corvioz. It inventories and classifies all existing files, assigns clear authority levels, defines documentation rules to prevent content duplication, and outlines the recommended structure for the repository's `README.md`.

---

## Phase 1 — Documentation Inventory

Every Markdown document in the workspace root has been identified and classified into one of six categories.

```
┌────────────────────────────────────────────────────────────────────────┐
│                        DOCUMENTATION INVENTORY                         │
├────────────────────────────────────────────────────────────────────────┤
│ • Product (Specs & Blueprints)    • Quality (Audits & Verifications)  │
│ • Launch (Checklists & Guides)    • Engineering (Contracts & Specs)   │
│ • Research (Models & Analytics)   • Historical (Obsolete & Archives)  │
└────────────────────────────────────────────────────────────────────────┘
```

---

### 1. Product (Core Specs & Design Blueprints)
* `CORVIOZ_PRODUCT_BIBLE.md` — The single source of truth for product direction.
* `WORKSPACE_EXPERIENCE_ARCHITECTURE.md` — UX architecture blueprints.
* `DASHBOARD_UX_BLUEPRINT.md` — Original dashboard design and competitor analysis.
* `corvioz-brand-system-v1.md` — Core brand assets and spacing rules.
* `corvioz-growth-system-v1.md` — Conceptual user growth models.
* `corvioz-monetization-engine-v1.md` — Core pricing tiers and gateway plans.
* `corvioz-icon-language-system-v1.md` — Unified icon selection and layout guidelines.
* `corvioz-ui-system-2.0.md` — Standard CSS classes and visual identity tokens.

### 2. Quality (Audits & Verifications)
* `PRODUCTION_READINESS_SYSTEM.md` — Release gates and checklist checks.
* `AUDIT_REPORT.md` — Core usability and functional audit checks.
* `corvioz-first-user-audit.md` — Onboarding and activation UX checks.
* `corvioz-conversion-audit-report.md` — CTA and navigation click audits.
* `corvioz-beta-ui-polish-report.md` — Visual polish task list.
* `corvioz-beta-ux-polish-report.md` — UX task logs.
* `corvioz-ui-consistency-audit.md` — UI components layout check.
* `corvioz-ux-conversion-audit.md` — User friction mapping and reports.
* `corvioz-interaction-audit-report.md` — User interaction audit checks.
* `corvioz-production-audit-report.md` — Production staging checklist.
* `corvioz-revenue-audit-report.md` — Stripe sandbox transaction checks.
* *Staging verification reports:* `corvioz-ga4-funnel-verification-report.md`, `corvioz-ga4-production-final-verification.md`, `corvioz-real-funnel-validation-report.md`, `corvioz-ga4-production-report.md`, `corvioz-ga4-production-fix-report.md`.
* *UI polish logs:* `corvioz-brand-consistency-report.md`, `corvioz-brand-system-ux-validation.md`, `corvioz-button-interaction-fix-report.md`, `corvioz-ui-consistency-fix-report.md`, `corvioz-ui-final-polish-report.md`, `corvioz-ui-hotfix-report.md`, `corvioz-ux-final-fix-report.md`, `corvioz-v5-9-audit-report.md`.

### 3. Launch (Checklists & Guides)
* `corvioz-launch-checklist.md` — Launch readiness tasks.
* `AUTH_CHECKLIST.md` — Supabase authentication setup checklist.
* `DEPLOYMENT_CHECKLIST.md` — Vercel deployment checklists.
* `DOMAIN_DNS_CHECKLIST.md` — DNS record configuration checklist.
* `DOMAIN_SETUP.md` — Custom domain setups.
* `EMAIL_PREPARATION.md` — SMTP setup checks.
* `ENV_REQUIRED.md` — Missing environment variables guides.
* `PRODUCTION_LOOP.md` — Production release checklist.
* `SUPABASE_PRODUCTION_VERIFICATION.md` — Database checks.
* `VERCEL_ENV_CHECKLIST.md` — Vercel dashboard environment keys checklist.
* `corvioz-beta-launch-readiness.md` — Staging readiness checklists.
* `corvioz-launch-blockers.md` — Issues blocking deployment.
* `corvioz-launch-fix-checklist.md` — Hotfix check items.
* `corvioz-production-checklist.md` — Live production checklist checks.
* `corvioz-production-risk-list.md` — Risk assessment lists.

### 4. Engineering (Architecture & Tech Specs)
* `WORKSPACE_IMPLEMENTATION_SPEC.md` — Next-sprint implementation blueprint for Codex.
* `corvioz-dashboard-unified-architecture.md` — Dashboard operation modes.
* `corvioz-analytics-contract-v1.md` — Event schema contracts.
* `corvioz-analytics-implementation-report.md` — GA4 integration verification.
* `corvioz-brand-system-implementation-report.md` — Custom style guidelines.
* `corvioz-env-setup-guide.md` — Environment variable guide.
* `client_detection_logic.md` — CRM auto-save logic specs.
* `corvioz-conversion-engine-system.md` — Stripe webhook listeners and checkout scripts.
* `SUPABASE_SETUP.md` — SQL table setups and schema migrations.
* `t_plus_2h_reengagement_logic.md` — Re-engagement logic rules.

### 5. Research (Models & Analytics)
* `first_paying_user_model_v1.md` — Explains the 36h repeat exporter conversion path.
* `behavior_simulation_report.md` — Simulates user pathing and conversion.
* `conversion_breakpoint_analysis.md` — Spots where users drop off.
* `conversion_risk_assessment.md` — Checks conversion risk elements.
* `corvioz-100-user-growth-execution-plan.md` — Growth and marketing steps.
* `corvioz-beta-conversion-report.md` — Sandbox payment funnel report.
* `corvioz-beta-growth-report.md` — Analytics conversion data.
* `corvioz-growth-simulation-report.md` — Growth model charts.
* `corvioz-growth-validation-report.md` — Onboarding funnel validation.
* `cashflow_model_v1.md` — Financial models.
* `cashflow_acceleration_report.md` — Payout settlement models.
* `acceleration_levers.md` — Growth acceleration points.
* `export-value-psychology.md` — Watermark vs. Pro pricing psychology.
* `export_context_model.md` — PDF export tracking data.
* `export_flow_state_diagram.md` — Export state models.
* `first_export_monetization_flow.md` — 1st vs. 2nd export rules.
* `first_payment_countdown_v1.md` — Urgent alert logic for unpaid invoices.
* `guest-to-paid-flow.md` — Guest-mode signup conversion.
* `monetization_trigger_map.md` — Behavioral checkout popups.
* `pricing-decision-optimization.md` — Paddle price calibration models.
* `studio_reality_alignment_report.md` — Studio mode validation.
* `studio_repositioning_report.md` — Professional to Studio upgrade models.
* `user-journey-breakdown.md` — Onboarding funnel analytics.
* `user_behavior_depth_schema.md` — Deep engagement metrics.

### 6. Historical (Obsolete & Archives)
* `implementation_plan.md` — Legacy setup plan (Superseded by Workspace Implementation Spec).
* `task.md` — Obsolete todo lists.
* `walkthrough.md` — Old documentation of early staging tasks.
* `simulation_removal_report.md` — Logs removing test scripts.
* `feedback-system-v1-report.md` — Obsolete customer response logs.

---

## Phase 2 — Proposing the Folder Structure

To organize this documentation without breaking import paths or developer access, we propose organizing the repository root into a structured `docs/` directory.

```
corvioz/ (Repository Root)
├── docs/
│   ├── product/       # SSOT specifications, blueprints, and branding
│   ├── quality/       # QA systems, checklists, and audits
│   ├── engineering/   # Technical contracts, architecture, and db setups
│   ├── launch/        # Environment configurations and production guides
│   ├── research/      # Growth models, cashflow analysis, and simulations
│   └── archive/       # Obsolete plans, old checklists, and logs
```

---

## Phase 3 — Authority Hierarchy

Documents are assigned to one of four authority levels. This determines which document takes precedence in the event of conflicting information.

```
                    AUTHORITY LEVELS MATRIX
                    
  Level A: Single Source of Truth ──> Definitive product / QA guidelines.
  Level B: Implementation Specs ──> Guidelines for active sprint tasks.
  Level C: Supporting References  ──> Historical audits and logs.
  Level D: Archived / Obsolete    ──> Replaced documentation.
```

* **Level A — Single Source of Truth (SSOT):**
  * *Files:* `CORVIOZ_PRODUCT_BIBLE.md`, `PRODUCTION_READINESS_SYSTEM.md`, `README.md`.
  * *Rule:* These documents are final. In the event of any contradiction, Level A files take precedence.
* **Level B — Implementation & Architecture:**
  * *Files:* `WORKSPACE_IMPLEMENTATION_SPEC.md`, `WORKSPACE_EXPERIENCE_ARCHITECTURE.md`, `DASHBOARD_UX_BLUEPRINT.md`.
  * *Rule:* Translates Level A principles into implementation specifications. Must align with Level A guidelines.
* **Level C — Supporting References:**
  * *Files:* Active competitor research, launch guides, and specific audits (e.g. `corvioz-launch-checklist.md`, `first_paying_user_model_v1.md`, `corvioz-conversion-audit-report.md`).
  * *Rule:* Provides context and background. Useful for understanding detail but superseded by Level B or Level A specs.
* **Level D — Historical / Archived:**
  * *Files:* Deprecated walkthroughs, obsolete TODO files, and old plan logs (e.g. `implementation_plan.md`, `task.md`, `walkthrough.md`).
  * *Rule:* No longer authoritative. Kept only for historical reference.

---

## Phase 4 — Document Relationships & Dependencies

This map illustrates how product decisions flow from high-level vision down to execution and verification.

```
          ┌────────────────────────────────────────────────────────┐
          │               CORVIOZ_PRODUCT_BIBLE.md                 │
          │                   (Level A - SSOT)                     │
          └────────────────────────────────────────────────────────┘
                                       │
            ┌──────────────────────────┴──────────────────────────┐
            ▼                                                     ▼
┌──────────────────────────────────────┐              ┌──────────────────────┐
│WORKSPACE_EXPERIENCE_ARCHITECTURE.md  │              │PRODUCTION_READINESS_ │
│         (Level B - Blueprint)        │              │       SYSTEM.md      │
└──────────────────────────────────────┘              │   (Level A - Quality)│
            │                                         └──────────────────────┘
            ▼                                                     │
┌──────────────────────────────────────┐                          │
│     WORKSPACE_IMPLEMENTATION_SPEC.md │                          │
│           (Level B - Spec)           │                          │
└──────────────────────────────────────┘                          │
            │                                                     │
            ▼                                                     ▼
┌────────────────────────────────────────────────────────────────────────┐
│                        Sprint Audit Report                             │
│                       (Level C - Verification)                         │
└────────────────────────────────────────────────────────────────────────┘
```

### Information Duplications & Contradictions
1. **Onboarding Checklists:** Onboarding checklists are declared in `DASHBOARD_UX_BLUEPRINT.md`, `WORKSPACE_EXPERIENCE_ARCHITECTURE.md`, and `corvioz-launch-checklist.md`.
   * *Resolution:* Consolidated into the **Onboarding Checklist** section of the `CORVIOZ_PRODUCT_BIBLE.md`.
2. **Pricing Plans:** Product prices and feature matrices vary across `corvioz-monetization-engine-v1.md`, `first_paying_user_model_v1.md`, and `corvioz-first-user-audit.md`.
   * *Resolution:* The pricing models in the `CORVIOZ_PRODUCT_BIBLE.md` ($9/mo Pro, $19/mo Professional, $29/mo Studio) are final. All other documents are secondary.

---

## Phase 5 — Archive Plan

The following documents should be moved to the `docs/archive/` directory to prevent developer confusion.

1. **`implementation_plan.md` ➔ `docs/archive/`**
   * *Reason:* Replaced by the comprehensive `WORKSPACE_IMPLEMENTATION_SPEC.md`.
2. **`walkthrough.md` ➔ `docs/archive/`**
   * *Reason:* Describes early staging setups that are now complete. Refactored into current QA verification steps.
3. **`task.md` ➔ `docs/archive/`**
   * *Reason:* Obsolete todo list. Active tasks are now tracked in sprint issues.
4. **`corvioz-blockers-list.md` / `corvioz-launch-blockers.md` ➔ `docs/archive/`**
   * *Reason:* Addressed and resolved. Future checks are handled by the `PRODUCTION_READINESS_SYSTEM.md`.

---

## Phase 6 — Future Documentation Rules

To keep the repository clean and maintainable, all future documentation must adhere to the following four rules.

1. **No New "Bibles" or "Blueprints":**
   * *Rule:* Never create suffix versions (e.g. `PRODUCT_BIBLE_v2.md` or `WORKSPACE_BLUEPRINT_v1.2.md`).
   * *Action:* Update the existing `CORVIOZ_PRODUCT_BIBLE.md` or `WORKSPACE_EXPERIENCE_ARCHITECTURE.md` and rely on Git history for version tracking.
2. **Mandatory Sprint Outputs:**
   * *Rule:* Every development sprint must produce a **Sprint Audit Report** in the `docs/quality/` folder.
   * *Action:* The report must map: changes introduced, business impact, UX verification, and manual test logs.
3. **Single Source of Truth Rule:**
   * *Rule:* If an implementation detail contradicts the `CORVIOZ_PRODUCT_BIBLE.md`, the developer must halt and request clarification rather than proceeding.
4. **No Technical Jargon in Product Specs:**
   * *Rule:* Product specs must focus on user behavior and capabilities. Technical jargon (e.g. database schemas or Next.js route names) belongs in `docs/engineering/`.

---

## Phase 7 — README.md Structure Recommendation

A proposed structure for the repository's primary `README.md` to help new developers get up to speed quickly.

```markdown
# Corvioz Freelancer Daily Business Workspace

## 1. Quick Start
* **Local Development Setup:** `npm install && npm run dev`
* **Staging Verification:** `npm run build`
* **Technology Stack:** Next.js, Supabase, Tailwind, Paddle, GA4.

## 2. Documentation Map
All documentation resides in the `docs/` directory:
* **Product Vision & Rules:** [Product Bible](file:///Users/duo/Documents/想做个网站/corvioz/CORVIOZ_PRODUCT_BIBLE.md)
* **Active Sprint Tasks:** [Implementation Spec](file:///Users/duo/Documents/想做个网站/corvioz/WORKSPACE_IMPLEMENTATION_SPEC.md)
* **Release Gates:** [Readiness System](file:///Users/duo/Documents/想做个网站/corvioz/PRODUCTION_READINESS_SYSTEM.md)

## 3. Product Hierarchy
* **Starter Workspace:** Goal: "Get first client paid."
* **Professional Workspace:** Goal: "Increase productivity & follow-up."
* **Studio Workspace:** Goal: "Run a real business."

## 4. Developer Workflow
1. Read the [Product Bible](file:///Users/duo/Documents/想做个网站/corvioz/CORVIOZ_PRODUCT_BIBLE.md) to understand UX laws.
2. Complete tasks outlined in the [Implementation Spec](file:///Users/duo/Documents/想做个网站/corvioz/WORKSPACE_IMPLEMENTATION_SPEC.md).
3. Run checks in the [Readiness Checklist](file:///Users/duo/Documents/想做个网站/corvioz/PRODUCTION_READINESS_SYSTEM.md) before pushing to staging.
4. Document changes using the **Sprint Audit Report** template.
```
