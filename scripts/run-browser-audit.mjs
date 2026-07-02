import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const artifactDir = '/Users/duo/.gemini/antigravity-ide/brain/15897dc3-eb01-4ad1-ae0f-65648cc0ba66';
const screenshotDir = path.join(artifactDir, 'screenshots');

if (!fs.existsSync(screenshotDir)) {
  fs.mkdirSync(screenshotDir, { recursive: true });
}

async function auditPage(browser, url, pageName) {
  const page = await browser.newPage();
  const consoleMessages = [];
  const pageErrors = [];
  const networkFailures = [];

  page.on('console', msg => {
    if (msg.type() === 'error' || msg.type() === 'warning') {
      consoleMessages.push(`[${msg.type().toUpperCase()}] ${msg.text()}`);
    }
  });

  page.on('pageerror', err => {
    pageErrors.push(err.stack || err.message);
  });

  page.on('requestfailed', req => {
    const failure = req.failure();
    networkFailures.push(`${req.method()} ${req.url()} - ${failure ? failure.errorText : 'failed'}`);
  });

  const startTime = Date.now();
  console.log(`Auditing ${pageName} (${url})...`);
  
  let statusCode = null;
  try {
    const response = await page.goto(url, { waitUntil: 'networkidle', timeout: 15000 });
    statusCode = response ? response.status() : null;
  } catch (err) {
    pageErrors.push(`Failed to navigate: ${err.message}`);
  }

  const loadTime = Date.now() - startTime;

  // Take screenshot
  const screenshotPath = path.join(screenshotDir, `${pageName.toLowerCase()}_view.png`);
  await page.screenshot({ path: screenshotPath, fullPage: true });

  // Get SEO and DOM checks
  let seo = {};
  try {
    seo = await page.evaluate(() => {
      const title = document.title;
      const h1 = document.querySelector('h1')?.innerText || 'None';
      const metaDesc = document.querySelector('meta[name="description"]')?.getAttribute('content') || 'None';
      return { title, h1, metaDesc };
    });
  } catch (_) {}

  // Check v8 safe growth decision state in localStorage
  let growthDecisionState = null;
  try {
    growthDecisionState = await page.evaluate(() => {
      // Find keys in localStorage
      const keys = {};
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k.startsWith('corvioz_')) {
          keys[k] = localStorage.getItem(k);
        }
      }
      return keys;
    });
  } catch (_) {}

  await page.close();

  return {
    url,
    pageName,
    statusCode,
    loadTime,
    seo,
    consoleMessages,
    pageErrors,
    networkFailures,
    growthDecisionState,
    screenshotPath: `screenshots/${pageName.toLowerCase()}_view.png`
  };
}

async function runAudit() {
  const browser = await chromium.launch({ headless: true });
  
  const results = [];
  
  // Audit Homepage
  results.push(await auditPage(browser, 'http://localhost:3000', 'Homepage'));
  
  // Audit Pricing Page
  results.push(await auditPage(browser, 'http://localhost:3000/pricing', 'Pricing'));
  
  // Audit Dashboard
  results.push(await auditPage(browser, 'http://localhost:3000/dashboard', 'Dashboard'));

  await browser.close();

  // Generate Markdown Report
  let mdReport = `# Corvioz Website Live Browser Audit Report\n\n`;
  mdReport += `Generated on: ${new Date().toLocaleString()}\n`;
  mdReport += `Local server: http://localhost:3000\n\n`;
  
  mdReport += `## Summary of Pages Audited\n\n`;
  mdReport += `| Page | URL | Status | Load Time (ms) | Console Warnings/Errors | Page Crashes | Network Failures |\n`;
  mdReport += `| --- | --- | --- | --- | --- | --- | --- |\n`;
  
  for (const r of results) {
    mdReport += `| **${r.pageName}** | [${r.url}](${r.url}) | ${r.statusCode || 'Timeout'} | ${r.loadTime} | ${r.consoleMessages.length} | ${r.pageErrors.length} | ${r.networkFailures.length} |\n`;
  }
  mdReport += `\n---\n\n`;

  for (const r of results) {
    mdReport += `## Page: ${r.pageName}\n\n`;
    mdReport += `- **URL**: ${r.url}\n`;
    mdReport += `- **Load Time**: ${r.loadTime} ms\n`;
    mdReport += `- **SEO Title**: \`${r.seo.title || 'Missing'}\`\n`;
    mdReport += `- **SEO H1**: \`${r.seo.h1 || 'Missing'}\`\n`;
    mdReport += `- **Meta Description**: \`${r.seo.metaDesc || 'Missing'}\`\n`;
    mdReport += `- **Screenshot Path**: \`${r.screenshotPath}\`\n\n`;

    if (r.pageErrors.length > 0) {
      mdReport += `### 🔴 Page Crashes / Exceptions (${r.pageErrors.length})\n\`\`\`\n`;
      r.pageErrors.forEach(err => { mdReport += `${err}\n`; });
      mdReport += `\`\`\`\n\n`;
    }

    if (r.consoleMessages.length > 0) {
      mdReport += `### ⚠️ Console Warnings & Errors (${r.consoleMessages.length})\n\`\`\`\n`;
      r.consoleMessages.forEach(msg => { mdReport += `${msg}\n`; });
      mdReport += `\`\`\`\n\n`;
    }

    if (r.networkFailures.length > 0) {
      mdReport += `### ❌ Network Failures (${r.networkFailures.length})\n\`\`\`\n`;
      r.networkFailures.forEach(fail => { mdReport += `${fail}\n`; });
      mdReport += `\`\`\`\n\n`;
    }

    if (r.growthDecisionState && Object.keys(r.growthDecisionState).length > 0) {
      mdReport += `### 🧠 Local Cache States (v8 Safe Growth & History)\n\`\`\`json\n`;
      mdReport += JSON.stringify(r.growthDecisionState, null, 2);
      mdReport += `\n\`\`\`\n\n`;
    }

    mdReport += `\n---\n\n`;
  }

  const reportFilePath = path.join(artifactDir, 'website_audit_report.md');
  fs.writeFileSync(reportFilePath, mdReport, 'utf8');
  console.log(`\nAudit completed successfully! Report written to: ${reportFilePath}`);
}

runAudit().catch(err => {
  console.error('Audit script failed:', err);
  process.exit(1);
});
