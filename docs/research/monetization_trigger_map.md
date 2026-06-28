# Corvioz Monetization Trigger Map v1.5

This document outlines the behavior-driven monetization trigger map implemented in Corvioz v1.5.

---

## 1. Export Monetization Gates

PDF exports represent high-intent actions where monetization is natural and highly convertible.

| Milestone | Action Type | User Experience | Telemetry Payload & Event | Bypass Permitted |
| :--- | :--- | :--- | :--- | :--- |
| **1st Export** | Free | Instantly triggers watermarked PDF download. Suggests upgrading via toast message. | `export_attempt` (watermark_free: false)<br>`export_attempt_1`<br>`watermark_view_triggered` (source: first_export) | Yes (free watermarked download) |
| **2nd Export** | Value Reinforcement | Triggers **Value Reinforcement Overlay**. Highlights Pro advantages (signature, client portal tracking, watermark removal). | `export_attempt` (watermark_free: false, source: value_reinforcement_modal)<br>`export_attempt_2`<br>`watermark_view_triggered` (source: second_export)<br>`pricing_view_after_export` | Yes (permits free watermarked download if user rejects upgrade) |
| **3rd Export** | Hard Lock | Triggers **Plan Selection Hard Lock**. Shows side-by-side Pro vs. Studio plan cards. Free watermark bypass is completely removed. | `export_attempt` (blocked, redirects to plan selection)<br>`pro_upgrade_view` / `studio_upgrade_view` | **No** (Must select a plan to proceed) |

---

## 2. Client Detection Funnels

Transitioning from individual invoicing tasks to client management marks a shift in user identity from freelancer to business operator.

| Client Count | Event Trigger | User Experience | Telemetry Event | Action CTA |
| :--- | :--- | :--- | :--- | :--- |
| **1st Client Created** | *Freelancer to Business transition* | Triggers **Business Mode Activated Modal** explaining the workflow shift and recommending Pro. | `business_mode_activated` | "Upgrade to Pro" (checks out Pro at $9/mo) |
| **2nd+ Client Created** | *Freelancer to Agency/Studio transition* | Triggers **Studio Preview Welcome Modal** explaining Studio value. Activates interactive Studio tab. | `studio_preview_triggered` | "Explore Preview" (redirects to Studio space) or "Upgrade to Studio" ($29/mo) |

---

## 3. Workflow Delay & Pressure System

Track client responsiveness and invoice status delays to trigger context-aware upsell cards in the workspace dashboard.

| Workflow State | Trigger Condition | Dashboard Insight Message | Telemetry Event | CTA Target |
| :--- | :--- | :--- | :--- | :--- |
| **Unresponsive Invoice** | `status === 'sent'` and age > 24 hours (no comments) | "Invoice #XXX has been sent for over 24 hours with no response. Upgrade to Pro to automate payment reminders." | `pending_event` (trigger_type: invoice_no_response_24h) | `/pricing?checkout=pro` |
| **Pending Proposal** | `status === 'sent'` and age > 48 hours | "Quote #XXX has been pending client action for over 48 hours. Upgrade to Pro to activate signature capture." | `pending_event` (trigger_type: quote_pending_48h) | `/pricing?checkout=pro` |
| **High Revision Rate** | invoice or quote edited >= 3 times | "You have revised invoice #XXX multiple times. Pro users lock milestone scopes to prevent revision fatigue." | `revision_event` (trigger_type: invoice_edited_3_times) | `/pricing?checkout=pro` |
| **Multi-Client Scaling** | client roster count >= 2 (on Free tier) | "Studio command center is recommended for managing multi-client project status boards." | `multi_client_event` (trigger_type: client_count_ge_2) | `/pricing?checkout=agency` |
