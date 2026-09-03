import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import { createQuoteWithAtomicQuota, createInvoiceWithAtomicQuota } from '../src/app/lib/supabase.js';

const require = createRequire(import.meta.url);
const ts = require('typescript');
const entSource = fs.readFileSync('lib/entitlements.ts', 'utf8');
const entJs = ts.transpileModule(entSource, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;
const entModule = { exports: {} };
new Function('exports', 'require', 'module', '__filename', '__dirname', entJs)(
  entModule.exports,
  (specifier) => {
    if (specifier.includes('planStateAdapter')) return { shadowValidatePlanRead: () => {} };
    if (specifier.includes('decisionTelemetry')) return { recordDecisionTelemetry: () => {} };
    if (specifier.includes('documentQuota')) return { getCombinedDocumentLimit: (plan) => ({ free: 5, starter: 30, pro: 100 }[String(plan || 'free').toLowerCase()] ?? 5) };
    return {};
  },
  entModule,
  'lib/entitlements.ts',
  'lib',
);

const { getUserEntitlements, getCombinedDocumentLimit } = entModule.exports;
assert.equal(typeof getCombinedDocumentLimit, 'function', 'entitlements must expose the canonical combined limit helper');
const expectedLimits = { free: 5, starter: 30, pro: 100 };
for (const [plan, limit] of Object.entries(expectedLimits)) {
  const actualLimit = typeof getCombinedDocumentLimit === 'function' ? getCombinedDocumentLimit(plan) : undefined;
  assert.equal(actualLimit, limit, `${plan} must have the frozen combined limit`);
  assert.equal(getUserEntitlements(plan).combined_document_limit, limit, `${plan} entitlement must expose the frozen combined limit`);
  assert.equal(getUserEntitlements(plan).unlimited_invoices, false, `${plan} must not expose an unlimited compatibility claim`);
}

const serverHelper = fs.readFileSync('src/app/lib/supabase.js', 'utf8');
assert.match(serverHelper, /getCombinedDocumentLimit/, 'server quota helper must use the canonical plan limit definition');
assert.doesNotMatch(serverHelper, /normalizedPlan === "pro"[\s\S]{0,260}Infinity/, 'Pro server quota helper must not return Infinity');
assert.match(serverHelper, /documentsUsed: totalUsed/, 'Pro server quota helper must report actual combined usage');

const migrationNames = fs.readdirSync('supabase/migrations').filter((name) => name.includes('r56b2_pro_combined_document_quota_authority'));
assert.equal(migrationNames.length, 1, 'R56B2 must add exactly one forward-only quota migration');
const quotaMigration = fs.readFileSync(`supabase/migrations/${migrationNames[0]}`, 'utf8');
assert.match(quotaMigration, /v_plan = 'pro'[\s\S]{0,180}v_limit := 100/, 'R56B2 migration must set Pro to 100');
assert.doesNotMatch(quotaMigration, /v_plan IN \('pro', 'agency', 'studio'\)[\s\S]{0,180}RETURN QUERY SELECT NULL::TIMESTAMPTZ, NULL::TIMESTAMPTZ, NULL::INT/, 'R56B2 migration must not leave Pro unlimited');
const activeMigration = fs.readFileSync('supabase/migrations/20260821174436_pricing_quota_client_quote_foundation.sql', 'utf8');
assert.match(activeMigration, /pg_advisory_xact_lock\(hashtext\(p_user_id::text\)\)/, 'active atomic RPCs must retain advisory locking');
assert.match(activeMigration, /COUNT\(\*\) FROM public\.quotes[\s\S]{0,260}COUNT\(\*\) FROM public\.invoices/, 'active atomic RPCs must retain combined Quote plus Invoice counting');

const successfulRpc = { rpc: async () => ({ data: { id: 'doc-r56b2' }, error: null }) };
const quoteResult = await createQuoteWithAtomicQuota(successfulRpc, 'user-r56b2', 'pro', {});
const invoiceResult = await createInvoiceWithAtomicQuota(successfulRpc, 'user-r56b2', 'pro', {});
assert.equal(quoteResult.quota.documentsLimit, 100, 'Pro Quote creation metadata must expose 100');
assert.equal(invoiceResult.quota.documentsLimit, 100, 'Pro Invoice creation metadata must expose 100');

console.log('R56B2 Pro quota authority tests passed.');
