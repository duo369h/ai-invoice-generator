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
const evidenceDir = path.join(cwd, 'output/playwright/r56e-g-qe-pro-impl-01');
const pdfDir = path.join(evidenceDir, 'pdf');
fs.mkdirSync(pdfDir, { recursive: true });

const TEST_USER = { id: '56565656-5656-4656-8656-565656565656', email: 'avery@example.com', aud: 'authenticated', role: 'authenticated', app_metadata: { provider: 'email' }, user_metadata: {} };
const base64Url = (value) => Buffer.from(JSON.stringify(value)).toString('base64url');
const createSession = () => { const expiresAt = Math.floor(Date.now() / 1000) + 3600; return { access_token: [base64Url({ alg: 'none', typ: 'JWT' }), base64Url({ ...TEST_USER, exp: expiresAt }), 'test-signature'].join('.'), refresh_token: 'test-refresh-token', expires_in: 3600, expires_at: expiresAt, token_type: 'bearer', user: TEST_USER }; };
const getFreePort = () => new Promise((resolve, reject) => { const server = net.createServer(); server.once('error', reject); server.listen(0, '127.0.0.1', () => { const port = server.address().port; server.close((error) => error ? reject(error) : resolve(port)); }); });
const sendJson = (response, status, body) => { response.writeHead(status, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }); response.end(JSON.stringify(body)); };

const scope = (specified = true) => ({ version: 2, common: { shoot_type: 'Autumn Brand Campaign', shoot_date: '2026-10-14', shoot_duration: 480, primary_location: 'Northlight Studio', coverage_expectation: 'Campaign stills and social crops', deliverables: ['24 retouched selects', 'Web gallery'], final_image_count: 24, retouched_image_count: 24, delivery_format: ['TIFF', 'JPEG'], delivery_deadline: '2026-10-28', exclusions: [], assumptions: [], usage_rights: { status: specified ? 'specified' : 'unspecified', purpose: specified ? 'Autumn brand campaign' : '', media_channels: specified ? ['Digital', 'Social'] : [], territory: specified ? 'North America' : '', license_duration: specified ? '12 months' : '', exclusivity: specified ? 'Non-exclusive' : '' } } });
const metadataNotes = (photographyScope) => `Payment due within 30 days.\n\n---METADATA---\n${JSON.stringify({ quote_preset_id: 'commercial-shoot', quote_preset_name: 'Commercial Shoot', photography_scope_v2: photographyScope, quote_provenance_v1: { canonical_authority: { authority: 'photographer', confirmation_action: 'explicit_quote_save' } } })}`;
const makeItems = (count) => {
  const names = ['Photography / Creative Fee', 'Producer', 'Photo Assistant', 'Digital Tech', 'Equipment / Lighting', 'Studio / Location', 'Props', 'Styling', 'Retouching', 'Travel / Expenses', 'Production Fee'];
  return Array.from({ length: count }, (_, index) => ({ description: count <= 3 ? ['Creative fee', 'Studio hire', 'Retouching'][index] : `${names[index % names.length]}${index >= names.length ? ` ${Math.floor(index / names.length) + 1}` : ''}`, quantity: index % 3 === 0 ? 2 : 1, unit_price: (650 + index * 85) * 100 }));
};
const makeQuote = ({ id = 'quote-pro', count = 3, specified = true, number = 'QT-2026-041' } = {}) => ({ id, quote_number: number, client_name: 'North Star Outdoor Co.', client_email: 'mara@northstar.example', client_address: '58 Mercer Street, New York, NY', currency: 'USD', total: 8400, tax_rate: 8.25, discount_rate: 0, status: 'draft', notes: metadataNotes(scope(specified)), items: makeItems(count) });

async function startMockSupabase() {
  const server = http.createServer((request, response) => {
    const url = new URL(request.url, 'http://127.0.0.1');
    if (request.method === 'OPTIONS') { response.writeHead(204, { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': '*', 'Access-Control-Allow-Methods': '*' }); response.end(); return; }
    if (url.pathname === '/auth/v1/user') return sendJson(response, 200, TEST_USER);
    if (url.pathname === '/auth/v1/token') return sendJson(response, 200, createSession());
    if (url.pathname === '/auth/v1/logout') { response.writeHead(204); response.end(); return; }
    if (url.pathname === '/rest/v1/entitlements') return sendJson(response, 200, [{ user_id: TEST_USER.id, invoice: true, export_pdf: true, pdf_branding: true, client_portal: true, crm: true, automation: false, advanced_invoicing: true }]);
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

async function createDashboardPage(browser, baseUrl, quote, viewport) {
  const context = await browser.newContext({ viewport, locale: 'en-US', acceptDownloads: true });
  const session = createSession();
  await context.addInitScript((storedSession) => { window.localStorage.setItem('corvioz_analytics_consent', 'accepted'); window.localStorage.setItem('sb-127-auth-token', JSON.stringify(storedSession)); }, session);
  await context.addCookies([{ name: 'sb-127-auth-token.0', value: encodeURIComponent(JSON.stringify(session)), url: baseUrl }, { name: 'corvioz_analytics_consent', value: 'accepted', url: baseUrl }]);
  const page = await context.newPage();
  const pageErrors = [];
  const requests = [];
  const pdfPayloads = [];
  let persistedQuote = structuredClone(quote);
  page.on('pageerror', (error) => pageErrors.push(error.message));
  page.on('request', (request) => requests.push({ method: request.method(), url: request.url() }));
  await page.route('**/api/**', async (route) => {
    const request = route.request();
    const pathname = new URL(request.url()).pathname;
    if (pathname === '/api/pdf/export' && request.method() === 'POST') {
      pdfPayloads.push(request.postDataJSON());
      return route.fulfill({ status: 200, contentType: 'application/pdf', body: '%PDF-1.4\n%%EOF' });
    }
    if (pathname === '/api/quotes' && request.method() === 'GET') return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ data: [persistedQuote] }) });
    if (pathname === '/api/quotes' && ['POST', 'PUT'].includes(request.method())) {
      const patch = request.postDataJSON();
      persistedQuote = { ...persistedQuote, ...patch, items: patch.items || persistedQuote.items };
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(persistedQuote) });
    }
    if (pathname === '/api/user') return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ id: TEST_USER.id, email: TEST_USER.email, name: 'Avery Hart', plan: 'pro', hasActivated: true, auth_mode: 'supabase', quota: {} }) });
    if (pathname === '/api/user/entitlements') return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ invoice: true, export_pdf: true, pdf_branding: true, client_portal: true, crm: true }) });
    if (pathname === '/api/clients' || pathname === '/api/invoices' || pathname === '/api/leads') return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ data: [] }) });
    if (pathname === '/api/card-profile') return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ data: { id: 'profile-pro' } }) });
    return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ data: [] }) });
  });
  return { context, page, pageErrors, requests, pdfPayloads };
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

async function screenshot(page, filename, fullPage = true) {
  await page.screenshot({ path: path.join(evidenceDir, filename), fullPage });
  if (/^0[6-9]-/.test(filename)) console.log(`BILLING_SCREENSHOT_WRITTEN ${filename}`);
}

async function assertNoHorizontalOverflow(page, label) {
  const size = await page.evaluate(() => ({ viewport: window.innerWidth, html: document.documentElement.scrollWidth, body: document.body.scrollWidth }));
  assert.ok(size.html <= size.viewport && size.body <= size.viewport, `${label}: horizontal overflow ${JSON.stringify(size)}`);
}

async function assertFiniteA4(page, expectedPages) {
  const pages = page.locator('.professional-paper-layer.is-front .quote-client-document-page');
  assert.equal(await pages.count(), expectedPages, `expected ${expectedPages} finite A4 page(s)`);
  const metrics = await pages.first().evaluate((element) => { const style = getComputedStyle(element); return { width: style.width, height: style.height, ratio: element.closest('[data-page-ratio]')?.getAttribute('data-page-ratio') }; });
  assert.deepEqual(metrics, { width: '794px', height: '1123px', ratio: '210:297' });
}

async function exportPdf(browser, dashboard, filename) {
  const { page, pdfPayloads } = dashboard;
  await page.getByRole('button', { name: 'Download PDF', exact: true }).click();
  const dialog = page.getByRole('dialog');
  await dialog.waitFor({ state: 'visible' });
  await Promise.all([
    page.waitForResponse((response) => response.url().includes('/api/pdf/export') && response.request().method() === 'POST'),
    dialog.getByRole('button', { name: 'Confirm & Export', exact: true }).click(),
  ]);
  assert.equal(pdfPayloads.length, 1, `${filename}: exact one PDF export payload`);
  const payload = pdfPayloads[0];
  assert.match(payload.html, /data-page-ratio="210:297"/);
  const pdfPage = await browser.newPage({ viewport: { width: 794, height: 1123 } });
  await pdfPage.setContent(payload.html, { waitUntil: 'load' });
  await pdfPage.emulateMedia({ media: 'print' });
  await pdfPage.pdf({ path: path.join(pdfDir, filename), width: '210mm', height: '297mm', printBackground: true, margin: { top: 0, right: 0, bottom: 0, left: 0 }, preferCSSPageSize: false });
  await pdfPage.close();
  return payload;
}

const supabase = await startMockSupabase();
const server = await startNext(supabase.url);
const browser = await chromium.launch({ headless: true });
const evidence = { devices: [], states: [], pdfs: [], assertions: [] };

try {
  const simple = await createDashboardPage(browser, server.baseUrl, makeQuote({ count: 3, specified: false }), { width: 1280, height: 900 });
  try {
    await openExistingQuote(simple.page, server.baseUrl);
    await simple.page.waitForTimeout(1200);
    assert.equal(await simple.page.locator('[data-quote-presentation-mode]').getAttribute('data-quote-presentation-mode'), 'desktop');
    await assertFiniteA4(simple.page, 1);
    await assertNoHorizontalOverflow(simple.page, '1280 desktop');
    assert.equal(await simple.page.locator('.professional-template-indexes button').count(), 7);
    assert.match(await simple.page.locator('.professional-editor-title').textContent(), /Saved/);
    assert.equal(await simple.page.getByRole('button', { name: 'Send Quote', exact: true }).count(), 1);
    await screenshot(simple.page, 'DESKTOP-1280-DEFAULT.png');

    const simplePaper = simple.page.locator('.professional-paper-layer.is-front');
    await simplePaper.getByTestId('professional-pricing-row-0').click();
    await simplePaper.getByTestId('quote-line-description-0').fill('Campaign creative fee — revised');
    await simple.page.evaluate(() => { window.__professionalEditorNode = document.querySelector('[data-testid="professional-quote-editor"]'); });
    assert.match(await simple.page.locator('.professional-editor-title').textContent(), /Unsaved changes/);
    assert.equal(await simple.page.getByRole('button', { name: 'Save', exact: true }).count(), 1);
    await screenshot(simple.page, 'ROW-EDIT.png', false);

    await simplePaper.getByTestId('professional-add-item').click();
    assert.equal(await simplePaper.locator('[data-testid^="professional-pricing-row-"]').count(), 4, 'opening Add Item creates one provisional row');
    assert.equal(await simplePaper.getByTestId('professional-add-item').count(), 0, 'Add item affordance yields to the provisional row');
    assert.equal(await simplePaper.getByTestId('professional-pricing-row-3').getAttribute('class'), 'quote-client-document-item-row is-editing', 'provisional row is active immediately');
    const summaryGeometryBeforeMenu = await simple.page.evaluate(() => {
      const paper = document.querySelector('.professional-paper-layer.is-front');
      const point = (selector) => {
        const element = paper?.querySelector(selector);
        if (!element) return null;
        const rect = element.getBoundingClientRect();
        return { top: rect.top + window.scrollY, left: rect.left + window.scrollX };
      };
      return { usage: point('[data-testid="professional-usage-summary"]'), total: point('.quote-client-document-total') };
    });
    assert.equal(await simplePaper.getByTestId('professional-add-item-suggestion-menu').count(), 1, 'Description focus opens a compact anchored menu');
    assert.ok(await simplePaper.locator('[data-testid^="professional-add-suggestion-"]').count() >= 8, 'existing safe suggestions provide a scrollable list');
    assert.equal(await simplePaper.getByTestId('professional-add-suggestion-custom').count(), 1, 'Custom discoverability entry is present');
    const suggestionMenuMetrics = await simplePaper.getByTestId('professional-add-item-suggestion-menu').evaluate((element) => {
      const style = getComputedStyle(element);
      return {
        flexDirection: style.flexDirection,
        flexWrap: style.flexWrap,
        overflowY: style.overflowY,
        overflowX: style.overflowX,
        scrollable: element.scrollHeight > element.clientHeight,
        width: element.getBoundingClientRect().width,
        descriptionWidth: element.closest('td')?.getBoundingClientRect().width,
      };
    });
    assert.equal(suggestionMenuMetrics.flexDirection, 'column', 'suggestions are one per row');
    assert.equal(suggestionMenuMetrics.flexWrap, 'nowrap', 'suggestions do not wrap into horizontal chips');
    assert.equal(suggestionMenuMetrics.overflowY, 'auto', 'suggestion menu scrolls vertically');
    assert.equal(suggestionMenuMetrics.overflowX, 'hidden', 'suggestion menu has no horizontal scroll');
    assert.equal(suggestionMenuMetrics.scrollable, true, 'long suggestion list is bounded and scrollable');
    assert.ok(suggestionMenuMetrics.width <= suggestionMenuMetrics.descriptionWidth + 1, 'suggestion menu follows the Description editing area');
    const summaryGeometryAfterMenu = await simple.page.evaluate(() => {
      const paper = document.querySelector('.professional-paper-layer.is-front');
      const point = (selector) => {
        const element = paper?.querySelector(selector);
        if (!element) return null;
        const rect = element.getBoundingClientRect();
        return { top: rect.top + window.scrollY, left: rect.left + window.scrollX };
      };
      return { usage: point('[data-testid="professional-usage-summary"]'), total: point('.quote-client-document-total') };
    });
    assert.deepEqual(summaryGeometryAfterMenu, summaryGeometryBeforeMenu, 'opening the menu does not reflow Usage or Total');
    assert.equal(await simple.page.evaluate(() => document.activeElement?.getAttribute('data-testid')), 'quote-line-description-3', 'Description is focused automatically');
    assert.equal(await simple.page.evaluate(() => window.__professionalEditorNode === document.querySelector('[data-testid="professional-quote-editor"]')), true, 'Add item preserves the mounted editor state');
    assert.match(await simple.page.locator('.professional-editor-title').textContent(), /Unsaved changes/);
    await simplePaper.getByTestId('professional-add-item-suggestion-menu').scrollIntoViewIfNeeded();
    await screenshot(simple.page, 'ADD-ITEM-PROVISIONAL.png', false);
    await screenshot(simple.page, 'ADD-ITEM-SUGGESTIONS.png', false);

    await simplePaper.getByTestId('professional-add-item-suggestion-menu').evaluate((element) => { element.scrollTop = element.scrollHeight; });
    assert.equal(await simplePaper.getByTestId('professional-add-suggestion-custom').isVisible(), true, 'Custom entry remains reachable after vertical scroll');
    await screenshot(simple.page, 'ADD-ITEM-LONG-MENU.png', false);
    await simplePaper.getByTestId('professional-add-suggestion-custom').click();
    assert.equal(await simplePaper.getByTestId('professional-add-item-suggestion-menu').count(), 0, 'Custom discoverability closes without creating a second editor');
    assert.equal(await simple.page.evaluate(() => document.activeElement?.getAttribute('data-testid')), 'quote-line-description-3', 'Custom discoverability preserves Description focus');
    await simplePaper.getByTestId('quote-line-description-3').fill('Food stylist');
    await screenshot(simple.page, 'ADD-ITEM-CUSTOM.png', false);
    await simplePaper.getByTestId('quote-line-description-3').blur();
    await simplePaper.getByTestId('quote-line-description-3').focus();
    await simplePaper.getByTestId('professional-add-item-suggestion-menu').scrollIntoViewIfNeeded();
    await simplePaper.locator('[data-testid^="professional-add-suggestion-"]').first().hover();
    await screenshot(simple.page, 'ADD-ITEM-SUGGESTION-HOVER.png', false);

    await simplePaper.locator('[data-testid^="professional-add-suggestion-"]').first().click();
    assert.equal(await simplePaper.locator('[data-testid^="professional-pricing-row-"]').count(), 4, 'suggestion creates exactly one qItem');
    assert.equal(await simplePaper.getByTestId('professional-pricing-row-3').getAttribute('class'), 'quote-client-document-item-row is-editing', 'suggestion makes the new row active');
    assert.match(await simplePaper.getByTestId('quote-line-description-3').inputValue(), /Photography|Assistant|Producer|Digital Tech/);
    assert.equal(await simplePaper.getByTestId('professional-add-item-suggestion-menu').count(), 0, 'suggestion selection closes the compact menu');
    await simplePaper.getByTestId('professional-pricing-row-3').scrollIntoViewIfNeeded();
    await screenshot(simple.page, 'ADD-ITEM-CREATED.png', false);

    await simplePaper.getByTestId('professional-add-item').click();
    assert.equal(await simplePaper.locator('[data-testid^="professional-pricing-row-"]').count(), 5, 'empty Add item row exists locally before cancellation');
    await simple.page.locator('.professional-editor-title').click();
    assert.equal(await simplePaper.locator('[data-testid^="professional-pricing-row-"]').count(), 4, 'outside click removes an empty provisional row');

    await simplePaper.getByTestId('professional-add-item').click();
    const customDescription = simplePaper.getByTestId('quote-line-description-4');
    await customDescription.fill('Food stylist');
    await simplePaper.getByTestId('professional-add-item-suggestion-menu').scrollIntoViewIfNeeded();
    await screenshot(simple.page, 'ADD-ITEM-CUSTOM.png', false);
    await simple.page.locator('.professional-editor-title').click();
    assert.equal(await simplePaper.locator('[data-testid^="professional-pricing-row-"]').count(), 5, 'non-empty provisional row remains after outside click');
    assert.match(await simplePaper.getByTestId('professional-pricing-row-4').locator('td').first().textContent(), /Food stylist/);
    assert.equal(await simplePaper.getByTestId('professional-add-item-suggestion-menu').count(), 0, 'outside click exits the active interaction');
    await simplePaper.getByTestId('professional-pricing-row-4').scrollIntoViewIfNeeded();
    await screenshot(simple.page, 'ADD-ITEM-CLICK-OUTSIDE.png', false);

    await simplePaper.getByTestId('professional-add-item').click();
    assert.equal(await simplePaper.locator('[data-testid^="professional-pricing-row-"]').count(), 6, 'second Add item creates a new provisional row');
    await simplePaper.getByTestId('quote-line-description-5').press('Escape');
    assert.equal(await simplePaper.locator('[data-testid^="professional-pricing-row-"]').count(), 5, 'Escape removes an empty provisional row');
    await simplePaper.getByTestId('professional-add-item').click();
    await simplePaper.getByTestId('quote-line-description-5').fill('Travel coordination');
    await simple.page.locator('.professional-editor-title').click();
    assert.equal(await simplePaper.locator('[data-testid^="professional-pricing-row-"]').count(), 6, 'non-empty custom row remains after outside click');
    await simplePaper.getByTestId('professional-add-item').hover();
    await screenshot(simple.page, 'ADD-ITEM-HOVER.png', false);
    await screenshot(simple.page, 'ADD-ITEM.png', false);

    const createdRow = simplePaper.getByTestId('professional-pricing-row-4');
    await createdRow.click();
    await simplePaper.getByTestId('professional-pricing-quantity-4').fill('2');
    await simplePaper.getByTestId('professional-pricing-rate-4').fill('1250');
    await simple.page.getByRole('button', { name: 'Save', exact: true }).click();
    await simple.page.getByText('Saved', { exact: true }).waitFor({ state: 'visible' });
    await openExistingQuote(simple.page, server.baseUrl);
    const reloadedCreatedRow = simple.page.locator('.professional-paper-layer.is-front').getByTestId('professional-pricing-row-4');
    assert.match(await reloadedCreatedRow.locator('td').first().textContent(), /Food stylist/);
    assert.equal((await reloadedCreatedRow.locator('td').nth(1).textContent()).trim(), '2', 'saved quantity survives reload');
    assert.match(await reloadedCreatedRow.locator('td').nth(2).textContent(), /1,250/);
    assert.match(await reloadedCreatedRow.locator('td').nth(3).textContent(), /2,500/);
    await screenshot(simple.page, 'ADD-ITEM-SAVED-RELOADED.png', false);
    await simple.page.locator('.professional-paper-layer.is-front').getByTestId('professional-pricing-row-0').click();
    await simple.page.locator('.professional-paper-layer.is-front').getByTestId('quote-line-description-0').fill('Campaign creative fee — revised again');
    await simple.page.evaluate(() => { window.__professionalEditorNode = document.querySelector('[data-testid="professional-quote-editor"]'); });

    assert.equal(await simplePaper.getByTestId('professional-intelligence').count(), 1);
    await screenshot(simple.page, 'INTELLIGENCE.png', false);
    await simplePaper.getByTestId('professional-usage-summary').click();
    await simple.page.getByTestId('professional-floating-sheet').waitFor({ state: 'visible' });
    await simple.page.waitForTimeout(250);
    const deepEditContinuity = await simple.page.evaluate(() => ({
      sameNode: window.__professionalEditorNode === document.querySelector('[data-testid="professional-quote-editor"]'),
      oldConnected: Boolean(window.__professionalEditorNode?.isConnected),
      mode: document.querySelector('[data-quote-presentation-mode]')?.getAttribute('data-quote-presentation-mode'),
      sheetCount: document.querySelectorAll('[data-testid="professional-floating-sheet"]').length,
      title: document.querySelector('.professional-editor-title')?.textContent,
      url: location.href,
      navigationCount: performance.getEntriesByType('navigation').length,
    }));
    assert.equal(deepEditContinuity.sameNode, true, 'Deep edit preserves the mounted editor state');
    assert.equal(deepEditContinuity.oldConnected, true, 'Deep edit keeps the prior editor DOM connected');
    assert.equal(deepEditContinuity.mode, 'desktop');
    assert.equal(deepEditContinuity.sheetCount, 1);
    assert.match(deepEditContinuity.title, /Unsaved changes/);
    assert.equal(deepEditContinuity.navigationCount, 1, 'Deep edit performs no navigation');
    assert.equal(await simple.page.locator('.professional-guidance-line').count(), 1);
    assert.match(await simple.page.locator('.professional-editor-title').textContent(), /Unsaved changes/);
    await screenshot(simple.page, 'DEEP-EDIT.png', false);
    assert.deepEqual(simple.pageErrors, []);
    evidence.states.push('default', 'row-edit', 'add-item', 'intelligence', 'deep-edit');
  } finally { await simple.context.close(); }

  const billingQuote = makeQuote({ id: 'quote-billing-basis', specified: true, number: 'QT-BILLING-001' });
  billingQuote.items = [
    { description: 'Photography Fee', quantity: 1, unit_price: 200000 },
    { description: 'Studio', quantity: 2, unit_price: 250000, billingUnit: 'day' },
    { description: 'Retouching', quantity: 8, unit_price: 12000, billingUnit: 'image' },
    { description: 'Post-production', quantity: 12, unit_price: 15000, billingUnit: 'hour' },
    { description: 'Photo Assistant', quantity: 2, unit_price: 50000, billingUnit: 'person', secondaryQuantity: 2, secondaryUnit: 'day' },
  ];
  const billing = await createDashboardPage(browser, server.baseUrl, billingQuote, { width: 1280, height: 900 });
  try {
    await openExistingQuote(billing.page, server.baseUrl);
    const front = billing.page.locator('.professional-paper-layer.is-front');
    const row = (index) => front.getByTestId(`professional-pricing-row-${index}`);
    const text = async (index, column) => (await row(index).locator('td').nth(column).innerText()).trim();
    assert.equal(await text(0, 1), '1'); assert.match(await text(0, 2), /2,000/); assert.match(await text(0, 3), /2,000/);
    assert.equal(await text(1, 1), '2 days'); assert.match(await text(1, 2), /2,500\.00\/day/); assert.match(await text(1, 3), /5,000/);
    assert.equal(await text(2, 1), '8 images'); assert.match(await text(2, 2), /120\.00\/image/); assert.match(await text(2, 3), /960/);
    assert.equal(await text(3, 1), '12 hours'); assert.match(await text(3, 2), /150\.00\/hour/); assert.match(await text(3, 3), /1,800/);
    assert.equal(await text(4, 1), '2 people × 2 days'); assert.match(await text(4, 2), /500\.00\/person\/day/); assert.match(await text(4, 3), /2,000/);
    for (const [index, name] of [[0, '01-SIMPLE-QTY.png'], [1, '02-DAY-BASIS.png'], [2, '03-IMAGE-BASIS.png'], [3, '04-HOUR-BASIS.png'], [4, '05-PEOPLE-DAYS.png']]) { await row(index).scrollIntoViewIfNeeded(); await screenshot(billing.page, name, false); }
    const reloaded = front;
    await reloaded.getByTestId('professional-pricing-row-4').click();
    await reloaded.getByTestId('professional-pricing-row-4').scrollIntoViewIfNeeded();
    await screenshot(billing.page, '06-ACTIVE-BASIS-CONTROL.png', false);
    const a4Forensic = await billing.page.locator('.professional-paper-layer.is-front .quote-client-document-page').evaluate((element) => {
      const boundary = element.getBoundingClientRect().right;
      const rootRect = element.getBoundingClientRect();
      const all = [element, ...element.querySelectorAll('*')];
      const overflowing = all.map((node) => {
        const rect = node.getBoundingClientRect();
        return { selector: node.id ? `#${node.id}` : node.dataset?.testid ? `[data-testid="${node.dataset.testid}"]` : node.className && typeof node.className === 'string' ? `.${node.className.trim().replace(/\\s+/g, '.')}` : node.tagName.toLowerCase(), left: rect.left, right: rect.right, width: rect.width, overflowPx: rect.right - boundary };
      }).filter((item) => item.overflowPx > 0.5);
      const scrollable = all.map((node) => { const rect = node.getBoundingClientRect(); return { selector: node.id ? `#${node.id}` : node.dataset?.testid ? `[data-testid="${node.dataset.testid}"]` : node.tagName.toLowerCase(), left: rect.left, right: rect.right, width: rect.width, clientWidth: node.clientWidth, scrollWidth: node.scrollWidth }; }).filter((item) => item.scrollWidth > item.clientWidth + 0.5);
      const pseudo = ['::before', '::after'].map((pseudoElement) => { const style = getComputedStyle(element, pseudoElement); return { pseudoElement, content: style.content, position: style.position, left: style.left, right: style.right, width: style.width, transform: style.transform }; }).filter((item) => item.content !== 'none');
      return { root: { left: rootRect.left, right: rootRect.right, width: rootRect.width }, clientWidth: element.clientWidth, scrollWidth: element.scrollWidth, boundary, overflowing, scrollable, pseudo };
    });
    console.log(`A4_FORENSIC ${JSON.stringify(a4Forensic)}`);
    const stress = { scrollWidth: a4Forensic.scrollWidth, clientWidth: a4Forensic.clientWidth };
    await billing.page.getByRole('button', { name: 'Preview', exact: true }).click();
    await billing.page.locator('.professional-paper-layer.is-front .quote-client-document-item-row').nth(4).scrollIntoViewIfNeeded();
    assert.equal(await billing.page.locator('.professional-row-billing-unit').count(), 0);
    assert.match(await billing.page.locator('.professional-paper-layer.is-front').getByTestId('professional-pricing-row-4').locator('td').nth(1).innerText(), /2 people × 2 days/);
    assert.match(await billing.page.locator('.professional-paper-layer.is-front').getByTestId('professional-pricing-row-4').locator('td').nth(2).innerText(), /500\.00\/person\/day/);
    await screenshot(billing.page, '07-READ-ONLY.png', false);
    await screenshot(billing.page, '08-A4-WIDTH-STRESS.png', false);
    await billing.page.getByRole('button', { name: 'Edit', exact: true }).click();
    await billing.page.locator('[data-quote-presentation-mode]').waitFor({ state: 'attached' });
    const reloadedEdit = billing.page.locator('.professional-paper-layer.is-front');
    await reloadedEdit.getByTestId('professional-pricing-row-4').click();
    await reloadedEdit.getByTestId('professional-pricing-unit-4').selectOption('');
    assert.equal(await reloaded.getByLabel('Secondary quantity for item 5').count(), 0);
    await screenshot(billing.page, '09-PRIMARY-UNIT-CLEARED.png', false);
    await billing.page.getByRole('button', { name: 'Save', exact: true }).click(); await billing.page.getByText('Saved', { exact: true }).waitFor({ state: 'visible' });
    await openExistingQuote(billing.page, server.baseUrl);
    assert.equal((await billing.page.locator('.professional-paper-layer.is-front').getByTestId('professional-pricing-row-4').locator('td').nth(1).innerText()).trim(), '2');
    const printable = billing.page.locator('.quote-printable-target');
    assert.equal(await printable.locator('.professional-row-billing-unit').count(), 0);
    assert.deepEqual(billing.pageErrors, []);
  } finally { await billing.context.close(); }

  const preparedForCheck = await createDashboardPage(browser, server.baseUrl, makeQuote({ id: 'quote-prepared-for', specified: true, number: 'QT-PREPARED-001' }), { width: 1280, height: 900 });
  try {
    await openExistingQuote(preparedForCheck.page, server.baseUrl);
    const front = preparedForCheck.page.locator('.professional-paper-layer.is-front');
    const preparedFor = front.getByTestId('quote-prepared-for');
    assert.equal(await preparedFor.getAttribute('data-prepared-for-active'), 'false', 'resting Prepared for is inactive');
    assert.equal(await preparedFor.locator('input').count(), 0, 'resting Prepared for has no editor fields');
    assert.equal(await preparedFor.evaluate((element) => getComputedStyle(element, '::after').opacity), '0', 'resting Prepared for has no visible cue');
    await screenshot(preparedForCheck.page, 'PREPARED-FOR-REST.png', false);

    await preparedFor.hover();
    await preparedFor.evaluate((element) => new Promise((resolve, reject) => {
      const deadline = performance.now() + 1000;
      const check = () => {
        const opacity = Number.parseFloat(getComputedStyle(element, '::after').opacity);
        if (opacity >= 0.999) return resolve();
        if (performance.now() >= deadline) return reject(new Error(`Prepared for hover did not settle at final opacity (actual=${opacity})`));
        requestAnimationFrame(check);
      };
      check();
    }), 'hover reveals only the contextual cue');
    await screenshot(preparedForCheck.page, 'PREPARED-FOR-HOVER.png', false);

    await preparedFor.click();
    assert.equal(await preparedFor.getAttribute('data-prepared-for-active'), 'true', 'click activates Prepared for locally');
    assert.equal(await preparedFor.getByLabel('Client name').count(), 1);
    assert.equal(await preparedFor.getByLabel('Client email').count(), 1);
    assert.equal(await preparedFor.getByLabel('Client address').count(), 1);
    await preparedFor.getByLabel('Client name').fill('North Star Outdoor Co. Revised');
    await preparedFor.getByLabel('Client email').fill('revised@northstar.example');
    await preparedFor.getByLabel('Client address').fill('60 Mercer Street, New York, NY');
    assert.match(await preparedForCheck.page.locator('.professional-editor-title').textContent(), /Unsaved changes/);
    await screenshot(preparedForCheck.page, 'PREPARED-FOR-ACTIVE.png', false);

    await preparedForCheck.page.locator('.professional-editor-title').click();
    assert.equal(await front.getByTestId('quote-prepared-for').getAttribute('data-prepared-for-active'), 'false', 'click outside deactivates Prepared for');
    assert.equal(await front.getByTestId('quote-prepared-for').locator('input').count(), 0, 'click outside restores document text');
    assert.match(await front.getByTestId('quote-prepared-for').textContent(), /North Star Outdoor Co\. Revised/);
    await screenshot(preparedForCheck.page, 'PREPARED-FOR-CLICK-OUTSIDE.png', false);

    const selectedText = await front.getByTestId('quote-prepared-for').locator('.quote-client-document-primary').evaluate((element) => {
      const range = document.createRange();
      range.selectNodeContents(element);
      const selection = window.getSelection();
      selection.removeAllRanges();
      selection.addRange(range);
      return selection.toString();
    });
    assert.equal(selectedText, 'North Star Outdoor Co. Revised', 'Prepared for content remains selectable at rest');
    assert.equal(await front.getByTestId('quote-prepared-for').getAttribute('data-prepared-for-active'), 'false', 'selection does not activate Prepared for');

    await preparedForCheck.page.getByRole('button', { name: 'Save', exact: true }).click();
    await preparedForCheck.page.getByText('Saved', { exact: true }).waitFor({ state: 'visible' });
    assert.ok(preparedForCheck.requests.some(({ method, url }) => ['POST', 'PUT'].includes(method) && url.includes('/api/quotes')), 'Prepared for Save uses the existing Quote path');
    await openExistingQuote(preparedForCheck.page, server.baseUrl);
    const reloadedPreparedFor = preparedForCheck.page.locator('.professional-paper-layer.is-front').getByTestId('quote-prepared-for');
    assert.equal(await reloadedPreparedFor.locator('input').count(), 0, 'reload returns Prepared for to clean document state');
    assert.match(await reloadedPreparedFor.textContent(), /North Star Outdoor Co\. Revised/);
    assert.match(await reloadedPreparedFor.textContent(), /revised@northstar\.example/);
    assert.match(await reloadedPreparedFor.textContent(), /60 Mercer Street/);
    assert.equal(await preparedForCheck.page.locator('.professional-paper-layer.is-front').getByLabel('Project').inputValue(), 'Autumn Brand Campaign', 'adjacent Project content remains unchanged');

    await preparedForCheck.page.getByRole('button', { name: 'Preview', exact: true }).click();
    const readOnlyPreparedFor = preparedForCheck.page.locator('.professional-paper-layer.is-front').getByTestId('quote-prepared-for');
    assert.equal(await readOnlyPreparedFor.locator('input').count(), 0, 'read-only Quote has no Prepared for editor fields');
    assert.equal(await readOnlyPreparedFor.getAttribute('data-prepared-for-active'), 'false', 'read-only Quote has no active editor state');
    assert.equal(await readOnlyPreparedFor.evaluate((element) => getComputedStyle(element, '::after').opacity), '0', 'read-only Quote has no editor cue');
    await screenshot(preparedForCheck.page, 'PREPARED-FOR-READ-ONLY.png', false);

    const payload = await exportPdf(browser, preparedForCheck, 'PREPARED-FOR-PRINT.pdf');
    assert.doesNotMatch(payload.html, /professional-document-field|data-prepared-for-active="true"/, 'print source has no Prepared for editor chrome');
    evidence.states.push('prepared-for-rest', 'prepared-for-hover', 'prepared-for-active', 'prepared-for-click-outside', 'prepared-for-reloaded', 'prepared-for-read-only');
    evidence.pdfs.push('PREPARED-FOR-PRINT.pdf');
    assert.deepEqual(preparedForCheck.pageErrors, []);
  } finally { await preparedForCheck.context.close(); }

  const p0 = await createDashboardPage(browser, server.baseUrl, makeQuote({ id: 'quote-p0-reorder', count: 3, specified: true }), { width: 1280, height: 900 });
  try {
    await openExistingQuote(p0.page, server.baseUrl);
    const front = p0.page.locator('.professional-paper-layer.is-front');
    const row = (index) => front.getByTestId(`professional-pricing-row-${index}`);
    const description = (itemRow) => itemRow.locator('td').first().evaluate((cell) => {
      const copy = cell.cloneNode(true);
      copy.querySelector('.professional-row-drag-handle')?.remove();
      return copy.textContent.trim();
    });
    const descriptions = async () => Promise.all([0, 1, 2].map((index) => description(row(index))));
    assert.deepEqual(await descriptions(), ['Creative fee', 'Studio hire', 'Retouching']);
    await screenshot(p0.page, 'P0-REST.png');

    const handle0 = front.getByTestId('professional-pricing-drag-handle-0');
    await row(0).hover();
    assert.equal(await handle0.evaluate((element) => getComputedStyle(element).opacity), '1', 'reorder handle appears only in contextual hover state');
    await screenshot(p0.page, 'P0-HOVER.png', false);

    await row(0).click();
    assert.equal(await front.locator('.quote-client-document-item-row.is-editing').count(), 1);
    await front.getByTestId('professional-pricing-quantity-0').fill('5');
    await front.getByTestId('professional-pricing-rate-0').fill('200');
    await screenshot(p0.page, 'P0-ACTIVE.png', false);
    await p0.page.locator('.professional-editor-title').click();
    assert.equal(await front.locator('.quote-client-document-item-row.is-editing').count(), 0, 'clicking outside clears active row');
    assert.equal((await row(0).locator('td').nth(1).innerText()).trim(), '5', 'click outside keeps edited quantity in local draft');
    assert.match((await row(0).locator('td').nth(2).innerText()).trim(), /200/);
    await screenshot(p0.page, 'P0-CLICK-OUTSIDE.png', false);

    const sourceHandle = front.getByTestId('professional-pricing-drag-handle-2');
    await sourceHandle.hover();
    await p0.page.evaluate(() => {
      window.__dragEvents = [];
      for (const type of ['dragstart', 'dragover', 'drop', 'dragend']) {
        document.addEventListener(type, (event) => window.__dragEvents.push({ type, target: event.target?.getAttribute?.('data-testid') || event.target?.tagName }), true);
      }
    });
    await sourceHandle.dragTo(row(0), { targetPosition: { x: 24, y: 2 } });
    await p0.page.waitForTimeout(200);
    assert.deepEqual(await descriptions(), ['Retouching', 'Creative fee', 'Studio hire'], `drag event trace: ${JSON.stringify(await p0.page.evaluate(() => window.__dragEvents))}`);
    assert.equal((await row(0).locator('td').nth(1).innerText()).trim(), '1', 'reorder keeps quantity with moved row');
    assert.match((await row(0).locator('td').nth(2).innerText()).trim(), /820/);
    await screenshot(p0.page, 'P0-REORDERED.png', false);

    await p0.page.getByRole('button', { name: 'Save', exact: true }).click();
    await p0.page.getByText('Saved', { exact: true }).waitFor({ state: 'visible' });
    assert.ok(p0.requests.some(({ method, url }) => method === 'POST' && url.includes('/api/quotes')), 'reorder uses the existing Quote save path');
    await openExistingQuote(p0.page, server.baseUrl);
    const reloadedFront = p0.page.locator('.professional-paper-layer.is-front');
    const reloadedDescriptions = await Promise.all([0, 1, 2].map((index) => reloadedFront.getByTestId(`professional-pricing-row-${index}`).locator('td').first().evaluate((cell) => cell.textContent.replace('⋮⋮', '').trim())));
    assert.deepEqual(reloadedDescriptions, ['Retouching', 'Creative fee', 'Studio hire']);
    await screenshot(p0.page, 'P0-RELOADED.png', false);
    assert.deepEqual(p0.pageErrors, []);
    evidence.states.push('p0-rest', 'p0-hover', 'p0-active', 'p0-click-outside', 'p0-reordered', 'p0-reloaded');
  } finally { await p0.context.close(); }

  const deleteCheck = await createDashboardPage(browser, server.baseUrl, makeQuote({ id: 'quote-p0-delete', count: 3, specified: true }), { width: 1280, height: 900 });
  try {
    await openExistingQuote(deleteCheck.page, server.baseUrl);
    const front = deleteCheck.page.locator('.professional-paper-layer.is-front');
    await front.getByTestId('professional-pricing-row-1').click();
    await front.getByRole('button', { name: 'Remove Studio hire', exact: true }).click();
    assert.equal(await front.getByTestId('professional-pricing-row-1').locator('td').first().evaluate((cell) => cell.textContent.replace('⋮⋮', '').trim()), 'Retouching');
    await deleteCheck.page.getByRole('button', { name: 'Save', exact: true }).click();
    await deleteCheck.page.getByText('Saved', { exact: true }).waitFor({ state: 'visible' });
    await openExistingQuote(deleteCheck.page, server.baseUrl);
    const reloaded = deleteCheck.page.locator('.professional-paper-layer.is-front');
    assert.equal(await reloaded.locator('[data-testid^="professional-pricing-row-"]').count(), 2);
    assert.deepEqual(await Promise.all([0, 1].map((index) => reloaded.getByTestId(`professional-pricing-row-${index}`).locator('td').first().evaluate((cell) => cell.textContent.replace('⋮⋮', '').trim()))), ['Creative fee', 'Retouching']);
    assert.deepEqual(deleteCheck.pageErrors, []);
    evidence.states.push('p0-delete-reloaded');
  } finally { await deleteCheck.context.close(); }

  const editCheck = await createDashboardPage(browser, server.baseUrl, makeQuote({ id: 'quote-p0-edit', count: 3, specified: true }), { width: 1280, height: 900 });
  try {
    await openExistingQuote(editCheck.page, server.baseUrl);
    const front = editCheck.page.locator('.professional-paper-layer.is-front');
    await front.getByTestId('professional-pricing-row-0').click();
    await front.getByTestId('professional-pricing-quantity-0').fill('3');
    await front.getByTestId('professional-pricing-rate-0').fill('400');
    assert.match((await front.getByTestId('professional-pricing-row-0').locator('td').nth(3).innerText()).trim(), /1,200|1200/);
    await editCheck.page.getByRole('button', { name: 'Save', exact: true }).click();
    await editCheck.page.getByText('Saved', { exact: true }).waitFor({ state: 'visible' });
    await openExistingQuote(editCheck.page, server.baseUrl);
    const reloaded = editCheck.page.locator('.professional-paper-layer.is-front');
    assert.equal((await reloaded.getByTestId('professional-pricing-quantity-0').count()), 0, 'reload returns to clean document state');
    await reloaded.getByTestId('professional-pricing-row-0').click();
    assert.equal(await reloaded.getByTestId('professional-pricing-quantity-0').inputValue(), '3');
    assert.equal(await reloaded.getByTestId('professional-pricing-rate-0').inputValue(), '400');
    assert.match((await reloaded.getByTestId('professional-pricing-row-0').locator('td').nth(3).innerText()).trim(), /1,200|1200/);
    await screenshot(editCheck.page, 'P0-QTY-RATE-RELOADED.png', false);
    assert.deepEqual(editCheck.pageErrors, []);
    evidence.states.push('p0-qty-rate-reloaded');
  } finally { await editCheck.context.close(); }

  const sevenPlusQuote = makeQuote({ count: 7, specified: true, id: 'quote-p0-seven-plus', number: 'QT-P0-007' });
  sevenPlusQuote.items = [
    { description: 'Creative Fee', quantity: 1, unit_price: 120000 },
    { description: 'Photo Assistant', quantity: 1, unit_price: 40000 },
    { description: 'Equipment', quantity: 1, unit_price: 30000 },
    { description: 'Studio', quantity: 1, unit_price: 50000 },
    { description: 'Props', quantity: 1, unit_price: 15000 },
    { description: 'Retouching', quantity: 1, unit_price: 25000 },
    { description: 'Travel', quantity: 1, unit_price: 10000 },
  ];
  const sevenPlus = await createDashboardPage(browser, server.baseUrl, sevenPlusQuote, { width: 1280, height: 900 });
  try {
    await openExistingQuote(sevenPlus.page, server.baseUrl);
    const front = sevenPlus.page.locator('.professional-paper-layer.is-front');
    const row = (index) => front.getByTestId(`professional-pricing-row-${index}`);
    const readDescriptions = (rows = front) => Promise.all(Array.from({ length: 7 }, (_, index) => rows.getByTestId(`professional-pricing-row-${index}`).locator('td').first().evaluate((cell) => cell.textContent.replace('⋮⋮', '').trim())));
    const expectedOrder = ['Creative Fee', 'Photo Assistant', 'Equipment', 'Studio', 'Props', 'Retouching', 'Travel'];
    assert.deepEqual(await readDescriptions(), expectedOrder);
    await front.getByTestId('professional-pricing-drag-handle-5').hover();
    await front.getByTestId('professional-pricing-drag-handle-5').dragTo(row(0), { targetPosition: { x: 24, y: 2 } });
    const reorderedExpected = ['Retouching', 'Creative Fee', 'Photo Assistant', 'Equipment', 'Studio', 'Props', 'Travel'];
    assert.deepEqual(await readDescriptions(), reorderedExpected);
    await sevenPlus.page.getByRole('button', { name: 'Save', exact: true }).click();
    await sevenPlus.page.getByText('Saved', { exact: true }).waitFor({ state: 'visible' });
    await openExistingQuote(sevenPlus.page, server.baseUrl);
    assert.deepEqual(await readDescriptions(), reorderedExpected, 'seven-plus manual order survives Save and reload');
    await screenshot(sevenPlus.page, 'P0-FIX1-SEVEN-EDITABLE.png', false);

    await sevenPlus.page.getByRole('button', { name: 'Preview', exact: true }).click();
    assert.equal(await front.getByTestId('professional-pricing-drag-handle-0').count(), 0, 'read-only preview has no editor drag handle');
    assert.deepEqual(await readDescriptions(), reorderedExpected, 'read-only/client-facing order matches saved qItems');
    await screenshot(sevenPlus.page, 'P0-FIX1-SEVEN-READONLY.png', false);

    const printableRows = sevenPlus.page.locator('.quote-printable-target');
    assert.deepEqual(await readDescriptions(printableRows), reorderedExpected, 'printable source order matches saved qItems');
    const payload = await exportPdf(browser, sevenPlus, 'P0-FIX1-SEVEN-PLUS.pdf');
    const pdfPage = await browser.newPage({ viewport: { width: 794, height: 1123 } });
    await pdfPage.setContent(payload.html, { waitUntil: 'load' });
    const pdfRows = pdfPage.locator('#printable-quote .quote-client-document-item-row');
    assert.deepEqual(await Promise.all(Array.from({ length: 7 }, (_, index) => pdfRows.nth(index).locator('td').first().evaluate((cell) => cell.textContent.replace('⋮⋮', '').trim()))), reorderedExpected, 'PDF source keeps manual line-item order');
    await pdfPage.close();
    assert.deepEqual(sevenPlus.pageErrors, []);
    evidence.states.push('p0-fix1-seven-plus-editable', 'p0-fix1-seven-plus-readonly', 'p0-fix1-seven-plus-printable');
    evidence.pdfs.push('P0-FIX1-SEVEN-PLUS.pdf');
  } finally { await sevenPlus.context.close(); }

  for (const [width, height, expected, filename] of [
    [390, 844, 'guided', 'MOBILE-390-REVIEW.png'],
    [768, 1000, 'guided', 'MOBILE-768.png'],
    [1023, 1000, 'guided', 'MOBILE-1023.png'],
    [1024, 900, 'desktop', 'DESKTOP-1024.png'],
    [1440, 900, 'desktop', 'DESKTOP-1440.png'],
  ]) {
    const dashboard = await createDashboardPage(browser, server.baseUrl, makeQuote({ count: 3, specified: true }), { width, height });
    try {
      await openExistingQuote(dashboard.page, server.baseUrl);
      assert.equal(await dashboard.page.locator('[data-quote-presentation-mode]').getAttribute('data-quote-presentation-mode'), expected, `${width}: exact presentation mode`);
      if (expected === 'guided') {
        await dashboard.page.getByTestId('quote-guided-review-step').waitFor({ state: 'visible' });
        assert.equal(await dashboard.page.locator('[data-testid="professional-quote-editor"]').count(), 0, `${width}: no desktop tree`);
      } else {
        await dashboard.page.getByTestId('professional-quote-editor').waitFor({ state: 'visible' });
        await assertFiniteA4(dashboard.page, 1);
      }
      await assertNoHorizontalOverflow(dashboard.page, String(width));
      await screenshot(dashboard.page, filename);
      assert.deepEqual(dashboard.pageErrors, [], `${width}: no browser errors`);
      evidence.devices.push({ width, presentation: expected });
    } finally { await dashboard.context.close(); }
  }

  const grouped = await createDashboardPage(browser, server.baseUrl, makeQuote({ count: 11, specified: true, id: 'quote-grouped', number: 'QT-PRODUCTION-019' }), { width: 1280, height: 900 });
  try {
    await openExistingQuote(grouped.page, server.baseUrl);
    await assertFiniteA4(grouped.page, 1);
    const groupText = await grouped.page.locator('.professional-paper-layer.is-front .quote-client-document-group-row').allTextContents();
    assert.deepEqual(groupText, [], 'implicit category grouping does not override manual qItems order');
    await screenshot(grouped.page, 'PRODUCTION-MANUAL-ORDER.png');
    await exportPdf(browser, grouped, 'PRODUCTION-MANUAL-ORDER.pdf');
    evidence.pdfs.push('PRODUCTION-MANUAL-ORDER.pdf');
    assert.deepEqual(grouped.pageErrors, []);
  } finally { await grouped.context.close(); }

  const multi = await createDashboardPage(browser, server.baseUrl, makeQuote({ count: 22, specified: true, id: 'quote-multi', number: 'QT-MULTI-022' }), { width: 1280, height: 900 });
  try {
    await openExistingQuote(multi.page, server.baseUrl);
    await assertFiniteA4(multi.page, 2);
    assert.equal(await multi.page.locator('.professional-paper-layer.is-front .quote-client-document').evaluate((element) => getComputedStyle(element).gap), '28px');
    await screenshot(multi.page, 'MULTI-PAGE.png');
    await exportPdf(browser, multi, 'MULTI-PAGE.pdf');
    evidence.pdfs.push('MULTI-PAGE.pdf');
    assert.deepEqual(multi.pageErrors, []);
  } finally { await multi.context.close(); }

  const pdfSimple = await createDashboardPage(browser, server.baseUrl, makeQuote({ count: 3, specified: true, id: 'quote-pdf-simple', number: 'QT-SIMPLE-003' }), { width: 1280, height: 900 });
  try {
    await openExistingQuote(pdfSimple.page, server.baseUrl);
    const payload = await exportPdf(browser, pdfSimple, 'SIMPLE-QUOTE.pdf');
    assert.doesNotMatch(payload.html, /professional-add-item/);
    evidence.pdfs.push('SIMPLE-QUOTE.pdf');
    assert.deepEqual(pdfSimple.pageErrors, []);
  } finally { await pdfSimple.context.close(); }

  evidence.assertions = [
    'A finite 794x1123 paper', 'B 210:297 ratio', 'C physical 28px page gap', 'D one-page simple quote', 'E two-page dense quote',
    'F seven paper indexes', 'G Saved status', 'H Send Quote authority', 'I direct row lift', 'J row mutation dirties', 'K Save authority when dirty',
    'L ghost Add item', 'M item insertion', 'N inline Intelligence', 'O Floating Edit Sheet', 'P guidance line', 'Q source focus',
    'R manual seven-plus item order', 'S shared editable/export document', 'T clean PDF payload', 'U mobile Review preserved', 'V 1023 guided',
    'W 1024 desktop', 'X no horizontal overflow', 'Y no browser errors',
  ];
  fs.writeFileSync(path.join(evidenceDir, 'browser-evidence.json'), `${JSON.stringify(evidence, null, 2)}\n`);
} finally {
  await browser.close();
  await server.close();
  await supabase.close();
}

console.log(`R56E-G-QE-PRO-IMPL-01 browser runtime: PASS (${evidenceDir})`);
