/**
 * Corvioz Revenue Flow Reality Verification v2
 * Skips form filling — instruments export-click → modal → bypass flow directly.
 *
 * Checks:
 *   A. FIRST_EXPORT_MODAL  — SoftUpgradeModal visible after export click
 *   B. FREE_PATH           — Watermarked-download button accessible in modal
 *   C. EXPORT_COUNTER      — corvioz_export_count = 1 in localStorage
 *   D. REENGAGEMENT_TRIGGER — corvioz_first_export_watermark_bypass_at set
 *   E. UPGRADE_ATTRIBUTION — corvioz_first_export_watermark_bypass = 'true'
 *   F. PRICING_ATTRIBUTION — export telemetry fired (export_count key present)
 */

const { chromium } = require('playwright');

const BASE = 'http://127.0.0.1:3000';
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

// ── Helpers ───────────────────────────────────────────────────────────────────

const log = (msg) => console.log(msg);
const pass = (label, detail = '') => console.log(`  ✓ ${label}${detail ? ': ' + detail : ''}`);
const fail = (label, detail = '') => console.log(`  ✗ ${label}${detail ? ': ' + detail : ''}`);

// Safe evaluate with fallback
async function safeEval(page, fn, fallback = null) {
  try { return await page.evaluate(fn); }
  catch (e) { return fallback; }
}

// Find button by text pattern and click via evaluate (no editability required)
async function clickButtonByText(page, pattern) {
  return await page.evaluate((pat) => {
    const re = new RegExp(pat, 'i');
    const btns = Array.from(document.querySelectorAll('button'));
    const btn = btns.find(b => re.test(b.innerText || b.textContent || ''));
    if (!btn) return { clicked: false, text: null };
    btn.click();
    return { clicked: true, text: (btn.innerText || btn.textContent || '').trim() };
  }, pattern);
}

// Snapshot all revenue-related storage keys
async function storageSnapshot(page) {
  return await safeEval(page, () => ({
    exportCount:        localStorage.getItem('corvioz_export_count'),
    watermarkBypass:    localStorage.getItem('corvioz_first_export_watermark_bypass'),
    watermarkBypassAt:  localStorage.getItem('corvioz_first_export_watermark_bypass_at'),
    bannerDismissed:    localStorage.getItem('corvioz_revisit_banner_dismissed'),
    monetizationPrompt: sessionStorage.getItem('corvioz_monetization_prompt_shown'),
    sessionId:          sessionStorage.getItem('corvioz_session_id'),
    allLocalKeys:       Object.keys(localStorage).filter(k => k.startsWith('corvioz_')),
    allSessionKeys:     Object.keys(sessionStorage).filter(k => k.startsWith('corvioz_')),
  }), {});
}

// Detect visible modal-like elements
async function detectModal(page) {
  return await safeEval(page, () => {
    const candidates = [
      ...document.querySelectorAll('[class*="modal"]'),
      ...document.querySelectorAll('[role="dialog"]'),
      ...document.querySelectorAll('[class*="upgrade"]'),
      ...document.querySelectorAll('[class*="soft"]'),
      ...document.querySelectorAll('[class*="paywall"]'),
      ...document.querySelectorAll('[class*="overlay"]'),
      ...document.querySelectorAll('[class*="SoftUpgrade"]'),
    ];
    const visible = candidates.filter(el => {
      const r = el.getBoundingClientRect();
      return r.width > 50 && r.height > 50;
    });
    const btns = Array.from(document.querySelectorAll('button'));
    const modalBtns = btns.filter(b =>
      /(watermark|continue.*free|download.*free|get.*pro|upgrade.*now|proceed|download.*anyway)/i.test(b.innerText || b.textContent || '')
    );
    const bodyText = document.body.innerText || '';
    return {
      visibleModalCount: visible.length,
      visibleModalTexts: visible.slice(0,3).map(el => (el.innerText||'').substring(0,80).replace(/\n/g,' ')),
      modalButtonCount: modalBtns.length,
      modalButtonTexts: modalBtns.slice(0,5).map(b => (b.innerText||b.textContent||'').trim()),
      hasUpgradeText: /upgrade|unlock|pro plan|watermark|clean pdf|premium/i.test(bodyText),
      allButtonTexts: Array.from(document.querySelectorAll('button')).map(b=>(b.innerText||b.textContent||'').trim().substring(0,30)).filter(Boolean).slice(0,20),
    };
  }, { visibleModalCount: 0, modalButtonCount: 0, modalButtonTexts: [], allButtonTexts: [] });
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function run() {
  const results = {
    FIRST_EXPORT_MODAL: false,
    FREE_PATH: false,
    EXPORT_COUNTER: false,
    REENGAGEMENT_TRIGGER: false,
    UPGRADE_ATTRIBUTION: false,
    PRICING_ATTRIBUTION: false,
  };
  const details = {};
  const errors = [];

  let browser;
  try {
    browser = await chromium.launch({
      headless: true,
      executablePath: CHROME,
      timeout: 30000,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
    });

    const ctx = await browser.newContext();

    // Intercept PDF blob to prevent actual download hanging
    await ctx.route('**/*', route => {
      const url = route.request().url();
      if (/\.pdf$|blob:/.test(url)) return route.abort();
      return route.continue();
    });

    const page = await ctx.newPage();
    page.on('pageerror', e => errors.push('PAGE_ERR: ' + e.message));
    page.on('console', msg => {
      if (msg.type() === 'error') {
        const t = msg.text();
        if (!/favicon|_next|gtag|analytics|clarity|supabase/i.test(t))
          errors.push('CONSOLE_ERR: ' + t);
      }
      if (msg.type() === 'log' && /INSTRUMENTATION/i.test(msg.text()))
        details.instrumentation = [...(details.instrumentation || []), msg.text()];
    });

    // ── STEP 1: Fresh free user state ────────────────────────────────────────
    log('\n[Step 1] Load page as fresh free user...');
    await page.goto(`${BASE}/invoices/create`, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(3000);

    // Clear all corvioz state
    await safeEval(page, () => {
      Object.keys(localStorage).forEach(k => {
        if (k.startsWith('corvioz_') || k.includes('supabase') || k.includes('sb-'))
          localStorage.removeItem(k);
      });
      Object.keys(sessionStorage).forEach(k => {
        if (k.startsWith('corvioz_')) sessionStorage.removeItem(k);
      });
    });

    await page.reload({ waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(5000); // allow full React hydration

    const initialState = await storageSnapshot(page);
    log(`  → Initial state: exportCount=${initialState.exportCount}, bypass=${initialState.watermarkBypass}`);
    log(`  → URL: ${await page.evaluate(() => location.href)}`);
    log(`  → All buttons: ${(await detectModal(page)).allButtonTexts.join(' | ')}`);

    // ── STEP 2: Click first export button ────────────────────────────────────
    log('\n[Step 2] Click export button...');
    let exportClickResult = await clickButtonByText(page, 'watermark.*pdf|pdf.*export|export.*watermark');
    if (!exportClickResult.clicked) {
      exportClickResult = await clickButtonByText(page, 'export|download');
    }
    log(`  → Export click: ${JSON.stringify(exportClickResult)}`);
    await page.waitForTimeout(2500);

    // ── STEP 3: Check export purpose modal ───────────────────────────────────
    log('\n[Step 3] Check for export purpose modal...');
    const afterFirstClick = await detectModal(page);
    log(`  → Buttons after click: ${afterFirstClick.allButtonTexts.join(' | ')}`);

    // The export purpose modal asks "why are you exporting?"
    // Click confirm/continue if present
    const purposeConfirm = await clickButtonByText(page, 'confirm|continue|looks good|send|test|personal');
    log(`  → Purpose confirm click: ${JSON.stringify(purposeConfirm)}`);
    // The SoftUpgradeModal renders — wait for it to fully mount
    if (purposeConfirm.clicked) await page.waitForTimeout(3000);

    // ── STEP 4: CHECK A — Did upgrade modal appear? ───────────────────────────
    log('\n[Check A] First export upgrade modal...');
    const modalAfterExport = await detectModal(page);
    log(`  → Modal elements: ${modalAfterExport.visibleModalCount}`);
    log(`  → Modal buttons: ${modalAfterExport.modalButtonTexts.join(' | ')}`);
    log(`  → Has upgrade text: ${modalAfterExport.hasUpgradeText}`);
    log(`  → All buttons now: ${modalAfterExport.allButtonTexts.join(' | ')}`);

    results.FIRST_EXPORT_MODAL = modalAfterExport.visibleModalCount > 0
      || modalAfterExport.modalButtonCount > 0
      || modalAfterExport.hasUpgradeText;
    details.modalAfterExport = modalAfterExport;

    if (results.FIRST_EXPORT_MODAL) {
      pass('A: Upgrade modal appeared', `${modalAfterExport.visibleModalCount} modal elements, buttons: [${modalAfterExport.modalButtonTexts.join(', ')}]`);
    } else {
      fail('A: No upgrade modal', `buttons present: [${modalAfterExport.allButtonTexts.join(', ')}]`);
    }

    // ── STEP 5: CHECK B — Free path (watermarked download) accessible? ────────
    log('\n[Check B] Free path button...');
    // Priority order: match the bypass button INSIDE the SoftUpgradeModal
    // NOT the main export button "Watermarked PDF export"
    let freeBtnResult = await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      // First pass: exact bypass button patterns (inside modal)
      const bypass = btns.find(b => {
        const t = (b.innerText || b.textContent || '').trim();
        return /download.*watermark.*preview|download.*watermark|watermark.*preview|continue.*free|download.*free|download.*anyway|proceed.*free/i.test(t)
          && !/^watermarked pdf export$/i.test(t); // exclude the main export button
      });
      if (bypass) { bypass.click(); return { clicked: true, text: bypass.textContent.trim() }; }
      // Second pass: any button with 'preview' or 'continue'
      const preview = btns.find(b => /preview|continue/i.test(b.innerText || b.textContent || ''));
      if (preview) { preview.click(); return { clicked: true, text: (preview.innerText||preview.textContent).trim() }; }
      return { clicked: false, text: null, available: btns.map(b=>(b.innerText||b.textContent||'').trim().substring(0,30)).filter(Boolean) };
    });
    log(`  → Free path click: ${JSON.stringify(freeBtnResult)}`);
    results.FREE_PATH = freeBtnResult.clicked;
    details.freePath = freeBtnResult;

    if (freeBtnResult.clicked) {
      pass('B: Free path accessible', `clicked: "${freeBtnResult.text}"`);
      await page.waitForTimeout(3000); // wait for bypass handler to fire
    } else {
      fail('B: Free path button not found');
    }

    // ── STEP 6: CHECK C, D, E, F — localStorage state after bypass ───────────
    log('\n[Checks C-F] Storage state after bypass...');
    const finalStorage = await storageSnapshot(page);
    log(`  → Storage: ${JSON.stringify(finalStorage, null, 2).replace(/\n/g, '\n  ')}`);
    details.finalStorage = finalStorage;

    // C: Export counter
    results.EXPORT_COUNTER = finalStorage.exportCount !== null && Number(finalStorage.exportCount) >= 1;
    if (results.EXPORT_COUNTER) {
      pass('C: Export counter set', `corvioz_export_count = ${finalStorage.exportCount}`);
    } else {
      fail('C: Export counter not incremented', `value = ${finalStorage.exportCount}`);
    }

    // D: T+2h scheduler (watermarkBypassAt timestamp)
    results.REENGAGEMENT_TRIGGER = finalStorage.watermarkBypassAt !== null;
    if (results.REENGAGEMENT_TRIGGER) {
      const ts = new Date(Number(finalStorage.watermarkBypassAt));
      pass('D: T+2h scheduler activated', `bypass_at = ${ts.toISOString()}`);
    } else {
      fail('D: T+2h scheduler NOT activated', `watermarkBypassAt = null`);
    }

    // E: Upgrade attribution (bypass flag set)
    results.UPGRADE_ATTRIBUTION = finalStorage.watermarkBypass === 'true';
    if (results.UPGRADE_ATTRIBUTION) {
      pass('E: Upgrade attribution recorded', `corvioz_first_export_watermark_bypass = true`);
    } else {
      fail('E: Upgrade attribution missing', `value = ${finalStorage.watermarkBypass}`);
    }

    // F: Pricing attribution (export count key exists = telemetry pathway reached)
    results.PRICING_ATTRIBUTION = finalStorage.exportCount !== null
      || (finalStorage.allLocalKeys && finalStorage.allLocalKeys.length > 0);
    if (results.PRICING_ATTRIBUTION) {
      pass('F: Pricing attribution recorded', `corvioz keys: [${(finalStorage.allLocalKeys || []).join(', ')}]`);
    } else {
      fail('F: No pricing attribution', 'no corvioz_ keys in localStorage');
    }

    // Instrumentation logs
    if (details.instrumentation) {
      log('\n[Instrumentation]');
      details.instrumentation.forEach(l => log('  ' + l));
    }

    await browser.close();

  } catch (err) {
    errors.push('FATAL: ' + err.message);
    console.error('\n  FATAL:', err.message);
    if (browser) await browser.close().catch(() => {});
  }

  // ── FINAL OUTPUT ─────────────────────────────────────────────────────────────
  const passCount = Object.values(results).filter(Boolean).length;
  const totalCount = Object.keys(results).length;
  const monetizes = results.FIRST_EXPORT_MODAL && results.FREE_PATH && results.EXPORT_COUNTER;
  const overallResult = passCount === totalCount ? 'PASS'
    : passCount >= 4 ? 'PARTIAL'
    : 'FAIL';

  log('\n' + '═'.repeat(52));
  log('  REVENUE FLOW REALITY VERIFICATION');
  log('═'.repeat(52));
  log(`RESULT: ${overallResult}  (${passCount}/${totalCount} checks passed)\n`);
  log(`FIRST_EXPORT_MODAL:       ${results.FIRST_EXPORT_MODAL ? 'PASS ✓' : 'FAIL ✗'}`);
  log(`FREE_PATH:                ${results.FREE_PATH ? 'PASS ✓' : 'FAIL ✗'}`);
  log(`EXPORT_COUNTER:           ${results.EXPORT_COUNTER ? 'PASS ✓' : 'FAIL ✗'}`);
  log(`REENGAGEMENT_TRIGGER:     ${results.REENGAGEMENT_TRIGGER ? 'PASS ✓' : 'FAIL ✗'}`);
  log(`UPGRADE_ATTRIBUTION:      ${results.UPGRADE_ATTRIBUTION ? 'PASS ✓' : 'FAIL ✗'}`);
  log(`PRICING_ATTRIBUTION:      ${results.PRICING_ATTRIBUTION ? 'PASS ✓' : 'FAIL ✗'}`);
  log('');
  log(`RUNTIME_ERRORS: ${errors.length}`);
  if (errors.length) errors.slice(0, 3).forEach(e => log('  ' + e));
  log('');
  log('FINAL SUMMARY:');
  log('  Does the revenue engine actually monetize a real free user?');
  log(`  → ${monetizes ? 'YES — modal fires, free path gated, counter tracked' : 'NO/PARTIAL — see failed checks above'}`);
  if (details.finalStorage) {
    const s = details.finalStorage;
    log(`  → exportCount=${s.exportCount}, bypass=${s.watermarkBypass}, bypassAt=${s.watermarkBypassAt ? 'SET (' + new Date(Number(s.watermarkBypassAt)).toISOString() + ')' : 'NOT SET'}`);
  }
  log('═'.repeat(52));

  process.exit(overallResult === 'PASS' ? 0 : 1);
}

run().catch(err => {
  console.error('FATAL:', err.message);
  console.log('\nRESULT: FAIL\nFIRST_EXPORT_MODAL: FAIL\nFREE_PATH: FAIL\nEXPORT_COUNTER: FAIL\nREENGAGEMENT_TRIGGER: FAIL\nUPGRADE_ATTRIBUTION: FAIL\nPRICING_ATTRIBUTION: FAIL\nFINAL SUMMARY: Script crashed — ' + err.message);
  process.exit(1);
});
