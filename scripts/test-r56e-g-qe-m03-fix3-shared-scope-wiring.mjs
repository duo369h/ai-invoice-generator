import fs from 'node:fs';

const sharedSource = fs.readFileSync(new URL('../src/components/dashboard/QuoteEditorSharedContext.js', import.meta.url), 'utf8');
const dashboardSource = fs.readFileSync(new URL('../src/components/dashboard/Dashboard.js', import.meta.url), 'utf8');
const guidedSource = fs.readFileSync(new URL('../src/components/dashboard/QuoteEditorGuided.js', import.meta.url), 'utf8');

const checks = [
  ['shared contract exposes the narrow scope capability', /scope\s*,/.test(sharedSource) || /scope\s*:\s*scope/.test(sharedSource)],
  ['Dashboard passes qPhotographyScope through the shared contract', /qPhotographyScope,/.test(dashboardSource) && /scope:\s*\{/.test(dashboardSource)],
  ['Dashboard shared scope action delegates to updatePhotographyScopeField', /scope:\s*\{[\s\S]*?updateField:\s*updateQPhotographyScope/.test(dashboardSource)],
  ['Guided consumes shared scope capability', /const\s*\{[\s\S]*?scope[\s,}]/.test(guidedSource)],
  ['Guided Scope fields trigger the shared scope action', /scope\.updateField\(/.test(guidedSource)],
  ['Guided source does not define a second Scope state', !/useState\([^)]*scope/i.test(guidedSource)],
];

let failed = 0;
for (const [label, passed] of checks) {
  if (passed) console.log(`PASS: ${label}`);
  else {
    failed += 1;
    console.log(`FAIL: ${label}`);
  }
}

console.log(`M03_FIX3_SHARED_SCOPE_WIRING_TARGETED=${failed === 0 ? 'PASS' : 'FAIL'}`);
if (failed > 0) process.exitCode = 1;
