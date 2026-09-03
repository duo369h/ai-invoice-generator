# Changed files

- `src/middleware.js`: production redirect boundary for internal dashboard routes.
- `src/app/proposal/page.js`, `src/app/proposals/page.js`: legacy URLs redirect to canonical Quotes.
- `src/app/api/proposals/generate/route.js`: neutral 410 fail-closed legacy API boundary.
- `src/components/dashboard/Dashboard.js`: development-only diagnostics, localStorage quarantine, modal classes, neutral core copy.
- `src/components/dashboard/dashboardWave1.mjs`: stable equal-timestamp Recent Documents tie-breaker.
- `src/app/styles/components.css`: canonical Wave 1 selectors and responsive/modal overflow rules.
- `src/app/dashboard/components/StudioSpace.js`: current visible legacy label correction.
- `scripts/test-r56d-dashboard-ux-closure.mjs`: deterministic R56D contract test.
