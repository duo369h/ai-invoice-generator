# Corvioz Monetization Engine v1 (Revenue System Layer)

This document specifies the architecture, logic rules, user experience flow, and telemetry framework for the Corvioz Monetization Engine v1. 

The primary goal of this monetization layer is to optimize free-to-paid conversions and capture transaction analytics for all willingness-to-pay moments.

---

## 1. Product Tier Structure

Corvioz enforces a two-tier product model separating Free users from Pro/Agency paid subscribers:

| Capability / Resource | Free Tier | Pro & Agency Tiers |
| :--- | :--- | :--- |
| **Invoices Threshold** | Max 2 invoices created | Unlimited |
| **Quotes Threshold** | Max 1 quote created | Unlimited |
| **PDF Downloads** | Watermarked (Blocked on dashboard) | Watermark-free |
| **Invoicing Sending** | Blocked (Copy Link, Email triggers) | Unrestricted |
| **Client Portal Access** | Blocked | Unrestricted |
| **AI assistant & Reminders** | Blocked | Unrestricted |

---

## 2. Paywall Rules & Trigger Engine

The paywall engine is triggered programmatically at five distinct interaction vectors to restrict access to core premium operations:

1. **Invoice Creation Threshold**: Blocked when trying to create a 3rd invoice (`invoicesCount >= 2` for a new invoice creation or save attempt).
2. **Quote Creation Threshold**: Blocked when trying to create a 2nd quote (`quotesCount >= 1` for a new quote creation or save attempt).
3. **PDF Export Action**: Blocked when clicking "Download PDF Document".
4. **Sending Invoice / Copylink Action**: Blocked when clicking "Copy Link" to send an invoice to a client.
5. **Client Portal Access**: Blocked when clicking "Client Portal" in the sidebar or clicking "Copy Link" for quotes.

*Note: Paywall modals do not freeze user navigation. Users can close paywall dialogs and browse their existing data, maintaining a high-quality discovery experience.*

---

## 3. High-Converting Psychological Copy Matrix

Every paywall event utilizes high-converting psychological messaging structured as follows:

* **Workflow Proximity**: *"You are close to completing your workflow"*
* **Friction Minimization**: *"Unlock to continue without interruption"*
* **Social Proofing**: *"Most freelancers upgrade at this stage"*

These statements replace generic pricing tables inside the app's upgrade modals to align upgrade requests with immediate feature utility.

---

## 4. Behavioral Pricing Highlight System

The pricing landing page (`/pricing`) reads current user usage and intent stored locally:
* **Invoice Usage Detected**: Auto-highlights the Pro Plan card.
* **Quote Usage Detected**: Auto-highlights the Pro Plan card.
* **Dual Invoice + Quote Usage**: Dynamically flags the Pro Plan card as a **Hard Recommendation**.
* **Intent-based Checkout**: If the user has a pending checkout intent (e.g. they clicked "Upgrade" on Agency), the pricing page shifts its popular focus and highlights the attempted plan (e.g., Agency card receives the active glow state and badge).

---

## 5. Telemetry & Monetization Event Schema

All willingness-to-pay events are tracked and piped to the data analytics layer with mandatory tracking properties (`session_id`, `user_id`, `trigger_source`):

* `paywall_view`: Dispatched when the upgrade modal is displayed.
* `upgrade_click`: Dispatched when the upgrade button on the modal or pricing page is clicked.
* `pricing_view`: Dispatched when the pricing page is viewed.
* `checkout_started`: Dispatched when the Paddle checkout flow is loaded and initialized.
* `checkout_completed`: Dispatched when the transaction completes successfully.
* `feature_blocked`: Dispatched when a free user hits a paywall block.
