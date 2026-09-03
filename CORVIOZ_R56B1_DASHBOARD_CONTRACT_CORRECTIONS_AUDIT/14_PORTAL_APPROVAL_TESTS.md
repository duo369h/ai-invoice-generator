# Portal / Approval Tests

Commands and results:

- `node --no-warnings scripts/test-r56b1-portal-route-runtime.mjs` -> `R56B1 Portal token route runtime tests passed.`
- `node --no-warnings scripts/test-r56b1-entitlements-route-runtime.mjs` -> `R56B1 entitlements route runtime tests passed.`
- `node --no-warnings scripts/test-r56b1-dashboard-contract-corrections.mjs` -> `R56B1 dashboard contract correction tests passed.`

The tests cover neutral Portal token denial for Free/Starter/Pro, absence of `requiredPlan`, stale entitlement-field normalization, Dashboard/StudioSpace Portal and Approval copy removal, and preserved Portal backend route foundation.
