# SINGLE_SOURCE_OF_TRUTH_AUDIT.md — Corvioz Final Snapshot

## 1. Duplicated Ownership Areas
*   **Pricing Constants:** Shared between `pricingViewModel.ts` (flat lists) and `pricingController.ts` (Paddle checkout Price IDs).
*   **User Plan State:** Mismatch between `Dashboard.js` saving plans at `corvioz_user_plan_${user.id}` and `globalOrchestrator.ts` querying `corvioz_user_plan`.
*   **CTA Decision Logic:** Calculated concurrently in `globalOrchestrator.ts` (`getCTA`), `pricingViewModel.ts` (`ctaLabel` and `ctaState`), and Action Handlers.
*   **Upgrade Gating Limits:** Checked locally by `unifiedDecisionEngine.ts` and `paywallEngine.ts` but enforced remotely in database functions.
