# Sandbox mutation and cleanup

Only `corvioz-sandbox` (`ibdysgdgkdoxfsyepxrq`) was mutated. The R56B2 baseline and R56B2A candidate were applied there under their migration names. Temporary auth users, profiles, Quotes, Invoices, and usage events were deleted after each runtime scenario. Production ref `fgortrxozlbzxbkerejz` was not touched.

`SANDBOX_RUNTIME_VALIDATION=PASS`, `SANDBOX_TEMP_DATA_CLEANUP=PASS`, `PRODUCTION_DATABASE_MUTATION=NONE`, `PRODUCTION_DEPLOYMENT=NONE`.
