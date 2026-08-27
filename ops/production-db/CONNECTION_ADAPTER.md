# R14 connection adapter closure

The adapter accepts only PostgreSQL URLs for the expected Production project.
It recognizes either the IPv6-capable direct endpoint
`db.fgortrxozlbzxbkerejz.supabase.co` with user `postgres`, or the verified
IPv4 session-pooler endpoint `aws-1-us-east-1.pooler.supabase.com` with user
`postgres.fgortrxozlbzxbkerejz`. Both require database `postgres` and port
`5432`; any other host, project-qualified pooler user, database, or port is
refused before a migration action.

The disposable R12 rehearsal is the sole documented exception: its adapter
uses the same session-pooler-shaped host/user/port but rewrites to an isolated
local `r12_*` database before invoking the local clients. Production URLs
remain restricted to database `postgres`.

After connection, the adapter requires the expected database identity and
Postgres major version. The unchanged R12 classifier then rejects unknown,
non-prefix, or schema/history-mismatched states. Read-only R14 mode also
checks the expected Production schema fingerprint before running the real
dry-run and exits with `MUTATION_REFUSAL=PASS` while pending migrations exist.
