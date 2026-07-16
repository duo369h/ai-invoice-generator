import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const migrationPath = path.join(root, 'supabase/migration-bug-activation-quote-002-auth-profile.sql');
const quoteRoutePath = path.join(root, 'src/app/api/quotes/route.js');

assert.ok(
  fs.existsSync(migrationPath),
  'the auth-profile RPC correction migration must exist'
);

const migration = fs.readFileSync(migrationPath, 'utf8');
assert.match(
  migration,
  /CREATE OR REPLACE FUNCTION public\.create_first_revenue_quote/,
  'the RPC signature remains the single Free quote authority'
);
assert.doesNotMatch(
  migration,
  /FROM auth\.users/,
  'SECURITY INVOKER RPC must not require service_role SELECT access to auth.users'
);
assert.match(
  migration,
  /p_quote->>'_profile_email'/,
  'the RPC must create its profile from server-provided identity data'
);
assert.match(
  migration,
  /ON CONFLICT \(id\) DO NOTHING/,
  'profile initialization remains idempotent and atomic'
);
assert.match(
  migration,
  /GRANT EXECUTE ON FUNCTION public\.create_first_revenue_quote\(UUID, JSONB\)\s+TO service_role/,
  'RPC access remains service-role-only'
);

const quotePostHandler = fs.readFileSync(quoteRoutePath, 'utf8').split('export async function PATCH')[0];
assert.match(
  quotePostHandler,
  /const quotesTablePayload = \{[\s\S]*?user_id:[\s\S]*?updated_at:/,
  'the route must define a table-only Quote payload'
);
assert.match(
  quotePostHandler,
  /const firstRevenueRpcPayload = \{[\s\S]*?\.\.\.quotesTablePayload,[\s\S]*?_profile_email: context\.user\.email[\s\S]*?_profile_name: profileName/,
  'only the Free first-revenue RPC payload may add authenticated profile metadata'
);
assert.match(
  quotePostHandler,
  /\.update\(quotesTablePayload\)\s*\.eq\('id', id\)\s*\.eq\('user_id', context\.user\.id\)/,
  'Quote edits must update only table columns and use id solely as a filter'
);
assert.match(
  quotePostHandler,
  /\.insert\(quotesTablePayload\)/,
  'non-Free Quote creation must insert only table columns'
);
assert.match(
  quotePostHandler,
  /p_quote: firstRevenueRpcPayload/,
  'the Free first-revenue RPC must receive the metadata-bearing payload'
);
assert.match(
  quotePostHandler,
  /else if \(plan === 'free'\) \{[\s\S]*?create_first_revenue_quote[\s\S]*?p_quote: firstRevenueRpcPayload,[\s\S]*?\} else \{[\s\S]*?\.insert\(quotesTablePayload\)/,
  'the Free first-revenue RPC branch must remain separate from the non-Free table insert branch'
);

const tablePayloadMatch = quotePostHandler.match(/const quotesTablePayload = \{([\s\S]*?)\n\s*\};/);
assert.ok(tablePayloadMatch, 'the table payload must be inspectable as its own object');
assert.doesNotMatch(
  tablePayloadMatch[1],
  /(?:^|\n)\s*(?:id|_profile_email|_profile_name)\s*:/m,
  'the table payload must not contain id or RPC-only profile metadata'
);

console.log('BUG-ACTIVATION-QUOTE-002 auth-profile regression test passed.');
