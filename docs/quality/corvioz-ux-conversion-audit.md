# Corvioz UX Trust & Conversion Audit
*Evaluating onboarding, guest capabilities, paywall transitions, and pricing psychology against modern SaaS benchmarks (Stripe, Linear, Framer, and Notion).*

---

## Executive Summary

This audit evaluates **Corvioz Freelancer OS** from the perspective of a first-time freelancer discovering the platform. 

Currently, Corvioz possesses a strong foundation: the transition from landing to guest-mode invoice creation is fast and reduces upfront commitment friction, similar to early Notion playboxes. However, critical pricing inconsistencies and signup redirect loops break user trust at key conversion moments. 

By applying design principles from **Stripe** (payment clarity and modal design), **Linear** (frictionless context transitions), **Framer** (interactive editor previews), and **Notion** (context-preserving onboarding), we can turn Corvioz into a trustworthy, high-converting product.

---

## 1. Landing → Invoice Journey

Evaluating the flow from landing on the homepage to creating the first invoice.

```
[ Landing Page ] ──(Click Hero CTA)──> [ Guest Invoice Builder ]
       │                                         │
 (Static Preview)                         (Pre-filled Sample)
```

### Clarity of Value
* **Successes**: The hero statement *"Create your first invoice instantly"* immediately targets freelancers in a high-intent, time-sensitive scenario. The kicker *"⚡ You don’t need an account to start"* removes signup hesitation.
* **Gaps**: While the messaging is clear, the primary product illustration below the fold is a static dashboard mock (`mode="preview"`). Clicking on this preview does absolutely nothing (clicks are intercepted by `e.preventDefault()`), which can make the site feel unresponsive.
* **Benchmark comparison (Framer)**: Framer landing pages feature interactive sandboxes. A reader expects a "Live Preview" to let them click tabs or change values. If clicks are frozen, it looks like a rendering bug.

### Emotional Comfort
* **Successes**: Bypassing OAuth/Email screens to enter the invoice creator directly offers high emotional comfort. It matches Notion's early layout of letting users build a page before claiming ownership.
* **Gaps**: The sudden shift from a dark landing hero into a complex split-screen workspace dashboard causes a minor visual shock.

### Visual Hierarchy & CTA Discoverability
* **Successes**: The primary CTA button (*"Generate First Invoice Instantly"*) features a premium glow that draws attention, and is well-balanced against the secondary *"Try Without Signup"* button.
* **Gaps**: On the homepage pricing cards, clicking "Start Free Invoice", "Try Without Signup", or "Generate First Invoice Instantly" all redirect to the same URL (`/invoices/create`). This makes the different tier cards feel like a visual trick rather than distinct pathways.

---

## 2. Guest Mode Experience

Evaluating the friction, safety, and natural flow of the guest-mode invoice editor.

### Does Guest Mode Feel Natural?
* **Successes**: Yes. Landing directly on a pre-populated invoice with sample line items (Acme Corporation, logo design services, etc.) helps freelancers understand formatting rules instantly without staring at a blank slate.
* **Gaps**: 
  1. The guest mode lacks restriction indicators on the sidebar tabs. A guest user can click "Quotes", "Leads CRM", or "Clients" in the sidebar, which opens completely empty tables.
  2. If a guest user attempts to create and save a Quote, the application crashes or displays a generic `401 Unauthorized` API error, because guest mode only handles invoice saves.

### Does the User Feel Free to Explore?
* **Successes**: The live PDF side-by-side preview updates instantly as fields are typed on the left. This real-time feedback loop makes the editor feel fast and safe.
* **Gaps**: Clicking sidebar tabs causes confusion because there is no feedback explaining that these tables are empty because they are logged out.

### Does Signup Appear at the Correct Moment?
* **Successes**: The signup wall appears only when the user clicks "Save Invoice". This ensures the user experiences value before committing.
* **Gaps**: Clicking "Save Invoice" triggers a hard page redirect to `/signup`. A hard redirect interrupts the workspace flow, creating anxiety that the draft has been discarded.
* **Benchmark comparison (Notion)**: Notion handles this with an inline modal or sliding drawer that prompts signup while keeping the editor visible in the background, preventing visual context loss.

---

## 3. Export Paywall UX

Evaluating the paywall modal triggered during PDF export.

```
[ Export Action ] ──> [ Export Modal (Free vs Pro comparison) ]
                               │
            ┌──────────────────┴──────────────────┐
            ▼                                     ▼
 [ Upgrade to Pro ($49/mo) ]        [ Download with Watermark (Free) ]
```

### Does the Paywall Feel Respectful?
* **Successes**: The paywall is a "soft wall" rather than a hard blocker. Providing a *"Download with Watermark (Free)"* button alongside the premium upgrade ensures freelancers can finish urgent tasks, which builds long-term goodwill.
* **Gaps**: The modal highlights Pro at **$49/month**, which is a steep step-up compared to the prices advertised on the landing and pricing pages.

### Does it Explain Value?
* **Successes**: The modal features a clean, side-by-side comparison table (Free vs Pro) detailing the limits (Branded Client Portals, Watermark presence, and Invoice volume).
* **Gaps**: It misses an opportunity to show a visual comparison of a watermarked PDF vs a branded PDF, which is the primary driver for a professional upgrade.

### Upgrade vs. Restriction
* **Successes**: Framing the paywall as *"Export your invoice professionally"* positions the upgrade as a business expansion rather than a penalty.
* **Benchmark comparison (Stripe/Linear)**: Stripe and Linear explain feature values (e.g. custom domain, branding) educationally. Corvioz does this well with the comparison table, but the price mismatch breaks the educational narrative.

---

## 4. Pricing Psychology

Evaluating the trust, perceived value, and pressure levels of the monetization tiers.

### Trust & Confidence
* **Critical Trust Gap (The Price Mismatch)**:
  * **Landing Page**: Pro plan is listed as **$7/month**, Agency as **$24/month** (yearly equivalent rate, but displayed with `/month` without stating "billed annually").
  * **Pricing Page**: Pro plan is **$9/month** (monthly) or **$7/month** (annual). Agency is **$29/month** (monthly) or **$24/month** (annual).
  * **In-App Upgrade & Export Modals**: Pro plan is hardcoded to **$49/month**.
  * **Impact**: This inconsistency creates immediate distrust. A user encountering this will feel they are experiencing a bait-and-switch pricing scheme.

### Perceived Value
* **Successes**: The value-add details (secure client portal, unlimited documents, money-back guarantee) are clear and high-value for freelancers.
* **Gaps**: The lack of a clear billing period toggle on the landing page leaves users confused about monthly vs annual obligations.

### Pressure Level
* **Successes**: Zero artificial scarcity elements (no fake countdown timers, no "only 3 spots left" prompts). This is highly respectful and matches the premium design standard of Linear and Notion.
* **Gaps**: The fee jump from $7/mo (advertised) to $49/mo (modal) creates a high-pressure feeling of unexpected costs.

---

## 5. Identified Friction Points

### Moments of Confusion
1. **Unexplained Landing Page Preview Lock**: Clicking the interactive dashboard card on `/` does nothing. Users may think the site is frozen.
2. **Empty Guest Tabs**: Navigating to non-invoice tabs as a guest displays empty states with no explanation of guest status.
3. **Empty PDF Preview State**: Clearing all fields in the invoice form leaves the PDF preview blank. An empty page looks broken rather than unwritten.

### Moments of Hesitation
1. **Guest Save Redirect**: Redirecting to `/signup` after clicking "Save Invoice" makes guests hesitate, fearing their work will be lost.
2. **Bare Signup Screen**: The `/signup` page is blank and lacks testimonials, security badges, or reassurance, leaving users unmotivated to register.
3. **Unprotected Quote Saving**: Clicking "Save Quote" as a guest triggers an unhandled `401` error, breaking the safety feeling of the app.

### Moments of Distrust
1. **Bait-and-Switch Pricing**: Discovering three different prices ($7, $9, and $49) for the same Pro tier across the app.
2. **Hidden Annual Pricing**: Listing annual rates on the homepage without clarifying that it requires a yearly commitment.
3. **Repetitive Modal Paywalls**: The paywall pops up repeatedly on export retries without adjusting its copy to acknowledge the user's ongoing attempts.

---

## 6. Suggested UX Improvements

We recommend the following UX improvements to optimize trust and conversion rates (without adding new features or changing the product structure):

```
       [ Proposed Onboarding & Pricing Improvements ]
                             │
     ┌───────────────────────┼───────────────────────┐
     ▼                       ▼                       ▼
[ Pricing Alignment ]   [ Auth Context ]        [ Guest State Locks ]
- Align modals to       - Save badge on auth    - Read-only sidebar tabs
  show active pricing     page to confirm draft   with informative locks
  (monthly $9/mo)         is saved safely.        for guest sessions.
```

### 1. Pricing Harmonization (Trust Optimization)
* **Action**: Align the Pro plan price displayed in `ExportRestrictionModal.js` and `UpgradeModal.js` with the active pricing page model (**$9/month** for monthly, **$7/month** for annual) instead of the hardcoded **$49/month**.
* **Action**: Add clear, visible kicker badges to the landing page pricing cards clarifying *"Billed annually ($84/yr)"* for the $7/mo and $24/mo cards, or add a billing toggle switch similar to the pricing page.
* **Quality Reference**: **Stripe Billing Checkout**.

### 2. Context-Preserving Signup Flow (Conversion Optimization)
* **Action**: On the `/signup` and `/auth` page, detect if the user has a draft invoice saved in `localStorage` (`corvioz_pending_invoice`). If active, render a confirmation card:
  > **Draft Invoice Saved!** ⚡
  > *"Acme Corporation invoice draft is saved locally. Create an account to sync it to the cloud."*
* **Action**: On `/auth`, display a summary section highlighting security assurances (e.g. "Secure 256-bit encryption", "No credit card required") and a quote from a customer to increase registration confidence.
* **Quality Reference**: **Notion Onboarding / Linear Auth Journey**.

### 3. Guest Mode Guardrails (UX Optimization)
* **Action**: If a guest user is on `/invoices/create` (unauthenticated):
  * Display a visual indicator (e.g. a small padlock icon or "Preview Mode" tag) next to sidebar navigation items for *Leads CRM*, *Quotes*, *Clients*, and *Public Profile*.
  * If they click these locked tabs, instead of displaying blank tables or allowing actions that crash, render a unified lock screen:
    > **Locked during Guest Session** 🔒
    > *Save your current invoice first, then sign up to access client portals, quotes, and lead generation.*
* **Action**: Intercept the "Save Quote" action in guest mode and handle it like invoice saves: serialize the quote to `localStorage` and redirect to signup with a confirmation badge.
* **Quality Reference**: **Linear Product onboarding**.

### 4. Visual Previews & Editor Polishing
* **Action**: If a user clears the invoice form fields, instead of displaying a blank PDF page, render a watermark skeleton preview with guidance placeholders (e.g. *"[Your Company Name]"*, *"[Client Name]"*) to keep the page interactive.
* **Action**: Make the landing page interactive preview responsive to tab clicks (read-only mode), or change the label from "Live Preview" to "Dashboard Interface Preview".
* **Quality Reference**: **Framer Canvas Engine**.
