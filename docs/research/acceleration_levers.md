# Corvioz Acceleration Levers v1
## How to Make the First Payment Arrive Faster

**Date:** 2026-06-23
**Source:** `first_payment_countdown_v1.md`, `payment_time_distribution.json`, `conversion_breakpoint_analysis.md`

---

## Lever Framework

Every acceleration lever targets one of three variables:

```
PAYMENT TIME = Gap Duration × Return Probability × Modal Conversion Rate

Compress the gap → Faster return → Shorter countdown
Increase return probability → More users reach the modal → Higher MRR volume
Improve modal conversion rate → More users cross the breakpoint → Higher MRR %
```

---

## Lever 1 — Watermark Prominence (Compresses Gap, Activates Fast Path)

**Current state:** Watermark is a semi-transparent overlay on exported PDF
**Impact on timeline:** Determines whether the user notices immediately (fast path, ~18min) or after client feedback (normal path, ~36h)

### What It Does
The watermark is the only marketing message that exists *outside the app* — it lives on the PDF the client receives. It is the silent salesperson. If the user doesn't notice it, or if the client doesn't react, the urgency never builds and the gap extends to 72h+.

### Acceleration Actions

| Action | Implementation | Expected Effect |
|---|---|:-:|
| Center-diagonal watermark placement | Increase watermark opacity, center placement on PDF | Fast path users ×2, gap −24h |
| Watermark text: "Upgrade at corvioz.com" | Add branded CTA inside the watermark text | Re-entry from PDF itself, bypass gap entirely |
| Export button label: "Watermarked PDF" | Change button text from "Download PDF" → "Watermarked PDF (free)" | Sets expectation before download, urgency priming |
| Preview watermark in invoice builder | Show translucent watermark overlay in the PDF preview panel | User sees watermark *before* export → may upgrade immediately |

**Estimated timeline impact:** Fast path share: 7.7% → 14% of converters. Gap duration: 36h median → 24h median.
**Revenue impact:** +$57/mo per 100 users. Zero engineering required for text changes; 2–4h for preview overlay.

---

## Lever 2 — Export Modal Copy Quality (Increases Breakpoint Conversion)

**Current state:** P(convert | modal shown) = 36%
**Target:** P(convert | modal shown) = 54%
**Revenue impact:** +$152/mo per 100 users

### Why This Is the Highest-Leverage Single Lever

The 2nd export modal is seen by approximately 11 users per 100-user cohort. It is the **only mandatory, non-dismissible monetization gate** in the system. No bypass exists for returning users. Every 1% improvement in modal conversion rate = +$9.90 MRR per 100 users.

### Current Modal vs. Optimized Modal

**Current:**
```
┌─────────────────────────────────────┐
│  🚀 Remove watermark from your PDFs │
│                                     │
│  Pro — $9/month                     │
│  ✔ Watermark-free PDF exports        │
│  ✔ Unlimited invoices & quotes       │
│  ✔ Private client portal            │
│  ✔ Payment reminders                 │
│                                     │
│  [Upgrade to Pro →]                  │
│  [Continue with watermark]           │
└─────────────────────────────────────┘
P(convert): 36%
```

**Optimized:**
```
┌─────────────────────────────────────────────────────┐
│  Your client deserves a clean invoice               │
│  ─────────────────────────────────────────────────  │
│  You've exported 2 PDFs. Each one had a watermark   │
│  your client could see. One upgrade removes it      │
│  permanently.                                       │
│                                                     │
│  Pro — $9/month                                     │
│  ✔ Watermark-free PDFs — all future exports          │
│  ✔ Unlimited invoices & quotes                       │
│  ✔ Client portal — share securely, track views       │
│  ✔ Automated reminders — follow up without emailing  │
│                                                     │
│  [Remove watermark — $9/mo →]   ← primary CTA       │
│  [Download watermarked (free)]  ← styled as downgrade│
└─────────────────────────────────────────────────────┘
P(convert): ~54% (projected)
```

### Copy Optimization Breakdown

| Element | Change | P(convert) Gain |
|---|---|:-:|
| Headline | "Remove watermark" → "Your client deserves a clean invoice" | +4% |
| Context line | Add "You've exported N watermarked PDFs" | +3% |
| Primary CTA button | "Upgrade to Pro →" → "Remove watermark — $9/mo →" | +4% |
| Secondary option | "Continue with watermark" → "Download watermarked (free)" | +3% (framing as downgrade) |
| Price anchoring | Standalone $9 → "Less than one invoiced hour of work" | +3% |
| Social proof (when real) | Add "Join 200+ freelancers using Pro" | +5% |
| **Total projected gain** | | **+18pp → 36% → 54%** |

**Effort:** Zero code. Pure copy change in modal component.

---

## Lever 3 — Email Gap Re-engagement (Increases Return Probability)

**Current state:** 36h gap has 65% return probability. 35% of users never return.
**Target:** 36h gap has 80% return probability.
**Revenue impact:** +$45/mo per 100 users

### The Gap Problem

The 35h 38min gap between Session 1 and Session 2 is entirely passive. Corvioz has no communication channel to the user during this time — no email (guest users have no account), no push notification, no re-engagement. The gap is entirely dependent on the user's own urgency (watermark + client pressure).

### Gap Re-engagement Options

#### Option A — "Save your invoice" email capture (highest impact)

Add an email capture at the end of Session 1, directly after the first successful export:

```
After PDF downloaded:
┌──────────────────────────────────────────────────────┐
│  ✅ Invoice exported!                                 │
│                                                      │
│  Enter your email to save this invoice and access    │
│  it anytime — no password needed.                    │
│                                                      │
│  [your@email.com              ] [Save Invoice →]     │
│                                                      │
│  We'll only email you about your invoice.             │
└──────────────────────────────────────────────────────┘
```

Follow-up email at T+24h:
> Subject: "Your invoice is still in your Corvioz workspace"
> "Last session you created [invoice name]. Log back in to export a clean, watermark-free version."

**P(return | email captured):** 80% (vs 65% without)
**Revenue impact:** +15% return rate × 33 Archetype B users × P(convert) 45% = +2.2 converts/cohort = **+$19.80 MRR**

#### Option B — "Your client may have seen this" in-app nudge

On the user's next visit to any page (even days later), surface a nudge:

```
"📄 Your watermarked invoice was exported 2 days ago.
   Your client may have noticed the watermark.
   Clean it up in one click → [Remove watermark]"
```

**P(convert | nudge shown to returning user):** 55% (vs 36% on cold modal)
**Revenue impact:** Converts 55% of returning users who saw nudge vs 36% = +$22/mo

#### Option C — Watermark removal link in the PDF itself

Add a QR code or short URL in the watermark text:

```
Watermark text: "CORVIOZ — Remove at corvioz.com/upgrade"
```

This converts the PDF itself into a re-engagement channel — even if the user doesn't return, the *client* can mention the URL, or the user can click directly from the PDF.

**P(direct URL conversion):** 5% of watermarked PDFs sent generate a click
**Revenue impact:** Low direct impact but bypasses the gap entirely for some users.

---

## Lever 4 — Client Visibility Loop Acceleration (Compresses Gap 50%)

**Current state:** User is unaware their client viewed the portal
**Target:** Surface "your client is looking at this right now" notifications
**Revenue impact:** Gap 36h → 18h for active portal users (+$29/mo)

### How the Client Visibility Loop Works

When an invoice or quote is sent and the client opens the portal (`quote_status_pending` or `invoice_viewed`), the user currently gets no real-time signal. They're unaware the client is looking at their document right now.

Adding a real-time notification:

```
📨 "Maya just opened your Invoice #INV-002"
   → View in portal → Send message → Send reminder
```

This notification creates **immediate urgency** in the user: their client is evaluating them right now. This compresses the return timeline from 36h to 2–4h for portal-engaged users.

### Implementation Path

**Option A:** Dashboard notification badge ("Client activity: 1 new view")
- Data already exists: `invoice_viewed` and `quote_status_pending` events are tracked server-side
- Just needs a UI surface (notification dot on dashboard tab)
- Effort: 4–6h

**Option B:** Email notification (requires email capture from Lever 3)
- "Your client [Name] just viewed your invoice"
- Effort: 1–2h (with email infrastructure in place)

**Expected gap compression:** 36h → 18h for ~20% of users (those with portal-active clients)
**Revenue impact:** Faster return → earlier modal → earlier payment for 3–4 users/cohort = **+$27–$36 MRR**

---

## Lever 5 — Pricing Page Trust Repair (Increases Breakpoint Completion Rate)

**Current state:** Pricing page has unsubstantiated social proof claims
**Impact:** P(pricing_view → payment_start) = 71%
**Target:** P(pricing_view → payment_start) = 78%
**Revenue impact:** +$12/mo

### Claims to Soften or Substantiate

| Current Claim | Status | Fix |
|---|:-:|---|
| "$12M+ Invoice Volume Billed" | ❓ Unverified | Remove until real. Replace with: "Invoices created and sent by freelancers like you" |
| "10k+ Active Freelancers" | ❓ Unverified | Replace with: "Used by freelancers across 40+ countries" (when real) |
| "4.9/5 User Satisfaction" | ❓ Unverified | Remove until surveyed. Replace with: "Beta — we're building this with your feedback" |
| "Secure 256-bit Encrypted Payments" | ✅ Paddle handles this | Keep — Paddle encrypts payments. But link to Paddle's security page for credibility |
| "RECOMMENDED (Highest Value Workspaces)" | 🟠 Pushy label | Replace with user-benefit framing: "Most chosen by active freelancers" |
| "HARD RECOMMENDATION" label | 🔴 Aggressive | Remove entirely |

**Effort:** Copy change only. Zero code. 30 minutes.
**Impact:** Converts 7% more pricing page visitors (71% → 78%) → +$12/mo

---

## Lever 6 — 3rd Export Hard Gate Optimization (Catches Modal Dismissers)

**Current state:** Users who dismiss the 2nd export modal hit the hard gate on export×3. P(convert | hard gate) = 38%.
**Target:** P(convert | hard gate) = 50%
**Revenue impact:** +$27/mo

### Hard Gate Design Improvement

Current hard gate: "You've reached the export limit. Upgrade to continue."
This framing is **restriction-based** — it sounds like the user is being blocked.

**Optimized framing:** "You've created 3 professional invoices. Upgrade to deliver them without the watermark."
This is **achievement-based** — it acknowledges progress and frames the upgrade as the natural next step.

Additionally: add a count of how many clients have seen the watermark:
> "You've sent N watermarked PDFs. Your clients have seen the Corvioz overlay N times."

This makes the real-world consequence concrete and immediate.

**Effort:** Copy change + minor logic to display watermarked PDF count. 1–2h.
**Impact:** +12pp on hard gate conversion (38% → 50%) → +$27/mo per 100 users.

---

## Acceleration Stack: Combined Impact

If all 6 levers are implemented:

| Lever | MRR Gain | Effort |
|---|:-:|:-:|
| L1: Watermark prominence | +$57 | Low (4h) |
| L2: Modal copy quality | +$152 | Zero (copy) |
| L3: Email gap re-engagement | +$45 | Medium (1–2 days) |
| L4: Client visibility notifications | +$29 | Medium (4–6h) |
| L5: Pricing trust repair | +$12 | Zero (copy) |
| L6: Hard gate reframing | +$27 | Low (1–2h) |
| **Total** | **+$322** | |
| **Current MRR** | $394 | |
| **Accelerated MRR** | **$716** | |
| **MRR increase** | **+81.7%** | |

### Priority Order (by ROI)

```
Priority 1 (Zero code, immediate):
  → L2: Modal copy       +$152 MRR | ~30 minutes work
  → L5: Pricing trust    +$12 MRR  | ~30 minutes work
  → L6: Hard gate copy   +$27 MRR  | ~1 hour work
  TOTAL: +$191 MRR for ~2 hours work

Priority 2 (Low code, high ROI):
  → L1: Watermark        +$57 MRR  | ~4 hours work
  → L4: Notifications    +$29 MRR  | ~6 hours work
  TOTAL: +$86 MRR for ~10 hours work

Priority 3 (Medium code, infrastructure):
  → L3: Email capture    +$45 MRR  | ~2 days work
  TOTAL: +$45 MRR for ~2 days work
```

### Payment Time Impact by Lever

| Lever | Current Median Payment | Accelerated Median |
|---|:-:|:-:|
| Baseline | T+38h | T+38h |
| L1 (watermark) | T+38h | T+24h |
| L2 (modal copy) | T+38h | T+36h (same time, more converters) |
| L3 (email) | T+38h | T+30h |
| L4 (notifications) | T+38h | T+20h |
| All levers combined | T+38h | **T+18h** |

> **Full lever activation shifts the median payment from T+38h to T+18h** — a 52% countdown reduction, achieved mostly through copy changes and notification infrastructure, with no changes to the core monetization architecture.

---

*Corvioz Acceleration Levers v1 — All impact estimates are probability-weighted projections. Validate with A/B testing after baseline traffic is established.*
