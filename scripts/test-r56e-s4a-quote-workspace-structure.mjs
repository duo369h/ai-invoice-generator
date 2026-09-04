import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

const baseSha = 'b95454388d6ba127954ab8842f14d0b20ebb25a6';
const dashboardPath = 'src/components/dashboard/Dashboard.js';
const source = readFileSync(dashboardPath, 'utf8');
const addedDiff = execFileSync('git', ['diff', '--unified=0', baseSha, '--', dashboardPath], { encoding: 'utf8' });
const addedLines = addedDiff
  .split('\n')
  .filter((line) => line.startsWith('+') && !line.startsWith('+++'))
  .join('\n');

const sectionIds = [
  'quote-workspace-scope',
  'quote-workspace-usage',
  'quote-workspace-pricing',
  'quote-workspace-terms',
  'quote-workspace-review',
];
const sectionPositions = sectionIds.map((id) => source.indexOf(`id="${id}"`));

assert.ok(sectionPositions.every((position) => position >= 0), 'all supported workspace sections must exist');
assert.deepEqual(
  [...sectionPositions].sort((left, right) => left - right),
  sectionPositions,
  'workspace sections must be ordered Scope → Usage → Pricing → Terms & Notes → Review',
);

assert.equal(source.includes('id="quote-workspace-production"'), false, 'Production workspace section must not be rendered');
assert.equal(source.includes('id="quote-workspace-preview"'), false, 'Preview workspace section must not be rendered');
assert.equal(source.includes('>Production</'), false, 'Production must not be presented as a workspace section');
assert.equal(source.includes('>Preview &amp; Send</'), false, 'Preview must not be presented as a workspace section');

const usageStart = sectionPositions[1];
const pricingStart = sectionPositions[2];
const usageSection = source.slice(usageStart, pricingStart);
assert.match(usageSection, /Usage Rights/);
assert.match(usageSection, /qScopeCommon\.usage_rights/);
assert.match(usageSection, /handleUsageRightsStatusChange/);

assert.match(source, /data-testid="photography-scope"/);
assert.match(source, /photography_scope_v2/);
assert.match(source, /const \[qPhotographyScope, setQPhotographyScope\]/);
assert.match(source, /const handleUsageRightsStatusChange/);
assert.match(source, /Line Items/);
assert.match(source, /handleItemChange/);
assert.match(source, /addItem\('quote'\)/);
assert.match(source, /removeItem\('quote'/);
assert.match(source, /const qSubtotal = qItems\.reduce/);
assert.match(source, /Quote Notes/);
assert.match(source, /Review with Corvioz/);
assert.match(source, /onClick=\{handleSaveQuote\}/);
assert.match(source, /onClick=\{\(\) => handleSendQuote\(\)\}/);

assert.match(source, /data-testid="quote-workspace-index"/);
assert.match(source, /document\.getElementById\(sectionId\)/, 'section index must resolve the selected section');
for (const id of sectionIds) {
  assert.match(source, new RegExp(`['"]${id}['"]`), `${id} must be represented in the section index`);
}
assert.match(source, /<button[^>]+type="button"[^>]+aria-label=/s, 'section index controls must be semantic keyboard-accessible buttons');

assert.equal(source.includes('/settings'), false, 'S4A must not introduce settings routes');
assert.equal(addedLines.match(/fetch\s*\(/g)?.length || 0, 0, 'S4A must not add network requests');
assert.equal(addedLines.match(/\b(project|job|task|production)\b/gi)?.length || 0, 0, 'S4A must not introduce project/job/task/production product surfaces');
assert.equal((source.match(/quoteView === 'create' \|\| quoteView === 'edit'/g) || []).length, 1, 'create and edit must share one workspace structure');

console.log('R56E-S4A Quote Workspace Structure: PASS');
