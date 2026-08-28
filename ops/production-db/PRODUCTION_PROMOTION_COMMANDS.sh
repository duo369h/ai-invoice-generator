#!/usr/bin/env bash
set -euo pipefail

# R12 resume-safe Production procedure.
# The reviewed 15-file promotion workdir is immutable during normal execution.
# R12_REHEARSAL=YES is disposable-only and is never Production evidence.
EXPECTED_PROJECT_REF="fgortrxozlbzxbkerejz"
EXPECTED_RELEASE_COMMIT="39462eace7eb7791e8eed91a65a6d27597211855"
EXPECTED_SESSION_POOLER_HOST="aws-1-us-east-1.pooler.supabase.com"
EXPECTED_PRODUCTION_SCHEMA_FINGERPRINT="4b9c2aa33c27a224aac82c83835da615"
PROMOTION_ROOT="${PROMOTION_ROOT:-$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)}"
PROMOTION_CLI_WORKDIR="${PROMOTION_CLI_WORKDIR:-$PROMOTION_ROOT/promotion-cli-workdir}"
RC_WORKTREE="${RC_WORKTREE:-/Users/duo/Corvioz-Validation/integration-candidate-r1}"
REHEARSAL="${R12_REHEARSAL:-NO}"
READ_ONLY="${R14_READ_ONLY:-NO}"

fail() { echo "R12 REFUSED: $*" >&2; exit 1; }
[[ -n "${PRODUCTION_DB_URL:-}" ]] || fail "safe PRODUCTION_DB_URL is required and is never printed"
[[ "${PRODUCTION_PROJECT_REF:-}" == "$EXPECTED_PROJECT_REF" ]] || fail "Production project ref input mismatch"
[[ -d "$PROMOTION_CLI_WORKDIR/supabase/migrations" ]] || fail "final promotion-cli-workdir is missing"
[[ -f "$PROMOTION_ROOT/PRE_PROMOTION_PREFLIGHT.sql" ]] || fail "preflight SQL is missing"
[[ -f "$PROMOTION_ROOT/POST_PROMOTION_VERIFY.sql" ]] || fail "post-verification SQL is missing"
command -v supabase >/dev/null 2>&1 || fail "supabase CLI is unavailable"
command -v psql >/dev/null 2>&1 || fail "psql is unavailable"

validate_production_db_url() {
  local without_scheme authority userinfo hostport database username password host port
  case "$PRODUCTION_DB_URL" in
    postgresql://*|postgres://*) ;;
    *) fail "safe DB URL scheme is not PostgreSQL" ;;
  esac
  without_scheme="${PRODUCTION_DB_URL#*://}"
  authority="${without_scheme%%/*}"
  database="${without_scheme#*/}"
  [[ "$authority" != "$without_scheme" ]] || fail "safe DB URL database component is missing"
  userinfo="${authority%@*}"
  hostport="${authority##*@}"
  [[ "$userinfo" != "$authority" ]] || fail "safe DB URL credentials are missing"
  username="${userinfo%%:*}"
  password="${userinfo#*:}"
  host="${hostport%:*}"
  port="${hostport##*:}"
  [[ -n "$username" && -n "$password" ]] || fail "safe DB URL credentials are incomplete"
  if [[ "$REHEARSAL" == YES ]]; then
    [[ "$database" == r12_* || "$database" == r12_*\?* ]] || fail "disposable rehearsal database must use an r12_ name"
  else
    [[ "$database" == postgres || "$database" == postgres\?* ]] || fail "safe DB URL database must be postgres"
  fi
  [[ "$port" == 5432 ]] || fail "safe DB URL port must be 5432"
  case "$host" in
    "db.${EXPECTED_PROJECT_REF}.supabase.co")
      [[ "$username" == postgres ]] || fail "direct Production URL user must be postgres"
      PRODUCTION_CONNECTION_TRANSPORT="DIRECT"
      ;;
    "$EXPECTED_SESSION_POOLER_HOST")
      [[ "$username" == "postgres.${EXPECTED_PROJECT_REF}" ]] || fail "session pooler URL user must include the Production project ref"
      PRODUCTION_CONNECTION_TRANSPORT="SESSION_POOLER"
      ;;
    *) fail "safe DB URL host is not an approved Production or us-east-1 session-pooler endpoint" ;;
  esac
}

schema_fingerprint() {
  psql "$PRODUCTION_DB_URL" -X -A -t -v ON_ERROR_STOP=1 <<'SQL'
WITH objects AS (
  SELECT 'table|' || n.nspname || '.' || c.relname || '|' || c.relkind::text || '|' || c.relrowsecurity::text AS item
  FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
  WHERE n.nspname IN ('public','supabase_migrations') AND c.relkind IN ('r','p','v','m','f')
  UNION ALL
  SELECT 'column|' || n.nspname || '.' || c.relname || '|' || a.attnum::text || '|' || a.attname || '|' || format_type(a.atttypid,a.atttypmod) || '|' || a.attnotnull::text AS item
  FROM pg_attribute a JOIN pg_class c ON c.oid=a.attrelid JOIN pg_namespace n ON n.oid=c.relnamespace
  WHERE n.nspname IN ('public','supabase_migrations') AND c.relkind IN ('r','p','v','m','f') AND a.attnum > 0 AND NOT a.attisdropped
  UNION ALL
  SELECT 'function|' || n.nspname || '.' || p.proname || '(' || pg_get_function_identity_arguments(p.oid) || ')|' || pg_get_function_result(p.oid) AS item
  FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
  WHERE n.nspname IN ('public','supabase_migrations')
  UNION ALL
  SELECT 'constraint|' || n.nspname || '.' || c.relname || '|' || con.conname || '|' || pg_get_constraintdef(con.oid) AS item
  FROM pg_constraint con JOIN pg_class c ON c.oid=con.conrelid JOIN pg_namespace n ON n.oid=c.relnamespace
  WHERE n.nspname IN ('public','supabase_migrations')
)
SELECT md5(COALESCE(string_agg(item, E'\n' ORDER BY item),'')) FROM objects;
SQL
}

validate_production_db_url

if [[ "$REHEARSAL" == "YES" ]]; then
  [[ "${REHEARSAL_ALLOW_MUTATION:-NO}" == "YES" ]] || fail "rehearsal mutation authorization is missing"
  [[ "${BACKUP_GATE:-}" == "REHEARSAL_PASS" ]] || fail "disposable backup rehearsal gate is missing"
  [[ "${PRODUCTION_DB_CREDENTIAL_GATE:-}" == "REHEARSAL_PASS" ]] || fail "disposable credential rehearsal gate is missing"
  identity_result="$(psql "$PRODUCTION_DB_URL" -X -A -t -v ON_ERROR_STOP=1 -c "SELECT CASE WHEN current_database() LIKE 'r12_%' AND EXISTS (SELECT 1 FROM r12_rehearsal.connection_identity WHERE project_ref = '$EXPECTED_PROJECT_REF' AND marker = 'R12_DISPOSABLE_ONLY') THEN 'PASS' ELSE 'FAIL' END")"
else
  [[ "${BACKUP_GATE:-}" == "PASS" ]] || fail "BACKUP_GATE=PASS is required"
  [[ "${PRODUCTION_DB_CREDENTIAL_GATE:-}" == "PASS" ]] || fail "Production DB credential gate is not PASS"
  if [[ "$READ_ONLY" != YES ]]; then
    [[ "${PROMOTION_ALLOW_MUTATION:-NO}" == "YES" ]] || fail "explicit Production mutation flag is missing"
    [[ "${PROMOTION_ONE_TIME_AUTH:-}" == "R12-ONE-TIME-AUTHORIZED" ]] || fail "explicit one-time authorization is missing"
  fi
  identity_result="$(psql "$PRODUCTION_DB_URL" -X -A -t -v ON_ERROR_STOP=1 -c "SELECT CASE WHEN current_database() = 'postgres' AND current_user = 'postgres' AND current_setting('server_version_num')::integer >= 170000 THEN 'PASS' ELSE 'FAIL' END")"
fi
[[ "$identity_result" == "PASS" ]] || fail "database connection identity check failed"
echo "PRODUCTION_CONNECTION_IDENTITY_GATE=PASS"
if [[ "$REHEARSAL" != YES && "$PRODUCTION_CONNECTION_TRANSPORT" == SESSION_POOLER ]]; then
  echo "SESSION_POOLER_PROJECT_IDENTITY_GATE=PASS"
elif [[ "$REHEARSAL" != YES ]]; then
  echo "DIRECT_PROJECT_IDENTITY_GATE=PASS"
fi

release_head="$(git -C "$RC_WORKTREE" rev-parse HEAD 2>/dev/null)"
git -C "$RC_WORKTREE" merge-base --is-ancestor "$EXPECTED_RELEASE_COMMIT" "$release_head" || fail "release authority is not based on the accepted release commit"
[[ -z "$(git -C "$RC_WORKTREE" status --short 2>/dev/null)" ]] || fail "release authority worktree is dirty"

expected_files=(
  20260815000000_document_usage_engine_v2.sql
  20260815134423_document_usage_engine_v2_hardening.sql
  20260826004100_paddle_checkout_source_schema_closure_r1.sql
  20260827000100_production_promotion_reconciliation_r9.sql
)
history_files=(
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
[[ "$sql_count" -eq 15 ]] || fail "CLI local SQL file count is not 15"
for file in "${history_files[@]}"; do
  path="$PROMOTION_CLI_WORKDIR/supabase/migrations/$file"
  [[ -f "$path" ]] || fail "history marker missing: $file"
  rg -q 'HISTORY_MARKER_DO_NOT_EXECUTE' "$path" || fail "history marker label missing: $file"
done
for file in "${expected_files[@]}"; do
  [[ -f "$PROMOTION_CLI_WORKDIR/supabase/migrations/$file" ]] || fail "executable migration missing: $file"
done
[[ ! -e "$PROMOTION_CLI_WORKDIR/supabase/migrations/20260618000000_canonical_corvioz_baseline.sql" ]] || fail "baseline is present"
[[ ! -e "$PROMOTION_CLI_WORKDIR/supabase/migrations/20260826010904_paddle_source_schema_strict_closure_r2.sql" ]] || fail "original R2 is present"
[[ ! -e "$PROMOTION_CLI_WORKDIR/supabase/migrations/20260826113534_migration_authority_reconciliation_r3.sql" ]] || fail "R3 body is present"

for file in "${expected_files[@]}"; do
  case "$file" in
    20260815000000_document_usage_engine_v2.sql) expected_hash=dac031df2cf1460ca1640afae4e2f4ffe91b48e7735b7496075be8220c38f9c6 ;;
    20260815134423_document_usage_engine_v2_hardening.sql) expected_hash=2326eca342429f2ba269e46c11d0b0ed785cfdb3d895de33c569fafbb0ed1152 ;;
    20260826004100_paddle_checkout_source_schema_closure_r1.sql) expected_hash=e3765527551678aee4d1568ac61f75fab0b5ab22e91d64d0c3ef086dac28036b ;;
    20260827000100_production_promotion_reconciliation_r9.sql) expected_hash=57233b26b3302dfa8731420fd983d2777efb891109240aacb921e105aac4f396 ;;
  esac
  actual_hash="$(shasum -a 256 "$PROMOTION_CLI_WORKDIR/supabase/migrations/$file" | awk '{print $1}')"
  [[ "$actual_hash" == "$expected_hash" ]] || fail "bundle hash mismatch: $file"
done
echo "REVIEWED_15_FILE_WORKDIR=PASS"

classify_state() {
  local state_line
  state_line="$(psql "$PRODUCTION_DB_URL" -X -A -t -F '|' -v ON_ERROR_STOP=1 <<'SQL'
WITH expected_base(version) AS (
  VALUES ('20260710202115'),('20260711181554'),('20260711183628'),
         ('20260711192505'),('20260725213909'),('20260729135940'),
         ('20260815142927'),('20260821174436'),('20260821185325'),
         ('20260821190820'),('20260821191944')
), executable(version, ord) AS (
  VALUES ('20260815000000',1),('20260815134423',2),
         ('20260826004100',3),('20260827000100',4)
), actual AS (
  SELECT version FROM supabase_migrations.schema_migrations
), counts AS (
  SELECT
    (SELECT count(*) FROM actual a JOIN executable e USING (version)) AS executable_count,
    (SELECT count(*) FROM actual WHERE version = '20260826010904') AS r2_count,
    (SELECT count(*) FROM actual WHERE version = '20260826113534') AS r3_count,
    (SELECT count(*) FROM actual) AS actual_count
), flags AS (
  SELECT
    NOT EXISTS (SELECT 1 FROM expected_base e WHERE NOT EXISTS (SELECT 1 FROM actual a WHERE a.version=e.version)) AS base_complete,
    NOT EXISTS (SELECT 1 FROM actual a WHERE a.version NOT IN (SELECT version FROM expected_base UNION ALL SELECT version FROM executable UNION ALL VALUES ('20260826010904'),('20260826113534'))) AS known_only,
    NOT EXISTS (SELECT 1 FROM executable e WHERE e.ord <= counts.executable_count AND NOT EXISTS (SELECT 1 FROM actual a WHERE a.version=e.version))
      AND NOT EXISTS (SELECT 1 FROM executable e WHERE e.ord > counts.executable_count AND EXISTS (SELECT 1 FROM actual a WHERE a.version=e.version)) AS executable_prefix,
    (counts.executable_count = 4 OR (counts.r2_count = 0 AND counts.r3_count = 0)) AS repair_after_executables
  FROM counts
)
SELECT CASE
  WHEN NOT base_complete OR NOT known_only OR NOT executable_prefix OR NOT repair_after_executables THEN 'REFUSE'
  WHEN executable_count = 0 AND r2_count = 0 AND r3_count = 0 THEN 'STATE_0'
  WHEN executable_count = 1 AND r2_count = 0 AND r3_count = 0 THEN 'STATE_1'
  WHEN executable_count = 2 AND r2_count = 0 AND r3_count = 0 THEN 'STATE_2'
  WHEN executable_count = 3 AND r2_count = 0 AND r3_count = 0 THEN 'STATE_3'
  WHEN executable_count = 4 AND r2_count = 0 AND r3_count = 0 THEN 'STATE_4'
  WHEN executable_count = 4 AND r2_count = 1 AND r3_count = 0 THEN 'STATE_5'
  WHEN executable_count = 4 AND r2_count = 0 AND r3_count = 1 THEN 'STATE_6'
  WHEN executable_count = 4 AND r2_count = 1 AND r3_count = 1 AND actual_count = 17 THEN 'STATE_COMPLETE'
  ELSE 'REFUSE'
END || '|PASS'
FROM counts, flags;
SQL
  )"
  state_line="$(printf '%s\n' "$state_line" | sed '/^$/d' | tail -n 1 | tr -d '\r')"
  [[ "$state_line" == *"|PASS" ]] || fail "UNKNOWN_OR_NONPREFIX_HISTORY=REFUSE_BEFORE_MUTATION"
  PROMOTION_STATE="${state_line%%|*}"
  [[ "$PROMOTION_STATE" != "REFUSE" ]] || fail "UNKNOWN_OR_NONPREFIX_HISTORY=REFUSE_BEFORE_MUTATION"
  echo "PROMOTION_STATE=$PROMOTION_STATE"
}

scalar() {
  psql "$PRODUCTION_DB_URL" -X -A -t -v ON_ERROR_STOP=1 -c "$1" | tr -d '[:space:]'
}

run_preflight() {
  local rows gate_count pass_count fail_count
  rows="$(psql "$PRODUCTION_DB_URL" -X -A -t -F '|' -v ON_ERROR_STOP=1 -f "$PROMOTION_ROOT/PRE_PROMOTION_PREFLIGHT.sql")"
  printf '%s\n' "$rows"
  gate_count="$(printf '%s\n' "$rows" | awk -F '|' 'NF >= 2 {n++} END {print n+0}')"
  pass_count="$(printf '%s\n' "$rows" | awk -F '|' '$2 == "PASS" {n++} END {print n+0}')"
  fail_count="$(printf '%s\n' "$rows" | awk -F '|' '$2 == "FAIL" {n++} END {print n+0}')"
  [[ "$gate_count" -eq 13 && "$pass_count" -eq 13 && "$fail_count" -eq 0 ]] || fail "State_0 preflight did not pass 13/13"
  echo "PHASE_SCHEMA_HISTORY_ALIGNMENT=PASS STATE_0_PREFLIGHT=PASS"
}

run_post_verify() {
  local rows gate_count pass_count fail_count
  rows="$(psql "$PRODUCTION_DB_URL" -X -A -t -F '|' -v ON_ERROR_STOP=1 -f "$PROMOTION_ROOT/POST_PROMOTION_VERIFY.sql")"
  printf '%s\n' "$rows"
  gate_count="$(printf '%s\n' "$rows" | awk -F '|' 'NF >= 2 {n++} END {print n+0}')"
  pass_count="$(printf '%s\n' "$rows" | awk -F '|' '$2 == "PASS" {n++} END {print n+0}')"
  fail_count="$(printf '%s\n' "$rows" | awk -F '|' '$2 == "FAIL" {n++} END {print n+0}')"
  [[ "$gate_count" -eq 8 && "$pass_count" -eq 8 && "$fail_count" -eq 0 ]] || fail "post-promotion semantic gates did not all PASS"
  echo "PHASE_SCHEMA_HISTORY_ALIGNMENT=PASS FULL_POST_VERIFY=PASS"
}

run_partial_phase_alignment() {
  local m1 m2 m3 m4
  m1="$(scalar "SELECT CASE WHEN to_regclass('public.document_usage_events') IS NOT NULL AND to_regprocedure('public.resolve_free_document_usage_cycle(timestamptz,timestamptz)') IS NOT NULL AND to_regprocedure('public.create_document_with_usage(uuid,text,uuid,uuid,jsonb)') IS NOT NULL THEN 'PRESENT' ELSE 'ABSENT' END")"
  m2="$(scalar "SELECT CASE WHEN (SELECT relrowsecurity FROM pg_class WHERE oid='public.document_usage_events'::regclass) AND NOT has_table_privilege('anon','public.document_usage_events','INSERT,UPDATE,DELETE') AND NOT has_table_privilege('authenticated','public.document_usage_events','INSERT,UPDATE,DELETE') AND NOT has_table_privilege('service_role','public.document_usage_events','INSERT,UPDATE,DELETE') THEN 'PRESENT' ELSE 'ABSENT' END")"
  m3="$(scalar "SELECT CASE WHEN EXISTS (SELECT 1 FROM pg_attribute WHERE attrelid='public.subscriptions'::regclass AND attname='billing_interval' AND NOT attisdropped) AND (SELECT count(*) FROM pg_attribute WHERE attrelid='public.entitlements'::regclass AND attname IN ('invoice','quote','pdf_branding','client_approval','approval_scope') AND NOT attisdropped)=5 AND EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid='public.entitlements'::regclass AND conname='entitlements_plan_check') THEN 'PRESENT' ELSE 'ABSENT' END")"
  m4="$(scalar "SELECT CASE WHEN EXISTS (SELECT 1 FROM pg_attribute WHERE attrelid='public.subscriptions'::regclass AND attname='latest_event_occurred_at' AND NOT attisdropped) AND EXISTS (SELECT 1 FROM pg_attribute WHERE attrelid='public.subscriptions'::regclass AND attname='paddle_price_id' AND NOT attisdropped) AND EXISTS (SELECT 1 FROM pg_attribute WHERE attrelid='public.billing_events'::regclass AND attname='occurred_at' AND NOT attisdropped) AND EXISTS (SELECT 1 FROM pg_attribute WHERE attrelid='public.billing_events'::regclass AND attname='applied' AND NOT attisdropped) THEN 'PRESENT' ELSE 'ABSENT' END")"
  echo "PHASE_EFFECTS M1=$m1 M2=$m2 M3=$m3 M4=$m4"
  case "$PROMOTION_STATE" in
    STATE_1) [[ "$m1" == PRESENT && "$m2" == ABSENT && "$m3" == ABSENT && "$m4" == ABSENT ]] ;;
    STATE_2) [[ "$m1" == PRESENT && "$m2" == PRESENT && "$m3" == ABSENT && "$m4" == ABSENT ]] ;;
    STATE_3) [[ "$m1" == PRESENT && "$m2" == PRESENT && "$m3" == PRESENT && "$m4" == ABSENT ]] ;;
    *) fail "phase alignment called for an invalid partial state" ;;
  esac || fail "PHASE_SCHEMA_HISTORY_ALIGNMENT=REFUSE_SCHEMA_HISTORY_MISMATCH"
  echo "PHASE_SCHEMA_HISTORY_ALIGNMENT=PASS"
}

classify_state
case "$PROMOTION_STATE" in
  STATE_0) run_preflight ;;
  STATE_1|STATE_2|STATE_3) run_partial_phase_alignment ;;
  STATE_4|STATE_5|STATE_6|STATE_COMPLETE) run_post_verify ;;
  *) fail "UNKNOWN_OR_NONPREFIX_HISTORY=REFUSE_BEFORE_MUTATION" ;;
esac

if [[ "$REHEARSAL" != YES && "$READ_ONLY" == YES ]]; then
  schema_result="$(schema_fingerprint)"
  [[ "$schema_result" == "$EXPECTED_PRODUCTION_SCHEMA_FINGERPRINT" ]] || fail "Production schema fingerprint is not the expected read-only authority"
  echo "PRODUCTION_SCHEMA_FINGERPRINT=PASS"
fi

case "$PROMOTION_STATE" in
  STATE_0) expected_pending=("${expected_files[@]}") ;;
  STATE_1) expected_pending=(
    20260815134423_document_usage_engine_v2_hardening.sql
    20260826004100_paddle_checkout_source_schema_closure_r1.sql
    20260827000100_production_promotion_reconciliation_r9.sql
  ) ;;
  STATE_2) expected_pending=(
    20260826004100_paddle_checkout_source_schema_closure_r1.sql
    20260827000100_production_promotion_reconciliation_r9.sql
  ) ;;
  STATE_3) expected_pending=(20260827000100_production_promotion_reconciliation_r9.sql) ;;
  STATE_4|STATE_5|STATE_6|STATE_COMPLETE) expected_pending=() ;;
  *) fail "unrecognized promotion state" ;;
esac

# Supabase db push requires every already-applied remote version to have a
# local filename. Existing repair-history versions are represented temporarily
# for the read-only dry-run; missing repair versions stay absent until the
# post-verify repair step. All temporary markers are removed on every exit.
repair_r2="$PROMOTION_CLI_WORKDIR/supabase/migrations/20260826010904_history_marker.sql"
repair_r3="$PROMOTION_CLI_WORKDIR/supabase/migrations/20260826113534_history_marker.sql"
cleanup_repair_markers() { rm -f "$repair_r2" "$repair_r3"; }
trap cleanup_repair_markers EXIT
case "$PROMOTION_STATE" in
  STATE_5|STATE_COMPLETE)
    printf '%s\n' '-- HISTORY_MARKER_DO_NOT_EXECUTE: R2 body is intentionally absent.' 'SELECT 1;' > "$repair_r2" ;;
esac
case "$PROMOTION_STATE" in
  STATE_6|STATE_COMPLETE)
    printf '%s\n' '-- HISTORY_MARKER_DO_NOT_EXECUTE: R3 body is intentionally absent.' 'SELECT 1;' > "$repair_r3" ;;
esac
if [[ "${#expected_pending[@]}" -gt 0 ]]; then
  expected_pending_set="$(printf '%s\n' "${expected_pending[@]}" | sort)"
else
  expected_pending_set=""
fi

dry_run_output="$(env SUPABASE_TELEMETRY_DISABLED=1 DO_NOT_TRACK=1 supabase db push --workdir "$PROMOTION_CLI_WORKDIR" --db-url "$PRODUCTION_DB_URL" --dry-run --skip-vault --include-all 2>&1)"
printf '%s\n' "$dry_run_output"
pending_set="$(printf '%s\n' "$dry_run_output" | rg -o '202[0-9]{11}_[A-Za-z0-9_]+\.sql' | sort -u || true)"
[[ "$pending_set" == "$expected_pending_set" ]] || fail "STATE_AWARE_PENDING_SET=REFUSE expected suffix does not match dry-run"
pending_count="$(printf '%s\n' "$pending_set" | sed '/^$/d' | wc -l | tr -d ' ')"
echo "STATE_AWARE_PENDING_SET=PASS EXPECTED_COUNT=$pending_count ACTUAL_COUNT=$pending_count"

if [[ "$pending_count" -gt 0 ]]; then
  if [[ "$READ_ONLY" == YES ]]; then
    echo "R14_READ_ONLY=PASS"
    echo "MUTATION_REFUSAL=PASS"
    exit 0
  fi
  [[ "${PROMOTION_ALLOW_MUTATION:-NO}" == "YES" ]] || fail "mutation authorization is missing for pending migrations"
  if [[ "$REHEARSAL" == "YES" ]]; then
    [[ "${PROMOTION_ONE_TIME_AUTH:-}" == "R12-REHEARSAL" ]] || fail "rehearsal one-time authorization is missing"
  else
    [[ "${PROMOTION_ONE_TIME_AUTH:-}" == "R12-ONE-TIME-AUTHORIZED" ]] || fail "Production one-time authorization is missing"
  fi
  apply_output="$(env SUPABASE_TELEMETRY_DISABLED=1 DO_NOT_TRACK=1 supabase db push --workdir "$PROMOTION_CLI_WORKDIR" --db-url "$PRODUCTION_DB_URL" --skip-vault --include-all --yes 2>&1)"
  printf '%s\n' "$apply_output"
  applied_set="$(printf '%s\n' "$apply_output" | rg -o '202[0-9]{11}_[A-Za-z0-9_]+\.sql' | sort -u || true)"
  [[ "$applied_set" == "$expected_pending_set" ]] || fail "apply did not report exactly the state-aware pending suffix"
  echo "STATE_AWARE_APPLY=PASS APPLIED_COUNT=$pending_count"
fi

classify_state
case "$PROMOTION_STATE" in
  STATE_4|STATE_5|STATE_6) run_post_verify ;;
  STATE_COMPLETE)
    run_post_verify
    echo "ALREADY_COMPLETE_RERUN=PASS"
    echo "ALREADY_COMPLETE_MUTATION=NO"
    echo "HISTORY_REPAIR_RESUME_SAFE=PASS REPAIR_ACTION=NONE"
    ;;
  *) fail "after apply, expected State_4/5/6/STATE_COMPLETE but observed an incomplete state" ;;
esac

if [[ "$PROMOTION_STATE" != "STATE_COMPLETE" ]]; then
  schema_before_repair="$(schema_fingerprint)"
  repair_r2="$PROMOTION_CLI_WORKDIR/supabase/migrations/20260826010904_history_marker.sql"
  repair_r3="$PROMOTION_CLI_WORKDIR/supabase/migrations/20260826113534_history_marker.sql"
  cleanup_repair_markers() { rm -f "$repair_r2" "$repair_r3"; }
  trap cleanup_repair_markers EXIT
  repair_args=()
  case "$PROMOTION_STATE" in
    STATE_4)
      printf '%s\n' '-- HISTORY_MARKER_DO_NOT_EXECUTE: R2 body is intentionally absent.' 'SELECT 1;' > "$repair_r2"
      printf '%s\n' '-- HISTORY_MARKER_DO_NOT_EXECUTE: R3 body is intentionally absent.' 'SELECT 1;' > "$repair_r3"
      repair_args=(20260826010904 20260826113534) ;;
    STATE_5)
      printf '%s\n' '-- HISTORY_MARKER_DO_NOT_EXECUTE: R3 body is intentionally absent.' 'SELECT 1;' > "$repair_r3"
      repair_args=(20260826113534) ;;
    STATE_6)
      printf '%s\n' '-- HISTORY_MARKER_DO_NOT_EXECUTE: R2 body is intentionally absent.' 'SELECT 1;' > "$repair_r2"
      repair_args=(20260826010904) ;;
    *) fail "history repair reached from an invalid state" ;;
  esac
  env SUPABASE_TELEMETRY_DISABLED=1 DO_NOT_TRACK=1 supabase migration repair --workdir "$PROMOTION_CLI_WORKDIR" --db-url "$PRODUCTION_DB_URL" --status applied --yes "${repair_args[@]}"
  schema_after_repair="$(schema_fingerprint)"
  [[ -n "$schema_before_repair" && "$schema_before_repair" == "$schema_after_repair" ]] || fail "HISTORY_REPAIR_SCHEMA_DELTA=CHANGED"
  echo "HISTORY_REPAIR_RESUME_SAFE=PASS REPAIRED_COUNT=${#repair_args[@]}"
  echo "HISTORY_REPAIR_SCHEMA_DELTA=NONE"
  cleanup_repair_markers
  trap - EXIT
fi

history_result="$(psql "$PRODUCTION_DB_URL" -X -A -t -v ON_ERROR_STOP=1 -c "WITH expected(version) AS (VALUES ('20260710202115'),('20260711181554'),('20260711183628'),('20260711192505'),('20260725213909'),('20260729135940'),('20260815000000'),('20260815134423'),('20260815142927'),('20260821174436'),('20260821185325'),('20260821190820'),('20260821191944'),('20260826004100'),('20260826010904'),('20260826113534'),('20260827000100')), actual AS (SELECT version FROM supabase_migrations.schema_migrations) SELECT CASE WHEN (SELECT count(*) FROM actual)=17 AND NOT EXISTS (SELECT 1 FROM expected e WHERE NOT EXISTS (SELECT 1 FROM actual a WHERE a.version=e.version)) AND NOT EXISTS (SELECT 1 FROM actual a WHERE NOT EXISTS (SELECT 1 FROM expected e WHERE e.version=a.version)) AND NOT EXISTS (SELECT 1 FROM actual WHERE version='20260618000000') THEN 'PASS' ELSE 'FAIL' END")"
[[ "$history_result" == "PASS" ]] || fail "final migration history set is not the exact expected 17 versions"
echo "POST_PROMOTION_HISTORY_SET=PASS"
if [[ "$PROMOTION_STATE" != "STATE_COMPLETE" ]]; then
  echo "FINAL_COMMAND_SCRIPT_REHEARSAL=PASS"
else
  echo "FINAL_COMMAND_SCRIPT_ALREADY_COMPLETE=PASS"
fi
