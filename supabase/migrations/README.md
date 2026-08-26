# Supabase migrations

Future database changes must be added to this folder as migration files.

Use the following naming convention:

```text
YYYYMMDDHHMMSS_description.sql
```

Existing SQL files directly under `supabase/` are historical only. Do not move or rename them; new database changes belong in this directory.

Files under `supabase/migration-candidates/` are preserved review candidates and
are not part of the active migration chain. Promote a candidate only after its
authority, ordering, and fresh-schema compatibility have been independently
verified.

`20260618000000_canonical_corvioz_baseline.sql` is the original canonical
bootstrap snapshot used by the local fresh database and recorded in Sandbox.
It is not asserted as a Production migration; Production continuity begins
with the first Production-applied version shown by the migration authority
matrix.
