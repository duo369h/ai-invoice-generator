import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const migrationPath = path.join(root, 'supabase/migration-bug-activation-quote-002.sql');
const quoteRoutePath = path.join(root, 'src/app/api/quotes/route.js');

assert.ok(
  fs.existsSync(migrationPath),
  'BUG-ACTIVATION-QUOTE-002 must ship an RPC-only runtime migration'
);

const migration = fs.readFileSync(migrationPath, 'utf8');
assert.match(
  migration,
  /CREATE OR REPLACE FUNCTION public\.create_first_revenue_quote/,
  'the free first-quote RPC remains the single write authority'
);
assert.match(
  migration,
  /INSERT INTO public\.profiles[\s\S]*FROM auth\.users[\s\S]*ON CONFLICT \(id\) DO NOTHING/,
  'the RPC must establish its profile prerequisite in the same transaction'
);
assert.match(
  migration,
  /INSERT INTO public\.first_revenue_loops[\s\S]*ON CONFLICT \(user_id\) DO NOTHING[\s\S]*FOR UPDATE/,
  'the RPC must atomically initialize and lock the first revenue loop'
);
assert.doesNotMatch(
  migration,
  /COALESCE\(\(p_quote->>'(?:subtotal|discount_amount|tax_amount|total)'\)::INTEGER, 0\)/,
  'malformed JSONB numeric strings must not be cast directly'
);
assert.ok(
  migration.includes("CASE WHEN COALESCE(p_quote->>'subtotal', '') ~ '^[+-]?[0-9]+$'"),
  'JSONB integer values must be validated before casting'
);
assert.ok(
  migration.includes("CASE WHEN COALESCE(p_quote->>'discount_rate', '') ~ '^[+-]?([0-9]+([.][0-9]*)?|[.][0-9]+)$'"),
  'JSONB decimal values must be validated before casting'
);
assert.match(
  migration,
  /GRANT EXECUTE ON FUNCTION public\.create_first_revenue_quote\(UUID, JSONB\)\s+TO service_role/,
  'RPC access remains restricted to the service role'
);

const quotePostHandler = fs.readFileSync(quoteRoutePath, 'utf8').split('export async function PATCH')[0];
assert.doesNotMatch(
  quotePostHandler,
  /ensureProfile\(context\.supabase, context\.user\)/,
  'the Free quote path must not depend on a request-scoped profile write before the RPC'
);
assert.match(
  quotePostHandler,
  /serviceSupabase\s*\.from\('profiles'\)/,
  'the route must read an existing plan without creating the RPC prerequisite itself'
);

console.log('BUG-ACTIVATION-QUOTE-002 RPC contract test passed.');
