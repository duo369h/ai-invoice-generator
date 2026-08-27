# R11 final CLI-compatible promotion source

This is the exact source used by the final rehearsal and future Production
procedure. It contains 15 local migration files: 11 harmless history markers
for versions already recorded in Production and four executable promotion
migrations. Supabase CLI therefore sees the same local history shape during
dry-run and apply.

The 11 marker files are not historical migration bodies. They are labeled
`HISTORY_MARKER_DO_NOT_EXECUTE` and contain only `SELECT 1;`. The baseline,
original R2, and R3 body are absent. The final script temporarily creates
R2/R3 no-op markers only after post-verify PASS so the supported history repair
command can resolve their filenames, then removes them.
