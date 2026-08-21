import assert from 'node:assert/strict';
import fs from 'node:fs';

const source = fs.readFileSync('src/app/api/portal/token/[token]/route.js', 'utf8');
const approveStart = source.indexOf("if (action === 'approve')");
const rejectStart = source.indexOf("if (action === 'reject')", approveStart);

assert.ok(approveStart >= 0, 'Portal quote approval branch must exist');
assert.ok(rejectStart > approveStart, 'Portal quote rejection branch must follow approval');

const approveBlock = source.slice(approveStart, rejectStart);
assert.match(approveBlock, /resolved\.data\?\.status === 'approved'/, 'Already-approved requests must return before side effects');
assert.match(approveBlock, /idempotent: true/, 'Duplicate approval must report idempotent success');
assert.match(approveBlock, /\.eq\('status', 'sent'\)/, 'Approval must be an atomic sent-to-approved transition');
assert.match(approveBlock, /\.select\('id'\)[\s\S]*?\.maybeSingle\(\)/, 'Conditional approval must return whether this request won the transition');
assert.match(approveBlock, /latestQuote\?\.status === 'approved'/, 'Concurrent loser must resolve as idempotent success');
assert.match(approveBlock, /QUOTE_APPROVAL_INVALID_STATE/, 'Non-sent, non-approved quotes must fail closed');
assert.ok(
  approveBlock.indexOf("resolved.data?.status === 'approved'") < approveBlock.indexOf('recordServerGrowthEvent'),
  'Duplicate guard must run before growth side effects',
);
assert.ok(
  approveBlock.indexOf("latestQuote?.status === 'approved'") < approveBlock.indexOf('writeAuditLog'),
  'Concurrent idempotency resolution must run before audit side effects',
);
assert.ok(
  approveBlock.indexOf('idempotent: false') > approveBlock.indexOf('sendQuoteApprovedEmail'),
  'Only the transition winner may reach notification and non-idempotent success',
);

console.log('Portal quote approval idempotency contract passed.');
