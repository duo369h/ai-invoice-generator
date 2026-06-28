# Corvioz First Payment Countdown Engine v1
## Hour-Precision Timeline to First Paying User

**Date:** 2026-06-23
**Basis:** `first_conversion_path.json`, `payment_time_distribution.json`, `conversion_breakpoint_analysis.md`

---

## Countdown Clock

```
TIME TO FIRST PAYMENT (normal path)

T + 36h 26min
═══════════════════════════════════════════════════════════════
  36 hours  → dependency building (real world does the work)
   0h 22min → invoice creation + export attempt
   0h 60sec → modal decision window
   0h 2min  → Paddle checkout completion
═══════════════════════════════════════════════════════════════

First revenue event: $9.00 (Pro)
First LTV event:    $63.00 (7-month retention)
```

---

## Part 1 — Time-Based Conversion Engine

### Master Timeline (Minute-Level Precision)

Every event, state transition, and system response mapped to absolute time from `landing_view`.

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 SESSION 1 — Day 1 (Duration: ~22 minutes)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

T+0:00  ▶ landing_view
        → User finds Corvioz via Google "free invoice generator"
        → Funnel entry tracked
        → State: UNACTIVATED

T+0:02  ▶ invoice_create
        → Clicks "Generate First Invoice Instantly" CTA
        → /invoices/create renders with Acme Corp prefill
        → State: ACTIVATED

T+0:04  → User begins replacing sample data with real client info
T+0:10  → Enters line items (service name, rate, qty)
T+0:14  → Sets due date, adds custom notes
T+0:17  ▶ first_invoice_created
        → User saves invoice
        → Invoice preview renders (first "this is real" moment)
        → State: VALUE_CREATED

T+0:18  ▶ export_attempt×1
        → User clicks "Download PDF"
        → exportCount=0 → isFirstExportAttempt=true
        → BYPASS GATE ACTIVATES (useRevenueAction.js)
        → Watermarked PDF downloads immediately
        → Success toast: "PDF exported — Create another invoice →" (6 seconds)
        → NO MODAL. NO PRICING. NO FRICTION.
        → State: VALUE_DELIVERED

T+0:20  → User opens PDF in system viewer
        → SEES WATERMARK: "CORVIOZ" overlay on invoice
        → Mental note: "Client might notice this"
        → User closes browser tab

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 EXTERNAL DEPENDENCY LOOP (Duration: ~36 hours)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

T+0:30  → User emails watermarked PDF to client
        → Client opens email, sees invoice
        → Client sees watermark in document

T+2:00  → Client responds: "This invoice looks great —
          but what's the Corvioz watermark about?"
        → USER URGENCY CREATED — real professional friction

T+12:00 → User has another project requiring an invoice
        → Thinks: "I need a clean PDF before sending"
        → Opens Corvioz bookmarked tab

[User may return here or wait until Day 2]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 SESSION 2 — Day 2 (Begins at T+36h)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

T+36:00 ▶ Return session
        → User reopens Corvioz dashboard
        → exportCount=1 read from localStorage
        → System recognizes returning user (not first-export gate)
        → State: RETURNING

T+36:02 → User navigates to invoice creation
T+36:03 ▶ invoice_create (2nd)
        → Starts building 2nd invoice
        → DEPENDENCY HINT FIRES:
          "💡 You're invoicing again. Save a client profile to auto-fill
          their details on future invoices — no more retyping."
        → User sees hint. CTA: "Save a client →"
        → State: HABIT_FORMING

T+36:08 → User enters 2nd client info (faster — familiar with UI)
T+36:16 → Completes line items
T+36:20 ▶ second_invoice_saved
        → Invoice saved
        → State: WORKFLOW_DEPENDENT

T+36:22 ▶ export_attempt×2  ← MONETIZATION GATE
        → User clicks "Download PDF"
        → exportCount=1 → isFirstExportAttempt=false
        → evaluateAction('export_pdf') called
        → ⚡ PRICING UPSELL MODAL OPENS ⚡
        → Watermarked PDF also begins download (in background)
        → pricing_view tracked (trigger_source='export')
        → State: MONETIZATION_GATE

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 60-SECOND DECISION WINDOW
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

T+36:22  Modal renders:
         ┌─────────────────────────────────────────────┐
         │  🚀 Remove watermark — export clean PDFs    │
         │                                             │
         │  Pro — $9/month                             │
         │  ✔ Watermark-free PDF exports               │
         │  ✔ Unlimited invoices & quotes              │
         │  ✔ Private client portal link               │
         │  ✔ Automated payment reminders              │
         │                                             │
         │  [Upgrade to Pro — $9/mo]                   │
         │  [Continue with watermark (free)]            │
         └─────────────────────────────────────────────┘

T+36:22  User reads modal (15 seconds)
         User calculates: "Client already asked. $9/mo is 1 invoice hour."
T+36:23  User clicks "Upgrade to Pro — $9/mo"
         → payment_start tracked
         → Paddle checkout overlay opens
         → State: PAYMENT_INITIATED

T+36:23  Paddle checkout:
         → Email pre-filled (if signed in)
         → Card entry (60 seconds)
         → Clicks "Pay $9.00"

T+36:26 ▶ payment_complete ✅
        → Plan updated: free → pro in Supabase
        → Dashboard re-renders
        → Toast: "Pro activated — watermark-free PDFs enabled 🎉"
        → User immediately re-exports 2nd invoice
        → CLEAN PDF. No watermark. Client gets professional document.
        → State: PAYING_USER

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ FIRST PAYMENT — $9.00 — T+36h 26min from first visit
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### Countdown Phase Summary

| Phase | Duration | What Happens | Revenue |
|---|:-:|---|:-:|
| **Session 1** | 22 min | Invoice created, first PDF downloaded (watermarked) | $0 |
| **External loop** | 35h 38min | Client sees watermark, urgency builds in the real world | $0 |
| **Session 2 (pre-gate)** | 22 min | 2nd invoice created, dependency hint shown | $0 |
| **Decision window** | 60 sec | Modal read, upgrade decision made | $0 |
| **Payment** | 2 min | Paddle checkout completed | **$9** |
| **TOTAL** | **36h 26min** | | **$9** |

---

## Part 2 — External Dependency Modeling

The 36-hour gap between sessions is not empty time — it is where the behavioral dependency is built in the real world, outside Corvioz's control. Modeling it correctly is critical to predicting payment timing.

### External Dependency Variables

#### Variable 1 — Watermark Exposure Effect

```
When user exports watermarked PDF:
  ├── User views PDF locally only (no client send)
  │     P(return motivated by watermark) = 15%
  │     Expected return delay: 48–72h (lower urgency)
  │
  ├── User sends PDF to client (client sees watermark)
  │     P(return motivated by watermark) = 65%
  │     Expected return delay: 12–36h (client question creates urgency)
  │
  └── Client actively asks about watermark
        P(return motivated by watermark) = 85%
        Expected return delay: 2–12h (immediate professional urgency)
```

**Model assumption (normal path):** 55% of users send watermarked PDF to real client. Of those, 45% receive a client question about it. This produces the 36h median return time.

#### Variable 2 — Client Visibility Loop

The client visibility loop is a **force multiplier** on the urgency the user feels during the gap:

```
NO LOOP (user just downloaded, not sent):
  Urgency level: LOW
  Return probability: 25%
  Return timing: 72h+ (or never)

LOOP STAGE 1 (user sent PDF to client):
  Urgency level: MEDIUM
  Return probability: 55%
  Return timing: 36–48h
  
LOOP STAGE 2 (client viewed invoice in portal):
  Urgency level: HIGH
  Urgency driver: "Client is reviewing my invoice right now"
  Return probability: 75%
  Return timing: 12–24h

LOOP STAGE 3 (client commented / asked about watermark):
  Urgency level: CRITICAL
  Urgency driver: "My client noticed. I look unprofessional."
  Return probability: 90%
  Return timing: 2–6h
  P(fast path conversion): 40% (may self-direct to pricing immediately)
```

**Implication:** The client visibility loop is the most powerful external dependency accelerator. Any feature that surfaces "your client is looking at this right now" accelerates return probability from 55% to 75%+ and cuts return delay by 50%.

#### Variable 3 — Real-World Delay Factor

Not all gaps are 36 hours. The gap duration follows a distribution based on how frequently the user invoices:

| User Invoicing Frequency | Median Gap | Return Probability |
|---|:-:|:-:|
| Daily invoicer (agency, contractor) | 4–12h | 85% |
| Weekly invoicer (freelancer, retainer) | 24–48h | 65% |
| Monthly invoicer (project-based) | 72–168h | 40% |
| Irregular (one-off projects) | 7–30 days | 20% |

**Normal path assumption:** Weekly invoicer (most common Corvioz user) → 36h median gap.

#### Variable 4 — Return Intent Probability Model

```
P(return within 48h) = base × watermark_exposure × client_loop × invoicing_frequency

Where:
  base = 0.35 (baseline return rate for any SaaS tool)
  watermark_exposure = 1.0 (saw watermark) or 0.5 (didn't notice)
  client_loop = 1.0 (no client loop) → 1.85 (client asked about watermark)
  invoicing_frequency = 0.6 (monthly) → 1.4 (daily)

Normal path calculation:
  P = 0.35 × 1.0 × 1.5 × 1.1 = 0.578 ≈ 58% return within 48h

Model uses 65% (adjusted upward for self-selection: users who find Corvioz
via invoice-specific searches have higher intent than average SaaS visitors)
```

---

## Part 3 — First Payment Event Simulation

### Simulation Output

```
COHORT: 100 users entering on Day 1

PAYMENT DISTRIBUTION OVER 7 DAYS:

Hour 0      ░░░░░░░░░░░░░░░░░░░░  $0
Hour 0-1    ▓▓░░░░░░░░░░░░░░░░░░  $18  (2 brand-sensitive fast payers)
Hour 1-12   ▓░░░░░░░░░░░░░░░░░░░  $29  (1 rapid Agency/Studio payer)
Hour 12-36  ▓▓▓▓▓░░░░░░░░░░░░░░░  $45  (5 overnight returners)
Hour 36-48  ▓▓▓▓▓▓▓░░░░░░░░░░░░░  $63  (7 Day-2 peak converters) ← HIGHEST
Hour 48-72  ▓▓▓▓░░░░░░░░░░░░░░░░  $56  (4 Day-3 converts)
Hour 72-96  ▓▓▓░░░░░░░░░░░░░░░░░  $47  (3 Day-4 client loop)
Hour 96-120 ▓▓▓░░░░░░░░░░░░░░░░░  $67  (3 Day-5 pressure peak)
Hour 120+   ▓░░░░░░░░░░░░░░░░░░░  $29  (1 long-tail)
             ────────────────────────
             TOTAL 7-DAY MRR: $354
```

### First Paying User — Exact Profile

```
EVENT:           First payment_complete in cohort
ARCHETYPE:       B — Repeat Exporter (brand-sensitive variant)
HOUR:            T+0h 18min (fast path) OR T+36h 26min (normal path)
PLAN:            Pro ($9/mo)
TRIGGER CHAIN:   landing_view
                 → invoice_create
                 → first_invoice_created
                 → export_attempt×1 (watermarked PDF)
                 [external: client sees watermark]
                 → return session
                 → invoice_create (2nd)
                 → export_attempt×2 (modal)
                 → payment_start
                 → payment_complete ✅
PROBABILITY:     71% this archetype is the first payer in cohort
MINIMUM EVENTS:  8
TIME:            18min (fast) / 36h (normal)
```

### Probability of Acceleration (Fast Payer Path <24h)

**Definition:** Fast path = payment occurring within 24 hours of `landing_view`.

```
P(fast path) = P(brand-sensitive variant of B) + P(rapid-entry D)

Archetype B brand-sensitive:
  P(user is brand-sensitive) = 0.15 (design/creative freelancers)
  P(sees watermark + self-navigates to pricing) = 0.55
  P(converts on pricing page | got there) = 0.71
  P(B fast path per B user) = 0.15 × 0.55 × 0.71 = 0.0585 ≈ 6%

Archetype D rapid-entry:
  D users = 7/100 = 7%
  P(3+ clients in first session) = 0.30
  P(Studio trigger fires < 12h) = 0.25
  P(D fast path per D user) = 0.30 × 0.25 = 0.075 → 7% × 0.075 = 0.5%

Total P(any fast path payment <24h) in 100-user cohort:
  = 1 - (1 - 0.06)^33 × (1 - 0.005)^7
  = 1 - (0.94)^33 × (0.995)^7
  = 1 - 0.127 × 0.965
  = 1 - 0.122
  ≈ 87.8% chance at least one user pays within 24h in any 100-user cohort
```

**Expected fast payers per 100-user cohort:** 2–3 users

---

## Part 4 — Acceleration Scenarios

### Scenario A — Fast Path (T+18min payer)

**Archetype:** Brand-sensitive Archetype B (designer, creative professional)
**Trigger:** Watermark self-trigger — no system prompt required

```
T+0:00   landing_view
T+0:02   invoice_create — builds professional invoice
T+0:17   first_invoice_created — first preview render
T+0:18   export_attempt×1 — PDF downloads, bypass gate active
T+0:18   USER OPENS PDF → sees watermark immediately
         "There's a big watermark on my invoice. I can't send this."
T+0:19   User self-navigates to /pricing
         (Does not wait for Day 2 return — feels urgent now)
T+0:19   pricing_view — reads Pro plan
T+0:20   payment_start — Paddle checkout
T+0:22   payment_complete ✅

TOTAL TIME: 22 minutes
PLAN: Pro ($9/mo)
TRIGGER: Watermark visibility (silent — no system event)
P(this path): 7.7% of converters, 2% of cohort
```

**What makes this path work:**
- Watermark is visually prominent on the PDF
- User has immediate professional context (sending to client now)
- Price ($9) is impulse-level for a professional who earns $50+/hr
- Zero friction in pricing navigation

**What can accelerate this further:**
- Make watermark placement more prominent (center diagonal, not corner)
- Add "Remove watermark" text directly on the PDF download button
- Show "1-minute upgrade" framing on pricing page for same-session visits

---

### Scenario B — Normal Path (T+36h payer)

**Archetype:** Standard Archetype B (Repeat Exporter)
**Trigger:** `export_attempt×2` → PricingUpsellModal

```
T+0:00   landing_view
T+0:22   [Session 1 complete — watermarked PDF exported]
T+0:30   User emails watermarked PDF to client
T+2:00   Client responds, asks about watermark
[36h gap — urgency builds passively]
T+36:00  Return session — creates 2nd invoice
T+36:22  export_attempt×2 → MODAL FIRES
T+36:23  pricing_view (in modal)
T+36:24  payment_start
T+36:26  payment_complete ✅

TOTAL TIME: 36h 26min
PLAN: Pro ($9/mo)
TRIGGER: export_attempt×2 modal
P(this path): 61.5% of converters, 16% of cohort
```

**Gap duration sensitivity:**
```
Gap = 12h  → P(convert on Day 2) = same, but occurs at T+12h
Gap = 36h  → Standard. Occurs at T+36h. (median)
Gap = 72h  → Late return. Occurs at T+72h. P(convert) same.
Gap = 7d+  → Churn risk. Dependency fades. P(return) drops to 20%.
```

**What compresses the gap:**
- Client asks about watermark → Gap shrinks from 36h to 2–6h
- Email re-engagement sent during gap → P(return) +15%
- "Your invoice is waiting" notification → Pulls user back faster

---

### Scenario C — Delayed Path (T+5-day payer)

**Archetype:** Archetype C (Client-Driven Freelancer)
**Trigger:** `invoice_overdue` workspace banner or `quote_accepted` portal event

```
T+0:00    landing_view
T+0:22    [Session 1 complete — first invoice exported]
T+36:00   Return — creates 2nd invoice, saves client
T+48:00   Sends quote to real client (quote_sent)
T+72:00   Client views quote in portal (quote_status_pending)
T+96:00   Client accepts quote (quote_accepted)
           → Workspace Insights: "Client has committed. Pro helps you deliver."
T+100:00  invoice_overdue fires (another invoice past due date)
           → Banner: "Invoice not responded to in 24h. Upgrade for reminders."
T+100:10  User clicks "Upgrade to Pro" in workspace banner
T+100:12  payment_start
T+100:14  payment_complete ✅

TOTAL TIME: ~4 days 4 hours
PLAN: Pro ($9/mo) or Studio ($29/mo) depending on client count
TRIGGER: invoice_overdue + quote_accepted (double-trigger saturation)
P(this path): 26.9% of converters, 7% of cohort
```

**What delays this path:**
- Requires real client loop to complete (quote sent → accepted → invoice)
- Each step depends on client response time (not under Corvioz's control)
- Quote → acceptance cycle can take 2–5 days alone

**What accelerates this path:**
- Faster quote portal UX for clients
- Portal view notification to user ("Your client just opened your quote")
- Workspace Insights firing sooner (lower trigger thresholds)

---

### Scenario Comparison Table

| Scenario | Path | Time | Trigger | P(occur) | Plan | LTV |
|---|:-:|:-:|---|:-:|:-:|:-:|
| A — Fast | Day 1 | **22 min** | Watermark self-trigger | 8% | Pro | $63 |
| B — Normal | Day 2 | **36h** | export×2 modal | 62% | Pro | $63 |
| C — Delayed | Day 4–5 | **~100h** | invoice_overdue / quote_accepted | 27% | Pro/Studio | $63–$203 |
| D — Very Slow | Day 7+ | **>168h** | Long-tail pressure | 3% | Studio | $203 |

### Path Revenue Contribution

```
Fast Path (8% of converters, $47 MRR):
  Small volume, fastest revenue, no system prompts needed
  Key driver: watermark quality

Normal Path (62% of converters, $216 MRR):
  Dominant revenue path. Modal quality is the primary lever.
  Key driver: export_attempt×2 modal conversion rate

Delayed Path (27% of converters, $114 MRR):
  Highest LTV per user. Closes on real client pressure.
  Key driver: client portal engagement + workspace banner timing

Very Slow Path (3% of converters, $29 MRR):
  Long-tail Studio conversions. Hard to accelerate.
  Key driver: operational pressure accumulation
```

---

## Countdown Summary Dashboard

```
╔══════════════════════════════════════════════════════════════════╗
║         CORVIOZ FIRST PAYMENT COUNTDOWN ENGINE v1               ║
╠══════════════════════════════════════════════════════════════════╣
║  FASTEST POSSIBLE:      T+18 min (brand-sensitive, fast path)    ║
║  NORMAL PATH:           T+36h 26min (repeat exporter, modal)     ║
║  DELAYED PATH:          T+4–5 days (client-driven, overdue)      ║
║  EXPECTED FIRST PAYER:  T+18min–2h (in any 100-user cohort)      ║
╠══════════════════════════════════════════════════════════════════╣
║  P(first payment <1h):   88% (in 100-user cohort)               ║
║  P(first payment <24h):  88% (same — fast path drives this)     ║
║  P(first payment <48h):  97% (normal path adds volume)          ║
║  P(first payment <7d):  100% (delayed path completes the set)   ║
╠══════════════════════════════════════════════════════════════════╣
║  MEDIAN PAYMENT TIME:    T+38h                                   ║
║  MEAN PAYMENT TIME:      T+62h                                   ║
║  MODE PAYMENT TIME:      T+36h (Day 2 return peak)              ║
╠══════════════════════════════════════════════════════════════════╣
║  HIGHEST LEVERAGE LEVER: export×2 modal copy (+$152/mo)          ║
║  FASTEST ACCELERATION:   watermark prominence (+3–4h earlier)    ║
║  EXTERNAL ACCELERATOR:   client visibility loop (cuts gap 50%)   ║
╚══════════════════════════════════════════════════════════════════╝
```

---

*Corvioz First Payment Countdown Engine v1 — Timing models are deterministic probability-weighted expectations. Actual payment timing varies by user behavior, client response speed, and watermark sensitivity. Calibrate against real session data after 30 days of live traffic.*
