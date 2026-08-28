#!/usr/bin/env bash
set -euo pipefail

# R28 strict completion verifier. This is intentionally separate from the
# promotion state machine and is incapable of applying a migration.
EXPECTED_PROJECT_REF="fgortrxozlbzxbkerejz"
EXPECTED_RELEASE_COMMIT="39462eace7eb7791e8eed91a65a6d27597211855"
R26_OPERATIONS_AUTHORITY_BASE="bbadfaba0b15927929df7751986c010032050b66"
EXPECTED_SESSION_POOLER_HOST="aws-1-us-east-1.pooler.supabase.com"
PROMOTION_ROOT="${PROMOTION_ROOT:-$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)}"
PROMOTION_CLI_WORKDIR="${PROMOTION_CLI_WORKDIR:-$PROMOTION_ROOT/promotion-cli-workdir}"
RC_WORKTREE="${RC_WORKTREE:-/Users/duo/Corvioz-Validation/integration-candidate-r1}"

fail() {
  printf 'STATE_COMPLETE_READ_ONLY_VERIFY=REFUSE\nPRODUCTION_DB_MUTATION=NO\n' >&2
  printf 'R28 REFUSED: %s\n' "$*" >&2
  exit 1
}

[[ -d "$PROMOTION_CLI_WORKDIR/supabase/migrations" ]] || fail "reviewed CLI workdir is missing"
[[ -f "$PROMOTION_ROOT/POST_PROMOTION_VERIFY.sql" ]] || fail "post-promotion verification SQL is missing"

validate_production_db_url() {
  local without_scheme authority userinfo hostport database username password host port
  case "$PRODUCTION_DB_URL" in
    postgresql://*|postgres://*) ;;
    *) fail "safe database URL scheme is not PostgreSQL" ;;
  esac
  without_scheme="${PRODUCTION_DB_URL#*://}"
  authority="${without_scheme%%/*}"
  database="${without_scheme#*/}"
  [[ "$authority" != "$without_scheme" ]] || fail "safe database URL database component is missing"
  userinfo="${authority%@*}"
  hostport="${authority##*@}"
  [[ "$userinfo" != "$authority" ]] || fail "safe database URL credentials are missing"
  username="${userinfo%%:*}"
  password="${userinfo#*:}"
  host="${hostport%:*}"
  port="${hostport##*:}"
  [[ -n "$username" && -n "$password" ]] || fail "safe database URL credentials are incomplete"
  [[ "$database" == postgres || "$database" == postgres\?* ]] || fail "safe database URL database must be postgres"
  [[ "$port" == 5432 ]] || fail "safe database URL port must be 5432"
  case "$host" in
    "db.${EXPECTED_PROJECT_REF}.supabase.co") [[ "$username" == postgres ]] || fail "direct URL user mismatch" ;;
    "$EXPECTED_SESSION_POOLER_HOST") [[ "$username" == "postgres.${EXPECTED_PROJECT_REF}" ]] || fail "session pooler URL user mismatch" ;;
    *) fail "safe database URL host is not an approved endpoint" ;;
  esac
}

verify_release_authority() {
  local release_branch release_head
  release_branch="$(git -C "$RC_WORKTREE" branch --show-current 2>/dev/null)"
  [[ "$release_branch" == release/corvioz-first-release-r1 ]] || fail "release authority branch mismatch"
  release_head="$(git -C "$RC_WORKTREE" rev-parse HEAD 2>/dev/null)"
  git -C "$RC_WORKTREE" merge-base --is-ancestor "$EXPECTED_RELEASE_COMMIT" "$release_head" || fail "release authority is not descended from the accepted product release baseline"
  git -C "$RC_WORKTREE" merge-base --is-ancestor "$R26_OPERATIONS_AUTHORITY_BASE" "$release_head" || fail "release authority is not descended from the accepted R26 operations authority"
  [[ -z "$(git -C "$RC_WORKTREE" status --short 2>/dev/null)" ]] || fail "release authority worktree is dirty"
  printf 'RELEASE_AUTHORITY_GATE=PASS\n'
}

verify_reviewed_bundle() {
  local file expected_hash actual_hash sql_count
  local -a expected_files=(
    20260815000000_document_usage_engine_v2.sql
    20260815134423_document_usage_engine_v2_hardening.sql
    20260826004100_paddle_checkout_source_schema_closure_r1.sql
    20260827000100_production_promotion_reconciliation_r9.sql
  )
  local -a history_files=(
    20260710202115_history_marker.sql
    20260711181554_history_marker.sql
    20260711183628_history_marker.sql
    20260711192505_history_marker.sql
    20260725213909_history_marker.sql
    20260729135940_history_marker.sql
    20260815142927_history_marker.sql
    20260821174436_history_marker.sql
    20260821185325_history_marker.sql
    20260821190820_history_marker.sql
    20260821191944_history_marker.sql
  )
  sql_count="$(find "$PROMOTION_CLI_WORKDIR/supabase/migrations" -maxdepth 1 -type f -name '*.sql' | wc -l | tr -d ' ')"
  [[ "$sql_count" == 15 ]] || fail "reviewed CLI SQL file count is not 15"
  for file in "${history_files[@]}"; do
    [[ -f "$PROMOTION_CLI_WORKDIR/supabase/migrations/$file" ]] || fail "history marker is missing"
    rg -q 'HISTORY_MARKER_DO_NOT_EXECUTE' "$PROMOTION_CLI_WORKDIR/supabase/migrations/$file" || fail "history marker label is missing"
  done
  [[ ! -e "$PROMOTION_CLI_WORKDIR/supabase/migrations/20260618000000_canonical_corvioz_baseline.sql" ]] || fail "baseline marker is present"
  [[ ! -e "$PROMOTION_CLI_WORKDIR/supabase/migrations/20260826010904_paddle_source_schema_strict_closure_r2.sql" ]] || fail "original R2 body is present"
  [[ ! -e "$PROMOTION_CLI_WORKDIR/supabase/migrations/20260826113534_migration_authority_reconciliation_r3.sql" ]] || fail "original R3 body is present"
  for file in "${expected_files[@]}"; do
    case "$file" in
      20260815000000_document_usage_engine_v2.sql) expected_hash=dac031df2cf1460ca1640afae4e2f4ffe91b48e7735b7496075be8220c38f9c6 ;;
      20260815134423_document_usage_engine_v2_hardening.sql) expected_hash=2326eca342429f2ba269e46c11d0b0ed785cfdb3d895de33c569fafbb0ed1152 ;;
      20260826004100_paddle_checkout_source_schema_closure_r1.sql) expected_hash=e3765527551678aee4d1568ac61f75fab0b5ab22e91d64d0c3ef086dac28036b ;;
      20260827000100_production_promotion_reconciliation_r9.sql) expected_hash=57233b26b3302dfa8731420fd983d2777efb891109240aacb921e105aac4f396 ;;
    esac
    actual_hash="$(shasum -a 256 "$PROMOTION_CLI_WORKDIR/supabase/migrations/$file" | awk '{print $1}')"
    [[ "$actual_hash" == "$expected_hash" ]] || fail "reviewed executable migration hash mismatch"
  done
  printf 'REVIEWED_15_FILE_WORKDIR=PASS\nEXECUTABLE_MIGRATION_HASHES=4/4 PASS\n'
}

classify_state_complete() {
  local state_line
  state_line="$(psql "$PRODUCTION_DB_URL" -X -A -t -F '|' -v ON_ERROR_STOP=1 <<'SQL'
WITH expected(version) AS (
  VALUES ('20260710202115'),('20260711181554'),('20260711183628'),('20260711192505'),
         ('20260725213909'),('20260729135940'),('20260815000000'),('20260815134423'),
         ('20260815142927'),('20260821174436'),('20260821185325'),('20260821190820'),
         ('20260821191944'),('20260826004100'),('20260826010904'),('20260826113534'),
         ('20260827000100')
), actual AS (
  SELECT version FROM supabase_migrations.schema_migrations
)
SELECT CASE WHEN (SELECT count(*) FROM actual) = 17
  AND NOT EXISTS (SELECT 1 FROM expected e WHERE NOT EXISTS (SELECT 1 FROM actual a WHERE a.version = e.version))
  AND NOT EXISTS (SELECT 1 FROM actual a WHERE NOT EXISTS (SELECT 1 FROM expected e WHERE e.version = a.version))
  AND NOT EXISTS (SELECT 1 FROM actual WHERE version = '20260618000000')
THEN 'STATE_COMPLETE' ELSE 'REFUSE' END || '|PASS';
SQL
  )"
  state_line="$(printf '%s\n' "$state_line" | sed '/^$/d' | tail -n 1 | tr -d '\r')"
  [[ "$state_line" == 'STATE_COMPLETE|PASS' ]] || fail "live migration history is not the exact STATE_COMPLETE authority"
  printf 'PRE_RECHECK_STATE=STATE_COMPLETE\n'
}

run_post_verify() {
  local rows gate_count pass_count fail_count
  rows="$(psql "$PRODUCTION_DB_URL" -X -A -t -F '|' -v ON_ERROR_STOP=1 -f "$PROMOTION_ROOT/POST_PROMOTION_VERIFY.sql")"
  printf '%s\n' "$rows"
  gate_count="$(printf '%s\n' "$rows" | awk -F '|' 'NF >= 2 {n++} END {print n+0}')"
  pass_count="$(printf '%s\n' "$rows" | awk -F '|' '$2 == "PASS" {n++} END {print n+0}')"
  fail_count="$(printf '%s\n' "$rows" | awk -F '|' '$2 == "FAIL" {n++} END {print n+0}')"
  [[ "$gate_count" == 8 && "$pass_count" == 8 && "$fail_count" == 0 ]] || fail "post-promotion semantic verification did not pass 8/8"
  printf 'POST_VERIFY=8/8 PASS\n'
}

verify_final_history() {
  local history_result
  history_result="$(psql "$PRODUCTION_DB_URL" -X -A -t -v ON_ERROR_STOP=1 -c "WITH expected(version) AS (VALUES ('20260710202115'),('20260711181554'),('20260711183628'),('20260711192505'),('20260725213909'),('20260729135940'),('20260815000000'),('20260815134423'),('20260815142927'),('20260821174436'),('20260821185325'),('20260821190820'),('20260821191944'),('20260826004100'),('20260826010904'),('20260826113534'),('20260827000100')), actual AS (SELECT version FROM supabase_migrations.schema_migrations) SELECT CASE WHEN (SELECT count(*) FROM actual)=17 AND NOT EXISTS (SELECT 1 FROM expected e WHERE NOT EXISTS (SELECT 1 FROM actual a WHERE a.version=e.version)) AND NOT EXISTS (SELECT 1 FROM actual a WHERE NOT EXISTS (SELECT 1 FROM expected e WHERE e.version=a.version)) AND NOT EXISTS (SELECT 1 FROM actual WHERE version='20260618000000') THEN 'PASS' ELSE 'FAIL' END")"
  [[ "$history_result" == PASS ]] || fail "final migration history is not the exact expected set"
  printf 'FINAL_HISTORY_COUNT=17\nFINAL_HISTORY_EXACT=PASS\nFINAL_PRODUCTION_DB_STATE=STATE_COMPLETE\n'
}

verify_zero_pending_dry_run() {
  local repair_r2 repair_r3 dry_run_output pending_set pending_count
  repair_r2="$PROMOTION_CLI_WORKDIR/supabase/migrations/20260826010904_history_marker.sql"
  repair_r3="$PROMOTION_CLI_WORKDIR/supabase/migrations/20260826113534_history_marker.sql"
  [[ ! -e "$repair_r2" && ! -e "$repair_r3" ]] || fail "temporary history marker already exists"
  cleanup_temporary_markers() { rm -f "$repair_r2" "$repair_r3"; }
  trap cleanup_temporary_markers EXIT
  printf '%s\n' '-- HISTORY_MARKER_DO_NOT_EXECUTE: R2 body is intentionally absent.' 'SELECT 1;' > "$repair_r2"
  printf '%s\n' '-- HISTORY_MARKER_DO_NOT_EXECUTE: R3 body is intentionally absent.' 'SELECT 1;' > "$repair_r3"
  dry_run_output="$(env SUPABASE_TELEMETRY_DISABLED=1 DO_NOT_TRACK=1 supabase db push --workdir "$PROMOTION_CLI_WORKDIR" --db-url "$PRODUCTION_DB_URL" --dry-run --skip-vault --include-all 2>&1)"
  pending_set="$(printf '%s\n' "$dry_run_output" | rg -o '202[0-9]{11}_[A-Za-z0-9_]+\.sql' | sort -u || true)"
  [[ -z "$pending_set" ]] || fail "PENDING_SET_EXACT=REFUSE"
  pending_count="$(printf '%s\n' "$pending_set" | sed '/^$/d' | wc -l | tr -d ' ')"
  [[ "$pending_count" == 0 ]] || fail "dry-run reported pending migrations"
  cleanup_temporary_markers
  trap - EXIT
  printf 'EXPECTED_PENDING_COUNT=0\nACTUAL_PENDING_COUNT=0\nPENDING_SET_EXACT=PASS\n'
}

verify_release_authority
verify_reviewed_bundle
[[ -n "${PRODUCTION_DB_URL:-}" ]] || fail "safe Production database URL is required"
[[ "${PRODUCTION_PROJECT_REF:-}" == "$EXPECTED_PROJECT_REF" ]] || fail "Production project reference mismatch"
command -v psql >/dev/null 2>&1 || fail "psql is unavailable"
command -v supabase >/dev/null 2>&1 || fail "supabase CLI is unavailable"
validate_production_db_url
identity_result="$(psql "$PRODUCTION_DB_URL" -X -A -t -v ON_ERROR_STOP=1 -c "SELECT CASE WHEN current_database() = 'postgres' AND current_user = 'postgres' AND current_setting('server_version_num')::integer >= 170000 THEN 'PASS' ELSE 'FAIL' END")"
[[ "$identity_result" == PASS ]] || fail "database connection identity check failed"
printf 'PRODUCTION_CONNECTION_IDENTITY_GATE=PASS\n'
classify_state_complete
run_post_verify
verify_zero_pending_dry_run
verify_final_history
printf 'ALREADY_COMPLETE_RERUN=PASS\nALREADY_COMPLETE_MUTATION=NO\nHISTORY_REPAIR_ADDITIONAL_ACTION=NO\nSTATE_COMPLETE_READ_ONLY_VERIFY=PASS\nPRODUCTION_DB_MUTATION=NO\n'
