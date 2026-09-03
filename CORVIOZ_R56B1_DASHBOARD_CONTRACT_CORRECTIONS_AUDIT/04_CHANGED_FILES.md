# Changed Files

## Product source

- `lib/entitlements.ts`
- `src/app/api/clients/route.js`
- `src/app/api/portal/token/generate/route.js`
- `src/app/api/revenue/evaluate/route.js`
- `src/app/api/user/entitlements/route.js`
- `src/app/dashboard/components/StudioSpace.js`
- `src/app/lib/revenue/control-plane/decision-engine.ts`
- `src/components/dashboard/Dashboard.js`
- `src/core/state/dashboardEntitlementState.js`
- `src/hooks/useRevenueAction.js`

## Focused regression support

- `scripts/test-dashboard-entitlement-runtime.mjs`
- `scripts/test-pricing-v2-suite.mjs`
- `scripts/test-support/route-runtime-loader.mjs`
- `scripts/test-support/route-runtime-mocks.mjs`
- `scripts/test-r56b1-dashboard-contract-corrections.mjs`
- `scripts/test-r56b1-portal-route-runtime.mjs`
- `scripts/test-r56b1-entitlements-route-runtime.mjs`
- `scripts/test-r56b1-client-create-runtime.mjs`

The actual before/after contents are in `18_SOURCE_EVIDENCE_BEFORE/` and `19_SOURCE_EVIDENCE_AFTER/`. New R56B-1 test files have explicit absent-at-base records in the before folder.
