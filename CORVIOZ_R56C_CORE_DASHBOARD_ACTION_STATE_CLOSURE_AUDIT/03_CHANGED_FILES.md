# Changed Files

Production source:

- src/components/dashboard/dashboardWave1.mjs
- src/app/dashboard/components/DashboardOverview.js
- src/components/dashboard/Dashboard.js
- src/hooks/useDashboardData.js
- src/app/styles/components.css

Verification authority:

- scripts/test-r56c-core-dashboard-action-state.mjs
- scripts/test-r56c-error-stale-data.mjs
- scripts/test-dashboard-overview-needs-attention-r42.mjs

No backend route or migration changed. The existing invoice-draft route and RPC remain the transition authority.
