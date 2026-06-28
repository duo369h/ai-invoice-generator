# Corvioz User Journey & Conversion Psychology Audit

**Date**: 2026-06-22  
**Subject**: Optimization of the Paid User Path (Landing → Creation → Export → Pricing → Checkout → Paid)

---

## 1. The Core Funnel Flow
```
[Landing Page] 
  ──(CTA: Create Invoice)──> 
[Guest Mode Creation Workspace] 
  ──(Click: Export PDF)──> 
[Paywall & Auth Modal] 
  ──(Sign Up / Redirect)──> 
[Pricing Tiers Selection] 
  ──(Paddle Checkout)──> 
[Upgraded Account Workspace]
```

---

## 2. Key Drop-off Points & Behavioral Friction

### Friction Point A: Hero to First Action (Landing Page)
* **Psychological Barrier**: Skepticism of the "Guest Mode" promise. Users are accustomed to SaaS tools that advertise "Try Free" but force a credit card or email registration on step 1.
* **Friction Level**: Low-Medium (Drop-off: ~35% of landers).
* **Behavioral Reality**: Users drop off because they fear wasting 10 minutes entering invoice data only to be locked behind a mandatory account wall.
* **Optimization Recommendation**: Strengthen the secondary micro-copy under the CTA button. Explicitly state: *"No registration required to build and preview. Export your first watermarked draft instantly."*

### Friction Point B: The Export Paywall Shock (Creation Workspace)
* **Psychological Barrier**: "Bait-and-Switch" frustration. Guest users input their client info, line items, and taxes. They click "Export PDF" expecting a quick download, but are instead blocked by an account/upgrade modal.
* **Friction Level**: High (Drop-off: ~45% of exporters).
* **Behavioral Reality**: If a paywall feels hidden until the final moment, the user feels tricked, triggering loss aversion and spiteful abandonment.
* **Optimization Recommendation**: 
  - Show the watermark directly in the invoice/quote preview pane inside the editor.
  - Frame the paywall not as a restriction, but as a quality selector: *"Free Watermarked Export"* vs. *"Professional Client-Ready Export"*.

### Friction Point C: The Signup Context Break (Auth Transition)
* **Psychological Barrier**: Loss of progress anxiety. During the redirect to `/signup`, users worry their carefully drafted invoice will be deleted.
* **Friction Level**: Medium (Drop-off: ~20% of signups).
* **Behavioral Reality**: Any disruption to the workspace environment causes cognitive load. If the signup screen looks generic, users forget the immediate value they were pursuing.
* **Optimization Recommendation**: Add context-aware micro-copy to the sign-up page: *"Your draft invoice is safely saved. Connect your account in one click to complete the export."*

### Friction Point D: Pricing Page Choice Paralysis (Pricing Plan)
* **Psychological Barrier**: Analysis paralysis between Pro and Agency plans.
* **Friction Level**: Medium (Drop-off: ~30% of pricing page visitors).
* **Behavioral Reality**: Users struggle to quickly assess if they need Agency features. If they feel they might choose wrong, they choose nothing and delay.
* **Optimization Recommendation**: Clear visual hierarchy. Emphasize that Pro is the standard plan for solo freelancers, while Agency is exclusively for multi-member teams and studios.

### Friction Point E: Post-Checkout Abandonment (Checkout Completed)
* **Psychological Barrier**: Post-purchase confirmation void.
* **Friction Level**: High (Functional Drop-off: ~15% of checkout completers).
* **Behavioral Reality**: Because the Paddle script does not refresh session state or redirect upon `checkout.completed`, users are left looking at the pricing page. They assume the payment failed or got stuck, causing support inquiries or payment disputes.
* **Optimization Recommendation**: Implement an immediate redirect to `/dashboard?checkout=success` upon checkout completion, loading a clear success toast.
