import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const repoRoot = process.cwd();
const entry = 'src/app/dashboard/page.js';
const requiredReachable = [
  'src/app/dashboard/page.js',
  'src/app/dashboard/TierRouter.js',
  'src/app/dashboard/components/DashboardOverview.js',
  'src/app/dashboard/components/StudioSpace.js',
  'src/components/dashboard/Dashboard.js',
  'src/components/dashboard/dashboardWave1.mjs',
  'src/components/dashboard/clientDocumentContinuity.mjs',
];

const read = (relativePath) => fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');
const normalize = (filePath) => filePath.split(path.sep).join('/');
const exists = (filePath) => fs.existsSync(path.join(repoRoot, filePath));

function resolveImport(importer, specifier) {
  if (!specifier.startsWith('.') && !specifier.startsWith('@/')) return null;
  const base = specifier.startsWith('@/')
    ? path.join(repoRoot, 'src', specifier.slice(2))
    : path.resolve(repoRoot, path.dirname(importer), specifier);
  const candidates = [
    base,
    `${base}.js`,
    `${base}.jsx`,
    `${base}.ts`,
    `${base}.tsx`,
    `${base}.mjs`,
    path.join(base, 'index.js'),
    path.join(base, 'index.jsx'),
  ];
  const match = candidates.find((candidate) => fs.existsSync(candidate) && fs.statSync(candidate).isFile());
  return match ? normalize(path.relative(repoRoot, match)) : null;
}

function collectImportClosure() {
  const queue = [entry];
  const visited = new Set();
  const unresolved = [];
  while (queue.length) {
    const current = queue.shift();
    if (visited.has(current)) continue;
    visited.add(current);
    const source = read(current);
    const importSpecifiers = [
      ...source.matchAll(/\b(?:import|export)\s+(?:[^'";]+?\s+from\s+)?['"]([^'"]+)['"]/g),
      ...source.matchAll(/\b(?:require|dynamicImport)\s*\(\s*['"]([^'"]+)['"]\s*\)/g),
    ].map((match) => match[1]);
    for (const specifier of importSpecifiers) {
      const resolved = resolveImport(current, specifier);
      if (!resolved) {
        if (specifier.startsWith('.') || specifier.startsWith('@/')) unresolved.push(`${current} -> ${specifier}`);
        continue;
      }
      if (!visited.has(resolved)) queue.push(resolved);
    }
  }
  return { files: [...visited].sort(), unresolved: [...new Set(unresolved)].sort() };
}

const graph = collectImportClosure();
assert.equal(graph.unresolved.length, 0, `Unresolved production Dashboard imports:\n${graph.unresolved.join('\n')}`);
for (const requiredFile of requiredReachable) {
  assert.ok(graph.files.includes(requiredFile), `Missing required reachable module: ${requiredFile}`);
}

const userVisibleFiles = graph.files.filter((file) => {
  const source = read(file);
  return /<[A-Za-z][^>]*[\s/>]/.test(source)
    || /(?:format|render|label|title|placeholder|description|message|currency|amount|date)/i.test(source);
});
assert.ok(userVisibleFiles.length > 0, 'Reachable user-visible inventory must not be empty');

const userVisibleSource = userVisibleFiles.map((file) => `\n/* ${file} */\n${read(file)}`).join('\n');
const cjkMatches = userVisibleSource.match(/[\u3400-\u4dbf\u4e00-\u9fff\u3040-\u30ff\uac00-\ud7af]/g) || [];
const nativeDateInputs = userVisibleSource.match(/type\s*=\s*['"]date['"]/gi) || [];
const unscopedLocaleCalls = userVisibleSource.match(/\.toLocale(?:DateString|TimeString|String)\s*\(/g) || [];
assert.equal(cjkMatches.length, 0, 'Production-reachable user-visible Dashboard source contains CJK literals');
assert.equal(nativeDateInputs.length, 0, 'Production-reachable user-visible Dashboard source contains native date inputs');
assert.equal(unscopedLocaleCalls.length, 0, 'Production-reachable user-visible Dashboard source contains browser-locale date/number calls');

const dashboard = read('src/components/dashboard/Dashboard.js');
const overview = read('src/app/dashboard/components/DashboardOverview.js');
const studio = read('src/app/dashboard/components/StudioSpace.js');
const allReachableSource = graph.files.map((file) => read(file)).join('\n');

assert.doesNotMatch(allReachableSource, /This invoice could be valued at/i, 'Invoice valuation copy remains in the reachable graph');
assert.doesNotMatch(allReachableSource, /(?:invSubtotal|subtotal)\s*\*\s*0\.95|(?:invSubtotal|subtotal)\s*\*\s*1\.15/, 'Invoice valuation multipliers remain in the reachable graph');
assert.doesNotMatch(dashboard, /e\.g\.\s*\$1,500|Amount\s*\(\$\)/i, 'Public Profile contains a bare-dollar placeholder');
assert.match(dashboard, /Currency not specified/, 'Public Profile must explain missing currency authority');
assert.match(studio, /Currency not specified/, 'Reachable client workspace must explain missing currency authority');

for (const source of [dashboard, overview, studio]) {
  assert.match(source, /currencyDisplay:\s*['"]code['"]/, 'Reachable money formatting must display currency codes');
}
assert.match(dashboard, /value="CAD"/, 'Dashboard must retain CAD document currency selection');
assert.match(dashboard, /value="USD"/, 'Dashboard must retain USD document currency selection');
assert.match(overview, /DASHBOARD_OVERVIEW_LOCALE\s*=\s*['"]en-CA['"]/, 'Overview must use the deterministic English locale');

const diff = execFileSync('git', ['diff', '--unified=0', 'f7223946871fe9ded7baab3e2da048a0929ed9da', '--'], { cwd: repoRoot, encoding: 'utf8' });
const changedPaths = execFileSync('git', ['diff', '--name-only', 'f7223946871fe9ded7baab3e2da048a0929ed9da', '--'], { cwd: repoRoot, encoding: 'utf8' }).trim().split('\n').filter(Boolean);
const allowedPaths = new Set([
  'src/components/dashboard/Dashboard.js',
  'src/app/dashboard/components/DashboardOverview.js',
  'src/app/dashboard/components/StudioSpace.js',
  'src/core/ui/UI_CONTROL_PLANE.ts',
  'scripts/test-r56e-dashboard-global-locale-currency-boundary.mjs',
]);
for (const changedPath of changedPaths) assert.ok(allowedPaths.has(changedPath), `R2 changed out-of-scope path: ${changedPath}`);
assert.doesNotMatch(diff, /^\+.*fetch\s*\(/m, 'R2 must not add network requests');
assert.doesNotMatch(diff, /^\+.*(?:supabase|from\s+['"]@supabase|api\/)/im, 'R2 must not add backend or API integration');
assert.doesNotMatch(diff, /^\+.*(?:profile[_A-Za-z]*currency|currency[_A-Za-z]*profile)/im, 'R2 must not add Public Profile currency persistence');

console.log(`PRODUCTION_REACHABLE_DASHBOARD_FILES=${graph.files.length}`);
console.log(`PRODUCTION_REACHABLE_USER_VISIBLE_FILES=${userVisibleFiles.length}`);
console.log(`PRODUCTION_REACHABLE_CJK_LITERAL_COUNT=${cjkMatches.length}`);
console.log(`PRODUCTION_REACHABLE_NATIVE_DATE_INPUT_COUNT=${nativeDateInputs.length}`);
console.log(`PRODUCTION_REACHABLE_UNSCOPED_DATE_LOCALE_CALLS=${unscopedLocaleCalls.length}`);
console.log('R56E-R2 global locale/currency/product boundary: PASS');
