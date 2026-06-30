# DUPLICATION_HEATMAP.md — Corvioz Final Snapshot

## 1. Duplicate Scoring Engines
*   `unifiedDecisionEngine.ts` and `executionEngine.ts` exist to evaluate client usage logs and recommend upgrade tiers.
*   Both `v8/brain/revenueIntelligence.ts` and `execution/revenueIntelligence.ts` exist with competing analytical calculations.

## 2. Duplicate Gating Paths
*   Limit gating checks for invoices and quotes exist in:
    *   `paywallEngine.ts` (local modal templates).
    *   `api/revenue/evaluate/route.js` (remote limit checks).
    *   `unifiedDecisionEngine.ts` (local client-side limits).

## 3. Duplicate Pricing Rules
*   Pricing details (free, starter, pro, studio) and price points are hardcoded inside:
    *   `pricingViewModel.ts` (generates card models).
    *   `pricingController.ts` (Paddle checkout logic mapping IDs).
    *   `decision-engine.ts` (control-plane dynamic signals override map).

## 4. Duplicate CTA Logic
*   `globalOrchestrator.ts` (`getCTA`): Binds AppState configuration to global CTAs.
*   `pricingViewModel.ts` (`cards` mapper): Determines button state based on plan items.
*   `useRevenueAction.js` (`ACTION_EVENT_MAP`): Forces redirects and local overlays on action intercepts.
