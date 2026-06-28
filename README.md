# Corvioz: Freelancer Daily Business Workspace
**Development Lifecycle Phase:** Operational  

Welcome to the Corvioz repository. Corvioz is a Next.js + Supabase workspace designed to help freelancers manage client inquiries, draft proposals, issue professional invoices, and track payment statuses with minimal administrative friction.

---

## 1. Quick Start

### Local Setup
1. **Install Dependencies:**
   ```bash
   npm install
   ```
2. **Launch Development Server:**
   ```bash
   npm run dev
   ```
3. **Staging Build Verification:**
   ```bash
   npm run build
   ```

### Core Stack
* **Framework:** Next.js (Pages / App Router)
* **Database & Auth:** Supabase
* **Payments:** Paddle Checkout (sandbox environment configuration)
* **Analytics:** Google Analytics 4 (funnel-tracking event layers)

---

## 2. Documentation Map

All project design parameters, blueprints, audits, and checklists reside under the **[docs/](file:///Users/duo/Documents/想做个网站/corvioz/docs/)** folder:

* 📄 **Vision & Principles:** [Product Bible](file:///Users/duo/Documents/想做个网站/corvioz/docs/product/CORVIOZ_PRODUCT_BIBLE.md) (SSOT)
* 📄 **UX Specifications:** [Experience Architecture](file:///Users/duo/Documents/想做个网站/corvioz/docs/product/WORKSPACE_EXPERIENCE_ARCHITECTURE.md)
* 📄 **Developer Tasks:** [Implementation Spec](file:///Users/duo/Documents/想做个网站/corvioz/docs/product/WORKSPACE_IMPLEMENTATION_SPEC.md)
* 📄 **Release Gates:** [Readiness System](file:///Users/duo/Documents/想做个网站/corvioz/docs/quality/PRODUCTION_READINESS_SYSTEM.md)
* 📄 **Documentation Index:** [Document Index Map](file:///Users/duo/Documents/想做个网站/corvioz/DOCUMENT_INDEX.md)

---

## 3. Product Hierarchy

Corvioz adapts its workspace layout and features based on the user's business maturity tier:

1. **Starter Workspace Mode:** Designed to get freelancers paid quickly with basic invoice creation and single-format PDF exports.
2. **Professional Workspace Mode:** Integrates CRM client inquiries, proposal drafting, and automated reminder scripts.
3. **Studio Workspace Mode:** Features white-labeled portals on custom domains, client collaboration, and cash runway projections.

---

## 4. Development Workflow

To maintain a clean codebase and clear documentation, developers must follow these four steps:

```
  1. READ PRODUCT BIBLE   ➔   2. EXECUTE SPEC   ➔   3. VERIFY RELEASE GATES   ➔   4. DOCUMENT AUDIT
```

1. **Read Constraints:** Always consult the [Product Bible](file:///Users/duo/Documents/想做个网站/corvioz/docs/product/CORVIOZ_PRODUCT_BIBLE.md) to ensure UI and operational constraints are respected.
2. **Execute Tasks:** Follow the instructions detailed in the [Implementation Spec](file:///Users/duo/Documents/想做个网站/corvioz/docs/product/WORKSPACE_IMPLEMENTATION_SPEC.md).
3. **Release Gates:** Run checks in the [Readiness Checklist](file:///Users/duo/Documents/想做个网站/corvioz/docs/quality/PRODUCTION_READINESS_SYSTEM.md) to verify that performance, mobile styling, and user journeys are correct.
4. **Document Sprints:** File a **Sprint Audit Report** in the `docs/quality/` directory to log changes, testing results, and build compliance.
