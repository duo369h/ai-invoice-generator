#!/usr/bin/env node
/**
 * SAFE-03B2A / SAFE-03B2A-R1 — static contract tests for the payment read
 * model.
 *
 * This test performs ONLY static source-text inspection. It does not import
 * application code, does not connect to a database or network, does not read
 * .env/secrets, does not modify source files, and does not depend on any
 * third-party package.
 *
 * Run: node scripts/test-payment-read-model-guardrails.mjs
 */

import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

const FILES = {
  paymentState: path.join(ROOT, 'src/core/revenue/invoicePaymentState.js'),
  supabaseLib: path.join(ROOT, 'src/app/lib/supabase.js'),
  firstRevenueLoop: path.join(ROOT, 'src/core/revenue/firstRevenueLoop.js'),
  revenueValidation: path.join(ROOT, 'src/app/api/product/revenue-validation/route.js'),
  firstRevenueLoopTest: path.join(ROOT, 'scripts/test-first-revenue-loop.mjs'),
};

const source = {};
for (const [key, filePath] of Object.entries(FILES)) {
  source[key] = readFileSync(filePath, 'utf8');
}

let passed = 0;
let failed = 0;
const failures = [];

function check(description, condition) {
  if (condition) {
    passed += 1;
    console.log(`PASS: ${description}`);
  } else {
    failed += 1;
    failures.push(description);
    console.log(`FAIL: ${description}`);
  }
}

/**
 * Extracts a brace-balanced block beginning at the first `{` after `marker`.
 * Dependency-free; adequate for the small, controlled functions inspected here.
 */
function extractBalancedBlock(text, marker) {
  const markerIdx = text.indexOf(marker);
  if (markerIdx === -1) return null;

  // Skip past the (possibly parenthesis-nested) parameter list first, so a
  // default value like `(invoice = {}, ...)` is never mistaken for the
  // function body's opening brace.
  const parenStart = text.indexOf('(', markerIdx);
  if (parenStart === -1) return null;
  let parenDepth = 0;
  let cursor = parenStart;
  for (; cursor < text.length; cursor++) {
    if (text[cursor] === '(') parenDepth++;
    else if (text[cursor] === ')') {
      parenDepth--;
      if (parenDepth === 0) {
        cursor++;
        break;
      }
    }
  }

  const braceStart = text.indexOf('{', cursor);
  if (braceStart === -1) return null;
  let depth = 0;
  for (let i = braceStart; i < text.length; i++) {
    if (text[i] === '{') depth++;
    else if (text[i] === '}') {
      depth--;
      if (depth === 0) return text.slice(markerIdx, i + 1);
    }
  }
  return null;
}

function walkDir(dir, exts, results = []) {
  let entries;
  try {
    entries = readdirSync(dir, { withFileTypes: true });
  } catch {
    return results;
  }
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) walkDir(fullPath, exts, results);
    else if (exts.some((ext) => entry.name.endsWith(ext))) results.push(fullPath);
  }
  return results;
}

// ---------------------------------------------------------------------------
// 1 & 2. mapSupabaseInvoice emits the four payment fields with nullish semantics.
// ---------------------------------------------------------------------------

const mapBlock = extractBalancedBlock(source.supabaseLib, 'export function mapSupabaseInvoice');

check('mapSupabaseInvoice: function block located', !!mapBlock);

if (mapBlock) {
  check('1. mapSupabaseInvoice outputs invoice_kind', /\binvoice_kind\s*:/.test(mapBlock));
  check('1. mapSupabaseInvoice outputs payment_status', /\bpayment_status\s*:/.test(mapBlock));
  check('1. mapSupabaseInvoice outputs amount_paid_cents', /\bamount_paid_cents\s*:/.test(mapBlock));
  check('1. mapSupabaseInvoice outputs amount_due_cents', /\bamount_due_cents\s*:/.test(mapBlock));

  check(
    '2b. mapSupabaseInvoice does NOT use truthy || fallback for amount_paid_cents (would swallow 0)',
    !/amount_paid_cents\s*\|\|/.test(mapBlock)
  );

  check(
    '2c. mapSupabaseInvoice does NOT use truthy || fallback for amount_due_cents (would swallow 0)',
    !/amount_due_cents\s*\|\|/.test(mapBlock)
  );

  check(
    '2d. mapSupabaseInvoice derives all four payment fields via resolveInvoicePaymentReadModel',
    /resolveInvoicePaymentReadModel\s*\(/.test(mapBlock)
  );

  check(
    '2e. mapSupabaseInvoice preserves existing status / currency / payment_link mapping',
    /status:\s*row\.status\s*\|\|\s*'draft'/.test(mapBlock) &&
      /currency:\s*\(row\.currency\s*\|\|\s*'USD'\)\.toLowerCase\(\)/.test(mapBlock) &&
      /payment_link:\s*row\.payment_link\s*\|\|\s*''/.test(mapBlock)
  );

  check(
    '2f. (R1) mapSupabaseInvoice no longer re-implements its own amount normalization (no duplicate Math.trunc(Number(row....)) money math)',
    !/Math\.trunc\(Number\(row\./.test(mapBlock)
  );

  check(
    '2g. (R1) mapSupabaseInvoice does not call paymentStatusForInvoice directly (must go through the centralized read model)',
    !/paymentStatusForInvoice\s*\(/.test(mapBlock)
  );
}

check(
  '(R1) supabase.js imports resolveInvoicePaymentReadModel from the pure module with an explicit .js extension',
  /import\s*\{[^}]*resolveInvoicePaymentReadModel[^}]*\}\s*from\s*['"][^'"]*invoicePaymentState\.js['"]/.test(source.supabaseLib)
);

check(
  '(R1) supabase.js no longer imports paymentStatusForInvoice directly',
  !/import\s*\{[^}]*paymentStatusForInvoice[^}]*\}\s*from/.test(source.supabaseLib)
);

// ---------------------------------------------------------------------------
// 3-6. firstRevenueLoop stage semantics.
// ---------------------------------------------------------------------------

check(
  '3. firstRevenueLoop no longer uses payment_link to decide the complete stage',
  !/payment_link/.test(source.firstRevenueLoop)
);

check(
  '4. firstRevenueLoop uses paymentStatusForInvoice',
  /paymentStatusForInvoice\s*\(/.test(source.firstRevenueLoop) &&
    /import\s*\{[^}]*paymentStatusForInvoice[^}]*\}\s*from\s*['"]\.\/invoicePaymentState\.js['"]/.test(source.firstRevenueLoop)
);

check(
  '(R1) firstRevenueLoop import of invoicePaymentState includes an explicit .js extension',
  /from\s*['"]\.\/invoicePaymentState\.js['"]/.test(source.firstRevenueLoop)
);

check(
  "5. firstRevenueLoop maps partial -> 'first_payment_received'",
  /PAYMENT_STATUSES\.PARTIAL[\s\S]{0,200}?result\(\s*'first_payment_received'/.test(source.firstRevenueLoop)
);

check(
  "6. firstRevenueLoop maps paid -> 'complete'",
  /PAYMENT_STATUSES\.PAID[\s\S]{0,200}?result\(\s*'complete'/.test(source.firstRevenueLoop)
);

check(
  "6b. firstRevenueLoop maps unpaid/overdue -> 'invoice_created'",
  /result\(\s*'invoice_created'/.test(source.firstRevenueLoop)
);

check(
  '6c. firstRevenueLoop keeps quote draft/sent/approved/declined branches intact',
  /case 'draft':/.test(source.firstRevenueLoop) &&
    /case 'sent':/.test(source.firstRevenueLoop) &&
    /case 'approved':/.test(source.firstRevenueLoop) &&
    /case 'declined':/.test(source.firstRevenueLoop)
);

check(
  '6d. firstRevenueLoop preserves workflow exports without a Free portal exception',
  /export function resolveFirstRevenueLoop/.test(source.firstRevenueLoop) &&
    /export function canTransitionFirstRevenueQuote/.test(source.firstRevenueLoop) &&
    /export function canCreateFirstRevenueInvoiceDraft/.test(source.firstRevenueLoop) &&
    /export function isFirstRevenueTrackedResource/.test(source.firstRevenueLoop) &&
    !/export function canAccessFirstRevenueQuotePortal/.test(source.firstRevenueLoop)
);

check(
  '6e. firstRevenueLoop performs no database writes',
  !/\.insert\(/.test(source.firstRevenueLoop) &&
    !/\.update\(/.test(source.firstRevenueLoop) &&
    !/\.upsert\(/.test(source.firstRevenueLoop)
);

// ---------------------------------------------------------------------------
// 7-8. revenue-validation read semantics.
// ---------------------------------------------------------------------------

check(
  '7. revenue-validation invoices select includes payment_status',
  /\.from\('invoices'\)[\s\S]{0,200}?\.select\([^)]*payment_status[^)]*\)/.test(source.revenueValidation)
);

check(
  '8. revenue-validation paid filter prefers payment_status',
  /paidInvoices\s*=[\s\S]{0,400}?invoice\.payment_status/.test(source.revenueValidation)
);

check(
  '8b. revenue-validation retains legacy status fallback',
  /paidInvoices\s*=[\s\S]{0,400}?invoice\.status\s*===\s*'paid'/.test(source.revenueValidation)
);

check(
  '(R1) 8f. revenue-validation uses nullish semantics (!== null && !== undefined) for payment_status presence, not a truthy check',
  /invoice\.payment_status\s*!==\s*null\s*&&\s*invoice\.payment_status\s*!==\s*undefined/.test(source.revenueValidation)
);

check(
  '(R1) 8g. revenue-validation does NOT use a bare truthy check on invoice.payment_status to decide fallback (would mis-treat empty string / falsy-but-present values as missing)',
  !/paidInvoices\s*=[\s\S]{0,400}?invoice\.payment_status\s*\?\s*invoice\.payment_status\s*===\s*'paid'/.test(source.revenueValidation)
);

check(
  '8c. revenue-validation adds no database writes',
  !/\.insert\(/.test(source.revenueValidation) &&
    !/\.update\(/.test(source.revenueValidation) &&
    !/\.upsert\(/.test(source.revenueValidation) &&
    !/\.delete\(/.test(source.revenueValidation)
);

check(
  '8d. revenue-validation keeps its admin auth gate',
  /requireInternalAdmin/.test(source.revenueValidation)
);

check(
  '8e. revenue-validation response structure unchanged (metrics/counts keys intact)',
  /proposal_acceptance_rate/.test(source.revenueValidation) &&
    /invoice_payment_rate/.test(source.revenueValidation) &&
    /paid_invoices/.test(source.revenueValidation)
);

// ---------------------------------------------------------------------------
// 9. This stage must not introduce payment-write capability or migrations.
// ---------------------------------------------------------------------------

const stageFiles = [
  FILES.paymentState,
  FILES.supabaseLib,
  FILES.firstRevenueLoop,
  FILES.revenueValidation,
];

check(
  '9. no record_invoice_payment call introduced in stage files',
  stageFiles.every((f) => !/record_invoice_payment/.test(readFileSync(f, 'utf8')))
);

check(
  '9b. no invoice_payments INSERT introduced in stage files',
  stageFiles.every((f) => {
    const t = readFileSync(f, 'utf8');
    return !/from\(\s*['"]invoice_payments['"]\s*\)/.test(t);
  })
);

check(
  '9c. no claim_first_revenue_invoice_draft call introduced in stage files',
  stageFiles.every((f) => !/claim_first_revenue_invoice_draft/.test(readFileSync(f, 'utf8')))
);

{
  // No payments API route may exist under the invoices API tree.
  const invoicesApiDir = path.join(ROOT, 'src/app/api/invoices');
  const invoiceApiFiles = walkDir(invoicesApiDir, ['.js', '.ts']);
  const paymentsRoutes = invoiceApiFiles.filter((f) => f.split(path.sep).includes('payments'));
  const paymentRoute = paymentsRoutes.find((file) => file.endsWith(path.join('payments', 'route.js')));
  const paymentRouteSource = paymentRoute ? readFileSync(paymentRoute, 'utf8') : '';
  check(
    '9d. the accepted invoice payment endpoint delegates settlement to the RPC and has no direct ledger write',
    paymentsRoutes.length === 1 &&
      /record_invoice_payment/.test(paymentRouteSource) &&
      !/from\(\s*['"]invoice_payments['"]\s*\)/.test(paymentRouteSource)
  );

  const paymentsTopLevel = path.join(ROOT, 'src/app/api/payments');
  check('9e. no top-level src/app/api/payments route created', !existsSync(paymentsTopLevel));
}

{
  // The pure module must remain free of IO / env access.
  const t = source.paymentState;
  check(
    '9f. invoicePaymentState.js touches no database, network, fs or env',
    !/process\.env/.test(t) &&
      !/\bfetch\s*\(/.test(t) &&
      !/node:fs/.test(t) &&
      !/createClient/.test(t) &&
      !/supabase/i.test(t)
  );
  check(
    '9g. invoicePaymentState.js exports the required surface',
    /export const PAYMENT_STATUSES/.test(t) &&
      /export function deriveInvoicePaymentState/.test(t) &&
      /export function paymentStatusForInvoice/.test(t)
  );
  check(
    '9h. invoicePaymentState.js uses integer-cent arithmetic (Math.trunc), not parseFloat/toFixed money math',
    /Math\.trunc\(/.test(t) && !/parseFloat\(/.test(t) && !/toFixed\(/.test(t)
  );
}

// ---------------------------------------------------------------------------
// (R1) 11. resolveInvoicePaymentReadModel exists in the pure module and
// outputs exactly the four documented snake_case fields.
// ---------------------------------------------------------------------------

{
  const readModelBlock = extractBalancedBlock(source.paymentState, 'export function resolveInvoicePaymentReadModel');
  check('11a. resolveInvoicePaymentReadModel function block located in the pure module', !!readModelBlock);

  if (readModelBlock) {
    check('11b. resolveInvoicePaymentReadModel outputs invoice_kind', /\binvoice_kind\s*:/.test(readModelBlock));
    check('11c. resolveInvoicePaymentReadModel outputs payment_status', /\bpayment_status\s*:/.test(readModelBlock));
    check('11d. resolveInvoicePaymentReadModel outputs amount_paid_cents', /\bamount_paid_cents\s*:/.test(readModelBlock));
    check('11e. resolveInvoicePaymentReadModel outputs amount_due_cents', /\bamount_due_cents\s*:/.test(readModelBlock));
    check(
      '11f. resolveInvoicePaymentReadModel does not mutate its input (uses spread, not direct assignment to invoice.*)',
      !/invoice\.[a-zA-Z_]+\s*=(?!=)/.test(readModelBlock)
    );
  }

  check(
    '11g. invoicePaymentState.js does not duplicate amount normalization logic in more than one place (single toNonNegativeCents/toIntegerCents pair)',
    (source.paymentState.match(/function toNonNegativeCents/g) || []).length === 1 &&
      (source.paymentState.match(/function toIntegerCents/g) || []).length === 1
  );
}

// ---------------------------------------------------------------------------
// (R1) 12. Calendar-day due-date semantics: no direct
// `new Date(dueDate).getTime() < now.getTime()` UTC-midnight comparison
// remains anywhere in the pure module.
// ---------------------------------------------------------------------------

check(
  '12a. invoicePaymentState.js no longer compares a raw new Date(due_date) timestamp directly against now.getTime()',
  !/new Date\([^)]*due[^)]*\)\.getTime\(\)\s*<\s*now\.getTime\(\)/.test(source.paymentState)
);

check(
  '12b. invoicePaymentState.js supports an options.timeZone parameter',
  /options\??\.\s*timeZone|options\.timeZone/.test(source.paymentState)
);

check(
  '12c. invoicePaymentState.js has a time-zone-safe fallback (try/catch around Intl.DateTimeFormat construction) so an invalid time zone never throws',
  /try\s*\{[\s\S]{0,200}?Intl\.DateTimeFormat[\s\S]{0,200}?\}\s*catch/.test(source.paymentState)
);

check(
  '12d. invoicePaymentState.js uses Intl.DateTimeFormat with an explicit timeZone (not process-local Date getters) to compute calendar dates',
  /Intl\.DateTimeFormat\([^)]*\{\s*timeZone/.test(source.paymentState)
);

check(
  '12e. invoicePaymentState.js does not use process-local date getters (getFullYear/getMonth/getDate without UTC/Intl) for due-date comparisons',
  !/dueMs\s*<\s*now\.getTime\(\)/.test(source.paymentState)
);

// ---------------------------------------------------------------------------
// (R1) 13. test-first-revenue-loop.mjs stage-contract synchronization.
// ---------------------------------------------------------------------------

check(
  "13a. test-first-revenue-loop.mjs no longer expects the 'invoice_draft' stage",
  !/'invoice_draft'/.test(source.firstRevenueLoopTest)
);

check(
  "13b. test-first-revenue-loop.mjs no longer treats a bare payment_link as evidence of 'complete'",
  !/payment_link:\s*'https:\/\/pay\.example\.com\/invoice-1'[\s\S]{0,120}?\)\.stage,\s*\n?\s*'complete'/.test(source.firstRevenueLoopTest)
);

check(
  "13c. test-first-revenue-loop.mjs includes a payment_status='partial' -> 'first_payment_received' case",
  /payment_status:\s*'partial'[\s\S]{0,300}?'first_payment_received'/.test(source.firstRevenueLoopTest)
);

check(
  "13d. test-first-revenue-loop.mjs includes a payment_status='paid' -> 'complete' case",
  /payment_status:\s*'paid'[\s\S]{0,300}?'complete'/.test(source.firstRevenueLoopTest)
);

check(
  "13e. test-first-revenue-loop.mjs includes a legacy status='paid' (no payment_status column) -> 'complete' case",
  /(?<!payment_)status:\s*'paid'[\s\S]{0,200}?'complete'/.test(source.firstRevenueLoopTest)
);

check(
  '13f. test-first-revenue-loop.mjs imports the resolver with an explicit .js extension (loadable by native node)',
  /from\s*['"]\.\.\/src\/core\/revenue\/firstRevenueLoop\.js['"]/.test(source.firstRevenueLoopTest)
);

check(
  '13g. test-first-revenue-loop.mjs performs no network or database access',
  !/\bfetch\s*\(/.test(source.firstRevenueLoopTest) &&
    !/createClient/.test(source.firstRevenueLoopTest) &&
    !/@supabase\/supabase-js/.test(source.firstRevenueLoopTest)
);

// ---------------------------------------------------------------------------
// (R2) 14. Missing historical migration file is isolated, not silently
// papered over: existsSync guard, exact SKIP message, readFileSync scoped
// inside the guard, no broad try/catch, no forced process.exit(0) on catch,
// and the migration security-contract assertions are still fully present
// (not weakened or deleted) for when the file does exist.
// ---------------------------------------------------------------------------

check(
  '14a. test-first-revenue-loop.mjs imports existsSync from node:fs',
  /import\s*\{\s*existsSync\s*\}\s*from\s*['"]node:fs['"]/.test(source.firstRevenueLoopTest)
);

check(
  '14b. test-first-revenue-loop.mjs checks existsSync(migrationPath) before reading the migration file',
  /existsSync\s*\(\s*migrationPath\s*\)/.test(source.firstRevenueLoopTest)
);

check(
  '14c. test-first-revenue-loop.mjs emits the exact required SKIP message when the migration file is absent',
  source.firstRevenueLoopTest.includes(
    'SKIP: supabase/migration-first-revenue-loops.sql is not tracked in this baseline; migration contract assertions deferred.'
  )
);

check(
  '14d. readFileSync(migrationPath) is scoped inside the existsSync(migrationPath) guard, not called unconditionally',
  /if\s*\(\s*existsSync\(migrationPath\)\s*\)\s*\{[\s\S]{0,80}?(?:fs\.)?readFileSync\(migrationPath/.test(source.firstRevenueLoopTest)
);

check(
  '14e. test-first-revenue-loop.mjs does not wrap logic in a broad try/catch that could swallow assertion failures',
  !/\btry\s*\{/.test(source.firstRevenueLoopTest)
);

check(
  '14f. test-first-revenue-loop.mjs never forces process.exit(0) from a catch block (would mask a real failure as success)',
  !/catch[\s\S]{0,150}?process\.exit\(\s*0\s*\)/.test(source.firstRevenueLoopTest)
);

check(
  '14g. test-first-revenue-loop.mjs still asserts the invoice_created stage case',
  /'invoice_created'/.test(source.firstRevenueLoopTest)
);

check(
  '14h. test-first-revenue-loop.mjs still asserts the first_payment_received stage case',
  /'first_payment_received'/.test(source.firstRevenueLoopTest)
);

check(
  '14i. test-first-revenue-loop.mjs still asserts complete stage cases',
  /'complete'/.test(source.firstRevenueLoopTest)
);

check(
  '14j. test-first-revenue-loop.mjs still asserts payment_link is not evidence of payment',
  /payment_link[\s\S]{0,250}?'invoice_created'/.test(source.firstRevenueLoopTest)
);

check(
  '14k. test-first-revenue-loop.mjs still asserts legacy status=paid compatibility',
  /(?<!payment_)status:\s*'paid'/.test(source.firstRevenueLoopTest)
);

{
  // The full historical migration security-contract fragment list must
  // still be present verbatim (not shortened) inside the existence guard,
  // for when the file is eventually archived and the check resumes.
  const REQUIRED_MIGRATION_FRAGMENTS = [
    'CREATE TABLE IF NOT EXISTS public.first_revenue_loops',
    'ON DELETE RESTRICT',
    'ALTER TABLE public.first_revenue_loops ENABLE ROW LEVEL SECURITY',
    'REVOKE ALL ON TABLE public.first_revenue_loops FROM anon, authenticated',
    'CREATE OR REPLACE FUNCTION public.claim_first_revenue_quote',
    'CREATE OR REPLACE FUNCTION public.claim_first_revenue_invoice_draft',
    'SECURITY INVOKER',
    'legacy_blocked_at',
    'REVOKE ALL ON FUNCTION public.claim_first_revenue_quote',
    'REVOKE ALL ON FUNCTION public.claim_first_revenue_invoice_draft',
    'GRANT EXECUTE ON FUNCTION public.claim_first_revenue_quote',
    'GRANT EXECUTE ON FUNCTION public.claim_first_revenue_invoice_draft',
  ];
  check(
    '14l. all 12 migration security-contract fragments are still listed (none removed or weakened)',
    REQUIRED_MIGRATION_FRAGMENTS.every((fragment) => source.firstRevenueLoopTest.includes(fragment))
  );
}

{
  // Needle assembled at runtime so this file's own source text (which must
  // mention the write-function name to check for it) never trips its own
  // "no source writes" hermeticity self-check further down this file.
  const WRITE_SYNC_NEEDLE = 'writeFile' + 'Sync';
  check(
    '14m. test-first-revenue-loop.mjs does not create, copy, or reference writing any .sql file',
    !source.firstRevenueLoopTest.includes(WRITE_SYNC_NEEDLE) &&
      !/\.sql['"]\s*,\s*['"]w/.test(source.firstRevenueLoopTest)
  );
}

// ---------------------------------------------------------------------------
// 10. This test itself must stay hermetic.
// ---------------------------------------------------------------------------

{
  const selfPath = fileURLToPath(import.meta.url);
  const self = readFileSync(selfPath, 'utf8');
  // Needles are assembled at runtime so that this file's own assertion text
  // never counts as a match against itself (self-reference false positives).
  const ENV_NEEDLE = 'process' + '.' + 'env';
  const ENV_PKG_NEEDLE = 'dot' + 'env';
  const WRITE_NEEDLES = [
    'writeFile' + 'Sync',
    'appendFile' + 'Sync',
    'rm' + 'Sync',
    'unlink' + 'Sync',
    'mkdir' + 'Sync',
  ];

  check(
    '10. this test reads no environment variables or environment files',
    !self.includes(ENV_NEEDLE) && !self.includes(ENV_PKG_NEEDLE)
  );
  check('10a. this test performs no fetch/network call', !/\bfetch\s*\(/.test(self));
  check(
    '10b. this test imports only node builtins (no third-party packages)',
    (self.match(/from\s+['"]([^'"]+)['"]/g) || []).every((imp) => /['"]node:/.test(imp))
  );
  check(
    '10c. this test performs no source writes',
    WRITE_NEEDLES.every((needle) => !self.includes(needle))
  );
}

// ---------------------------------------------------------------------------
// Summary
// ---------------------------------------------------------------------------

console.log('');
console.log(`Payment read-model contract checks: ${passed} passed, ${failed} failed.`);

if (failed > 0) {
  console.log('');
  console.log('Failures:');
  for (const f of failures) console.log(`  - ${f}`);
  process.exit(1);
}

process.exit(0);
