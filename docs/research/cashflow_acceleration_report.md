# Corvioz Cashflow Elasticity & Acceleration Report v1
## Monetization Lever Sensitivity Analysis

**Date:** 2026-06-23  
**Basis:** `revenue_curve_7day_hourly.json`, `payment_time_distribution.json`  
**Cohort Scope:** 100 users, T+0h to T+168h (7 days)

---

## Executive Summary: Lever Elasticity Comparison

This sensitivity analysis measures the cashflow elasticity of Corvioz's primary conversion levers. By simulating a isolated **+10% relative increase** in each key variable, we calculate the MRR delta, cohort conversion rate growth, and specific temporal shifts in revenue timing.

```
┌────────────────────────────────────────────────────────────────────────┐
│                   MONETIZATION ELASTICITY METRICS                      │
├────────────────────────────────────────────────────────────────────────┤
│  Baseline 7-Day cohort MRR:       $345.00                              │
│  Baseline cohort conversion rate:  26.0% (26 converts per 100 users)   │
│                                                                        │
│  LEVER 1: +10% Modal Upsell Rate   →  +$17.95 MRR (+5.2%) | 27.2% CR   │
│  LEVER 2: +10% User Return Rate    →  +$6.50 MRR  (+1.9%) | 26.7% CR   │
│  LEVER 3: +10% Watermark Prominence →  +$4.50 MRR  (+1.3%) | 26.5% CR   │
└────────────────────────────────────────────────────────────────────────┘
```

### Comparative Metrics Table

| Lever | Current Baseline | Optimized (+10% Rel) | 7-Day MRR Delta | Pct MRR Gain | Target CR |
|---|:-:|:-:|:-:|:-:|:-:|
| **1. Modal Conversion** | 36.0% upgrade rate | 39.6% upgrade rate | **+$17.95** | **+5.2%** | 27.2% |
| **2. Day 2 Return Rate** | 65.0% return rate | 71.5% return rate | **+$6.50** | **+1.9%** | 26.7% |
| **3. Watermark Prominence** | 7.7% fast-path CR | 8.5% fast-path CR | **+$4.50** | **+1.3%** | 26.5% |

---

## Part 1 — Lever Dissection & Behavioral Mechanisms

### Scenario 1 — Modal Upsell Conversion (+10% Relative)
* **Goal:** Increase `P(convert | modal shown)` from **36.0% to 39.6%**.
* **Primary Mechanism:** Optimize modal copy, visual hierarchy, pricing layout, or checkout friction.
* **Temporal Hourly Impact:** 
  - Revenue events in the Day 2 return peak (**hours 14–45**) increase by **+1.99 Pro conversions**.
  - No impact on fast-path conversions (first 12h) or long-tail studio conversions.
* **Elasticity Analysis:** 
  This is the **highest-leverage lever** in the entire engine. Because the second-export modal is a mandatory, non-dismissible gate for returning users, any marginal gain here has an immediate direct effect on cohort revenue.
* **Implementation Plan:**
  - Revise the Pro plan benefits copy to highlight "Remove Watermark Instantly" in a bold header.
  - Pre-fill user email in Paddle checkout from NextAuth session to reduce checkout drop-off.

---

### Scenario 2 — Day 2 Return Rate (+10% Relative)
* **Goal:** Increase user return probability from **65.0% to 71.5%**.
* **Primary Mechanism:** Re-engagement emails or browser notifications sent during the 36-hour gap.
* **Temporal Hourly Impact:**
  - **2–3 additional users** return and enter the invoice builder at hours 36–42.
  - Creates a downstream cohort volume boost, adding **+$6.50 MRR** through normal path conversions.
* **Elasticity Analysis:**
  While this lever adds more candidates to the funnel, it is gatekeeper-dependent (i.e. returning users must still pass the 36% modal conversion rate). Therefore, the revenue yield is lower than the pure modal optimization.
* **Implementation Plan:**
  - Send an automated email at T+24h: *"Your Acme Corp invoice has been exported. Need a clean copy without watermarks? Access it here →"*

---

### Scenario 3 — Watermark Prominence (+10% Relative)
* **Goal:** Increase watermark self-triggering from **7.7% to 8.5%** on the first session.
* **Primary Mechanism:** Adjust watermark visibility in downloaded PDFs to increase instant upgrade motivation.
* **Temporal Hourly Impact:**
  - Adds **+1 Pro convert at Hour 1** (fast-path).
  - Compresses the average conversion timeline by **~4 hours** for that user segment, shifting revenue from Day 2 to Day 1.
* **Elasticity Analysis:**
  This lever primarily acts as a **timeline compressor** rather than a volume driver. It pulls conversion events forward into the same-day window by creating immediate professionalism concerns.
* **Implementation Plan:**
  - Shift the default watermark from a small corner mark to a diagonal light-grey overlay across the middle section of the invoice.

---

## Part 2 — Combined Acceleration Scenario

If all three levers are implemented simultaneously, they act as **compound multipliers**:

$$\text{Cohort MRR} = f(\text{Return Rate} \times \text{Watermark Prominence} \times \text{Modal Conversion})$$

```
╔══════════════════════════════════════════════════════════════════╗
║                 COMPOUND OPTIMIZATION RESULTS                   ║
╠══════════════════════════════════════════════════════════════════╣
║  Optimized return rate:         71.5%                            ║
║  Optimized modal conversion:     39.6%                            ║
║  Optimized fast-path:           8.5%                             ║
╠══════════════════════════════════════════════════════════════════╣
║  COMBINED 7-DAY MRR:            $384.60 (+$39.60 delta)          ║
║  TOTAL REVENUE GAIN:            +11.5%                           ║
║  TIMELINE COMPRESSION:          Median T+38h → T+32h             ║
╚══════════════════════════════════════════════════════════════════╝
```

### Recommendation Ranking by ROI:
1. **Modal Copy Polish (Lever 1):** High impact, low engineering complexity (copy adjustments only).
2. **Watermark Prominence (Lever 3):** High timing acceleration, low complexity (CSS/PDF engine adjustment).
3. **Re-engagement Loops (Lever 2):** Moderate impact, high complexity (setting up Resend workflows / cron jobs).
