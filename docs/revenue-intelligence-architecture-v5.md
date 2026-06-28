# Revenue Intelligence Architecture Specification (v5.0)

This document specifies the multi-layered revenue intelligence architecture deployed in Corvioz SaaS. The system coordinates interaction events, real-time cohort scoring, safe recommenders, and simulation sandboxes.

---

## ─── Architecture Overview ───

The system is structured as four decoupled, specialized layers, flowing from raw telemetry to predictive simulation models:

```mermaid
graph TD
    subgraph Layer 3: Telemetry & Optimizer (v3)
        A[User Interaction Signals] --> B[Feedback Collector]
        B --> C[(revenue_events DB)]
        C --> D[Revenue Optimizer Engine]
    end

    subgraph Layer 4: Customer Truth (v4)
        D --> E[LTV Modeling]
        D --> F[Churn Probability]
        D --> G[Upgrade Probability]
    end

    subgraph Layer 4.5: Recommendation Layer (v4.5)
        E & F & G --> H[Decision Engine]
        H --> I[Non-executed Upgrade Recommendation]
    end

    subgraph Layer 5: Sandbox Simulation (v5)
        I --> J[Pricing Elasticity Model]
        I --> K[Funnel Pressure Model]
        I --> L[What-if Simulator UI]
    end

    style I fill:#f9f,stroke:#333,stroke-width:2px
    style L fill:#bbf,stroke:#333,stroke-width:2px
```

---

## ─── Layer Breakdown & Calculations ───

### 1. Layer 3: Telemetry & Feedback Loop (v3)
- **Inputs**: Clickstreams, scroll depths, active durations, tab switches, checkout starts, payments, and page dismissals.
- **Responsibilities**: Registers feedback indicators. The `revenueOptimizer.ts` automatically recalibrates weights dynamically based on cohort behavior.
- **Data Store**: Intercepted in client analytics and written to the `revenue_events` Supabase table.

### 2. Layer 4: Customer Truth Layer (v4)
- **Inputs**: User signal aggregates and optimizer weights.
- **Calculations**:
  - **LTV 30-Day Outlook**:
    $$LTV_{30d} = \left(\frac{RevenuePotentialScore}{100}\right) \times \$45$$
  - **Upgrade Probability**:
    $$P(Upgrade) = \max(ProScore, GrowthScore, StudioScore) / 100$$
  - **Churn Risk**:
    $$P(Churn) = ChurnRiskScore / 100$$

### 3. Layer 4.5: Recommendation Layer (v4.5)
- **Inputs**: Truth Layer metrics ($LTV_{30d}$, Churn, Upgrade Probabilities), behavior indicators (feature stickiness, export counts), and v3 output.
- **Deterministic Safe Recommendation Rules**:
  - **PRO Upgrade**: Fired when `upgrade_probability > 0.25`, `churn_risk < 0.6`, and `ltv_30d > 10`.
  - **GROWTH Upgrade**: Fired when `invoice_stickiness > 0.6` and `export_usage > growth_threshold`.
  - **STUDIO Upgrade**: Fired when `client_portal_stickiness > 0.7` and `usage_intensity > studio_threshold`.
- **UI SAFEGUARD**: This layer is **non-executing**. It generates recommended configurations and strategy suggestions (e.g. banner vs modal) without modifying production subscription tiers or showing overlays directly.

### 4. Layer 5: Autonomous Simulation Layer (v5)
- **Inputs**: Baseline cohort metrics, recommended actions, and historical pricing plans.
- **Pricing Elasticity Model**:
  Simulates expected conversion rate shift using base prices ($P_0$) and proposed prices ($P_1$):
  $$Conversion_{simulated} = BaselineRate \times \left(1 - \epsilon \times \frac{P_1 - P_0}{P_0}\right)$$
  Where the elasticity coefficient $\epsilon$ defaults to $1.5$.
- **Funnel Pressure Model**:
  Simulates the effect of CTA strategies. Pressure multipliers increase conversion but introduce proportional user churn risk:
  - `soft_banner`: Conversion Multiplier = $1.0\times$, Churn Risk increase = $+0\%$
  - `checkout_nudge`: Conversion Multiplier = $1.6\times$, Churn Risk increase = $+5\%$
  - `modal`: Conversion Multiplier = $2.2\times$, Churn Risk increase = $+18\%$
- **SAFE MODE BOUNDARY**: This engine runs completely client-side in a sandboxed analytical dashboard. It **never** writes pricing configuration changes to database profiles or third-party gateways (Stripe/Paddle).
