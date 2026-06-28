# Corvioz Icon Language System v1

**Date:** 2026-06-20  
**Status:** Audit & Design Proposal  

This document defines the unified icon design system for **Corvioz**, establishing semantic alignment, visual weight balance, and interactive feedback across all user-facing views (Landing Page, Dashboard Sidebar, Public Profile, Client Portal, and Auth Pages).

---

## 1. Icon Audit Findings & Inconsistencies

We audited all navigation, process stages, and status indicators across the repository. The following issues were identified:

### Semantic Duplication & Ambiguity
1. **Invoice Mismatch**: 
   - *Landing Page* uses a **Clipboard / Checklist** icon for Invoices.
   - *Dashboard Sidebar* and *Overview Empty States* use a **Dollar-in-Circle (Coin)** icon.
   - *Issue*: A dollar coin represents payment or currency, causing ambiguity. Both should be replaced by a cohesive **Receipt / Invoice** icon.
2. **Client Portal Mismatch**:
   - *Landing Page* uses a **Padlock / Lock** icon.
   - *Dashboard Sidebar* uses a **Portal Door / Sign-in** icon.
   - *Issue*: A padlock implies security/encryption (best suited for database or credentials), while the portal represents a collaborative workspace gateway. Both should align to the **Door Entry / Portal** icon.
3. **Public Profile Genericism**:
   - *Dashboard Sidebar* uses a **User-in-Circle** icon.
   - *Issue*: This is identical to a standard user avatar/account settings icon. Replacing it with an **ID Card / Business Card** icon makes it instantly clear it is a public-facing freelancer card.

### Interactive Clarity & Sidebar Spacing
- **Lack of Hover States**: Sidebar buttons use inline styles with `backgroundColor: activeTab === tab.id ? 'var(--btn-secondary-bg)' : 'transparent'`. There is no visual feedback on hover for inactive buttons.
- **Visual Weight**: Icon sizes and stroke weights are mostly consistent (`2px` stroke, outline style), but container alignments and flex margins have minor discrepancies.

---

## 2. Semantic Mapping Table

To ensure consistency, every primary feature is mapped to a single distinct icon:

| Feature / Page | Icon Name | Semantic Meaning | Recommended SVG Path (24x24 Grid, Outline) |
| :--- | :--- | :--- | :--- |
| **Dashboard / Overview** | `Layout Dashboard` | Unified grid status overview | `M4 4h6v8H4V4zm10 0h6v5h-6V4zm0 11h6v5h-6v-5zM4 16h6v4H4v-4z` |
| **Leads CRM** | `Inbox / Mail` | Unopened inquiries / inbound | `M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z` |
| **Quotes** | `File Text / Document` | Milestone estimates / terms | `M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z` |
| **Invoices** | `Receipt` | Itemized bills / requests | `M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1-2-1zm12 4H8v2h8V6zm0 4H8v2h8v-2zm-6 4H8v2h2v-2z` |
| **Clients** | `Users (Group)` | Directory of contacts | `M17 20h5v-2a3 3 0 00-5.356-1.857M9 20H4v-2a3 3 0 015.356-1.857M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z` |
| **Client Portal** | `Portal / Door Entry` | External client workspace gate | `M15 3h4a2 2 0 012 2v14a2 2 0 01-2 2h-4M10 17l5-5-5-5M15 12H3` |
| **Public Profile** | `ID Card / Profile` | Personal business card bento | `M3 4h18a2 2 0 012 2v12a2 2 0 01-2 2H3a2 2 0 01-2-2V6a2 2 0 012-2zm6 12a3 3 0 016 0M12 13a3 3 0 100-6 3 3 0 000 6z` |
| **Settings** | `Cog / Gear` | System configurations | *(Lucide Cog path: M12 15a3 3...)* |
| **Analytics** | `Chart` | Business metrics & performance | `M18 20V10M12 20V4M6 20v-6` |
| **SEO** | `Search` | Search engine indexing status | `M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z` |
| **Payments** | `Credit Card` | Transaction gateway | `M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z` |

---

## 3. Style & Consistency Guidelines

To achieve the premium look of Stripe and Linear, all icons must strictly adhere to the following rules:

1. **Monochrome Outline System**: No colored fills on icons. They must inherit color via `stroke="currentColor"` and utilize CSS classes for states.
2. **Stroke Width**: `strokeWidth="2"` is standard for UI navigation (with minor exceptions for smaller inline badges, which can use `1.5` or `2.5` to maintain optical weight).
3. **Bounding Boxes**: Every icon path is designed for a `0 0 24 24` viewBox grid to prevent offset shifts.
4. **Active/Hover State Scaling**:
   - **Active Navigation**: Background = `var(--btn-secondary-bg)`, Icon color = `var(--text-main)`, Opacity = `1.0`.
   - **Hover Navigation**: Background = `var(--btn-secondary-bg)` (slight transparency or transition), Icon color = `var(--text-main)`, Opacity = `0.9`, transition = `all 0.15s ease`.

---

## 4. Codebase Implementation & Refactoring Notes

The following codebase files will be aligned as soon as the plan is approved:

### 4.1. Sidebar Icon Paths
File: [DashboardClient.js](file:///Users/duo/Documents/想做个网站/corvioz/src/app/dashboard/DashboardClient.js)
```diff
- { id: 'overview', label: 'Overview', icon: 'M3 12l9-9 9 9M5 10v10a1 1 0 001 1h3m10-11v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' }
+ { id: 'overview', label: 'Overview', icon: 'M4 4h6v8H4V4zm10 0h6v5h-6V4zm0 11h6v5h-6v-5zM4 16h6v4H4v-4z' }

- { id: 'invoices', label: 'Invoices', icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z' }
+ { id: 'invoices', label: 'Invoices', icon: 'M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1-2-1zm12 4H8v2h8V6zm0 4H8v2h8v-2zm-6 4H8v2h2v-2z' }

- { id: 'profile', label: 'Public Profile', icon: 'M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z' }
+ { id: 'profile', label: 'Public Profile', icon: 'M3 4h18a2 2 0 012 2v12a2 2 0 01-2 2H3a2 2 0 01-2-2V6a2 2 0 012-2zm6 12a3 3 0 016 0M12 13a3 3 0 100-6 3 3 0 000 6z' }
```

### 4.2. Empty State Sync
File: [DashboardOverview.js](file:///Users/duo/Documents/想做个网站/corvioz/src/app/dashboard/components/DashboardOverview.js)
- Update the empty state illustration path for Invoices to match the Receipt path.

### 4.3. Landing Page Features Icon Sync
File: [page.js](file:///Users/duo/Documents/想做个网站/corvioz/src/app/page.js)
- Align the `Invoice` stage (stage index 2) to use the new `Receipt` path.
- Align the `Client Portal` stage (stage index 3) to use the `Portal Door` path instead of the padlock.

---
*Document prepared for review during the Corvioz Icon Language System v1 sprint.*
