#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
VERIFIER="$ROOT/ops/production-db/VERIFY_STATE_COMPLETE_READ_ONLY.sh"
FIXTURE_ROOT="$(mktemp -d "${TMPDIR:-/tmp}/corvioz-r28-fixture.XXXXXX")"
FAKE_BIN="$FIXTURE_ROOT/bin"
FAKE_WORKDIR="$FIXTURE_ROOT/promotion-cli-workdir"

cleanup() {
  rm -rf "$FIXTURE_ROOT"
}
trap cleanup EXIT

mkdir -p "$FAKE_BIN" "$FAKE_WORKDIR/supabase/migrations"

cat > "$FAKE_BIN/psql" <<'SH'
#!/usr/bin/env bash
set -euo pipefail
if [[ -n "${R28_PSQL_CALL_LOG:-}" ]]; then
  printf 'psql-called\n' >> "$R28_PSQL_CALL_LOG"
fi
if [[ " $* " == *" -f "* ]]; then
  printf '%s\n' \
    'billing_event_contract|PASS|fixture' \
    'document_usage_engine_present|PASS|fixture' \
    'payment_authority_preserved|PASS|fixture' \
    'quote_invoice_authority_preserved|PASS|fixture' \
    'r1_entitlement_contract|PASS|fixture' \
    'subscription_contract|PASS|fixture' \
    'usage_hardening_rls|PASS|fixture' \
    'webhook_function_authority|PASS|fixture'
elif [[ " $* " == *" -c "* ]]; then
  printf 'PASS\n'
else
  printf '%s|PASS\n' "${R28_FAKE_STATE:-STATE_COMPLETE}"
fi
SH

cat > "$FAKE_BIN/supabase" <<'SH'
#!/usr/bin/env bash
set -euo pipefail
case " $* " in
  *' db push '*' --dry-run '*) ;;
  *) printf 'fake supabase received a non-dry-run command\n' >&2; exit 98 ;;
esac
case " $* " in
  *' --yes '*) printf 'fake supabase received an apply confirmation\n' >&2; exit 99 ;;
esac
if [[ "${R28_FAKE_PENDING:-EMPTY}" == "NONEMPTY" ]]; then
  printf '%s\n' 'Would push these migrations:' ' • 20260815000000_document_usage_engine_v2.sql'
else
  printf '%s\n' '{"upToDate":true,"dryRun":true,"migrations":[]}'
fi
SH

cat > "$FAKE_BIN/git" <<'SH'
#!/usr/bin/env bash
set -euo pipefail
case " $* " in
  *' branch --show-current '*) printf '%s\n' "${R28_FAKE_BRANCH:-release/corvioz-first-release-r1}" ;;
  *' rev-parse HEAD '*) printf '%s\n' "${R28_FAKE_HEAD:-f28c0000000000000000000000000000000000000}" ;;
  *' merge-base --is-ancestor '*bbadfaba0b15927929df7751986c010032050b66*) [[ "${R28_FAKE_R26_ANCESTOR:-YES}" == YES ]] ;;
  *' merge-base --is-ancestor '*39462eace7eb7791e8eed91a65a6d27597211855*) [[ "${R28_FAKE_PRODUCT_ANCESTOR:-YES}" == YES ]] ;;
  *' status --short '*) [[ "${R28_FAKE_DIRTY:-NO}" == YES ]] && printf ' M fixture\n' ;;
  *) printf 'unexpected git invocation: %s\n' "$*" >&2; exit 97 ;;
esac
SH

chmod 700 "$FAKE_BIN/psql" "$FAKE_BIN/supabase" "$FAKE_BIN/git"

for file in \
  20260710202115_history_marker.sql \
  20260711181554_history_marker.sql \
  20260711183628_history_marker.sql \
  20260711192505_history_marker.sql \
  20260725213909_history_marker.sql \
  20260729135940_history_marker.sql \
  20260815142927_history_marker.sql \
  20260821174436_history_marker.sql \
  20260821185325_history_marker.sql \
  20260821190820_history_marker.sql \
  20260821191944_history_marker.sql; do
  printf '%s\n' '-- HISTORY_MARKER_DO_NOT_EXECUTE' 'SELECT 1;' > "$FAKE_WORKDIR/supabase/migrations/$file"
done

for file in \
  20260815000000_document_usage_engine_v2.sql \
  20260815134423_document_usage_engine_v2_hardening.sql \
  20260826004100_paddle_checkout_source_schema_closure_r1.sql \
  20260827000100_production_promotion_reconciliation_r9.sql; do
  cp "$ROOT/ops/production-db/promotion-cli-workdir/supabase/migrations/$file" "$FAKE_WORKDIR/supabase/migrations/$file"
done

run_case() {
  local name="$1"
  local expected_exit="$2"
  local expected_pattern="$3"
  shift 3
  local output
  local psql_log="$FIXTURE_ROOT/${name}.psql"
  local test_scheme='postgresql'
  local test_user='postgres.fgortrxozlbzxbkerejz'
  local test_password='fixture'
  local test_host='aws-1-us-east-1.pooler.supabase.com'
  local test_url="${test_scheme}://${test_user}:${test_password}@${test_host}:5432/postgres?sslmode=require"
  set +e
  output="$(PATH="$FAKE_BIN:$PATH" R28_PSQL_CALL_LOG="$psql_log" PRODUCTION_DB_URL="$test_url" PRODUCTION_PROJECT_REF=fgortrxozlbzxbkerejz PROMOTION_CLI_WORKDIR="$FAKE_WORKDIR" "$@" "$VERIFIER" 2>&1)"
  local actual_exit=$?
  set -e
  [[ "$actual_exit" == "$expected_exit" ]] || { printf '%s failed: unexpected exit %s\n%s\n' "$name" "$actual_exit" "$output" >&2; exit 1; }
  grep -Fq "$expected_pattern" <<<"$output" || { printf '%s failed: missing %s\n%s\n' "$name" "$expected_pattern" "$output" >&2; exit 1; }
  R28_LAST_PSQL_LOG="$psql_log"
}

assert_no_psql() {
  [[ ! -s "$R28_LAST_PSQL_LOG" ]] || { printf 'authority refusal contacted fake Production psql\n' >&2; exit 1; }
}

run_case clean_descendant_head 0 'STATE_COMPLETE_READ_ONLY_VERIFY=PASS' env R28_FAKE_STATE=STATE_COMPLETE
run_case dirty_exact_r26_refuses 1 'release authority worktree is dirty' env R28_FAKE_HEAD=bbadfaba0b15927929df7751986c010032050b66 R28_FAKE_DIRTY=YES
assert_no_psql
run_case r26_non_descendant_refuses 1 'accepted R26 operations authority' env R28_FAKE_R26_ANCESTOR=NO
assert_no_psql
run_case product_non_descendant_refuses 1 'accepted product release baseline' env R28_FAKE_PRODUCT_ANCESTOR=NO
assert_no_psql
run_case wrong_branch_refuses 1 'release authority branch mismatch' env R28_FAKE_BRANCH=main
assert_no_psql
run_case dirty_worktree_refuses 1 'release authority worktree is dirty' env R28_FAKE_DIRTY=YES
assert_no_psql
run_case state_0_refuses 1 'STATE_COMPLETE_READ_ONLY_VERIFY=REFUSE' env R28_FAKE_STATE=STATE_0
run_case state_1_refuses 1 'STATE_COMPLETE_READ_ONLY_VERIFY=REFUSE' env R28_FAKE_STATE=STATE_1
run_case unknown_history_refuses 1 'STATE_COMPLETE_READ_ONLY_VERIFY=REFUSE' env R28_FAKE_STATE=REFUSE
run_case non_prefix_refuses 1 'STATE_COMPLETE_READ_ONLY_VERIFY=REFUSE' env R28_FAKE_STATE=REFUSE
run_case baseline_refuses 1 'STATE_COMPLETE_READ_ONLY_VERIFY=REFUSE' env R28_FAKE_STATE=REFUSE
run_case nonempty_pending_refuses 1 'PENDING_SET_EXACT=REFUSE' env R28_FAKE_STATE=STATE_COMPLETE R28_FAKE_PENDING=NONEMPTY
[[ ! -e "$FAKE_WORKDIR/supabase/migrations/20260826010904_history_marker.sql" ]]
[[ ! -e "$FAKE_WORKDIR/supabase/migrations/20260826113534_history_marker.sql" ]]

if rg -q 'supabase db push' "$VERIFIER" && ! rg -q 'supabase db push.*--dry-run' "$VERIFIER"; then
  printf 'static safety failure: non-dry-run push found\n' >&2
  exit 1
fi
if rg -qi 'migration repair|\b(INSERT|UPDATE|DELETE|ALTER|CREATE|DROP|TRUNCATE|GRANT|REVOKE)\b' "$VERIFIER"; then
  printf 'static safety failure: mutation token found\n' >&2
  exit 1
fi
if rg -q 'PROMOTION_ALLOW_MUTATION|PROMOTION_ONE_TIME_AUTH' "$VERIFIER"; then
  printf 'static safety failure: mutation authorization dependency found\n' >&2
  exit 1
fi
if rg -q 'EXPECTED_OPERATIONS_HEAD|release_head.*==.*bbadfaba' "$VERIFIER"; then
  printf 'static safety failure: exact R26 HEAD self-pin found\n' >&2
  exit 1
fi
if rg -q 'printf.*PRODUCTION_DB_URL|echo.*PRODUCTION_DB_URL' "$VERIFIER"; then
  printf 'static safety failure: database URL output found\n' >&2
  exit 1
fi
bash -n "$VERIFIER"

printf 'R28 local mock verifier tests passed.\n'
