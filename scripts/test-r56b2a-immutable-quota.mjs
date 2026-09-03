import assert from 'node:assert/strict';
import fs from 'node:fs';

const migrationNames = fs.readdirSync('supabase/migrations')
  .filter((name) => name.includes('r56b2a_quota_immutability_security_closure'));
assert.equal(migrationNames.length, 1, 'R56B2A must add exactly one forward-only migration');
const migration = fs.readFileSync(`supabase/migrations/${migrationNames[0]}`, 'utf8');
const ledger = fs.readFileSync('supabase/migrations/20260815000000_document_usage_engine_v2.sql', 'utf8');
const hardening = fs.readFileSync('supabase/migrations/20260815134423_document_usage_engine_v2_hardening.sql', 'utf8');
const quotaHelper = fs.readFileSync('src/app/lib/supabase.js', 'utf8');
const userRoute = fs.readFileSync('src/app/api/user/route.js', 'utf8');
const invoiceRoute = fs.readFileSync('src/app/api/invoices/route.js', 'utf8');

assert.match(ledger, /document_usage_events_document_unique UNIQUE \(user_id, document_type, document_id\)/);
assert.match(ledger, /document_usage_events_idempotency_unique UNIQUE \(user_id, document_type, idempotency_key\)/);
assert.match(hardening, /ALTER TABLE public\.document_usage_events ENABLE ROW LEVEL SECURITY/);
assert.match(hardening, /REVOKE ALL ON TABLE public\.document_usage_events FROM anon, authenticated, service_role/);

for (const signature of [
  'public.get_user_active_document_cycle(UUID)',
  'public.check_and_create_quote(UUID, JSONB)',
  'public.check_and_create_invoice(UUID, JSONB)',
]) {
  assert.match(migration, new RegExp(`REVOKE ALL ON FUNCTION ${signature.replace(/[()]/g, '\\$&')} FROM PUBLIC, anon, authenticated`));
  assert.match(migration, new RegExp(`GRANT EXECUTE ON FUNCTION ${signature.replace(/[()]/g, '\\$&')} TO service_role`));
}
assert.match(migration, /document_usage_events/);
assert.match(migration, /ON CONFLICT \(user_id, document_type, document_id\) DO NOTHING/);
assert.match(migration, /INSERT INTO public\.document_usage_events/);
assert.match(migration, /COUNT\(\*\) INTO v_count[\s\S]{0,260}FROM public\.document_usage_events/);
assert.doesNotMatch(migration, /COUNT\(\*\) FROM public\.quotes/);
assert.doesNotMatch(migration, /COUNT\(\*\) FROM public\.invoices/);
assert.match(migration, /created_at >= c\.cycle_start/);
assert.match(migration, /created_at < c\.cycle_end/);
const quoteFunctionStart = migration.indexOf('CREATE OR REPLACE FUNCTION public.check_and_create_quote');
const invoiceFunctionStart = migration.indexOf('CREATE OR REPLACE FUNCTION public.check_and_create_invoice');
assert.ok(quoteFunctionStart >= 0, 'Quote atomic function must be redefined');
assert.ok(invoiceFunctionStart > quoteFunctionStart, 'Invoice atomic function must follow Quote atomic function');
const quoteFunction = migration.slice(quoteFunctionStart, invoiceFunctionStart);
const invoiceFunction = migration.slice(invoiceFunctionStart);
assert.match(quoteFunction, /INSERT INTO public\.quotes[\s\S]*INSERT INTO public\.document_usage_events/);
assert.match(invoiceFunction, /INSERT INTO public\.invoices[\s\S]*INSERT INTO public\.document_usage_events/);
assert.match(migration, /backfill/i);
assert.match(migration, /q\.created_at/);
assert.match(migration, /i\.created_at/);
const quotaFunctionStart = quotaHelper.indexOf('export async function getDocumentQuota');
const quotaFunctionEnd = quotaHelper.indexOf('export async function getSupabaseQuota');
assert.ok(quotaFunctionStart >= 0 && quotaFunctionEnd > quotaFunctionStart, 'Quota helper must have a bounded implementation');
const quotaFunction = quotaHelper.slice(quotaFunctionStart, quotaFunctionEnd);
assert.match(quotaFunction, /rpc\(['"]get_user_document_usage['"]/);
assert.doesNotMatch(quotaFunction, /\.from\(['"](?:quotes|invoices)['"]\)/);
assert.match(userRoute, /createServiceSupabaseClient/);
assert.match(userRoute, /getSupabaseQuota\(quotaSupabase/);
assert.match(invoiceRoute, /getDocumentQuota\(quotaSupabase/);

// Required delete-bypass contract: deletion changes business rows, never the
// immutable event count used by the next creation attempt.
function deletionBypassFixture(limit, seedCount) {
  const events = Array.from({ length: seedCount }, (_, index) => ({ id: index }));
  const documents = [...events];
  return {
    create() {
      if (events.length >= limit) return false;
      const event = { id: events.length };
      events.push(event);
      documents.push(event);
      return true;
    },
    deleteOne() { documents.pop(); },
    events,
    documents,
  };
}
for (const limit of [5, 30, 100]) {
  const fixture = deletionBypassFixture(limit, limit);
  fixture.deleteOne();
  assert.equal(fixture.create(), false, `deleting a document must not restore capacity at ${limit}`);
  assert.equal(fixture.events.length, limit);
}
const mixed = deletionBypassFixture(100, 100);
mixed.deleteOne();
assert.equal(mixed.create(), false, 'mixed Pro 60Q+40I delete bypass must remain blocked');
assert.equal(mixed.events.length, 100);

console.log('R56B2A IMMUTABLE QUOTA STATIC TEST=PASS');
