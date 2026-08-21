import assert from 'node:assert/strict';
import fs from 'node:fs';

const route = fs.readFileSync('src/app/api/pdf/export/route.js', 'utf8');
const nextConfig = fs.readFileSync('next.config.mjs', 'utf8');
const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));

assert.equal(packageJson.dependencies['@sparticuz/chromium'], '149.0.0');
assert.equal(packageJson.dependencies['puppeteer-core'], '25.8.0');
assert.equal(packageJson.dependencies['playwright-core'], undefined);
assert.match(route, /const isServerless = process\.env\.VERCEL === "1"/);
assert.match(route, /import\("puppeteer-core"\)/);
assert.match(route, /import\("@sparticuz\/chromium"\)/);
assert.match(route, /executablePath: await serverlessChromium\.executablePath\(\)/);
assert.match(route, /args: serverlessChromium\.args/);
assert.match(route, /headless: "shell"/);
assert.match(route, /page\.setViewport\(/);
assert.match(route, /waitUntil: isServerless \? "networkidle0" : "networkidle"/);
assert.match(nextConfig, /serverExternalPackages: \['@sparticuz\/chromium', 'puppeteer-core'\]/);
assert.match(nextConfig, /'\/api\/pdf\/export': \['\.\/node_modules\/@sparticuz\/chromium\/bin\/\*\*\/\*'\]/);
assert.match(route, /import\("playwright"\)/, 'Local development must retain the installed Playwright browser path');
assert.match(route, /if \(branding !== "branded"\) return html;/, 'Clean paid PDFs must not receive Free branding');
assert.doesNotMatch(route, /style="/);
assert.doesNotMatch(route, /#[0-9a-fA-F]{3,6}\b/);

console.log('Production PDF runtime contract passed.');
