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
const evidenceDir = path.join(cwd, 'output/playwright/r56e-g-qe-pro-impl-fix1');
fs.mkdirSync(evidenceDir, { recursive: true });

const TEST_USER = { id: '56565656-5656-4656-8656-565656565656', email: 'avery@example.com', aud: 'authenticated', role: 'authenticated', app_metadata: { provider: 'email' }, user_metadata: {} };
const base64Url = (value) => Buffer.from(JSON.stringify(value)).toString('base64url');
const createSession = () => { const expiresAt = Math.floor(Date.now() / 1000) + 3600; return { access_token: [base64Url({ alg: 'none', typ: 'JWT' }), base64Url({ ...TEST_USER, exp: expiresAt }), 'test-signature'].join('.'), refresh_token: 'test-refresh-token', expires_in: 3600, expires_at: expiresAt, token_type: 'bearer', user: TEST_USER }; };
const getFreePort = () => new Promise((resolve, reject) => { const server = net.createServer(); server.once('error', reject); server.listen(0, '127.0.0.1', () => { const port = server.address().port; server.close((error) => error ? reject(error) : resolve(port)); }); });
const sendJson = (response, status, body) => { response.writeHead(status, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }); response.end(JSON.stringify(body)); };
const metadataNotes = () => `Payment due within 30 days.\n\n---METADATA---\n${JSON.stringify({ quote_preset_id: 'commercial-shoot', quote_preset_name: 'Commercial Shoot', photography_scope_v2: { version: 2, common: { usage_rights: { status: 'specified', media_channels: ['Digital'], territory: 'North America', license_duration: '12 months' } } }, quote_provenance_v1: { canonical_authority: { authority: 'photographer', confirmation_action: 'explicit_quote_save' } } })}`;
const makeQuote = () => ({
  id: 'quote-qty-fix1', quote_number: 'QT-QTY-FIX1', client_name: 'North Star Outdoor Co.', client_email: 'mara@northstar.example', client_address: '58 Mercer Street, New York, NY', currency: 'USD', total: 8400, tax_rate: 8.25, discount_rate: 0, status: 'draft', notes: metadataNotes(),
  items: [
    { description: 'Studio', quantity: 2, billingUnit: 'day', unit_price: 250000 },
    { description: 'Retouching', quantity: 8, billingUnit: 'image', unit_price: 12000 },
    { description: 'Photo Assistant', quantity: 2, billingUnit: 'person', unit_price: 50000, secondaryQuantity: 2, secondaryUnit: 'day' },
    { description: 'Mystery Custom Item', quantity: 4, unit_price: 10000 },
    { description: 'Zero Item', quantity: 0, unit_price: 10000 },
  ],
});

async function startMockSupabase() {
  const server = http.createServer((request, response) => {
    const url = new URL(request.url, 'http://127.0.0.1');
    if (request.method === 'OPTIONS') { response.writeHead(204, { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': '*', 'Access-Control-Allow-Methods': '*' }); response.end(); return; }
    if (url.pathname === '/auth/v1/user') return sendJson(response, 200, TEST_USER);
    if (url.pathname === '/auth/v1/token') return sendJson(response, 200, createSession());
    if (url.pathname === '/auth/v1/logout') { response.writeHead(204); response.end(); return; }
    if (url.pathname === '/rest/v1/entitlements') return sendJson(response, 200, [{ user_id: TEST_USER.id, invoice: true, export_pdf: true, pdf_branding: true, client_portal: true, crm: true, advanced_invoicing: true }]);
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

async function createDashboardPage(browser, baseUrl, quote) {
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 }, locale: 'en-US' });
  const session = createSession();
  await context.addInitScript((storedSession) => { window.localStorage.setItem('corvioz_analytics_consent', 'accepted'); window.localStorage.setItem('sb-127-auth-token', JSON.stringify(storedSession)); }, session);
  await context.addCookies([{ name: 'sb-127-auth-token.0', value: encodeURIComponent(JSON.stringify(session)), url: baseUrl }, { name: 'corvioz_analytics_consent', value: 'accepted', url: baseUrl }]);
  const page = await context.newPage();
  const pageErrors = [];
  let persistedQuote = structuredClone(quote);
  page.on('pageerror', (error) => pageErrors.push(error.message));
  await page.route('**/api/**', async (route) => {
    const request = route.request();
    const pathname = new URL(request.url()).pathname;
    if (pathname === '/api/quotes' && request.method() === 'GET') return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ data: [persistedQuote] }) });
    if (pathname === '/api/quotes' && ['POST', 'PUT'].includes(request.method())) {
      const patch = request.postDataJSON();
      persistedQuote = { ...persistedQuote, ...patch, items: patch.items || persistedQuote.items };
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(persistedQuote) });
    }
    if (pathname === '/api/user') return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ id: TEST_USER.id, email: TEST_USER.email, name: 'Avery Hart', plan: 'pro', hasActivated: true, auth_mode: 'supabase', quota: {} }) });
    if (pathname === '/api/user/entitlements') return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ invoice: true, export_pdf: true, pdf_branding: true, client_portal: true, crm: true }) });
    return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ data: [] }) });
  });
  return { context, page, pageErrors };
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

async function screenshot(page, filename) { await page.screenshot({ path: path.join(evidenceDir, filename), fullPage: false }); }
const row = (page, index) => page.locator('.professional-paper-layer.is-front').getByTestId(`professional-pricing-row-${index}`);
const menuOptions = async (page, index) => {
  const menu = page.getByTestId(`professional-qty-unit-menu-${index}-primary`);
  await menu.waitFor({ state: 'visible' });
  return menu.locator('button').allTextContents();
};

const supabase = await startMockSupabase();
const server = await startNext(supabase.url);
const browser = await chromium.launch({ headless: true });
try {
  const dashboard = await createDashboardPage(browser, server.baseUrl, makeQuote());
  try {
    await openExistingQuote(dashboard.page, server.baseUrl);
    const front = dashboard.page.locator('.professional-paper-layer.is-front');

    await row(dashboard.page, 0).getByTestId('professional-qty-factor-0-primary').click();
    const wheelTwo = front.getByTestId('professional-qty-wheel-0-primary');
    assert.deepEqual(await wheelTwo.locator('.professional-qty-wheel-ghost').allTextContents(), ['3', '1'], 'current=2 has only adjacent ghost values');
    assert.equal(await wheelTwo.locator('input').inputValue(), '2', 'current=2 remains the actual editable center input');
    assert.equal(await wheelTwo.locator('.professional-qty-wheel-ghost').filter({ hasText: '2' }).count(), 0, 'current=2 is not duplicated in ghost values');
    const activeTypography = await wheelTwo.evaluate((element) => {
      const input = element.querySelector('input');
      const ghost = element.querySelector('.professional-qty-wheel-ghost');
      const inputStyle = getComputedStyle(input);
      const ghostStyle = getComputedStyle(ghost);
      return { currentFontSize: parseFloat(inputStyle.fontSize), currentFontWeight: inputStyle.fontWeight, ghostFontSize: parseFloat(ghostStyle.fontSize) };
    });
    const restingTypography = await front.getByTestId('professional-qty-factor-1-primary').evaluate((element) => {
      const style = getComputedStyle(element);
      return { fontSize: parseFloat(style.fontSize), fontWeight: style.fontWeight };
    });
    assert.ok(Math.abs(activeTypography.currentFontSize - restingTypography.fontSize) <= 0.5, `active current value should match resting QTY size: ${JSON.stringify({ activeTypography, restingTypography })}`);
    assert.equal(activeTypography.currentFontWeight, restingTypography.fontWeight, 'active current value should retain resting QTY weight');
    const ghostRatio = activeTypography.ghostFontSize / activeTypography.currentFontSize;
    assert.ok(ghostRatio >= 0.65 && ghostRatio <= 0.75, `ghost size should be 65–75% of current value: ${ghostRatio}`);
    await screenshot(dashboard.page, '01-WHEEL-CURRENT-2.png');
    await dashboard.page.locator('.professional-editor-title').click();

    await row(dashboard.page, 4).getByTestId('professional-qty-factor-4-primary').click();
    const wheelZero = front.getByTestId('professional-qty-wheel-4-primary');
    assert.deepEqual(await wheelZero.locator('.professional-qty-wheel-ghost').allTextContents(), ['1'], 'current=0 has only the positive top ghost');
    assert.equal(await wheelZero.locator('input').inputValue(), '0', 'current=0 remains the actual editable center input');
    assert.equal(await wheelZero.locator('.professional-qty-wheel-ghost').filter({ hasText: /-/ }).count(), 0, 'zero wheel never renders a negative ghost');
    await screenshot(dashboard.page, '02-WHEEL-CURRENT-0.png');
    await dashboard.page.locator('.professional-editor-title').click();

    await row(dashboard.page, 0).getByTestId('professional-qty-factor-0-primary').click();
    await front.getByTestId('professional-qty-unit-trigger-0-primary').click();
    const studioMenu = dashboard.page.getByTestId('professional-qty-unit-menu-0-primary');
    assert.deepEqual(await menuOptions(dashboard.page, 0), ['day', 'hour', 'No unit', 'More…'], 'Studio uses its contextual shortlist');
    await screenshot(dashboard.page, '03-STUDIO-SHORTLIST.png');
    await studioMenu.getByRole('button', { name: 'More…', exact: true }).click();
    assert.deepEqual(await menuOptions(dashboard.page, 0), ['No unit', 'day', 'hour', 'image', 'person', 'item'], 'More exposes the complete unit set');
    await screenshot(dashboard.page, '04-STUDIO-MORE-FULL-LIST.png');
    await studioMenu.getByRole('option', { name: 'item', exact: true }).click();
    await dashboard.page.locator('.professional-editor-title').click();

    await row(dashboard.page, 1).scrollIntoViewIfNeeded();
    await row(dashboard.page, 1).getByTestId('professional-qty-factor-1-primary').click();
    await front.getByTestId('professional-qty-unit-trigger-1-primary').click();
    assert.deepEqual(await menuOptions(dashboard.page, 1), ['image', 'hour', 'day', 'No unit', 'More…'], 'Retouching uses its contextual shortlist');
    await screenshot(dashboard.page, '05-RETOUCHING-SHORTLIST.png');
    await dashboard.page.getByTestId('professional-qty-unit-menu-1-primary').getByRole('option', { name: 'hour', exact: true }).click();
    await dashboard.page.locator('.professional-editor-title').click();

    await row(dashboard.page, 2).scrollIntoViewIfNeeded();
    await row(dashboard.page, 2).getByTestId('professional-qty-factor-2-primary').click();
    await front.getByTestId('professional-qty-unit-trigger-2-primary').click();
    assert.deepEqual(await menuOptions(dashboard.page, 2), ['person', 'day', 'hour', 'No unit', 'More…'], 'Photo Assistant uses its contextual shortlist');
    await screenshot(dashboard.page, '06-PHOTO-ASSISTANT-SHORTLIST.png');
    await dashboard.page.getByTestId('professional-qty-unit-menu-2-primary').getByRole('option', { name: 'day', exact: true }).click();
    await dashboard.page.locator('.professional-editor-title').click();

    await row(dashboard.page, 3).scrollIntoViewIfNeeded();
    await row(dashboard.page, 3).getByTestId('professional-qty-factor-3-primary').click();
    await front.getByTestId('professional-qty-unit-trigger-3-primary').click();
    assert.deepEqual(await menuOptions(dashboard.page, 3), ['No unit', 'day', 'hour', 'image', 'person', 'item'], 'Unknown custom items retain the general unit list');
    await screenshot(dashboard.page, '07-UNKNOWN-ITEM-GENERAL-MENU.png');
    await dashboard.page.getByTestId('professional-qty-unit-menu-3-primary').getByRole('option', { name: 'No unit', exact: true }).click();
    await dashboard.page.locator('.professional-editor-title').click();

    await row(dashboard.page, 2).scrollIntoViewIfNeeded();
    await row(dashboard.page, 2).getByTestId('professional-qty-factor-2-primary').click();
    assert.equal(await front.getByTestId('professional-qty-interaction-2-primary').count(), 1);
    assert.equal(await front.getByTestId('professional-qty-interaction-2-secondary').count(), 0);
    assert.equal(await front.getByTestId('professional-qty-factor-2-secondary').textContent(), '2 days');
    await screenshot(dashboard.page, '08-COMPOUND-PRIMARY-ACTIVE.png');
    await front.getByTestId('professional-qty-factor-2-secondary').click();
    assert.equal(await front.getByTestId('professional-qty-interaction-2-primary').count(), 0);
    assert.equal(await front.getByTestId('professional-qty-interaction-2-secondary').count(), 1);
    await screenshot(dashboard.page, '08-COMPOUND-SECONDARY-ACTIVE.png');
    await dashboard.page.locator('.professional-editor-title').click();

    await dashboard.page.getByRole('button', { name: 'Preview', exact: true }).click();
    assert.equal(await dashboard.page.locator('.professional-qty-wheel').count(), 0, 'read-only view has no wheel');
    assert.equal(await dashboard.page.locator('.professional-qty-unit-menu').count(), 0, 'read-only view has no unit menu');
    assert.equal(await dashboard.page.locator('.professional-qty-affordance').count(), 0, 'read-only view has no affordance chrome');
    await screenshot(dashboard.page, '09-READ-ONLY.png');
    assert.deepEqual(dashboard.pageErrors, []);
  } finally { await dashboard.context.close(); }
} finally {
  await browser.close();
  await server.close();
  await supabase.close();
}

console.log(`R56E-G-QE-PRO-IMPL-FIX1 browser runtime: PASS (${evidenceDir})`);
