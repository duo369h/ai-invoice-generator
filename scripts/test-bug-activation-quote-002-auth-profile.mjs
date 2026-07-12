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
  /_profile_email: context\.user\.email/,
  'the server route must provide the authenticated email to the RPC'
);
assert.match(
  quotePostHandler,
  /_profile_name:/,
  'the server route must provide a profile name to the RPC'
);

console.log('BUG-ACTIVATION-QUOTE-002 auth-profile regression test passed.');
