import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const sourcePath = path.join(root, 'src/components/dashboard/Dashboard.js');
const source = fs.readFileSync(sourcePath, 'utf8');
const r1BaseSha = '4d7e8090ab8dbe9ecfa73c6ca2aa5ea6a037cb58';
const r1CommitSha = 'f7223946871fe9ded7baab3e2da048a0929ed9da';
const currentHeadSha = execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
assert.doesNotThrow(
  () => execFileSync('git', ['cat-file', '-e', `${r1CommitSha}^{commit}`], { encoding: 'utf8' }),
  'R1 historical commit must exist locally',
);
assert.doesNotThrow(
  () => execFileSync('git', ['merge-base', '--is-ancestor', r1CommitSha, currentHeadSha], { encoding: 'utf8' }),
  'R1 historical commit must be an ancestor of current HEAD',
);
const baseSource = execFileSync('git', ['show', `${r1BaseSha}:src/components/dashboard/Dashboard.js`], { encoding: 'utf8' });
const changedFiles = execFileSync('git', ['diff', '--name-only', r1BaseSha, r1CommitSha, '--'], { encoding: 'utf8' }).trim().split('\n').filter(Boolean);
const dashboardDiff = execFileSync('git', ['diff', r1BaseSha, r1CommitSha, '--', 'src/components/dashboard/Dashboard.js'], { encoding: 'utf8' });
const addedLines = dashboardDiff.split('\n').filter((line) => line.startsWith('+') && !line.startsWith('+++')).join('\n');

const count = (value, pattern) => value.match(pattern)?.length || 0;
const assertEqualInBaseAndCurrent = (pattern, label) => {
  const currentMatch = source.match(pattern)?.[0];
  const baseMatch = baseSource.match(pattern)?.[0];
  assert.equal(currentMatch, baseMatch, `${label} must remain unchanged`);
};

assert.equal(count(source, /[\u3400-\u9fff\u3040-\u30ff]/g), 0, 'Dashboard source must contain no CJK literals');
assert.equal(count(source, /toLocaleDateString\s*\(/g), 0, 'unscoped toLocaleDateString must be absent');
assert.equal(count(source, /toLocaleTimeString\s*\(/g), 0, 'unscoped toLocaleTimeString must be absent');
assert.equal(count(source, /toLocaleString\s*\(/g), 0, 'browser-dependent toLocaleString must be absent');
assert.equal(count(source, /type=["']date["']/g), 0, 'native date inputs must be absent');
assert.match(source, /DASHBOARD_DATE_LOCALE\s*=\s*['"]en-CA['"]/);
assert.match(source, /DASHBOARD_MONEY_LOCALE\s*=\s*['"]en-CA['"]/);
assert.match(source, /placeholder=['"]YYYY-MM-DD['"]/g);
assert.match(source, /data-dashboard-date-entry=['"]english['"]/g);
assert.match(source, /timeZone:\s*['"]UTC['"]/g);
assert.match(source, /currencyDisplay:\s*['"]code['"]/g);
assert.match(source, /return `\$\{normalizedCurrency\} \$\{formattedAmount\}`/);
assert.doesNotMatch(source, /default:\s*return\s+['"]\$['"]/);

const currencyValues = ['USD', 'CAD', 'EUR', 'GBP', 'CNY'];
for (const currency of currencyValues) {
  assert.match(source, new RegExp(`<option value=["']${currency}["']>${currency}</option>`), `Quote/Invoice currency selector must support ${currency}`);
}
assert.ok(count(source, /<option value=["']CAD["']>CAD<\/option>/g) >= 2, 'CAD must be selectable for both Quote and Invoice');
assert.match(source, /formatDashboardMoney\([^\n]+,\s*qCurrency\)/);
assert.match(source, /formatDashboardMoney\([^\n]+,\s*invCurrency\)/);
assert.match(source, /formatDashboardDate\(/);
assert.match(source, /formatDashboardTime\(/);

assertEqualInBaseAndCurrent(/const \[qCurrency, setQCurrency\] = useState\('USD'\);/, 'Quote currency state');
assertEqualInBaseAndCurrent(/const \[invCurrency, setInvCurrency\] = useState\('USD'\);/, 'Invoice currency state');
assertEqualInBaseAndCurrent(/setQCurrency\(quote\.currency \|\| 'USD'\);/, 'Quote edit currency hydration');
assertEqualInBaseAndCurrent(/setInvCurrency\(invoice\.currency \|\| quote\.currency \|\| 'USD'\);/, 'Invoice edit currency hydration');
assertEqualInBaseAndCurrent(/const qSubtotal = qItems\.reduce\(\(sum, item\) => sum \+ \(item\.quantity \* item\.unitPrice\), 0\);/, 'Quote subtotal arithmetic');
assertEqualInBaseAndCurrent(/const qTotal = qSubtotal \* \(1 - qDiscountRate \/ 100\) \* \(1 \+ qTaxRate \/ 100\);/, 'Quote total arithmetic');
assertEqualInBaseAndCurrent(/const invSubtotal = invItems\.reduce\(\(sum, item\) => sum \+ \(item\.quantity \* item\.unitPrice\), 0\);/, 'Invoice subtotal arithmetic');
assertEqualInBaseAndCurrent(/const invTotal = invSubtotal \* \(1 - invDiscountRate \/ 100\) \* \(1 \+ invTaxRate \/ 100\);/, 'Invoice total arithmetic');

assert.deepEqual(changedFiles.sort(), [
  'scripts/test-r56e-english-locale-currency-authority.mjs',
  'src/components/dashboard/Dashboard.js',
].sort(), 'R56E-E-R1 must stay within the two-file application/test scope');
assert.doesNotMatch(addedLines, /\bfetch\s*\(/, 'R56E-E-R1 must not add network requests');
assert.doesNotMatch(addedLines, /src\/app\/api|supabase|migration|schema/i, 'R56E-E-R1 must not add backend/schema work');

console.log('R56E-E-R1 English Locale + Currency Authority: PASS');
