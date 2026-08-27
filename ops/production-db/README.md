# Corvioz Production DB operations authority

This directory is the separately reviewed Production promotion bundle. It is
not part of the canonical `supabase/migrations/` chain. The bundle preserves
the R12 resume-safe state machine and adds only a fail-closed connection
adapter for the verified Production direct endpoint and the verified
us-east-1 Supavisor session endpoint.

The session pooler contract is exact for this project:

- host: `aws-1-us-east-1.pooler.supabase.com`
- port: `5432`
- database: `postgres`
- user: `postgres.fgortrxozlbzxbkerejz`

The command requires `current_database=postgres`, `current_user=postgres`,
Postgres 17 or newer, a recognized migration-history state, and the frozen
preflight/post-verification gates. `R14_READ_ONLY=YES` performs classification,
preflight, and `supabase db push --dry-run`, then refuses before mutation.

Production credentials must be supplied through an approved secure read path;
the URL and credential are never printed. The reviewed migration files here
are synchronization artifacts only; R2/R3 history markers are generated at
runtime and are never applied as schema changes.
