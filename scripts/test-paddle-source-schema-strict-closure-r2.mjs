import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const route = fs.readFileSync(path.join(root, 'src/app/api/webhooks/paddle/route.js'), 'utf8');
const migration = fs.readFileSync(path.join(root, 'supabase/migrations/20260826010904_paddle_source_schema_strict_closure_r2.sql'), 'utf8');
const reconciliationMigration = fs.readFileSync(path.join(root, 'supabase/migrations/20260826113534_migration_authority_reconciliation_r3.sql'), 'utf8');
const schema = fs.readFileSync(path.join(root, 'supabase/schema.sql'), 'utf8');
const legacyMigrationPath = path.join(root, 'supabase/migration-paddle.sql');
const pricingMigration = path.join(root, 'supabase/migration-candidates/20260820_pricing_v2_reconciliation.sql');
const activePricingMigration = path.join(root, 'supabase/migrations/20260820_pricing_v2_reconciliation.sql');

function check(label, condition) {
  assert.ok(condition, label);
  console.log(`PASS=${label}`);
}

check('MIGRATION_CHAIN_20260820_PRESERVED_AS_CANDIDATE', fs.existsSync(pricingMigration));
check('MIGRATION_CHAIN_EXCLUDES_UNAPPLIED_20260820', !fs.existsSync(activePricingMigration));
check('ROUTE_USES_ATOMIC_WEBHOOK_RPC', route.includes("supabase.rpc('apply_paddle_webhook_event'"));
check('ROUTE_READS_OCCURRED_AT', route.includes('payload.occurred_at'));
check('ROUTE_TRANSACTION_COMPLETED_NEVER_COMPLETED', /eventType === 'transaction\.completed'\s*\?\s*'active'/.test(route) && !route.includes("? 'completed'"));
check('ROUTE_PAUSED_ACCEPTED', /eventType === 'subscription\.paused'\s*\n?\s*\?\s*'paused'/.test(route));
check('R2_HAS_ADVISORY_LOCK', migration.includes('pg_advisory_xact_lock'));
check('R2_HAS_EVENT_ID_IDEMPOTENCY', migration.includes('WHERE event_id = p_event_id'));
check('R2_HAS_STALE_OCCURRED_AT_GUARD', migration.includes('p_occurred_at < v_latest_occurred_at'));
check('R2_HAS_LATEST_EVENT_TIMESTAMP', migration.includes('latest_event_occurred_at'));
check('R2_HAS_PAUSED_AND_NO_COMPLETED_STATUS', migration.includes("'paused'") && !migration.includes("'completed'"));
check('R2_HAS_NONBLANK_PADDLE_ID_UNIQUE_INDEX', migration.includes("NULLIF(BTRIM(paddle_subscription_id), '') IS NOT NULL"));
check('R2_HAS_USER_ID_UNIQUE_INDEX', migration.includes('subscriptions_user_id_unique'));
check('R2_HAS_EVENT_ID_UNIQUE_INDEX', migration.includes('billing_events_event_id_unique'));
check('R3_REMOVES_REDUNDANT_EVENT_ID_INDEX', reconciliationMigration.includes('DROP INDEX public.billing_events_event_id_unique'));
check('R3_RETAINS_CONSTRAINT_AS_EVENT_ID_AUTHORITY', reconciliationMigration.includes('billing_events_event_id_key') && !schema.includes('CREATE UNIQUE INDEX IF NOT EXISTS billing_events_event_id_unique'));
check('SCHEMA_SNAPSHOT_HAS_ORDERING_FIELDS', schema.includes('latest_event_occurred_at') && schema.includes('occurred_at TIMESTAMPTZ'));
check('LEGACY_MIGRATION_FILE_IS_NON_AUTHORITATIVE', fs.existsSync(legacyMigrationPath) && !fs.existsSync(path.join(root, 'supabase/migrations/migration-paddle.sql')));
console.log('SCHEMA_MIGRATION_CODIFIED=PASS');
