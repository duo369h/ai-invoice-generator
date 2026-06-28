# Corvioz Guest-to-Paid Transition Flow & Onboarding UX

**Date**: 2026-06-22  
**Goal**: Design a low-friction, intent-preserving pathway that guides guest users into paid subscribers naturally.

---

## 1. Onboarding Progression Map

```
1. Guest Lands ──> 
2. Free Creation (Visualizing limit) ──> 
3. Preview PDF (Watermark warning visible) ──> 
4. Click Export ──> 
5. Select Pro (Draft saved to intent cache) ──> 
6. 1-Click Signup ──> 
7. Paddle Checkout (Draft synced automatically)
```

---

## 2. Transition Mechanics

### A. Proactive Usage Indicators
Rather than surprising users at the export gate, introduce a status pill in the creation sidebar:
- **UI Element**: `Usage Indicator`
- **Text**: *"Draft 1 of 5 free invoices used"*
- **Behavior**: Clicking this indicator reveals a calm comparison tooltip detailing Pro benefits, giving users warning before hitting the paywall.

### B. Intent-Preserving Signup
To prevent drop-off during registration, the checkout path must preserve the user's active work:
1. When a guest clicks "Upgrade to Pro" at the export modal, save the invoice/quote JSON draft payload to browser `localStorage` (`corvioz_pending_invoice`).
2. Save the target destination: `/pricing?checkout=pro`.
3. After Google OAuth or Email signup is completed, the dashboard checks `localStorage` for a pending draft.
4. If found, it automatically writes the draft to the database using the new user ID and proceeds directly to Paddle checkout.
5. **Outcome**: The user never loses their draft. The purchase decision is directly tied to the work they just completed.

### C. Trigger Timing Optimization
- **Gated Actions**: Only enforce checkout locks on **watermark-free PDF downloads** and **interactive client portals**.
- **Free Actions**: Let users draft, save locally, preview in-browser, and download watermarked copies without paying or signing up. This builds trust before asking for conversion.

---

## 3. Post-Export Follow-up
Once a free user downloads their watermarked document, show a non-intrusive banner on the dashboard workspace:
> *"Your watermarked PDF was downloaded. Ready to send this to a client? Upgrade to Pro for watermark-free client-ready exports and interactive client portal links."*
