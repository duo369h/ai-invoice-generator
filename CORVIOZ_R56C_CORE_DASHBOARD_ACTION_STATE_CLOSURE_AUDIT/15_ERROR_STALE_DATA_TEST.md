# Error / Stale Data Test

scripts/test-r56c-error-stale-data.mjs passed. It exercises the real loadDashboardResources function with Quote and Invoice 503 responses, verifies both last-known-good arrays remain intact, verifies both errors are set, and verifies stale disclosure plus the existing retry path.
