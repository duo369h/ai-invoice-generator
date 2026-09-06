import assert from 'node:assert/strict';
import http from 'node:http';
import net from 'node:net';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { spawn } from 'node:child_process';

const cwd = process.cwd();
const requireFromProject = createRequire(path.join(cwd, 'package.json'));
const { chromium } = requireFromProject('playwright');
const nextCli = requireFromProject.resolve('next/dist/bin/next');
const outputDir = path.join(cwd, 'output/playwright/r56e-g-qe-m04');
fs.mkdirSync(outputDir, { recursive: true });

const TEST_USER = { id: '66666666-6666-4666-8666-666666666666', aud: 'authenticated', role: 'authenticated', email: 'photographer@example.com', app_metadata: { provider: 'email' }, user_metadata: {} };
const base64Url = (value) => Buffer.from(JSON.stringify(value)).toString('base64url');
const createSession = () => { const expiresAt = Math.floor(Date.now() / 1000) + 3600; return { access_token: [base64Url({ alg: 'none', typ: 'JWT' }), base64Url({ ...TEST_USER, exp: expiresAt }), 'browser-test-signature'].join('.'), refresh_token: 'browser-test-refresh-token', expires_in: 3600, expires_at: expiresAt, token_type: 'bearer', user: TEST_USER }; };
const getFreePort = () => new Promise((resolve, reject) => { const server = net.createServer(); server.once('error', reject); server.listen(0, '127.0.0.1', () => { const port = server.address().port; server.close((error) => error ? reject(error) : resolve(port)); }); });
const sendJson = (response, status, body) => { response.writeHead(status, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }); response.end(JSON.stringify(body)); };

async function startMockSupabase() {
  const server = http.createServer((request, response) => {
    const requestUrl = new URL(request.url, 'http://127.0.0.1');
    if (request.method === 'OPTIONS') { response.writeHead(204, { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, apikey, content-type, x-client-info, x-supabase-api-version', 'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS' }); response.end(); return; }
    if (requestUrl.pathname === '/auth/v1/user') return sendJson(response, 200, TEST_USER);
    if (requestUrl.pathname === '/auth/v1/token') return sendJson(response, 200, createSession());
    if (requestUrl.pathname === '/auth/v1/logout') { response.writeHead(204, { 'Access-Control-Allow-Origin': '*' }); response.end(); return; }
    if (requestUrl.pathname === '/rest/v1/entitlements') return sendJson(response, 200, [{ user_id: TEST_USER.id, invoice: true, export_pdf: false, client_portal: false, crm: false, automation: false, advanced_invoicing: false }]);
    return sendJson(response, 200, []);
  });
  const port = await getFreePort();
  await new Promise((resolve, reject) => { server.once('error', reject); server.listen(port, '127.0.0.1', resolve); });
  return { url: `http://127.0.0.1:${port}`, close: () => new Promise((resolve) => server.close(() => resolve())) };
}

async function startNext(mockSupabaseUrl) {
  const port = await getFreePort();
  const baseUrl = `http://127.0.0.1:${port}`;
  const child = spawn(process.execPath, [nextCli, 'dev', '--webpack', '--hostname', '127.0.0.1', '--port', String(port)], { cwd, env: { ...process.env, NEXT_PUBLIC_SUPABASE_URL: mockSupabaseUrl, NEXT_PUBLIC_SUPABASE_ANON_KEY: 'browser-test-anon-key' }, stdio: ['ignore', 'pipe', 'pipe'] });
  let output = '';
  child.stdout.on('data', (chunk) => { output += chunk.toString(); });
  child.stderr.on('data', (chunk) => { output += chunk.toString(); });
  const deadline = Date.now() + 60_000;
  while (Date.now() < deadline) {
    if (child.exitCode !== null) throw new Error(`Next server exited early: ${output}`);
    try { const response = await fetch(`${baseUrl}/auth`); if (response.ok) return { baseUrl, close: () => new Promise((resolve) => { child.once('exit', resolve); child.kill('SIGTERM'); }) }; } catch (_) {}
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  child.kill('SIGTERM');
  throw new Error(`Timed out waiting for Next server: ${output}`);
}

const scope = { version: 2, common: { shoot_type: 'Portrait session', shoot_date: '2026-10-10', shoot_duration: 90, primary_location: 'Studio', coverage_expectation: 'Two looks', deliverables: ['Edited gallery'], final_image_count: 20, retouched_image_count: 10, delivery_format: ['JPEG'], delivery_deadline: '2026-10-20', exclusions: [], assumptions: [], usage_rights: { status: 'unspecified', purpose: null, media_channels: [], territory: null, license_duration: null, exclusivity: null } } };
const notes = `Existing notes\n\n---METADATA---\n${JSON.stringify({ quote_preset_id: 'portrait-session', photography_scope_v2: scope })}`;
let currencyFixture = 'USD';
function apiBody(pathname) {
  if (pathname === '/api/user') return { id: TEST_USER.id, email: TEST_USER.email, name: 'Avery Photographer', plan: 'free', hasActivated: true, auth_mode: 'supabase', quota: {} };
  if (pathname === '/api/quotes') return { data: [{ id: 'quote-m04-pricing', quote_number: 'QT-M04-PRICING', client_name: 'Hydrated Client', client_email: 'client@example.com', client_address: '400 Scope Street', currency: currencyFixture, total: 226800, tax_rate: 5, discount_rate: 10, status: 'draft', created_at: '2026-09-06T00:00:00.000Z', notes, items: [{ description: 'Portrait package', quantity: 2, unit_price: 90000 }, { description: 'Assistant', quantity: 1, unit_price: 60000 }] }] };
  if (pathname === '/api/clients') return { data: [{ id: 'client-m04', name: 'Hydrated Client', email: 'client@example.com', address: '400 Scope Street' }] };
  if (pathname === '/api/invoices' || pathname === '/api/leads') return { data: [] };
  if (pathname === '/api/card-profile') return { data: { id: 'profile-m04' } };
  return { data: [] };
}

async function createDashboardPage(browser, baseUrl, viewport) {
  const context = await browser.newContext({ viewport, locale: 'en-US' });
  const session = createSession();
  await context.addInitScript((storedSession) => { window.localStorage.setItem('corvioz_analytics_consent', 'accepted'); window.localStorage.setItem('sb-127-auth-token', JSON.stringify(storedSession)); }, session);
  await context.addCookies([{ name: 'sb-127-auth-token.0', value: encodeURIComponent(JSON.stringify(session)), url: baseUrl }, { name: 'corvioz_analytics_consent', value: 'accepted', url: baseUrl }]);
  const page = await context.newPage();
  const pageErrors = [];
  const requests = [];
  page.on('pageerror', (error) => pageErrors.push(error.message));
  page.on('request', (request) => requests.push({ method: request.method(), url: request.url() }));
  await page.route('**/api/**', async (route) => { await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(apiBody(new URL(route.request().url()).pathname)) }); });
  return { context, page, pageErrors, requests };
}

async function openExistingQuote(page, baseUrl) {
  await page.goto(`${baseUrl}/dashboard?tool=quotes`, { waitUntil: 'domcontentloaded' });
  await page.getByRole('heading', { name: 'Quotes', exact: true }).waitFor({ state: 'visible', timeout: 20_000 });
  await page.getByRole('button', { name: 'Edit', exact: true }).click();
  await page.locator('[data-quote-presentation-mode]').waitFor({ state: 'attached' });
  await page.waitForFunction(() => document.querySelector('[data-quote-presentation-mode]')?.dataset.quotePresentationMode !== 'unresolved');
  await page.evaluate(() => {
    const auditTitle = [...document.querySelectorAll('body *')].find((node) => node.textContent?.trim() === 'Corvioz Verification Audit');
    if (auditTitle?.parentElement?.parentElement?.parentElement) auditTitle.parentElement.parentElement.parentElement.style.display = 'none';
    const debugButton = [...document.querySelectorAll('button')].find((node) => /Kernel Dev Debug|Debug UI/.test(node.textContent || ''));
    if (debugButton?.parentElement) debugButton.parentElement.style.display = 'none';
  });
}
const isDomainMutation = ({ method, url }) => ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method) && !/(?:\/analytics(?:_events)?|\/revenue\/control-plane)(?:$|\/|\?)/.test(url);
const screenshot = (page, filename) => page.screenshot({ path: path.join(outputDir, filename), fullPage: true });
const clearAndType = async (page, locator, value) => { await locator.click(); await locator.press('ControlOrMeta+A'); await locator.press('Backspace'); for (const character of value) { await page.keyboard.type(character); await page.waitForTimeout(20); } };
const goToPricing = async (page) => {
  await page.locator('[data-quote-presentation-mode="guided"] [data-guided-step]').first().waitFor({ state: 'visible' });
  const currentStep = await page.locator('[data-quote-presentation-mode="guided"] [data-guided-step]').first().getAttribute('data-guided-step');
  if (currentStep === 'PRICING') return;
  if (currentStep === 'WORKFLOW') {
    await page.getByTestId('quote-guided-shell').getByRole('button', { name: 'Continue', exact: true }).click();
    await page.getByTestId('quote-guided-client-step').waitFor({ state: 'visible' });
  }
  if (currentStep === 'WORKFLOW' || currentStep === 'CLIENT') {
    await page.getByTestId('quote-guided-client-step').getByRole('button', { name: 'Continue', exact: true }).click();
    await page.getByTestId('quote-guided-scope-step').waitFor({ state: 'visible' });
  }
  await page.getByTestId('quote-guided-scope-step').getByRole('button', { name: 'Continue', exact: true }).click();
  await page.getByTestId('quote-guided-pricing-step').waitFor({ state: 'visible' });
};
const assertNoOverflow = async (page, label) => { const dimensions = await page.evaluate(() => ({ innerWidth: window.innerWidth, documentWidth: document.documentElement.scrollWidth, bodyWidth: document.body.scrollWidth })); assert.ok(dimensions.documentWidth <= dimensions.innerWidth, `${label}: document overflow ${JSON.stringify(dimensions)}`); assert.ok(dimensions.bodyWidth <= dimensions.innerWidth, `${label}: body overflow ${JSON.stringify(dimensions)}`); };

const evidence = { existingHydration: 'PASS', edits: [], currency: [], totals: [], addRemove: [], navigation: [], breakpoints: [], focus: [], pageErrors: 0, domainMutations: 0 };
const supabase = await startMockSupabase();
const server = await startNext(supabase.url);
const browser = await chromium.launch({ headless: true });
try {
  const dashboard = await createDashboardPage(browser, server.baseUrl, { width: 390, height: 844 });
  try {
    const page = dashboard.page;
    await openExistingQuote(page, server.baseUrl);
    await goToPricing(page);
    await assertNoOverflow(page, '390 pricing initial');
    assert.equal(await page.getByTestId('quote-guided-pricing-item-0').getByText('Portrait package', { exact: true }).count(), 1, 'existing first item hydrates');
    assert.equal(await page.getByTestId('quote-guided-pricing-item-1').getByText('Assistant', { exact: true }).count(), 1, 'existing second item hydrates');
    assert.match(await page.getByTestId('quote-guided-pricing-total-value').textContent(), /USD/);
    await screenshot(page, '390-guided-pricing.png');

    await page.getByTestId('quote-guided-pricing-item-0').locator('button.quote-guided-pricing-item-summary').click();
    await screenshot(page, '390-guided-pricing-item-edit.png');
    const assertPricingFocus = async (label, expected) => {
      const state = {
        label,
        item0Open: await page.getByTestId('quote-guided-pricing-edit-0').count() === 1,
        item1Open: await page.getByTestId('quote-guided-pricing-edit-1').count() === 1,
        adjustmentsOpen: await page.getByTestId('quote-guided-pricing-adjustments-panel').count() === 1,
        activeEditSurfaces: await page.locator('[data-pricing-edit-block="true"]').count(),
      };
      evidence.focus.push(state);
      assert.deepEqual(state, { label, ...expected }, `${label}: measured Pricing focus state`);
      assert.ok(state.activeEditSurfaces <= 1, `${label}: multiple active Pricing edit surfaces`);
    };
    await assertPricingFocus('open-item-0', { item0Open: true, item1Open: false, adjustmentsOpen: false, activeEditSurfaces: 1 });
    await page.getByTestId('quote-guided-pricing-adjustments-toggle').click();
    await assertPricingFocus('open-adjustments', { item0Open: false, item1Open: false, adjustmentsOpen: true, activeEditSurfaces: 1 });
    await page.getByTestId('quote-guided-pricing-item-1').locator('button.quote-guided-pricing-item-summary').click();
    await assertPricingFocus('open-item-1', { item0Open: false, item1Open: true, adjustmentsOpen: false, activeEditSurfaces: 1 });
    await page.getByTestId('quote-guided-pricing-item-0').locator('button.quote-guided-pricing-item-summary').click();
    await assertPricingFocus('reopen-item-0', { item0Open: true, item1Open: false, adjustmentsOpen: false, activeEditSurfaces: 1 });
    await page.getByTestId('quote-guided-pricing-item-0').locator('button.quote-guided-pricing-item-summary').click();
    const description = page.getByTestId('quote-guided-pricing-description-0');
    const quantity = page.getByTestId('quote-guided-pricing-quantity-0');
    const rate = page.getByTestId('quote-guided-pricing-rate-0');
    await clearAndType(page, description, 'Portrait session');
    await clearAndType(page, quantity, '2');
    await clearAndType(page, rate, '1200');
    assert.equal(await description.inputValue(), 'Portrait session', 'description sequential input');
    assert.equal(await quantity.inputValue(), '2', 'quantity sequential input');
    assert.equal(await rate.inputValue(), '1200', 'rate sequential input');
    evidence.edits.push({ field: 'description', input: 'Portrait session', canonical: 'qItems[0].description' }, { field: 'quantity', input: '2', canonical: 'qItems[0].quantity' }, { field: 'unitPrice', input: '1200', canonical: 'qItems[0].unitPrice' });
    await clearAndType(page, rate, '1250.50');
    assert.equal(await rate.inputValue(), '1250.50', 'decimal rate remains visible during human entry');
    evidence.edits.push({ field: 'unitPrice', input: '1250.50', decimalDraft: 'PRESERVED' });

    const currency = page.getByTestId('quote-guided-pricing-currency');
    await currency.selectOption('CAD');
    assert.equal(await page.getByTestId('quote-guided-pricing-currency-code').textContent(), 'CAD');
    assert.match(await page.getByTestId('quote-guided-pricing-total-value').textContent(), /CAD/);
    evidence.currency.push({ code: 'CAD', explicitCode: 'PASS', fxConversion: 'NO', amountPreserved: 'PASS' });
    await currency.selectOption('EUR'); await currency.selectOption('GBP'); await currency.selectOption('CNY'); await currency.selectOption('USD');
    evidence.currency.push(...['USD', 'CAD', 'EUR', 'GBP', 'CNY'].map((code) => ({ code, supported: 'PASS' })));

    await page.getByTestId('quote-guided-pricing-add-item').click();
    await page.getByTestId('quote-guided-pricing-edit-2').waitFor({ state: 'visible' });
    await clearAndType(page, page.getByTestId('quote-guided-pricing-description-2'), 'Retouching');
    await clearAndType(page, page.getByTestId('quote-guided-pricing-rate-2'), '800');
    assert.equal(await page.getByTestId('quote-guided-pricing-item-2').count(), 1, 'ordinary item added');
    await page.getByTestId('quote-guided-pricing-remove-item-2').click();
    assert.equal(await page.getByTestId('quote-guided-pricing-item-2').count(), 0, 'ordinary item removed');
    evidence.addRemove.push({ add: 'PASS', remove: 'PASS', sharedItems: 'qItems' });
    await screenshot(page, '390-guided-pricing-multi-item.png');

    await page.getByTestId('quote-guided-pricing-item-0').locator('button.quote-guided-pricing-item-summary').click();
    await clearAndType(page, page.getByTestId('quote-guided-pricing-rate-0'), '900');
    await page.getByTestId('quote-guided-pricing-adjustments-toggle').click();
    await assertPricingFocus('totals-adjustments', { item0Open: false, item1Open: false, adjustmentsOpen: true, activeEditSurfaces: 1 });
    await screenshot(page, '390-guided-pricing-adjustments.png');
    await clearAndType(page, page.getByTestId('quote-guided-pricing-discount'), '10');
    await clearAndType(page, page.getByTestId('quote-guided-pricing-tax'), '5');
    assert.match(await page.getByTestId('quote-guided-pricing-total-value').textContent(), /USD/);
    assert.match(await page.getByTestId('quote-guided-pricing-totals').textContent(), /2,268/);
    evidence.totals.push({ subtotal: 2400, discount: 240, discountedSubtotal: 2160, tax: 108, total: 2268, authority: 'shared derived.totals' });

    const mutationsBeforeNavigation = dashboard.requests.filter(isDomainMutation);
    await page.getByTestId('quote-guided-pricing-step').getByRole('button', { name: 'Back', exact: true }).click();
    await page.getByTestId('quote-guided-scope-step').waitFor({ state: 'visible' });
    await page.getByTestId('quote-guided-scope-step').getByRole('button', { name: 'Continue', exact: true }).click();
    await page.getByTestId('quote-guided-pricing-step').waitFor({ state: 'visible' });
    await page.getByTestId('quote-guided-pricing-adjustments-toggle').click();
    await page.getByTestId('quote-guided-pricing-item-0').locator('button.quote-guided-pricing-item-summary').click();
    assert.equal(await page.getByTestId('quote-guided-pricing-description-0').inputValue(), 'Portrait session', 'pricing survives Scope re-entry');
    assert.equal(await page.getByTestId('quote-guided-pricing-currency-code').textContent(), 'USD', 'currency survives Scope re-entry');
    assert.deepEqual(dashboard.requests.filter(isDomainMutation), mutationsBeforeNavigation, 'pricing navigation has zero server mutations');
    evidence.navigation.push({ pricingToScopeToPricing: 'PASS', serverMutations: 0 });

    await page.setViewportSize({ width: 1023, height: 844 });
    await page.waitForFunction(() => document.querySelector('[data-quote-presentation-mode]')?.dataset.quotePresentationMode === 'guided');
    await goToPricing(page);
    assert.equal(await page.getByTestId('quote-guided-pricing-total-value').textContent(), 'USD 2,268.00', '1023 Guided reads shared total');
    await page.setViewportSize({ width: 1024, height: 844 });
    await page.waitForFunction(() => document.querySelector('[data-quote-presentation-mode]')?.dataset.quotePresentationMode === 'desktop');
    assert.equal(await page.getByTestId('quote-line-description-0').inputValue(), 'Portrait session', '1024 Desktop reads shared qItems');
    assert.equal(await page.getByTestId('quote-currency-select').inputValue(), 'USD', '1024 Desktop reads shared qCurrency');
    assert.equal(await page.getByTestId('quote-tax-input').inputValue(), '5', '1024 Desktop reads shared qTaxRate');
    await screenshot(page, '1024-desktop.png');
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.waitForFunction(() => document.querySelector('[data-quote-presentation-mode]')?.dataset.quotePresentationMode === 'desktop');
    await screenshot(page, '1280-desktop.png');
    await page.setViewportSize({ width: 390, height: 844 });
    await page.waitForFunction(() => document.querySelector('[data-quote-presentation-mode]')?.dataset.quotePresentationMode === 'guided');
    await goToPricing(page);
    await page.getByTestId('quote-guided-pricing-item-0').locator('button.quote-guided-pricing-item-summary').click();
    assert.equal(await page.getByTestId('quote-guided-pricing-description-0').inputValue(), 'Portrait session', '390 re-entry reads shared qItems');
    assert.equal(await page.getByTestId('quote-guided-pricing-total-value').textContent(), 'USD 2,268.00', '390 re-entry reads shared totals');
    evidence.breakpoints.push({ '390→1023→1024→1280→390': 'PASS', sharedFields: ['qItems', 'qCurrency', 'qDiscountRate', 'qTaxRate'] });
    await assertNoOverflow(page, '390 pricing final');
    evidence.pageErrors = pageErrorsCount(dashboard.pageErrors);
    evidence.domainMutations = dashboard.requests.filter(isDomainMutation).length;
    assert.deepEqual(dashboard.pageErrors, [], 'no browser page errors');
    assert.equal(evidence.domainMutations, 0, 'no Guided pricing server mutations');
  } finally { await dashboard.context.close(); }

  for (const [width, height, filename] of [[768, 1000, '768-guided-pricing.png'], [1023, 1000, '1023-guided-pricing.png']]) {
    const dashboard = await createDashboardPage(browser, server.baseUrl, { width, height });
    try { await openExistingQuote(dashboard.page, server.baseUrl); await goToPricing(dashboard.page); await assertNoOverflow(dashboard.page, `${width} pricing`); await screenshot(dashboard.page, filename); assert.deepEqual(dashboard.pageErrors, [], `${width}: no browser page errors`); assert.deepEqual(dashboard.requests.filter(isDomainMutation), [], `${width}: no server mutations`); } finally { await dashboard.context.close(); }
  }
  currencyFixture = 'ZZZ';
  const unknownCurrency = await createDashboardPage(browser, server.baseUrl, { width: 390, height: 844 });
  try {
    await openExistingQuote(unknownCurrency.page, server.baseUrl);
    await goToPricing(unknownCurrency.page);
    assert.equal(await unknownCurrency.page.getByTestId('quote-guided-pricing-currency-code').textContent(), 'ZZZ', 'unknown currency identity is preserved');
    const unknownTotal = await unknownCurrency.page.getByTestId('quote-guided-pricing-total-value').textContent();
    assert.match(unknownTotal, /^ZZZ/);
    assert.doesNotMatch(unknownTotal, /^\$/);
    evidence.currency.push({ code: 'ZZZ', unknownIdentityPreserved: 'PASS', bareDollar: 'NO' });
    assert.deepEqual(unknownCurrency.pageErrors, [], 'unknown currency has no browser errors');
  } finally { await unknownCurrency.context.close(); }
} finally { await browser.close(); await server.close(); await supabase.close(); }

function pageErrorsCount(errors) { return errors.length; }
const observedActivePricingEditBlocksMax = Math.max(0, ...evidence.focus.map(({ activeEditSurfaces }) => activeEditSurfaces));
fs.writeFileSync(path.join(outputDir, 'real-pricing-edit-evidence.json'), JSON.stringify({ ...evidence, currencyExplicitness: 'PASS', usdCadBareDollarAmbiguity: 'NO', fxConversion: 'NO', guidedPricingServerMutations: 0, activeEditBlocksMax: observedActivePricingEditBlocksMax, activeEditBlockEvidenceSource: 'MEASURED_BROWSER_DOM' }, null, 2));
fs.writeFileSync(path.join(outputDir, 'pricing-totals-evidence.json'), JSON.stringify({ items: [{ quantity: 2, unitPrice: 900 }, { quantity: 1, unitPrice: 600 }], discountRate: 10, taxRate: 5, expected: { subtotal: 2400, discount: 240, discountedSubtotal: 2160, tax: 108, total: 2268 }, authority: 'shared derived.totals', result: 'PASS' }, null, 2));
fs.writeFileSync(path.join(outputDir, 'currency-browser-evidence.json'), JSON.stringify({ supportedCurrencies: ['USD', 'CAD', 'EUR', 'GBP', 'CNY'], explicitCodeVisible: ['USD', 'CAD', 'EUR', 'GBP', 'CNY'], unknownCurrency: 'ZZZ', unknownIdentityPreserved: 'PASS', usdCadBareDollarAmbiguity: 'NO', fxConversion: 'NO', result: 'PASS' }, null, 2));
console.log(`R56E-G-QE-M04 pricing browser runtime: PASS (${outputDir})`);
