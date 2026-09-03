# Failures and Retries

1. A development-server attempt rendered the dev debug overlay and intercepted a click. This was excluded from acceptance; the audit was rerun against a production build.
2. A temporary server invocation initially passed an unsupported `--webpack` option to `next start`. The harness was corrected to use that option only for development mode.
3. The first production run used an already-built output without the temporary public Supabase values and rendered guest/Preview content. This was an environment-fixture issue, not a product result. The harness was changed to rebuild with the ephemeral local authenticated fixture before production start.
4. At 320px the Recent Documents flex row had internal scroll width beyond its card. A narrow mobile `flex-direction: column` correction was applied and all viewports were rerun.
5. At mobile widths the invoice table's action column placed Edit, Record Payment, and Delete outside the viewport. A narrow mobile stacked invoice layout plus wrapped list header was applied and all viewports were rerun.
6. Authenticated production boundary checks initially returned `/auth` because the boundary server used a closed/mismatched temporary fixture. The boundary was rebuilt and run with the active fixture.
7. The effective root middleware returned 404 instead of the required internal-route redirect. It was corrected to redirect authenticated internal routes to `/dashboard`, and all route checks were rerun.
8. `/proposal` initially redirected with `tool=proposal` rather than canonical `tool=quotes`. The root middleware mapping was corrected and Proposal checks were rerun.

FINAL_RETRY_STATUS=PASS
