import assert from 'node:assert/strict';
import fs from 'node:fs';

const quoteRoute = fs.readFileSync('src/app/api/quotes/route.js', 'utf8');
const dashboard = fs.readFileSync('src/components/dashboard/Dashboard.js', 'utf8');
const portalRoute = fs.readFileSync('src/app/api/portal/token/[token]/route.js', 'utf8');
const portalView = fs.readFileSync('src/app/components/PortalClientView.js', 'utf8');

const postBlock = quoteRoute.slice(
  quoteRoute.indexOf('export async function POST'),
  quoteRoute.indexOf('export async function PATCH')
);
const patchBlock = quoteRoute.slice(quoteRoute.indexOf('export async function PATCH'));
const postUpdateBlock = postBlock.slice(
  postBlock.indexOf('const { data: updateData'),
  postBlock.indexOf('} else {', postBlock.indexOf('const { data: updateData'))
);
const patchUpdateBlock = patchBlock.slice(
  patchBlock.indexOf('const { data, error }'),
  patchBlock.indexOf('await writeAuditLog', patchBlock.indexOf('const { data, error }'))
);
const mismatchFunctionMatch = quoteRoute.match(/function hasTerminalQuoteStatusMismatch\([\s\S]*?\n\}/);
assert.ok(mismatchFunctionMatch, 'POST must define the explicit terminal-status mismatch decision');
const hasTerminalQuoteStatusMismatch = new Function(
  'TERMINAL_QUOTE_STATUSES',
  `${mismatchFunctionMatch[0]}; return hasTerminalQuoteStatusMismatch;`
)(new Set(['approved', 'declined', 'converted']));

assert.match(
  quoteRoute,
  /const OWNER_MUTABLE_QUOTE_STATUSES\s*=\s*new Set\(\[\s*["']draft["']\s*,\s*["']sent["']\s*\]\)/,
  'only draft and sent may be owner-authored quote statuses'
);
assert.match(
  quoteRoute,
  /const TERMINAL_QUOTE_STATUSES\s*=\s*new Set\(\[\s*["']approved["']\s*,\s*["']declined["']\s*,\s*["']converted["']\s*\]\)/,
  'approved, declined, and converted are client/system terminal states'
);
assert.match(
  quoteRoute,
  /QUOTE_STATUS_ACTOR_FORBIDDEN/,
  'owner attempts to manufacture client or system statuses must have a clear error code'
);
assert.match(
  quoteRoute,
  /code:\s*["']QUOTE_STATUS_ACTOR_FORBIDDEN["'][\s\S]*?status:\s*403/,
  'the actor-boundary error must be a clear 4xx response'
);
assert.match(
  postBlock,
  /!OWNER_MUTABLE_QUOTE_STATUSES\.has\(requestedStatus\)/,
  'new owner quotes must reject approved, declined, and converted request statuses'
);
assert.match(
  postBlock,
  /select\(["']client_id, client_name, client_email, client_address, status["']\)/,
  'existing quote status must be fetched as authoritative state before general owner edits'
);
assert.match(
  postBlock,
  /const hasObservedStatus = Object\.prototype\.hasOwnProperty\.call\(rawBody, "status"\)[\s\S]*?const body = validateQuotePayload\(rawBody\)/,
  'POST must distinguish an omitted status from a Dashboard-supplied observed status before validation defaults it'
);
assert.match(
  postBlock,
  /if \(hasTerminalQuoteStatusMismatch\(existingQuote\.status, requestedStatus, hasObservedStatus\)\) \{\s*return quoteStatusStateConflictResponse\(\);\s*\}/,
  'POST must reject an explicit stale status that differs from the authoritative terminal state before content is saved'
);
for (const [authoritativeStatus, staleStatus] of [
  ['approved', 'sent'],
  ['approved', 'draft'],
  ['declined', 'sent'],
  ['converted', 'draft'],
]) {
  assert.equal(
    hasTerminalQuoteStatusMismatch(authoritativeStatus, staleStatus, true),
    true,
    `DB ${authoritativeStatus} plus stale ${staleStatus} must fail closed`
  );
}
for (const status of ['approved', 'declined', 'converted']) {
  assert.equal(
    hasTerminalQuoteStatusMismatch(status, status, true),
    false,
    `fresh ${status} terminal edits must remain allowed`
  );
  assert.equal(
    hasTerminalQuoteStatusMismatch(status, 'draft', false),
    false,
    `omitted status must retain the legacy terminal-edit compatibility for ${status}`
  );
}
assert.match(
  postBlock,
  /TERMINAL_QUOTE_STATUSES\.has\(existingQuote\.status\)\s*\?\s*existingQuote\.status\s*:\s*requestedStatus/s,
  'general edits must preserve approved, declined, and converted statuses instead of accepting a forged replacement'
);
assert.match(
  postUpdateBlock,
  /\.eq\(["']status["'], existingQuote\.status\)/,
  'POST edits must atomically require the persisted status observed during the authoritative read'
);
assert.match(
  postUpdateBlock,
  /\.maybeSingle\(\)/,
  'POST compare-and-update must expose a no-match result without converting it into a write error'
);
assert.match(
  quoteRoute,
  /function quoteStatusStateConflictResponse[\s\S]*?QUOTE_STATUS_STATE_CONFLICT/,
  'POST must fail closed when a concurrent Portal or system transition makes the observed status stale'
);
assert.match(
  postUpdateBlock,
  /return conditionalQuoteUpdateFailureResponse\(serviceSupabase, id, context\.user\.id\)/,
  'POST must route an atomic compare-and-update miss to the state-conflict response'
);
assert.equal(
  (postUpdateBlock.match(/\.update\(/g) || []).length,
  1,
  'POST has exactly one generic quote update, and it is the status-guarded compare-and-update above'
);

for (const forbiddenStatus of ['approved', 'declined', 'converted']) {
  assert.equal(
    /const OWNER_MUTABLE_QUOTE_STATUSES\s*=\s*new Set\(\[\s*["']draft["']\s*,\s*["']sent["']\s*\]\)/.test(quoteRoute),
    true,
    `owner PATCH cannot authorize ${forbiddenStatus}`
  );
  assert.match(
    patchBlock,
    /!OWNER_MUTABLE_QUOTE_STATUSES\.has\(status\)/,
    `owner PATCH must reject ${forbiddenStatus} through the actor boundary`
  );
}
assert.match(
  patchBlock,
  /enumValue\(body\.status, ["']status["'], \[["']draft["'], ["']sent["'], ["']approved["'], ["']declined["'], ["']converted["']\]\)/,
  'PATCH must validate the full persisted status vocabulary before applying the actor guard'
);
assert.match(
  patchUpdateBlock,
  /\.in\(["']status["'], \[["']draft["'], ["']sent["']\]\)/,
  'PATCH must atomically require the persisted current status to be owner-mutable'
);
assert.match(
  patchUpdateBlock,
  /\.maybeSingle\(\)/,
  'PATCH must expose an atomic current-state guard miss before side effects'
);
assert.match(
  quoteRoute,
  /function quoteStatusStateConflictResponse[\s\S]*?QUOTE_STATUS_STATE_CONFLICT/,
  'PATCH must fail closed with a conflict when a terminal status blocks the conditional mutation'
);
assert.match(
  patchUpdateBlock,
  /return conditionalQuoteUpdateFailureResponse\(serviceSupabase, id, context\.user\.id\)/,
  'PATCH must route an atomic current-state guard miss to the state-conflict response'
);
assert.equal(
  (patchUpdateBlock.match(/\.update\(/g) || []).length,
  1,
  'PATCH has exactly one generic quote update, and it is the current-status-guarded mutation above'
);
for (const [from, to] of [
  ['approved', 'draft'],
  ['approved', 'sent'],
  ['declined', 'draft'],
  ['declined', 'sent'],
  ['converted', 'draft'],
  ['converted', 'sent'],
]) {
  assert.match(
    patchUpdateBlock,
    /\.in\(["']status["'], \[["']draft["'], ["']sent["']\]\)/,
    `PATCH ${from} -> ${to} must be blocked by the persisted current-state condition`
  );
}
assert.match(
  patchUpdateBlock,
  /\.in\(["']status["'], \[["']draft["'], ["']sent["']\]\)/,
  'PATCH draft -> sent and sent -> draft remain available only while the persisted current state is owner-mutable'
);

assert.doesNotMatch(dashboard, /<option value="approved">Approved<\/option>/, 'Dashboard must not expose Approved as an owner-selectable status');
assert.doesNotMatch(dashboard, /<option value="declined">Declined<\/option>/, 'Dashboard must not expose Declined as an owner-selectable status');
assert.match(
  dashboard,
  /Quote delivery status.*read-only/,
  'Dashboard must render quote delivery status as read-only'
);
assert.match(
  dashboard,
  /Quote delivery status.*read-only/s,
  'Dashboard must visibly represent historical and delivery states as read-only'
);

assert.match(portalRoute, /entitlements\.client_approval.*approval_scope !== 'quotes_only'/s, 'signed Portal approval remains limited to the Pro quote-only approval entitlement');
assert.match(portalRoute, /\.eq\('status', 'sent'\)/, 'signed Portal approval remains an atomic sent-to-approved transition');
assert.match(portalRoute, /idempotent: true/, 'duplicate signed Portal approval remains idempotent');
assert.match(portalRoute, /QUOTE_APPROVAL_INVALID_STATE/, 'invalid signed Portal approval states remain a 409 contract');

assert.doesNotMatch(portalView, /client signature|for signature|waiting for client signature|legally binding|contract signature/i, 'Portal UI must not imply an e-sign or legal-signature workflow');
assert.match(portalView, /Sent to client for review/, 'Portal copy must use review language');
assert.match(portalView, /Waiting for client approval/, 'Portal copy must use approval language');

console.log('Portal approval actor-boundary static contract passed.');
