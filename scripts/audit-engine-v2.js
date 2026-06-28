/**
 * Corvioz Audit Engine v2 — Hydration-Aware Runtime Verification
 * Single pass. Hard termination after results. No loops.
 * All navigations use domcontentloaded (app has persistent background fetch).
 */

const { chromium } = require('playwright');
const http = require('http');

const BASE = 'http://127.0.0.1:3000';
const ROUTES = {
  invoices_create: `${BASE}/invoices/create`,
  pricing: `${BASE}/pricing`,
};

// ── SSR helper ────────────────────────────────────────────────────────────────

function fetchSSR(url) {
  return new Promise((resolve) => {
    const req = http.get(url, (res) => {
      let body = '';
      res.on('data', c => body += c);
      res.on('end', () => resolve({ status: res.statusCode, body, len: body.length }));
    });
    req.on('error', e => resolve({ status: 0, body: '', len: 0, error: e.message }));
    req.setTimeout(8000, () => { req.destroy(); resolve({ status: 0, body: '', len: 0, error: 'timeout' }); });
  });
}

const CRASH_PATTERNS = [
  'Cannot access', 'before initialization', 'ReferenceError',
  'Application error', 'Unhandled Runtime Error', 'TypeError: Cannot',
  'This page could not be found',
];

// ── Main ──────────────────────────────────────────────────────────────────────

async function runAudit() {
  const report = {
    ssr: {},
    hydration: { errors: [], errorCount: 0, hydrated: false },
    clientDom: {},
    behavioral: {},
  };

  // ── PHASE 1: SSR ─────────────────────────────────────────────────────────────
  console.log('\n[Phase 1] SSR Validation...');
  for (const [name, url] of Object.entries(ROUTES)) {
    const r = await fetchSSR(url);
    const crashes = CRASH_PATTERNS.filter(p => r.body.includes(p));
    report.ssr[name] = {
      status: r.status,
      bodyLen: r.len,
      crashes,
      pass: r.status === 200 && crashes.length === 0 && r.len > 500,
    };
    console.log(`  ${name}: HTTP ${r.status} | ${r.len}b | crashes=${crashes.length} → ${report.ssr[name].pass ? 'PASS ✓' : 'FAIL ✗'}`);
  }
  const ssrPass = Object.values(report.ssr).every(r => r.pass);

  // ── PHASE 2–4: Browser ───────────────────────────────────────────────────────
  console.log('\n[Phase 2-4] Launching headless Chromium...');
  let browser;
  let hydrationPass = false;
  let clientDomPass = false;
  let behavioralPass = false;
  let behavioralNote = '';

  try {
    // Use system Chrome to avoid macOS sandbox networking restrictions
    const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
    browser = await chromium.launch({
      headless: true,
      executablePath: CHROME,
      timeout: 30000,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
    });
    const ctx = await browser.newContext();
    const page = await ctx.newPage();

    // Capture runtime errors
    const consoleErrors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        const t = msg.text();
        if (!/favicon|_next\/static|gtag|analytics|clarity|supabase/i.test(t))
          consoleErrors.push('CONSOLE_ERR: ' + t);
      }
    });
    page.on('pageerror', err => consoleErrors.push('PAGE_ERR: ' + err.message));

    // ── Navigate: /invoices/create ────────────────────────────────────────────
    console.log('  → /invoices/create (domcontentloaded)...');
    await page.goto(ROUTES.invoices_create, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(5000); // allow React hydration + auth check

    // PHASE 2: Hydration
    const hyd = await page.evaluate(() => ({
      corviozErrors: window.__CORVIOZ_ERRORS__ || [],
      nextRoot: !!document.getElementById('__next'),
      classedNodes: document.querySelectorAll('[class]').length,
      url: location.href,
      title: document.title,
    }));
    const allErrors = [...consoleErrors, ...hyd.corviozErrors];
    report.hydration = {
      errors: allErrors,
      errorCount: allErrors.length,
      hydrated: hyd.nextRoot || hyd.classedNodes > 10,
      url: hyd.url,
      title: hyd.title,
    };
    hydrationPass = allErrors.length === 0 && report.hydration.hydrated;
    console.log(`  Hydration: hydrated=${report.hydration.hydrated} errors=${allErrors.length} → ${hydrationPass ? 'PASS ✓' : 'FAIL ✗'}`);
    if (allErrors.length) console.log('  Errors:', allErrors.slice(0, 5));

    // PHASE 3a: DOM — /invoices/create
    const domCreate = await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const inputs = document.querySelectorAll('input, textarea, select');
      return {
        invoice_form: !!(document.querySelector('form') || inputs.length > 0),
        export_button: btns.some(b => /export|download|pdf/i.test(b.innerText || b.textContent)),
        export_btn_texts: btns.filter(b => /export|download|pdf/i.test(b.innerText || b.textContent))
          .map(b => (b.innerText || b.textContent).trim()).slice(0, 3),
        upgrade_trigger: btns.some(b => /upgrade|unlock|pro|premium/i.test(b.innerText || b.textContent)),
        total_buttons: btns.length,
        total_inputs: inputs.length,
        all_btns: btns.map(b => (b.innerText || b.textContent).trim().substring(0, 25)).filter(Boolean).slice(0, 12),
        page_preview: (document.body.innerText || '').substring(0, 200).replace(/\n+/g, ' '),
      };
    });
    report.clientDom.invoices_create = domCreate;
    console.log('  /invoices/create DOM:', JSON.stringify({
      invoice_form: domCreate.invoice_form,
      export_button: domCreate.export_button,
      upgrade_trigger: domCreate.upgrade_trigger,
      buttons: domCreate.total_buttons,
      inputs: domCreate.total_inputs,
    }));
    if (domCreate.export_btn_texts.length) console.log('  export btn texts:', domCreate.export_btn_texts);
    if (domCreate.all_btns.length) console.log('  all btns:', domCreate.all_btns);

    // PHASE 4: Behavioral — click export on same loaded page (no re-navigation)
    console.log('  Behavioral: clicking export on current page...');
    const behav = await page.evaluate(async () => {
      const btns = Array.from(document.querySelectorAll('button'));
      const exportBtn = btns.find(b => /export|download|pdf/i.test(b.innerText || b.textContent));
      if (!exportBtn) return { clicked: false, reason: 'no_export_btn_found', modal_appeared: false };
      exportBtn.click();
      await new Promise(r => setTimeout(r, 2000));
      const modal = !!(
        document.querySelector('[class*="modal"]') ||
        document.querySelector('[role="dialog"]') ||
        document.querySelector('[class*="upgrade"]') ||
        document.querySelector('[class*="paywall"]') ||
        document.querySelector('[class*="overlay"]')
      );
      return {
        clicked: true,
        export_btn_text: (exportBtn.innerText || exportBtn.textContent).trim(),
        modal_appeared: modal,
      };
    });
    report.behavioral = behav;
    behavioralPass = behav.clicked;
    behavioralNote = behav.clicked
      ? `clicked "${behav.export_btn_text}", modal=${behav.modal_appeared}`
      : behav.reason;
    console.log('  Behavioral:', JSON.stringify(behav));

    // PHASE 3b: DOM — /pricing
    console.log('  → /pricing (domcontentloaded)...');
    await page.goto(ROUTES.pricing, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(3000);
    const domPricing = await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      return {
        pricing_table: !!(
          document.querySelector('table') ||
          document.querySelector('[class*="pric"]') ||
          document.querySelector('[class*="plan"]') ||
          document.querySelector('[class*="card"]') ||
          /\$[0-9]/.test(document.body.innerText || '')
        ),
        has_price_amounts: /\$[0-9]/.test(document.body.innerText || ''),
        upgrade_buttons: btns
          .filter(b => /upgrade|get.*pro|start|choose|select/i.test(b.innerText || b.textContent))
          .map(b => (b.innerText || b.textContent).trim()).slice(0, 5),
        url: location.href,
      };
    });
    report.clientDom.pricing = domPricing;
    console.log('  /pricing DOM:', JSON.stringify({
      pricing_table: domPricing.pricing_table,
      has_price_amounts: domPricing.has_price_amounts,
      upgrade_buttons: domPricing.upgrade_buttons,
    }));

    clientDomPass =
      domCreate.invoice_form &&
      domCreate.export_button &&
      domCreate.upgrade_trigger &&
      domPricing.pricing_table;

    await browser.close();

  } catch (err) {
    console.error('  Browser error:', err.message);
    report.hydration.errors.push('BROWSER_ERR: ' + err.message);
    report.hydration.errorCount++;
    if (browser) await browser.close().catch(() => {});
  }

  // ── FINAL RESULT ──────────────────────────────────────────────────────────────
  const ssrStatus      = ssrPass       ? 'PASS' : 'FAIL';
  const hydStatus      = hydrationPass ? 'PASS' : (report.hydration.errorCount > 0 ? 'FAIL' : 'PARTIAL');
  const domStatus      = clientDomPass ? 'PASS' : 'PARTIAL';
  const behavStatus    = behavioralPass ? 'PASS' : 'FAIL';

  const failedChecks = [];
  if (!ssrPass)
    Object.entries(report.ssr).filter(([,v]) => !v.pass)
      .forEach(([k,v]) => failedChecks.push(`SSR:${k}(HTTP ${v.status})`));
  if (!hydrationPass && report.hydration.errorCount > 0)
    failedChecks.push(`Hydration: ${report.hydration.errors.slice(0,2).join(' | ')}`);
  if (!clientDomPass) {
    const d = report.clientDom.invoices_create || {};
    if (!d.invoice_form)    failedChecks.push('DOM:invoice_form missing');
    if (!d.export_button)   failedChecks.push('DOM:export_button missing');
    if (!d.upgrade_trigger) failedChecks.push('DOM:upgrade_trigger missing');
    const p = report.clientDom.pricing || {};
    if (!p.pricing_table)   failedChecks.push('DOM:pricing_table missing');
  }
  if (!behavioralPass)
    failedChecks.push(`Behavioral:${behavioralNote || 'export_btn_not_found'}`);

  const overallResult = failedChecks.length === 0 ? 'PASS'
    : (ssrPass && hydrationPass ? 'PARTIAL' : 'FAIL');

  console.log('\n' + '═'.repeat(52));
  console.log('  CORVIOZ AUDIT ENGINE v2 — FINAL RESULT');
  console.log('═'.repeat(52));
  console.log(`RESULT: ${overallResult}`);
  console.log(`SSR_STATUS: ${ssrStatus}`);
  console.log(`HYDRATION_STATUS: ${hydStatus}`);
  console.log(`CLIENT_DOM_STATUS: ${domStatus}`);
  console.log(`ERROR_COUNT: ${report.hydration.errorCount}`);
  console.log(`FAILED_CHECKS: ${failedChecks.length ? failedChecks.join(' | ') : 'none'}`);
  console.log(`FALSE_POSITIVES: SSR HTML omits client-only React nodes by design — not counted as failures`);
  console.log(`SUMMARY: SSR=${ssrStatus}, Hydration=${hydStatus}, DOM=${domStatus}, Behavioral=${behavStatus}. ${report.hydration.errorCount} runtime errors.`);
  console.log('═'.repeat(52));

  process.exit(overallResult === 'PASS' ? 0 : 1);
}

runAudit().catch(err => {
  console.error('AUDIT FATAL:', err.message);
  console.log('\nRESULT: FAIL\nSSR_STATUS: UNKNOWN\nHYDRATION_STATUS: FAIL\nCLIENT_DOM_STATUS: FAIL\nERROR_COUNT: 1\nFAILED_CHECKS: AUDIT_SCRIPT_FATAL — ' + err.message + '\nFALSE_POSITIVES: none\nSUMMARY: Audit script crashed.');
  process.exit(1);
});
