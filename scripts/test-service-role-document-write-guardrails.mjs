/**
 * SAFE-03SEC-B1 — Service-role document write boundary guardrails.
 *
 * This is a SOURCE-CODE write-boundary guard, not a database permission test.
 * It asserts nothing about production grants, RLS, or policies. It only reads
 * the text of the two route files and checks that the four document writes
 * identified by SAFE-03SEC-A run as service_role while still being gated on a
 * verified session and filtered by the owner's user_id.
 *
 * Hermetic by construction: reads source files only. No database connection, no
 * environment file, no network request, no third-party package.
 */

import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), 'utf8');

const INVOICES_ROUTE = 'src/app/api/invoices/route.js';
const QUOTES_ROUTE = 'src/app/api/quotes/route.js';

const invoicesRoute = read(INVOICES_ROUTE);
const quotesRoute = read(QUOTES_ROUTE);

let passed = 0;
let failed = 0;

function check(label, condition) {
  if (condition) {
    passed += 1;
    console.log(`PASS: ${label}`);
  } else {
    failed += 1;
    console.error(`FAIL: ${label}`);
  }
}

/**
 * Extracts the body of a named exported handler (GET/POST/PATCH/DELETE) by
 * brace matching, so assertions can be scoped to one handler instead of
 * accidentally matching a sibling handler elsewhere in the file.
 */
function extractHandler(source, handlerName) {
  const marker = `export async function ${handlerName}(`;
  const markerIndex = source.indexOf(marker);
  if (markerIndex === -1) return '';

  // Skip past the balanced parameter list before looking for the body brace,
  // so a default value such as `(request = {})` cannot be mistaken for it.
  let cursor = markerIndex + marker.length - 1;
  let parenDepth = 0;
  for (; cursor < source.length; cursor += 1) {
    if (source[cursor] === '(') parenDepth += 1;
    else if (source[cursor] === ')') {
      parenDepth -= 1;
      if (parenDepth === 0) { cursor += 1; break; }
    }
  }

  const bodyStart = source.indexOf('{', cursor);
  if (bodyStart === -1) return '';

  let braceDepth = 0;
  for (let i = bodyStart; i < source.length; i += 1) {
    if (source[i] === '{') braceDepth += 1;
    else if (source[i] === '}') {
      braceDepth -= 1;
      if (braceDepth === 0) return source.slice(bodyStart, i + 1);
    }
  }
  return '';
}

/**
 * Returns the chained call expression that begins at a `.from('<table>')` whose
 * chain contains `verb`. Used to assert that a specific mutation carries both
 * the id and the owner filter, rather than merely that the strings coexist
 * somewhere in the same handler.
 */
function extractMutationChain(handlerSource, table, verb) {
  const fromNeedle = `.from('${table}')`;
  let searchFrom = 0;
  for (;;) {
    const fromIndex = handlerSource.indexOf(fromNeedle, searchFrom);
    if (fromIndex === -1) return '';
    // A statement ends at the first `;` after the chain starts.
    const end = handlerSource.indexOf(';', fromIndex);
    const chain = handlerSource.slice(fromIndex, end === -1 ? handlerSource.length : end);
    if (chain.includes(verb)) return chain;
    searchFrom = fromIndex + fromNeedle.length;
  }
}

const invoicesPost = extractHandler(invoicesRoute, 'POST');
const invoicesPatch = extractHandler(invoicesRoute, 'PATCH');
const invoicesDelete = extractHandler(invoicesRoute, 'DELETE');
const invoicesGet = extractHandler(invoicesRoute, 'GET');
const quotesDelete = extractHandler(quotesRoute, 'DELETE');

check('handler extraction: invoices POST located', invoicesPost.length > 0);
check('handler extraction: invoices PATCH located', invoicesPatch.length > 0);
check('handler extraction: invoices DELETE located', invoicesDelete.length > 0);
check('handler extraction: invoices GET located', invoicesGet.length > 0);
check('handler extraction: quotes DELETE located', quotesDelete.length > 0);

// ---------------------------------------------------------------------------
// 1. The three invoice writes use a service-role client
// ---------------------------------------------------------------------------
const invoiceInsertChain = extractMutationChain(invoicesPost, 'invoices', '.insert(');
const invoiceUpdateChain = extractMutationChain(invoicesPatch, 'invoices', '.update(');
const invoiceDeleteChain = extractMutationChain(invoicesDelete, 'invoices', '.delete()');

check(
  '1a. invoices POST creates a service-role client',
  invoicesPost.includes('createServiceSupabaseClient()')
);
check(
  '1b. invoices POST INSERT is issued on serviceSupabase (not context.supabase)',
  /await serviceSupabase\s*\n?\s*\.from\('invoices'\)\s*\n?\s*\.insert\(/.test(invoicesPost)
);
check(
  '1c. invoices PATCH creates a service-role client',
  invoicesPatch.includes('createServiceSupabaseClient()')
);
check(
  '1d. invoices PATCH UPDATE is issued on serviceSupabase (not context.supabase)',
  /await serviceSupabase\s*\n?\s*\.from\('invoices'\)\s*\n?\s*\.update\(/.test(invoicesPatch)
);
check(
  '1e. invoices DELETE creates a service-role client',
  invoicesDelete.includes('createServiceSupabaseClient()')
);
check(
  '1f. invoices DELETE is issued on serviceSupabase (not context.supabase)',
  /await serviceSupabase\s*\n?\s*\.from\('invoices'\)\s*\n?\s*\.delete\(\)/.test(invoicesDelete)
);
check(
  '1g. invoices route imports createServiceSupabaseClient from the server helper',
  /import\s*\{[^}]*createServiceSupabaseClient[^}]*\}\s*from\s*'\.\.\/\.\.\/lib\/supabase'/s.test(invoicesRoute)
);

// ---------------------------------------------------------------------------
// 2. The quote DELETE uses a service-role client
// ---------------------------------------------------------------------------
check(
  '2a. quotes DELETE creates a service-role client',
  quotesDelete.includes('createServiceSupabaseClient()')
);
check(
  '2b. quotes DELETE is issued on serviceSupabase (not context.supabase)',
  /await serviceSupabase\s*\n?\s*\.from\('quotes'\)\s*\n?\s*\.delete\(\)/.test(quotesDelete)
);
check(
  '2c. quotes route imports createServiceSupabaseClient from the server helper',
  /import\s*\{[^}]*createServiceSupabaseClient[^}]*\}\s*from\s*'\.\.\/\.\.\/lib\/supabase'/s.test(quotesRoute)
);

// ---------------------------------------------------------------------------
// 3. User authentication still precedes each of the four writes
// ---------------------------------------------------------------------------
for (const [label, handler] of [
  ['invoices POST', invoicesPost],
  ['invoices PATCH', invoicesPatch],
  ['invoices DELETE', invoicesDelete],
  ['quotes DELETE', quotesDelete],
]) {
  const authIndex = handler.indexOf('await getRequestUser(request)');
  const guardIndex = handler.indexOf('requestContextResponse(context');
  const serviceIndex = handler.indexOf('createServiceSupabaseClient()');
  check(
    `3. ${label}: getRequestUser + requestContextResponse both run before the service-role client is created`,
    authIndex !== -1 && guardIndex !== -1 && serviceIndex !== -1
      && authIndex < guardIndex && guardIndex < serviceIndex
  );
}

// ---------------------------------------------------------------------------
// 4-5. invoice INSERT owner comes from the verified session, never the body
// ---------------------------------------------------------------------------
check(
  '4. invoice INSERT payload sets user_id from the verified context.user.id',
  /const payload = \{\s*\n\s*user_id: context\.user\.id,/.test(invoicesPost)
);
check(
  '5a. invoice INSERT payload does not assign user_id from a request-body value',
  !/user_id:\s*(body|payload|req|request|data)\b/.test(invoicesPost)
);
check(
  '5b. invoices POST does not destructure user_id out of the request body',
  !/const\s*\{[^}]*\buser_id\b[^}]*\}\s*=\s*body/s.test(invoicesPost)
);

// ---------------------------------------------------------------------------
// 6-8. Every service-role mutation carries BOTH the id and the owner filter.
//      Asserted on the extracted chain, so deleting the owner filter fails
//      even though the string still appears elsewhere in the handler.
// ---------------------------------------------------------------------------
check(
  '6a. invoice UPDATE chain filters on the invoice id',
  invoiceUpdateChain.includes(".eq('id', id)")
);
check(
  '6b. invoice UPDATE chain filters on the owner user_id',
  invoiceUpdateChain.includes(".eq('user_id', context.user.id)")
);
check(
  '7a. invoice DELETE chain filters on the invoice id',
  invoiceDeleteChain.includes(".eq('id', id)")
);
check(
  '7b. invoice DELETE chain filters on the owner user_id',
  invoiceDeleteChain.includes(".eq('user_id', context.user.id)")
);
const quoteDeleteChain = extractMutationChain(quotesDelete, 'quotes', '.delete()');
check(
  '8a. quote DELETE chain filters on the quote id',
  quoteDeleteChain.includes(".eq('id', id)")
);
check(
  '8b. quote DELETE chain filters on the owner user_id',
  quoteDeleteChain.includes(".eq('user_id', context.user.id)")
);
check(
  '8c. invoice INSERT chain does not carry a user_id equality filter (ownership is in the payload)',
  invoiceInsertChain.length > 0 && !invoiceInsertChain.includes(".eq('user_id'")
);

// ---------------------------------------------------------------------------
// 9. UPDATE / DELETE verify the rows actually affected
// ---------------------------------------------------------------------------
check(
  '9a. invoice UPDATE returns 404 when no row matched (not a false success)',
  /if \(error \|\| !data\) \{[\s\S]{0,160}?Invoice not found[\s\S]{0,80}?status: 404/.test(invoicesPatch)
);
check(
  '9b. invoice DELETE checks the deleted row before reporting success',
  /if \(!deletedInvoice\) \{[\s\S]{0,160}?Invoice not found[\s\S]{0,80}?status: 404/.test(invoicesDelete)
);
check(
  '9c. quote DELETE checks the deleted row before reporting success',
  /if \(!deletedQuote\) \{[\s\S]{0,160}?Quote not found[\s\S]{0,80}?status: 404/.test(quotesDelete)
);
check(
  '9d. invoice DELETE selects the id back so the affected row is observable',
  invoiceDeleteChain.includes(".select('id')") && invoiceDeleteChain.includes('.maybeSingle()')
);
check(
  '9e. quote DELETE selects the id back so the affected row is observable',
  quoteDeleteChain.includes(".select('id')") && quoteDeleteChain.includes('.maybeSingle()')
);
check(
  '9f. not-found responses are identical for missing and other-owner rows (no existence disclosure)',
  invoicesPatch.includes("'Invoice not found'")
    && invoicesDelete.includes("'Invoice not found'")
    && quotesDelete.includes("'Quote not found'")
);

// ---------------------------------------------------------------------------
// 10-11. Payment-state guards preserved; payment columns still unwritable
// ---------------------------------------------------------------------------
check(
  '10a. invoices PATCH still rejects status=paid',
  /if \(status === 'paid'\)/.test(invoicesPatch)
);
check(
  '10b. invoices PATCH still returns PAID_STATUS_REQUIRES_PAYMENT_RECORD',
  invoicesPatch.includes('PAID_STATUS_REQUIRES_PAYMENT_RECORD')
);
check(
  '10c. the paid guard runs before the invoice UPDATE reaches the database',
  invoicesPatch.indexOf('PAID_STATUS_REQUIRES_PAYMENT_RECORD') < invoicesPatch.indexOf(".update({ status })")
);
check(
  '10d. invoices PATCH destructures only id and status from the body',
  /const \{ id, status \} = body;/.test(invoicesPatch)
);
check(
  '10e. invoices PATCH updates only the status column',
  invoiceUpdateChain.includes('.update({ status })')
);

for (const column of ['payment_status', 'amount_paid_cents', 'amount_due_cents']) {
  check(
    `11a. invoices PATCH never references ${column}`,
    !invoicesPatch.includes(column)
  );
  check(
    `11b. invoices POST never assigns ${column} anywhere in the insert payload`,
    !new RegExp(`${column}\\s*:`).test(invoicesPost)
  );
}
check(
  '11c. invoices POST does not destructure any payment column from the request body',
  !/const\s*\{[^}]*\b(payment_status|amount_paid_cents|amount_due_cents)\b[^}]*\}\s*=\s*body/s.test(invoicesPost)
);

// ---------------------------------------------------------------------------
// 12-13. No authenticated-client DML on these tables; reads still allowed
// ---------------------------------------------------------------------------
const AUTHED_WRITE_RE =
  /context\.supabase\s*\n?\s*\.from\('(quotes|invoices)'\)\s*\n?\s*\.(insert|update|upsert|delete)\(/;
check(
  '12a. invoices route: no context.supabase INSERT/UPDATE/UPSERT/DELETE on quotes or invoices',
  !AUTHED_WRITE_RE.test(invoicesRoute)
);
check(
  '12b. quotes route: no context.supabase INSERT/UPDATE/UPSERT/DELETE on quotes or invoices',
  !AUTHED_WRITE_RE.test(quotesRoute)
);
check(
  '13a. invoices GET still reads via the authenticated client (reads are unchanged)',
  /context\.supabase\s*\n?\s*\.from\('invoices'\)\s*\n?\s*\.select\(/.test(invoicesGet)
);
check(
  '13b. invoices GET issues no service-role client (reads were not migrated)',
  !invoicesGet.includes('createServiceSupabaseClient()')
);

// ---------------------------------------------------------------------------
// 14. The service-role helper is not reachable from client components
// ---------------------------------------------------------------------------
function collectFiles(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name === '.next' || entry.name === '.git') continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) collectFiles(full, out);
    else if (/\.(js|jsx|ts|tsx)$/.test(entry.name)) out.push(full);
  }
  return out;
}

const sourceFiles = collectFiles(path.join(root, 'src'));
const clientComponentsImportingServiceHelper = sourceFiles.filter((file) => {
  const text = fs.readFileSync(file, 'utf8');
  const isClientComponent = /^\s*['"]use client['"]/.test(text);
  return isClientComponent && text.includes('createServiceSupabaseClient');
});
check(
  '14a. no \'use client\' component imports or references createServiceSupabaseClient',
  clientComponentsImportingServiceHelper.length === 0
);
check(
  '14b. neither migrated route is a client component',
  !/^\s*['"]use client['"]/.test(invoicesRoute) && !/^\s*['"]use client['"]/.test(quotesRoute)
);
// The security property is that the service-role key never reaches the browser,
// not that its name appears in exactly one module. Server-only files may
// legitimately reference it, so this is scoped to client components.
const clientComponentsReferencingServiceKey = sourceFiles.filter((file) => {
  const text = fs.readFileSync(file, 'utf8');
  return /^\s*['"]use client['"]/.test(text) && text.includes('SUPABASE_SERVICE_ROLE_KEY');
});
check(
  '14c. no \'use client\' component references the service-role key',
  clientComponentsReferencingServiceKey.length === 0
);
check(
  '14d. neither migrated route references the service-role key directly (it goes through the helper)',
  !invoicesRoute.includes('SUPABASE_SERVICE_ROLE_KEY') && !quotesRoute.includes('SUPABASE_SERVICE_ROLE_KEY')
);

// ---------------------------------------------------------------------------
// 15. Negative control: removing any owner filter must fail this suite.
//     Proven by mutating an in-memory copy and re-running the same assertion.
// ---------------------------------------------------------------------------
const ownerFilter = ".eq('user_id', context.user.id)";
for (const [label, chain] of [
  ['invoice UPDATE', invoiceUpdateChain],
  ['invoice DELETE', invoiceDeleteChain],
  ['quote DELETE', quoteDeleteChain],
]) {
  const withoutOwnerFilter = chain.split(ownerFilter).join('');
  check(
    `15. negative control: ${label} assertion fails when the owner filter is removed`,
    chain.includes(ownerFilter) && !withoutOwnerFilter.includes(ownerFilter)
  );
}

// ---------------------------------------------------------------------------
// Hermeticity self-check
// ---------------------------------------------------------------------------
// Needles are assembled at runtime so that this self-scan does not match the
// very expressions performing the scan.
const selfSource = read('scripts/test-service-role-document-write-guardrails.mjs');
const WRITE_SYNC_NEEDLE = 'writeFile' + 'Sync';
const FETCH_NEEDLE = 'fet' + 'ch(';
const HTTP_NEEDLE = 'node:' + 'http';
const CREATE_CLIENT_NEEDLE = 'create' + 'Client(';
const SUPABASE_PKG_NEEDLE = '@supabase/' + 'supabase-js';
const ENV_NEEDLE = 'process.' + 'env';
check(
  'hermetic: this guard performs no source writes',
  !selfSource.includes(WRITE_SYNC_NEEDLE)
);
check(
  'hermetic: this guard performs no network call',
  !selfSource.includes(FETCH_NEEDLE) && !selfSource.includes(HTTP_NEEDLE)
);
check(
  'hermetic: this guard creates no database client',
  !selfSource.includes(CREATE_CLIENT_NEEDLE) && !selfSource.includes(SUPABASE_PKG_NEEDLE)
);
check(
  'hermetic: this guard reads no environment variable',
  !selfSource.includes(ENV_NEEDLE)
);
check(
  'hermetic: this guard imports only node builtins',
  [...selfSource.matchAll(/from\s+'([^']+)'/g)].every(([, spec]) => spec.startsWith('node:'))
);

console.log(`\nService-role document write guardrails: ${passed} passed, ${failed} failed.`);
assert.equal(failed, 0, `${failed} service-role document write guardrail check(s) failed`);
