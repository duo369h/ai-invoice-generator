# CRITICAL_RISK_REPORT.md — Corvioz Final Snapshot

## Top 10 Architecture Risks

1.  **LocalStorage Suffix Mismatch (User Plan Resolution Failure)**
    *   *Root Cause:* Mismatch between `Dashboard.js` saving `corvioz_user_plan_${user.id}` and `globalOrchestrator.ts` reading `corvioz_user_plan`.
    *   *Impact:* Paid plans fail to resolve on dashboard views, restricting paying users to free-tier limits.
    *   *Severity:* Critical (9.8/10)
2.  **Multi-Engine Recommendation Drift**
    *   *Root Cause:* Coexistence of `unifiedDecisionEngine`, `executionEngine`, and `revenue-decision-engine`.
    *   *Impact:* Different parts of the UI suggest competing tier options at identical usage milestones.
    *   *Severity:* High (8.5/10)
3.  **Pricing Page Dual-Brain Conflict**
    *   *Root Cause:* Pricing page references both `CorviozKernel` and `pricingViewModel` to resolve states.
    *   *Impact:* Card badge indicators can diverge from global layout configurations and trust copy.
    *   *Severity:* Medium (6.8/10)
4.  **Limits Logic Triplication**
    *   *Root Cause:* Hardcoded limits (2 invoices, 1 quote) defined inside `evaluate/route.js`, `paywallEngine.ts`, and `decision-engine.ts`.
    *   *Impact:* Business policy adjustments require simultaneous updates across three distinct modules.
    *   *Severity:* High (8.0/10)
5.  **Database vs Cookie Hydration Race**
    *   *Root Cause:* Supabase session cookie resolution on server routes vs. localStorage values on the client.
    *   *Impact:* Causes momentary UI flashes or unauthorized pages redirecting back and forth during auth session transitions.
    *   *Severity:* Medium (6.5/10)
6.  **Control Plane Single-Point-of-Failure**
    *   *Root Cause:* Gating hooks rely on network availability of the `/api/revenue/control-plane` endpoint.
    *   *Impact:* Unhandled network exceptions could block user core actions completely.
    *   *Severity:* High (7.8/10)
7.  **Dormant Inline Styling in UIComponents**
    *   *Root Cause:* Unused helper components inside `UIComponents.js` retain inline layouts.
    *   *Impact:* Developers using these legacy helpers will bypass the tokenized design system.
    *   *Severity:* Medium (5.8/10)
8.  **Inconsistent Easing Hardcoding**
    *   *Root Cause:* Duration easing values in layout classes are hardcoded rather than referencing variables.
    *   *Impact:* Theme transitions and interactive sweeps show visual speed discrepancies.
    *   *Severity:* Low (4.5/10)
9.  **LocalStorage State Hijacking**
    *   *Root Cause:* Identity resolution checks local variables first.
    *   *Impact:* Anonymous clients can easily toggle workspace mockups by writing manual variables to the browser console.
    *   *Severity:* High (8.2/10)
10. **Scoring Index Discrepancies**
    *   *Root Cause:* Dual mathematical modules computing engagement and churn factors differently.
    *   *Impact:* Telemetry logs report inaccurate upgrade metrics.
    *   *Severity:* Low (4.0/10)
