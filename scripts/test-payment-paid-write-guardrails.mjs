#!/usr/bin/env node
/**
 * SAFE-03B1 P0 Guardrail — static verification.
 *
 * This test performs ONLY static source-text inspection of the files touched
 * by SAFE-03B1. It does not import application code, does not connect to a
 * database or network, does not read .env/secrets, does not modify source
 * files, and does not depend on any third-party package.
 *
 * Run: node scripts/test-payment-paid-write-guardrails.mjs
 */

import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

const FILES = {
  portalToken: path.join(ROOT, 'src/app/api/portal/token/[token]/route.js'),
  portalDoc: path.join(ROOT, 'src/app/api/portal/doc/[id]/route.js'),
  portalClientView: path.join(ROOT, 'src/app/components/PortalClientView.js'),
  invoicesRoute: path.join(ROOT, 'src/app/api/invoices/route.js'),
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
 * Extracts the invoice `action === 'pay'` handling block from a portal route
 * source string, so we can assert on its contents specifically rather than
 * the whole file (avoids false positives/negatives from unrelated code).
 * This is a legacy fixed-window extractor, kept for backward-compatible
 * coverage. See extractBalancedBlock() below for the hardened replacement.
 */
function extractPayBlock(text) {
  const marker = "if (action === 'pay')";
  const idx = text.indexOf(marker);
  if (idx === -1) return '';
  // Grab a generous window after the marker (the block is short in both files).
  return text.slice(idx, idx + 1200);
}

/**
 * Extracts a full brace-balanced block starting at the first `{` found after
 * `marker`. Dependency-free (no third-party parser). This does not attempt
 * to handle braces embedded inside string/template literals or comments —
 * it is a simplified scanner intended for the small, controlled guard
 * blocks in this codebase, not a general-purpose JS parser.
 */
function extractBalancedBlock(text, marker) {
  const markerIdx = text.indexOf(marker);
  if (markerIdx === -1) return null;
  const braceStart = text.indexOf('{', markerIdx);
  if (braceStart === -1) return null;
  let depth = 0;
  for (let i = braceStart; i < text.length; i++) {
    if (text[i] === '{') depth++;
    else if (text[i] === '}') {
      depth--;
      if (depth === 0) {
        return text.slice(markerIdx, i + 1);
      }
    }
  }
  return null; // Unbalanced — treat as not found.
}

/**
 * Recursively lists files under `dir` whose name ends with one of `exts`.
 * Dependency-free directory walk (no third-party glob).
 */
function walkDir(dir, exts, results = []) {
  let entries;
  try {
    entries = readdirSync(dir, { withFileTypes: true });
  } catch {
    return results;
  }
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walkDir(fullPath, exts, results);
    } else if (exts.some((ext) => entry.name.endsWith(ext))) {
      results.push(fullPath);
    }
  }
  return results;
}

// ---------------------------------------------------------------------------
// 1 & 2. Portal routes: no direct invoice status='paid' write, and action='pay'
//        returns 409 with PAYMENT_CONFIRMATION_NOT_SUPPORTED.
// ---------------------------------------------------------------------------

for (const [label, key] of [
  ['src/app/api/portal/token/[token]/route.js', 'portalToken'],
  ['src/app/api/portal/doc/[id]/route.js', 'portalDoc'],
]) {
  const text = source[key];
  const payBlock = extractPayBlock(text);

  check(
    `${label}: action='pay' branch exists`,
    payBlock.length > 0
  );

  check(
    // Hardened: no longer assumes `status` is the first key in the object
    // literal passed to .update() — matches status:'paid' anywhere inside
    // the object, regardless of key order or preceding spread/fields.
    `${label}: no direct invoice status='paid' write anywhere in file (any key order)`,
    !/\.update\(\s*\{[^}]*\bstatus\s*:\s*['"]paid['"]/.test(text)
  );

  check(
    `${label}: no invoice_payments write anywhere in file`,
    !/from\(\s*['"]invoice_payments['"]\s*\)/.test(text)
  );

  check(
    `${label}: no portal_invoice_paid audit event anywhere in file`,
    !/portal_invoice_paid/.test(text)
  );

  check(
    `${label}: no Invoice Paid email trigger anywhere in file`,
    !/sendInvoicePaidEmail/.test(text)
  );

  check(
    `${label}: action='pay' returns HTTP 409`,
    /status:\s*409/.test(payBlock)
  );

  check(
    `${label}: action='pay' returns PAYMENT_CONFIRMATION_NOT_SUPPORTED error code`,
    /PAYMENT_CONFIRMATION_NOT_SUPPORTED/.test(payBlock)
  );
}

// ---------------------------------------------------------------------------
// 1b. Hardened pay-block audit (SAFE-03B1-R3): extract the full brace-balanced
//     `if (action === 'pay') { ... }` block per portal route and assert on
//     its exact contents — eliminates the false-negative risk of the fixed
//     1200-char window and the "status must be first key" regex.
// ---------------------------------------------------------------------------

for (const [label, key] of [
  ['src/app/api/portal/token/[token]/route.js', 'portalToken'],
  ['src/app/api/portal/doc/[id]/route.js', 'portalDoc'],
]) {
  const text = source[key];
  const payBlock = extractBalancedBlock(text, "if (action === 'pay')");

  check(
    `${label}: action='pay' block extracted via balanced-brace scan`,
    !!payBlock
  );

  if (payBlock) {
    check(`${label}: pay block returns HTTP 409`, /\b409\b/.test(payBlock));
    check(
      `${label}: pay block includes PAYMENT_CONFIRMATION_NOT_SUPPORTED`,
      /PAYMENT_CONFIRMATION_NOT_SUPPORTED/.test(payBlock)
    );
    check(`${label}: pay block contains no .update( call`, !/\.update\(/.test(payBlock));
    check(`${label}: pay block contains no .insert( call`, !/\.insert\(/.test(payBlock));
    check(
      `${label}: pay block contains no portal_invoice_paid reference`,
      !/portal_invoice_paid/.test(payBlock)
    );
    check(
      `${label}: pay block contains no sendInvoicePaidEmail reference`,
      !/sendInvoicePaidEmail/.test(payBlock)
    );
    check(
      `${label}: pay block contains no status: 'paid' literal`,
      !/status:\s*'paid'/.test(payBlock)
    );
    check(
      `${label}: pay block contains no status: "paid" literal`,
      !/status:\s*"paid"/.test(payBlock)
    );
  }
}

// ---------------------------------------------------------------------------
// 6. Quote approve/reject key paths still exist in the portal routes.
// ---------------------------------------------------------------------------

check(
  "src/app/api/portal/token/[token]/route.js: quote action='approve' path exists",
  /action === 'approve'/.test(source.portalToken) &&
    /status: 'approved'/.test(source.portalToken)
);

check(
  "src/app/api/portal/token/[token]/route.js: quote action='reject' path exists",
  /action === 'reject'/.test(source.portalToken) &&
    /status: 'declined'/.test(source.portalToken)
);

check(
  "src/app/api/portal/doc/[id]/route.js: quote action='approve' path exists",
  /action === 'approve'/.test(source.portalDoc) &&
    /status: 'approved'/.test(source.portalDoc)
);

// ---------------------------------------------------------------------------
// 3. PortalClientView no longer contains Confirm Paid / handleMarkPaid /
//    the action='pay' write request body.
// ---------------------------------------------------------------------------

check(
  "PortalClientView.js: 'Confirm Paid' text removed",
  !/Confirm Paid/.test(source.portalClientView)
);

check(
  "PortalClientView.js: handleMarkPaid function removed",
  !/handleMarkPaid/.test(source.portalClientView)
);

check(
  "PortalClientView.js: body: JSON.stringify({ action: 'pay' }) removed",
  !/JSON\.stringify\(\{\s*action:\s*['"]pay['"]\s*\}\)/.test(source.portalClientView)
);

check(
  "PortalClientView.js: 'paying' state removed",
  !/\bsetPaying\b/.test(source.portalClientView) && !/\[\s*paying\s*,/.test(source.portalClientView)
);

check(
  "PortalClientView.js: existing payment_link Pay Now link preserved",
  /doc\.payment_link/.test(source.portalClientView) && /Pay\s*\{currencySymbol\}/.test(source.portalClientView)
);

check(
  "PortalClientView.js: paymentStatus derived field present",
  /const paymentStatus =/.test(source.portalClientView) &&
    /doc\.payment_status/.test(source.portalClientView)
);

check(
  "PortalClientView.js: 'Partially paid' shown when paymentStatus === 'partial'",
  /Partially paid/.test(source.portalClientView) &&
    /paymentStatus === 'partial'/.test(source.portalClientView)
);

check(
  "PortalClientView.js: payment action area hidden when paymentStatus === 'paid'",
  /paymentStatus !== 'paid'/.test(source.portalClientView)
);

check(
  "PortalClientView.js: quote approve handler (handleApproveQuote) untouched/present",
  /handleApproveQuote/.test(source.portalClientView)
);

check(
  "PortalClientView.js: quote decline handler (handleDeclineQuote) untouched/present",
  /handleDeclineQuote/.test(source.portalClientView)
);

// ---------------------------------------------------------------------------
// 4. Invoice PATCH: explicit rejection of status='paid'.
// ---------------------------------------------------------------------------

check(
  "invoices/route.js: PATCH rejects status='paid' with PAID_STATUS_REQUIRES_PAYMENT_RECORD",
  /PAID_STATUS_REQUIRES_PAYMENT_RECORD/.test(source.invoicesRoute)
);

{
  // Ensure the guard appears before the supabase update call within PATCH.
  const patchStart = source.invoicesRoute.indexOf('export async function PATCH');
  const patchEnd = source.invoicesRoute.indexOf('export async function DELETE');
  const patchBody = source.invoicesRoute.slice(patchStart, patchEnd === -1 ? undefined : patchEnd);
  const guardIdx = patchBody.indexOf('PAID_STATUS_REQUIRES_PAYMENT_RECORD');
  const updateIdx = patchBody.indexOf(".update({ status }");

  check(
    'invoices/route.js: PATCH status=paid guard runs before the database UPDATE call',
    guardIdx !== -1 && updateIdx !== -1 && guardIdx < updateIdx
  );
}

// ---------------------------------------------------------------------------
// 4b. Hardened (SAFE-03B1-R3): the unreachable status==='paid' side-effect
//     branch (sendInvoicePaidEmail / Invoice Paid analytics) must be fully
//     removed, while the status==='sent' side effects must remain intact.
// ---------------------------------------------------------------------------

check(
  'invoices/route.js: no longer contains sendInvoicePaidEmail (dead branch removed)',
  !/sendInvoicePaidEmail/.test(source.invoicesRoute)
);

check(
  "invoices/route.js: no longer contains the 'Invoice Paid' analytics event (dead branch removed)",
  !/['"]Invoice Paid['"]/.test(source.invoicesRoute)
);

check(
  'invoices/route.js: PAID_STATUS_REQUIRES_PAYMENT_RECORD guard still present after dead-branch removal',
  /PAID_STATUS_REQUIRES_PAYMENT_RECORD/.test(source.invoicesRoute)
);

check(
  "invoices/route.js: status === 'sent' side effect (invoice_sent_timestamp) still present",
  /invoice_sent_timestamp/.test(source.invoicesRoute)
);

check(
  "invoices/route.js: status === 'sent' side effect (eventName: 'invoice_sent') still present",
  /eventName:\s*'invoice_sent'/.test(source.invoicesRoute)
);

check(
  "invoices/route.js: status === 'sent' side effect (sendInvoiceSentEmail) still present",
  /sendInvoiceSentEmail/.test(source.invoicesRoute)
);

// ---------------------------------------------------------------------------
// 5. Invoice POST: explicit rejection of doc_type='receipt'.
// ---------------------------------------------------------------------------

check(
  "invoices/route.js: POST rejects doc_type='receipt' with RECEIPT_CREATION_NOT_SUPPORTED",
  /RECEIPT_CREATION_NOT_SUPPORTED/.test(source.invoicesRoute)
);

{
  // Ensure the guard appears before the invoices insert call within POST.
  const postStart = source.invoicesRoute.indexOf('export async function POST');
  const postEnd = source.invoicesRoute.indexOf('export async function PATCH');
  const postBody = source.invoicesRoute.slice(postStart, postEnd === -1 ? undefined : postEnd);
  const guardIdx = postBody.indexOf('RECEIPT_CREATION_NOT_SUPPORTED');
  const insertIdx = postBody.indexOf(".insert(payload)");

  check(
    'invoices/route.js: POST doc_type=receipt guard runs before the invoices insert call',
    guardIdx !== -1 && insertIdx !== -1 && guardIdx < insertIdx
  );
}

// ---------------------------------------------------------------------------
// 5b. Invoice POST: explicit execution-order assertions (SAFE-03B1-R2).
// ---------------------------------------------------------------------------

{
  const postStart = source.invoicesRoute.indexOf('export async function POST');
  const postEnd = source.invoicesRoute.indexOf('export async function PATCH');
  const postBody = source.invoicesRoute.slice(postStart, postEnd === -1 ? undefined : postEnd);

  const getRequestUserIdx = postBody.indexOf('getRequestUser(request)');
  const contextFailureCheckIdx = postBody.indexOf('if (contextFailure) return contextFailure;');
  const rateLimitCallIdx = postBody.indexOf("rateLimitAuthenticated('invoiceApi'");
  const requestJsonIdx = postBody.indexOf('request.json()');
  const receiptGuardIdx = postBody.indexOf('RECEIPT_CREATION_NOT_SUPPORTED');
  const ensureProfileIdx = postBody.indexOf('ensureProfile(');
  const insertIdx = postBody.indexOf('.insert(payload)');
  const rateLimitCallCount = (postBody.match(/rateLimitAuthenticated\(/g) || []).length;

  check(
    'invoices/route.js POST: getRequestUser / contextFailure check runs before rateLimitAuthenticated',
    getRequestUserIdx !== -1 &&
      contextFailureCheckIdx !== -1 &&
      rateLimitCallIdx !== -1 &&
      getRequestUserIdx < contextFailureCheckIdx &&
      contextFailureCheckIdx < rateLimitCallIdx
  );

  check(
    'invoices/route.js POST: rateLimitAuthenticated runs before request.json()',
    rateLimitCallIdx !== -1 &&
      requestJsonIdx !== -1 &&
      rateLimitCallIdx < requestJsonIdx
  );

  check(
    'invoices/route.js POST: receipt guard runs before ensureProfile',
    receiptGuardIdx !== -1 &&
      ensureProfileIdx !== -1 &&
      receiptGuardIdx < ensureProfileIdx
  );

  check(
    'invoices/route.js POST: receipt guard runs before invoices insert',
    receiptGuardIdx !== -1 &&
      insertIdx !== -1 &&
      receiptGuardIdx < insertIdx
  );

  check(
    'invoices/route.js POST: rateLimitAuthenticated appears exactly once',
    rateLimitCallCount === 1
  );
}

check(
  'invoices/route.js: no new payment_status POST field introduced',
  !/payment_status/.test(source.invoicesRoute)
);

check(
  'invoices/route.js: no record_invoice_payment RPC call introduced',
  !/record_invoice_payment/.test(source.invoicesRoute)
);

check(
  'invoices/route.js: no claim_first_revenue_invoice_draft call introduced',
  !/claim_first_revenue_invoice_draft/.test(source.invoicesRoute)
);

// ---------------------------------------------------------------------------
// 7. Repo-wide (src/app/api) recursive scan for direct paid-status writes
//    (SAFE-03B1-R3). Covers:
//      - object field:  status: 'paid'  /  status: "paid"   (any key order)
//      - assignment:    status = 'paid' /  status = "paid"
//    Explicitly must NOT flag comparison expressions status === 'paid' or
//    status !== 'paid' (verified via the negative lookahead + colon-only
//    object-field matcher below — comparisons never use a bare colon, and
//    the assignment pattern requires a single '=' not immediately followed
//    by another '=', which comparisons always have).
//
//    Allowlist policy: any legitimate exception must be added below with an
//    exact relative file path and an exact surrounding-context substring —
//    never a blanket per-file skip. As of SAFE-03B1-AUDIT, no exceptions are
//    expected under src/app/api.
// ---------------------------------------------------------------------------

const PAID_WRITE_ALLOWLIST = [
  // { file: 'src/app/api/<path>/route.js', context: 'exact substring surrounding the match' }
];

const API_DIR = path.join(ROOT, 'src/app/api');
const apiFiles = walkDir(API_DIR, ['.js', '.ts']);

const OBJECT_FIELD_PAID_RE = /\bstatus\s*:\s*(['"])paid\1/g;
// Negative lookahead (?!=) rules out ==, ===; the literal single '=' followed
// by whitespace-then-quote can never match !== (which has '!' before '='),
// == or === (whose second '=' immediately fails the lookahead).
const ASSIGNMENT_PAID_RE = /\bstatus\s*=(?!=)\s*(['"])paid\1/g;

const directPaidWriteFindings = [];
for (const file of apiFiles) {
  const relPath = path.relative(ROOT, file).split(path.sep).join('/');
  const content = readFileSync(file, 'utf8');

  for (const re of [OBJECT_FIELD_PAID_RE, ASSIGNMENT_PAID_RE]) {
    re.lastIndex = 0;
    let m;
    while ((m = re.exec(content)) !== null) {
      const contextWindow = content.slice(Math.max(0, m.index - 40), m.index + 40);
      const isAllowlisted = PAID_WRITE_ALLOWLIST.some(
        (entry) => entry.file === relPath && contextWindow.includes(entry.context)
      );
      if (!isAllowlisted) {
        const lineNo = content.slice(0, m.index).split('\n').length;
        directPaidWriteFindings.push(`${relPath}:${lineNo}: "${m[0]}"`);
      }
    }
  }
}

check(
  `src/app/api recursive scan: no un-allowlisted direct paid-status write pattern (${apiFiles.length} .js/.ts files scanned)`,
  directPaidWriteFindings.length === 0
);

if (directPaidWriteFindings.length > 0) {
  console.log('');
  console.log('Direct paid-write findings (src/app/api):');
  for (const f of directPaidWriteFindings) console.log(`  - ${f}`);
}

// Sanity checks on the scanner itself: confirm it does NOT misidentify
// comparison expressions as writes (regression guard for the scanner logic).
{
  const comparisonSample = "if (status === 'paid') { }\nif (status !== 'paid') { }";
  OBJECT_FIELD_PAID_RE.lastIndex = 0;
  ASSIGNMENT_PAID_RE.lastIndex = 0;
  check(
    'paid-write scanner: does not misidentify status === \'paid\' / status !== \'paid\' comparisons as writes',
    !OBJECT_FIELD_PAID_RE.test(comparisonSample) && !ASSIGNMENT_PAID_RE.test(comparisonSample)
  );

  const assignmentSample = "status = 'paid';";
  const objectFieldSample = "{ updated_at: x, status: 'paid' }"; // status NOT first key
  ASSIGNMENT_PAID_RE.lastIndex = 0;
  OBJECT_FIELD_PAID_RE.lastIndex = 0;
  check(
    'paid-write scanner: correctly detects bare assignment and non-first-key object field',
    ASSIGNMENT_PAID_RE.test(assignmentSample) && OBJECT_FIELD_PAID_RE.test(objectFieldSample)
  );
}

// ---------------------------------------------------------------------------
// Summary
// ---------------------------------------------------------------------------

console.log('');
console.log(`Guardrail static checks: ${passed} passed, ${failed} failed.`);

if (failed > 0) {
  console.log('');
  console.log('Failures:');
  for (const f of failures) console.log(`  - ${f}`);
  process.exit(1);
}

process.exit(0);
