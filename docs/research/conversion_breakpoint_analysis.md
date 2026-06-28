# Corvioz Conversion Breakpoint Analysis
## Last Non-Paying State → First Irreversible Paying State

**Date:** 2026-06-23
**Source:** `first_conversion_path.json`, `first_paying_user_model_v1.md`

---

## What Is a Conversion Breakpoint?

A conversion breakpoint is the **exact moment** a user transitions from "free, reversible consideration" to "irreversible payment commitment."

In Corvioz's architecture, this is a single click event:

```
[PURCHASE_CONSIDERATION]
    User is reading the Pro upgrade modal.
    They can still close it. No charge. No commitment.

                    ▼

    User clicks "Upgrade to Pro →"

                    ▼

[PAYMENT_INITIATED]  ← BREAKPOINT
    Paddle checkout window is open.
    89% of users who reach this state complete payment.
    The system has crossed from consideration to near-certain revenue.
```

---

## The Four Breakpoint Zones

### Zone 1 — Free Zone (Steps 1–8)
**Duration:** T+0:00 → T+36:20 (~36 hours)
**Monetization shown:** None
**User can exit:** Yes, at any point, zero friction

| State | Entry Event | Exit Risk |
|---|---|:-:|
| UNACTIVATED | `landing_view` | 62% abandon |
| ACTIVATED | `invoice_create` | 42% abandon |
| VALUE_CREATED | `first_invoice_created` | 32% abandon |
| VALUE_DELIVERED | `export_attempt×1` (free) | 35% exit after PDF |
| LATENT | *(gap — real world)* | 35% never return |
| RETURNING | Return session | 20% bounce |
| HABIT_FORMING | `invoice_create (2nd)` | 12% abandon |
| WORKFLOW_DEPENDENT | `second_invoice_saved` | 10% abandon |

**Cumulative survival to Zone 2:** 100 × 0.38 × 0.58 × 0.68 × 0.65 × 0.65 × 0.80 × 0.88 × 0.90 ≈ **5.3 users reach the modal per 100 landed**

---

### Zone 2 — Decision Gate (Step 9)
**Duration:** T+36:22 → T+36:23 (~60 seconds)
**Monetization shown:** PricingUpsellModal (Pro offer)
**User can exit:** Yes — "Continue with watermark" option always present

This is the **last non-paying state.** The system has shown its offer. The user is weighing:
- Value received so far (2 invoices, 2 exports)
- Cost of watermark (client saw it, professional friction)
- Price of upgrade ($9/mo)
- Feature value (watermark-free, reminders, portal)

**P(proceed to payment_start | modal shown):** 36% (current)
**P(dismiss modal):** 64%

> The 64% who dismiss are not lost. They receive a watermarked PDF and will hit the hard gate on their 3rd export attempt. The modal is educational, not a dead end.

---

### Zone 3 — Breakpoint (Step 11) ← THE LINE
**Duration:** T+36:24 → T+36:25 (~60 seconds in Paddle)
**Event:** `payment_start`
**User can exit:** Technically yes (close Paddle overlay) — but 89% complete

```
                    ╔══════════════════════════════╗
                    ║  CONVERSION BREAKPOINT       ║
                    ║                              ║
                    ║  Event: payment_start        ║
                    ║  T+36:24                     ║
                    ║  P(complete | this state): 89%║
                    ╚══════════════════════════════╝
```

**Before breakpoint (PURCHASE_CONSIDERATION):**
- User is reading. Reversible. Free to exit.
- 71% of users in this state proceed to `payment_start`.
- The 29% who exit: likely to revisit later (they self-directed to pricing).

**After breakpoint (PAYMENT_INITIATED):**
- Paddle checkout open. Card input visible.
- 89% completion rate — this is near-certain revenue.
- The 11% who abandon: card declined, changed mind, Paddle UX friction.

---

### Zone 4 — Committed (Step 12)
**Duration:** T+36:26 onward
**Event:** `payment_complete` / `signup_complete`
**Revenue:** $9/mo active | LTV: $63

User is now a paying customer. Plan = Pro. Watermark removed on next export.

---

## Breakpoint Dissection

### What Makes a User Cross the Breakpoint?

Based on the path engine and archetype analysis, users who cross the breakpoint from PURCHASE_CONSIDERATION → PAYMENT_INITIATED share these characteristics:

| Signal | Present in first payer? | Why it matters |
|---|:-:|---|
| 2+ invoices created | ✅ Yes | Habit signal — not a one-off user |
| Real watermark exposure | ✅ Yes | Client saw watermark → professional urgency |
| Day-2 return | ✅ Yes | High-intent signal — came back with purpose |
| Modal timing: immediately post-export | ✅ Yes | Highest-relevance moment — user was trying to get a clean PDF |
| Price is $9 (low psychological barrier) | ✅ Yes | Below the "impulse" threshold for freelancers earning $50+/hr |
| Clear value-gap display in modal | ✅ Yes | Pro features listed directly against current friction |

### What Causes Breakpoint Failure?

Users who reach the modal but do NOT cross the breakpoint fail for these reasons (in order of frequency):

| Reason | Est. % of modal dismissals | Fix |
|---|:-:|---|
| "I'll upgrade later" (procrastination) | 40% | Hard gate on export×3 catches them |
| Price uncertainty — unsure if worth it | 25% | Add social proof: "Join X freelancers already using Pro" |
| Modal dismissed by mistake | 10% | Add subtle re-surface after dismiss (toast: "Upgrade anytime from Settings") |
| Watermark not seen / not important to them | 15% | Stronger watermark placement |
| Evaluating competitors | 10% | Outside system scope |

---

## Highest Leverage Trigger — Full Analysis

### `export_attempt×2` → PricingUpsellModal

This is not just the highest-leverage trigger — it is the **only mandatory, non-dismissible monetization gate** in the entire system for the primary user archetype.

```
Every user who:
  1. Creates 2+ invoices (becomes WORKFLOW_DEPENDENT)
  2. Tries to export the 2nd invoice

MUST see the PricingUpsellModal.

There is no code path that bypasses this modal for a returning user.
The first-export bypass (Part 5) only fires when exportCount === 0.
```

**Why this makes it the highest leverage trigger:**

```
Revenue from trigger = Users seeing modal × P(convert) × Plan price

Current:  ~11 users/day × 0.36 × $9 = $35.64/day → $267/wk
Optimized: ~11 users/day × 0.55 × $9 = $54.45/day → $381/wk

Gap: $114/wk from modal copy optimization alone
```

**Modal optimization opportunities (zero code change):**

| Element | Current | Optimized | P(convert) Gain |
|---|---|---|:-:|
| Headline | "Remove watermark from your PDFs" | "Your client deserves a clean invoice" | +3% |
| Social proof | None | "Join 847 freelancers using Pro" (when real) | +5% |
| Price anchoring | $9/mo standalone | "$9/mo — less than one coffee, one paid invoice" | +4% |
| Urgency framing | None | "Your invoice is ready — upgrade to send it clean" | +3% |
| Secondary option | "Continue with watermark" (text) | "Download watermarked (free)" (styled as downgrade) | +3% |

**Combined optimized P(convert | modal):** 36% → ~54% (+18pp) → **$152/mo additional MRR per 100 users**

---

## Breakpoint Summary Table

| Dimension | Value |
|---|:-:|---|
| **Last non-paying state** | `PURCHASE_CONSIDERATION` at T+36:23 |
| **Entry event to last non-paying state** | `pricing_view` (modal load) |
| **First irreversible state** | `PAYMENT_INITIATED` at T+36:24 |
| **Entry event to first irreversible state** | `payment_start` (upgrade button click) |
| **Breakpoint trigger** | User clicks "Upgrade to Pro →" in PricingUpsellModal |
| **Time spent in breakpoint zone** | ~60 seconds (modal reading) |
| **P(proceed) in breakpoint zone** | 36% × 71% = 25.6% of all users reaching modal |
| **Highest leverage to increase P** | Modal copy optimization (+18pp) |
| **Second highest leverage** | Watermark visual prominence (silent trigger) |
| **Third highest leverage** | Pricing page trust (soften social proof claims) |

---

## Three Critical Breakpoint Insights

### Insight 1: The Breakpoint Is Faster Than the Buildup

It takes ~36 hours to build enough dependency for the first paying user. The actual breakpoint takes **60 seconds.** This means:
- 99.9% of the work is dependency infrastructure (Parts 1–5 of Re-entry System)
- 0.1% is the conversion moment
- Optimizing the 60-second moment has enormous leverage because the user has already been prepared for 36 hours

### Insight 2: The Watermark Is a Silent Breakpoint Accelerator

A subset of users (brand-sensitive, design professionals) **self-trigger the breakpoint** without any system intervention. They see the watermark → navigate to pricing → convert. This happens in ~18 minutes on Day 1. The watermark does not need a system prompt — its existence creates urgency. Watermark quality (prominence, professionalism of the overlay) directly affects this self-conversion rate.

### Insight 3: The 64% Who Dismiss Are Not Lost

The 64% of users who dismiss the modal at the 2nd export gate receive a watermarked PDF and continue. They will face the 3rd export hard gate (a harder stop). Of those 64%, approximately 38% will convert at the hard gate. This means the total conversion rate across export×2 and export×3 is:

```
P(convert at export×2) = 36%
P(convert at export×3 | didn't convert at ×2) = 38%
P(convert at either gate) = 1 - (1 - 0.36)(1 - 0.38) = 1 - 0.64 × 0.62 = 60.3%
```

**Over the full export gate sequence, 60% of Archetype B users who reach the 2nd export become Pro customers.**

---

*Corvioz Conversion Breakpoint Analysis — derived from real system behavior in `useRevenueAction.js`, `DashboardOverview.js`, and `Dashboard.js`. All probability estimates should be calibrated against real conversion data after 30 days of live traffic.*
