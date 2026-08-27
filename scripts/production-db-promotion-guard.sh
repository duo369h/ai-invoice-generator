#!/usr/bin/env bash
set -euo pipefail

# Durable entrypoint for the separately reviewed Production operations bundle.
# It never changes canonical supabase/migrations/ and delegates all gates to
# the frozen state machine plus its transport adapter.
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
COMMAND="$ROOT/ops/production-db/PRODUCTION_PROMOTION_COMMANDS.sh"

[[ -x "$COMMAND" ]] || { echo "PRODUCTION DB REFUSED: operations authority is missing" >&2; exit 1; }
[[ -n "${PRODUCTION_DB_URL:-}" ]] || { echo "PRODUCTION DB REFUSED: PRODUCTION_DB_URL is required and is never printed" >&2; exit 1; }

exec "$COMMAND" "$@"
