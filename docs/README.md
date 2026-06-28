# Corvioz Documentation Library
**Status:** Operational  
**Auditor / Architect:** Documentation Architect  

---

## 1. Folder Structure & Purpose

The documentation is organized into categorized folders to prevent scattered knowledge base logs:

* **[product/](file:///Users/duo/Documents/想做个网站/corvioz/docs/product/)**
  * *Purpose:* Core specifications, visual systems, and designs. Includes the **Product Bible** (Single Source of Truth) and UX blueprints.
* **[quality/](file:///Users/duo/Documents/想做个网站/corvioz/docs/quality/)**
  * *Purpose:* Product audits, conversion analyses, interface polish lists, and sessional release validation logs.
* **[engineering/](file:///Users/duo/Documents/想做个网站/corvioz/docs/engineering/)**
  * *Purpose:* Technical design plans, database setup schemas, and analytics contract events specifications.
* **[launch/](file:///Users/duo/Documents/想做个网站/corvioz/docs/launch/)**
  * *Purpose:* Env configurations, Paddle billing setups, domain records checklists, and prelaunch verification steps.
* **[research/](file:///Users/duo/Documents/想做个网站/corvioz/docs/research/)**
  * *Purpose:* Analytical growth sheets, user conversion models, cashflow runway math, and pricing optimization data.
* **[archive/](file:///Users/duo/Documents/想做个网站/corvioz/docs/archive/)**
  * *Purpose:* Legacy checklists, completed sprint task logs, and deprecated ideas kept only for reference history.

---

## 2. Authority Hierarchy

To prevent conflicting statements regarding product behavior or technical parameters, we enforce the following authority priority structure:

```
                    AUTHORITY LEVELS MATRIX
                    
  Level A: Single Source of Truth ──> Definitive product / QA guidelines.
  Level B: Implementation Specs ──> Guidelines for active sprint tasks.
  Level C: Supporting References  ──> Historical audits and logs.
  Level D: Archived / Obsolete    ──> Replaced documentation.
```

1. **Level A (Single Source of Truth):**
   * *Files:* [CORVIOZ_PRODUCT_BIBLE.md](file:///Users/duo/Documents/想做个网站/corvioz/docs/product/CORVIOZ_PRODUCT_BIBLE.md), [PRODUCTION_READINESS_SYSTEM.md](file:///Users/duo/Documents/想做个网站/corvioz/docs/quality/PRODUCTION_READINESS_SYSTEM.md).
   * *Rule:* Absolute authority. In case of discrepancies, Level A takes precedence.
2. **Level B (Implementation):**
   * *Files:* [WORKSPACE_IMPLEMENTATION_SPEC.md](file:///Users/duo/Documents/想做个网站/corvioz/docs/product/WORKSPACE_IMPLEMENTATION_SPEC.md), [WORKSPACE_EXPERIENCE_ARCHITECTURE.md](file:///Users/duo/Documents/想做个网站/corvioz/docs/product/WORKSPACE_EXPERIENCE_ARCHITECTURE.md).
   * *Rule:* Defines components and specs for active Sprints. Must align with Level A.
3. **Level C (Supporting References):**
   * *Files:* Audits, competitor research, and env setup files.
   * *Rule:* Provides analytical details but does not define product rules.
4. **Level D (Historical):**
   * *Files:* Legacy walkthroughs, task files, and old templates in `docs/archive/`.
   * *Rule:* Suppressed from current release check-gates.

---

## 3. Documentation Workflow

* **Sprint 1 — Planning:**
  * Check [CORVIOZ_PRODUCT_BIBLE.md](file:///Users/duo/Documents/想做个网站/corvioz/docs/product/CORVIOZ_PRODUCT_BIBLE.md) for architectural constraints.
  * Follow the [WORKSPACE_IMPLEMENTATION_SPEC.md](file:///Users/duo/Documents/想做个网站/corvioz/docs/product/WORKSPACE_IMPLEMENTATION_SPEC.md) for task lists.
* **Sprint 2 — Execution & Audit:**
  * Before deployment, run checks in [PRODUCTION_READINESS_SYSTEM.md](file:///Users/duo/Documents/想做个网站/corvioz/docs/quality/PRODUCTION_READINESS_SYSTEM.md).
  * Write a **Sprint Audit Report** based on the template in [PRODUCTION_READINESS_SYSTEM.md](file:///Users/duo/Documents/想做个网站/corvioz/docs/quality/PRODUCTION_READINESS_SYSTEM.md#phase-3--sprint-audit-template) and save it in `docs/quality/`.
* **Sprint 3 — Long-Term Updates:**
  * Never create suffix-based versions of files (e.g. `BIBLE_v2.md`). Update the existing documents directly and use Git commit history for tracking.
