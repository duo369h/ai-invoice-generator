# Corvioz Pricing Decision Optimization & Plan Hierarchy

**Date**: 2026-06-22  
**Goal**: Optimize the pricing page layout and copy hierarchy to reduce decision friction and steer freelancers toward the Pro tier.

---

## 1. Visual Plan Dominance (Pro Tier)
To reduce choice overload and guide user behavior, the **Pro** tier must stand out as the default, logical choice. 

### Recommended Visual Rules
* **Pro Plan Highlight**: Wrap the Pro card with a subtle shadow glow (`box-shadow: var(--shadow-lg)`) and a primary border color (`border: 2px solid var(--primary)`).
* **CTA Button Contrast**:
  - **Free**: Secondary neutral button (`btn-secondary`, gray border).
  - **Pro**: High-contrast primary button (`btn-primary`, solid background).
  - **Agency**: Secondary neutral button (`btn-secondary`).
* **Visual Badge**: Maintain a prominent badge centered at the top of the Pro card: `MOST POPULAR`.

---

## 2. Reducing Decision Friction

### A. Dynamic Billing Toggle
The toggle for Monthly vs. Yearly must emphasize the annual discount without hiding the low monthly cost.
- Display the monthly equivalent first: **$7 / month** (Pro, yearly) vs. **$9 / month** (Pro, monthly).
- Always display a micro-label under the annual price: *"Billed annually as $84/year"* to maintain transparency and Stripe-level trust.

### B. Plan Separation Strategy
Differentiate the core purpose of each tier using explicit target personas:
- **Free**: *"For starting freelancers testing their setup."*
- **Pro**: *"For active solo freelancers billing clients monthly."*
- **Agency**: *"For design/dev studios and teams with multiple collaborators."*

---

## 3. High-Contrast Plan Comparison

To avoid confusion, the pricing list must clearly highlight what is *gained* in the Pro tier:

```
[Free Plan] ──> Up to 5 invoices total (Watermarked)
[Pro Plan]  ──> Unlimited invoices (Watermark-Free) + Interactive Client Portal
[Agency]    ──> Pro + Multi-currency support & custom domains
```

This clear progression makes the decision feel obvious. Pro is the sweet spot that covers all basic commercial needs without unnecessary complexity.
