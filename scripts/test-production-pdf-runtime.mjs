import assert from 'node:assert/strict';
import fs from 'node:fs';

const route = fs.readFileSync('src/app/api/pdf/export/route.js', 'utf8');
const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));

assert.equal(packageJson.dependencies['@sparticuz/chromium'], '149.0.0');
assert.equal(packageJson.dependencies['playwright-core'], '1.61.0');
assert.match(route, /process\.env\.VERCEL === "1"/);
assert.match(route, /import\("playwright-core"\)/);
assert.match(route, /import\("@sparticuz\/chromium"\)/);
assert.match(route, /executablePath: await serverlessChromium\.executablePath\(\)/);
assert.match(route, /args: serverlessChromium\.args/);
assert.match(route, /import\("playwright"\)/, 'Local development must retain the installed Playwright browser path');
assert.match(route, /if \(branding !== "branded"\) return html;/, 'Clean paid PDFs must not receive Free branding');
assert.doesNotMatch(route, /style="/);
assert.doesNotMatch(route, /#[0-9a-fA-F]{3,6}\b/);

console.log('Production PDF runtime contract passed.');
