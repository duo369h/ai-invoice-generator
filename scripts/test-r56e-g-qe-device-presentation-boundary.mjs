import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';

const baseSha = '7527c773485e06a9016b58aa1b21b4177abb4e80';
const read = (path) => readFileSync(path, 'utf8');
const modePath = 'src/components/dashboard/useQuoteEditorPresentationMode.js';
const boundaryPath = 'src/components/dashboard/QuotePresentationBoundary.js';
const dashboardPath = 'src/components/dashboard/Dashboard.js';
const modeSource = existsSync(modePath) ? read(modePath) : '';
const boundarySource = existsSync(boundaryPath) ? read(boundaryPath) : '';
const dashboardSource = read(dashboardPath);
const changedFiles = execFileSync('git', ['diff', '--name-only', baseSha, '--'], { encoding: 'utf8' })
  .trim().split('\n').filter(Boolean);

assert.ok(existsSync(modePath), 'presentation mode authority must exist');
assert.ok(existsSync(boundaryPath), 'Quote presentation boundary must exist');
assert.match(modeSource, /QUOTE_EDITOR_GUIDED_QUERY\s*=\s*['"]\(max-width: 1023px\)['"]/, 'the deterministic guided breakpoint must be explicit');
assert.match(modeSource, /window\.matchMedia\(QUOTE_EDITOR_GUIDED_QUERY\)/, 'the deterministic guided breakpoint must use matchMedia');
assert.match(modeSource, /useState\(null\)/, 'mode must begin unresolved for SSR safety');
assert.match(modeSource, /useEffect\(/, 'mode must resolve after client-safe lifecycle');
assert.match(modeSource, /GUIDED/);
assert.match(modeSource, /DESKTOP/);
assert.doesNotMatch(modeSource, /navigator|userAgent|innerWidth/, 'device mode must not use UA or render-time width sniffing');

assert.match(boundarySource, /useQuoteEditorPresentationMode/);
assert.match(boundarySource, /data-quote-presentation-mode/);
assert.match(boundarySource, /activePresentation/);
assert.doesNotMatch(boundarySource, /display:\s*['"]none['"]/, 'Desktop and guided interactive trees must not be hidden in parallel');
assert.match(boundarySource, /children/);

assert.match(dashboardSource, /QuotePresentationBoundary/);
assert.match(dashboardSource, /data-testid="quote-workflow-selector"/);
for (const marker of ['QuoteClientDocumentPreviewFrame', 'quote-editor-bridge', 'Save Quote', 'Send Quote', 'quote-workspace-scope', 'quote-workspace-pricing', 'quote-workspace-terms', 'quote-workspace-review', 'printable-quote']) {
  assert.match(dashboardSource, new RegExp(marker.replace(/["-]/g, '\\$&')), `${marker} must remain reachable through the compatibility surface`);
}

assert.equal(execFileSync('git', ['diff', '--name-only', baseSha, '--', 'supabase', 'src/app/api'], { encoding: 'utf8' }).trim(), '', 'DEVICE-01 must not change database or API paths');
const changedSource = execFileSync('git', ['diff', '--unified=0', baseSha, '--', ...changedFiles.filter((file) => file.endsWith('.js') && file !== 'scripts/test-r56e-g-qe-device-presentation-boundary.mjs')], { encoding: 'utf8' });
const addedLines = changedSource.split('\n').filter((line) => line.startsWith('+') && !line.startsWith('+++')).join('\n');
assert.doesNotMatch(addedLines, /\b(fetch|supabase|saveQuote|handleSaveQuote|handleSendQuote)\s*\(/, 'DEVICE-01 must not alter persistence authority');
assert.doesNotMatch(addedLines, /autosave|mobileQuoteStep|QuoteContextEditor|activeQuoteRegion|mobile-breakout|cloneElement|Project|Job|Portal|Approval|AI Price|Market Price/i, 'DEVICE-01 must not import QE02 or later product work');

const allowedFiles = new Set([modePath, boundaryPath, dashboardPath, 'scripts/test-r56e-g-qe-device-presentation-boundary.mjs', 'scripts/test-r56e-g-qe-device-presentation-boundary-browser-runtime.mjs']);
assert.equal(changedFiles.every((file) => allowedFiles.has(file)), true, `changed files must remain narrow: ${changedFiles.join(', ')}`);
assert.equal(changedFiles.filter((file) => file === dashboardPath).length, 1);

console.log('R56E-G-QE-DEVICE-01 static boundary contract: PASS');
