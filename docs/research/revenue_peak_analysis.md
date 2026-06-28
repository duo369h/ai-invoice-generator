# Corvioz Revenue Peak Analysis v1
## Peak Detection & Temporal Dynamics of Cohort Cashflow

**Date:** 2026-06-23  
**Basis:** `revenue_curve_7day_hourly.json`, `payment_time_distribution.json`  
**Cohort Scope:** 100 users, T+0h to T+168h (7 days)

---

## Executive Summary: Temporal Metrics Dashboard

```
┌──────────────────────────────────────────────────────────────────┐
│                   TEMPORAL REVENUE METRICS                       │
├──────────────────────────────────────────────────────────────────┤
│  FIRST REVENUE HOUR:         T+1h ($18.00 Pro Upgrade)           │
│  LAST REVENUE HOUR:          T+140h ($29.00 Studio Upgrade)      │
│  TOTAL 7-DAY MRR:            $345.00                             │
│                                                                  │
│  HIGHEST REVENUE HOUR:       T+2h ($29.00 - Studio Upgrade)      │
│  SECOND PEAK HOUR:           T+65h ($29.00 - Studio Upgrade)     │
│  HIGHEST CONVERSION DENSITY: T+37h (2 converts, $18.00 MRR)      │
│                                                                  │
│  MEDIAN CONVERSION HOUR:     38h                                 │
│  MEAN CONVERSION HOUR:       67h                                 │
│  MODE CONVERSION HOUR:       37h                                 │
│                                                                  │
│  REVENUE-FREE INACTIVE GAP:  T+3h to T+13h (11 hours duration)   │
└──────────────────────────────────────────────────────────────────┘
```

---

## Part 1 — Key Conversion Peaks Dissection

### 1. Highest Revenue Hour (T+2h)
* **Revenue Generated:** $29.00 MRR
* **Event:** `multi_client_rapid_entry → Studio Plan Upgrade`
* **User Archetype:** Archetype D (Agency / Studio User)
* **Mechanics:** 
  A high-volume agency user signs up and immediately adds 3+ client profiles during their first active session. The system's multi-client rule flags this as professional commercial usage, prompting a Studio Plan upgrade card inside the sidebar dashboard. Because the agency user has active invoicing volume ready, they complete checkout within 120 minutes of landing.
* **Paradox:** 
  T+2h is the highest revenue hour for a *single hour*, despite having only a single user convert. This is due to the Studio tier ($29.00) being over 3.2× more valuable than the Pro tier ($9.00).

### 2. Highest Conversion Density Hour (T+37h)
* **Revenue Generated:** $18.00 MRR (2 × Pro at $9.00)
* **Event:** `export_attempt_2_modal → Pro Plan Upgrade`
* **User Archetype:** Archetype B (Repeat Exporter - Standard variant)
* **Mechanics:** 
  Day 2 return session peak. The largest cluster of Archetype B users returning from the 36h external dependency loop hit their second export attempt at approximately T+36h to T+38h. At T+37h, two independent users trigger the `export_attempt_2` modal simultaneously and upgrade to remove the watermark.
* **Significance:** 
  This represents the modal conversion engine functioning at peak density. While the hourly revenue is lower than a single Studio user, this hour is the mode of the conversion count distribution.

### 3. Second Revenue Peak Hour (T+65h)
* **Revenue Generated:** $29.00 MRR
* **Event:** `studio_preview_2nd_client → Studio Plan Upgrade`
* **User Archetype:** Archetype D (Agency / Studio User)
* **Mechanics:** 
  A standard agency user who has spent 2.5 days setting up their pipeline reaches their second client. They navigate to the Studio Space tab, view the multi-client board layout, and trigger the Studio payment modal. 

---

## Part 2 — Revenue-Free Inactive Gap Analysis

Between **T+3h and T+13h** (an 11-hour block), the cohort generates **$0.00** in new revenue. 

### Why the Gap Occurs:
1. **Fast-Path Exhaustion:** 
   The ultra-fast converted users (brand-sensitive Archetype B on watermark self-trigger at T+1h, and rapid-entry Archetype D at T+2h) have already paid. The remaining cohort users have completed their first sessions and closed the app.
2. **External Delay Loop Latency:** 
   The remaining users are currently stuck in the 36h real-world dependency loop. They have sent watermarked invoices, but their clients have not yet replied, and they have no immediate need to create another invoice.
3. **No Retainers/Quotes Active:** 
   In this early window, client feedback has not returned to prompt quote acceptances or overdue invoice warnings.
4. **Cohort Synchronization:** 
   Since all 100 users enter at T+0h, the sleep/work schedules of this cohort are roughly synchronized. The gap represents the standard "overnight and next-morning" period before Day 2 return intent begins.

---

## Part 3 — Revenue Acceleration Slope

The rate at which cumulative revenue builds is non-linear. We analyze the **Revenue Acceleration Slope** (MRR added per hour) across four distinct epochs of the 7-day lifecycle:

```
CUMULATIVE MRR CURVE (T+0h to T+168h)

$350 ───────────────────────────────────────────────────────────── $345 (T+140h)
                                                            ╱───
$300 ───────────────────────────────────────────────────── ╱ (T+116h)
                                                   ╱───────
$250 ──────────────────────────────────────────── ╱ (T+90h)
                                            ╱───╱
$200 ───────────────────────────────────── ╱ (T+65h)
                                  ╱───────
$150 ─────────────────────────── ╱ (T+50h)
                         ╱──────
$100 ───────────╱───────╱ (T+36h)
          ╱────╱ (T+24h)
$50  ────╱ (T+2h)
     ___╱
$0   ─────────────────────────────────────────────────────────────
     T+0h   T+24h       T+48h       T+72h       T+96h       T+120h      T+168h
```

### Cumulative Slope Breakdown by Epoch

| Epoch | Time Frame | MRR Added | Hourly Slope | Acceleration Index | Primary Driver |
|---|:-:|:-:|:-:|:-:|---|
| **1. Same-Day Fast-Track** | T+0h to T+24h | $74.00 | **$3.08 / hour** | High | Brand-sensitive self-triggers + rapid agency entries |
| **2. Day 2 Return Surge** | T+24h to T+48h | $72.00 | **$3.00 / hour** | High | 2nd export modal + 3rd export hard gates |
| **3. Client-Loop & Growth** | T+48h to T+120h | $170.00 | **$2.36 / hour** | Moderate | Client quote acceptances + invoice overdue banners |
| **4. Long-Tail Decay** | T+120h to T+168h | $29.00 | **$0.60 / hour** | Low | Late-stage overdue invoices & persistent users |

### Slope Takeaways:
* **The Velocity Peak:** 
  The absolute velocity peak occurs between T+0h and T+2h, where the slope hits **$23.50/hour** (moving from $0 to $47 in 2 hours). This is driven by high-intent self-selection.
* **The Steady Climb:** 
  Between T+24h and T+48h, the slope remains highly stable at **$3.00/hour**, driven by the deterministic recurrence of repeat exporters completing their invoicing loops.
* **The Decay Phase:** 
  Post T+120h, the slope decays to **$0.60/hour**. This indicates that by Day 6, the monetization potential of the cohort is 84% exhausted, suggesting that re-engagement emails are critical to reactivating silent users.
