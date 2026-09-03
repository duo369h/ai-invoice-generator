# Source Graph Authority

- Parent authority: e95ab5fec99d50abed5b302a8ce47f2443fcb1a1 (R56B2A).
- Working authority: isolated clone branch r56b-dashboard-contract-corrections.
- Changed runtime graph: Dashboard.js -> DashboardOverview.js -> dashboardWave1.mjs; Dashboard.js -> /api/quotes/[id]/invoice-draft; useDashboardData.js -> Quote/Invoice resource state.
- Payment source: resolveInvoicePaymentReadModel.
- Usage source: server /api/user quota backed by get_user_document_usage.
- Before/after source snapshots are under 22_SOURCE_EVIDENCE_BEFORE/ and 23_SOURCE_EVIDENCE_AFTER/.

No source authority mismatch was found.
