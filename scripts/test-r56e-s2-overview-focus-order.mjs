import assert from 'node:assert/strict';
import fs from 'node:fs';

const overview = fs.readFileSync('src/app/dashboard/components/DashboardOverview.js', 'utf8');
const dashboard = fs.readFileSync('src/components/dashboard/Dashboard.js', 'utf8');

const componentStart = overview.indexOf('export default function DashboardOverview');
assert.notEqual(componentStart, -1, 'DashboardOverview component must remain present');
const renderSource = overview.slice(componentStart);

const sectionPositions = Object.fromEntries([
  ['needsAttention', '<Wave1NeedsAttention '],
  ['recentDocuments', '<Wave1RecentDocuments'],
  ['quickActions', '<Wave1QuickActions '],
  ['payments', '<Wave1PaymentProgress '],
  ['usage', '<Wave1DocumentUsage '],
  ['scopeSnapshot', '<Wave1ScopeSnapshot'],
].map(([name, marker]) => [name, renderSource.indexOf(marker)]));

for (const [name, position] of Object.entries(sectionPositions)) {
  assert.notEqual(position, -1, `${name} must remain rendered exactly once in Overview`);
}

assert.ok(
  sectionPositions.needsAttention < sectionPositions.recentDocuments,
  'Needs Attention must be visually and semantically before Recent Documents',
);
for (const utility of ['quickActions', 'payments', 'usage', 'scopeSnapshot']) {
  assert.ok(
    sectionPositions.recentDocuments < sectionPositions[utility],
    `Recent Documents must be before ${utility}`,
  );
}

assert.match(renderSource, /<Wave1NeedsAttention[\s\S]*?<Wave1RecentDocuments[\s\S]*?<Wave1QuickActions/);
assert.doesNotMatch(
  renderSource,
  /data\.isLoading[\s\S]*?&&[\s\S]*?<Wave1QuickActions|data\.error[\s\S]*?&&[\s\S]*?<Wave1QuickActions/,
  'Empty, loading, and error states must not conditionally promote utility sections',
);

assert.match(
  overview,
  /resolveAction\(actionHandlers, item\.action, \{ id: item\.documentId, documentType: item\.documentType \}\)/,
  'Needs Attention must preserve its exact action payload and ID',
);
assert.match(
  overview,
  /resolveAction\(actionHandlers, openAction, \{ id: document\.id, documentType: isQuote \? 'quote' : 'invoice' \}\)/,
  'Recent Documents must preserve exact Quote and Invoice IDs',
);
assert.match(
  dashboard,
  /createInvoiceFromQuote:\s*\(\{ id \} = \{\}\) => \{[\s\S]*?handleConvertQuoteToInvoice\(quote\)/,
  'Approved Quote must still invoke the existing create-invoice flow',
);

const needsRowStart = overview.indexOf('className="dashboard-needs-attention-item"');
const recentRowStart = overview.indexOf('className="dashboard-wave1-document"');
assert.notEqual(needsRowStart, -1, 'Needs Attention row control must remain present');
assert.notEqual(recentRowStart, -1, 'Recent Documents row control must remain present');
const needsRow = overview.slice(overview.lastIndexOf('<button', needsRowStart), overview.indexOf('</button>', needsRowStart) + '</button>'.length);
const recentRow = overview.slice(overview.lastIndexOf('<button', recentRowStart), overview.indexOf('</button>', recentRowStart) + '</button>'.length);
for (const [name, row] of [['Needs Attention', needsRow], ['Recent Documents', recentRow]]) {
  assert.match(row, /type="button"/, `${name} full row must be keyboard accessible`);
  assert.equal((row.match(/<button/g) || []).length, 1, `${name} full row must not contain nested interactive controls`);
}

assert.doesNotMatch(renderSource, /fetch\s*\(/, 'S2 must not introduce an Overview data request');
assert.match(overview, /data-testid=\{`needs-attention-\$\{needsAttentionState\.mode\}-state`\}/, 'Needs Attention keeps distinct empty/loading/stale/error state rendering');

console.log('R56E-S2 OVERVIEW FOCUS ORDER TEST=PASS');
