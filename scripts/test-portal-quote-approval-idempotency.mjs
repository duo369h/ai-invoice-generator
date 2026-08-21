import assert from 'node:assert/strict';
import fs from 'node:fs';

const source = fs.readFileSync('src/app/api/portal/token/[token]/route.js', 'utf8');
const portalView = fs.readFileSync('src/app/components/PortalClientView.js', 'utf8');
const approveStart = source.indexOf("if (action === 'approve')");
const rejectStart = source.indexOf("if (action === 'reject')", approveStart);

assert.ok(approveStart >= 0, 'Portal quote approval branch must exist');
assert.ok(rejectStart > approveStart, 'Portal quote rejection branch must follow approval');

const approveBlock = source.slice(approveStart, rejectStart);
const rejectBlock = source.slice(rejectStart, source.indexOf("if (resolved.type === 'invoice')", rejectStart));
assert.match(approveBlock, /\['approved', 'converted'\]\.includes\(resolved\.data\?\.status\)/, 'Approved and converted requests must return before side effects');
assert.match(approveBlock, /idempotent: true/, 'Duplicate approval must report idempotent success');
assert.match(approveBlock, /\.eq\('status', 'sent'\)/, 'Approval must be an atomic sent-to-approved transition');
assert.match(approveBlock, /\.select\('id'\)[\s\S]*?\.maybeSingle\(\)/, 'Conditional approval must return whether this request won the transition');
assert.match(approveBlock, /\['approved', 'converted'\]\.includes\(latestQuote\?\.status\)/, 'Concurrent loser must resolve as idempotent success');
assert.match(approveBlock, /QUOTE_APPROVAL_INVALID_STATE/, 'Non-sent, non-approved quotes must fail closed');
assert.ok(
  approveBlock.indexOf("['approved', 'converted'].includes(resolved.data?.status)") < approveBlock.indexOf('recordServerGrowthEvent'),
  'Duplicate guard must run before growth side effects',
);
assert.ok(
  approveBlock.indexOf("['approved', 'converted'].includes(latestQuote?.status)") < approveBlock.indexOf('writeAuditLog'),
  'Concurrent idempotency resolution must run before audit side effects',
);
assert.ok(
  approveBlock.indexOf('idempotent: false') > approveBlock.indexOf('sendQuoteApprovedEmail'),
  'Only the transition winner may reach notification and non-idempotent success',
);

assert.match(rejectBlock, /\.eq\('status', 'sent'\)/, 'Rejection must be an atomic sent-to-declined transition');
assert.match(rejectBlock, /\.select\('id'\)[\s\S]*?\.maybeSingle\(\)/, 'Conditional rejection must return whether this request won the transition');
assert.match(rejectBlock, /latestQuote\?\.status === 'declined'/, 'Concurrent rejection loser must resolve as idempotent success');
assert.match(rejectBlock, /QUOTE_REJECTION_INVALID_STATE/, 'Non-sent, non-declined quotes must fail closed');
assert.match(portalView, /const quoteAccepted = \['approved', 'converted'\]\.includes\(status\)/, 'Portal UI must treat converted quotes as accepted terminal state');
assert.doesNotMatch(portalView, /doc\.status !== 'approved'/, 'Portal action controls must use the terminal-state helper');

console.log('Portal quote approval idempotency contract passed.');
