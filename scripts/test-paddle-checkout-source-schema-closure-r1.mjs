import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), 'utf8');

const route = read('src/app/api/webhooks/paddle/route.js');
const entitlements = read('lib/entitlements.ts');
const schema = read('supabase/schema.sql');
const migration = read('supabase/migrations/20260826004100_paddle_checkout_source_schema_closure_r1.sql');
const strictMigration = read('supabase/migrations/20260826010904_paddle_source_schema_strict_closure_r2.sql');

let passed = 0;
function check(label, condition) {
  assert.ok(condition, label);
  passed += 1;
  console.log(`PASS: ${label}`);
}

const handledEventsMatch = route.match(/const handledEvents = \[([\s\S]*?)\];/);
assert.ok(handledEventsMatch, 'route must declare handledEvents');
const handledEvents = [...handledEventsMatch[1].matchAll(/'([^']+)'/g)].map(([, event]) => event);

check('current handled event count is exactly 7', handledEvents.length === 7);
check('payment.completed is not executable', !route.includes("'payment.completed'"));
check(
  'transaction.completed normalizes subscription status to active',
  /eventType === 'transaction\.completed'\s*\?\s*'active'/.test(route)
);
check('current billing period start is mapped', route.includes('data.current_billing_period?.starts_at'));
check('current billing period end is mapped', route.includes('data.current_billing_period?.ends_at'));
check('monthly billing interval is mapped', route.includes("data.billing_cycle?.interval === 'month'"));
check('yearly billing interval is mapped', route.includes("data.billing_cycle?.interval === 'year'"));
check('webhook side effects use the atomic ordering RPC', route.includes("supabase.rpc('apply_paddle_webhook_event'") && strictMigration.includes('apply_paddle_webhook_event'));
check('subscriptions retain user-scoped uniqueness for the RPC', schema.includes('subscriptions_user_id_unique') && migration.includes('subscriptions_user_id_unique'));
check('entitlements retain user-scoped uniqueness for the RPC', schema.includes('entitlements_user_id_unique') && migration.includes('entitlements_user_id_unique'));
check('billing events retain event-id uniqueness for the RPC', schema.includes('event_id TEXT UNIQUE NOT NULL') && migration.includes('event_id TEXT UNIQUE NOT NULL'));

const entitlementFields = [
  'invoice',
  'quote',
  'export_pdf',
  'pdf_branding',
  'client_portal',
  'client_approval',
  'approval_scope',
  'crm',
  'automation',
  'advanced_invoicing',
  'unlimited_invoices',
];
for (const field of entitlementFields) {
  check(`entitlements contract includes ${field}`, schema.includes(field) && migration.includes(field));
}

check('entitlements contract includes starter plan', schema.includes("'free', 'starter', 'pro'") && migration.includes("'free', 'starter', 'pro'"));
check('subscriptions contract includes billing_interval', schema.includes('billing_interval TEXT') && migration.includes('ADD COLUMN IF NOT EXISTS billing_interval'));
check('subscriptions contract supports user-scoped upsert', schema.includes('subscriptions_user_id_unique') && migration.includes('subscriptions_user_id_unique'));
check('entitlements contract supports user-scoped upsert', schema.includes('entitlements_user_id_unique') && migration.includes('entitlements_user_id_unique'));
check('billing events retain event-id uniqueness', schema.includes('event_id TEXT UNIQUE NOT NULL') && migration.includes('event_id TEXT UNIQUE NOT NULL'));
check('closure migration is non-destructive for entitlements', !migration.includes('DROP TABLE IF EXISTS public.entitlements'));
check(
  'entitlements source contract contains approval_scope values',
  /approval_scope:\s*['"]quotes_only['"]/.test(entitlements) && /approval_scope:\s*['"]none['"]/.test(entitlements)
);

console.log(`SUMMARY: ${passed} checks passed, 0 failed`);
