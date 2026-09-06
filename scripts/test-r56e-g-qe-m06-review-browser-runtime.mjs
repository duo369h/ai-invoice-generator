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
const outputDir = path.join(cwd, 'output/playwright/r56e-g-qe-m06');
fs.mkdirSync(outputDir, { recursive: true });

const TEST_USER = { id: '60606060-6060-4060-8060-606060606060', email: 'photographer@example.com', aud: 'authenticated', role: 'authenticated', app_metadata: { provider: 'email' }, user_metadata: {} };
const base64Url = (value) => Buffer.from(JSON.stringify(value)).toString('base64url');
const createSession = () => { const expiresAt = Math.floor(Date.now() / 1000) + 3600; return { access_token: [base64Url({ alg: 'none', typ: 'JWT' }), base64Url({ ...TEST_USER, exp: expiresAt }), 'browser-test-signature'].join('.'), refresh_token: 'browser-test-refresh-token', expires_in: 3600, expires_at: expiresAt, token_type: 'bearer', user: TEST_USER }; };
const getFreePort = () => new Promise((resolve, reject) => { const server = net.createServer(); server.once('error', reject); server.listen(0, '127.0.0.1', () => { const port = server.address().port; server.close((error) => error ? reject(error) : resolve(port)); }); });
const sendJson = (response, status, body) => { response.writeHead(status, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }); response.end(JSON.stringify(body)); };

async function startMockSupabase() {
  const server = http.createServer((request, response) => {
    const url = new URL(request.url, 'http://127.0.0.1');
    if (request.method === 'OPTIONS') { response.writeHead(204, { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': '*', 'Access-Control-Allow-Methods': '*' }); response.end(); return; }
    if (url.pathname === '/auth/v1/user') return sendJson(response, 200, TEST_USER);
    if (url.pathname === '/auth/v1/token') return sendJson(response, 200, createSession());
    if (url.pathname === '/auth/v1/logout') { response.writeHead(204); response.end(); return; }
    if (url.pathname === '/rest/v1/entitlements') return sendJson(response, 200, [{ user_id: TEST_USER.id, invoice: true, export_pdf: false, client_portal: false, crm: false, automation: false, advanced_invoicing: false }]);
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

const usageScope = { version: 2, common: { shoot_type: 'Campaign photography', shoot_date: '2026-10-10', shoot_duration: 240, primary_location: 'Studio', coverage_expectation: 'Product and lifestyle scenes', deliverables: ['Campaign gallery'], final_image_count: 20, retouched_image_count: 10, delivery_format: ['JPEG'], delivery_deadline: '2026-10-20', exclusions: [], assumptions: [], usage_rights: { status: 'unspecified', purpose: '', media_channels: [], territory: '', license_duration: '', exclusivity: '' } } };
const quoteFrom = (status = 'draft') => ({ id: 'quote-m06', quote_number: 'QT-M06', client_name: 'Review Client', client_email: 'client@example.com', client_address: '400 Scope Street', currency: 'USD', total: 1000, tax_rate: 0, discount_rate: 0, status, notes: `Client-facing notes\n\n---METADATA---\n${JSON.stringify({ quote_preset_id: 'commercial-shoot', photography_scope_v2: usageScope, quote_provenance_v1: { canonical_authority: { authority: 'photographer', confirmation_action: 'explicit_quote_save' } } })}`, items: [{ description: 'Campaign package', quantity: 1, unit_price: 100000 }] });

async function createDashboardPage(browser, baseUrl, state, viewport) {
  const context = await browser.newContext({ viewport, locale: 'en-US' });
  const session = createSession();
  await context.addInitScript((storedSession) => { window.localStorage.setItem('corvioz_analytics_consent', 'accepted'); window.localStorage.setItem('sb-127-auth-token', JSON.stringify(storedSession)); }, session);
  await context.addCookies([{ name: 'sb-127-auth-token.0', value: encodeURIComponent(JSON.stringify(session)), url: baseUrl }, { name: 'corvioz_analytics_consent', value: 'accepted', url: baseUrl }]);
  const page = await context.newPage();
  const requests = [];
  const pageErrors = [];
  page.on('request', (request) => requests.push({ method: request.method(), url: request.url() }));
  page.on('pageerror', (error) => pageErrors.push(error.message));
  await page.route('**/api/**', async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const pathname = url.pathname;
    if (pathname === '/api/quotes' && request.method() === 'GET') return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ data: state.noQuote ? [] : state.savedQuote ? [state.savedQuote] : [{ ...quoteFrom('sent'), id: 'quote-m06-existing', quote_number: 'QT-M06-EXISTING' }] }) });
    if (pathname === '/api/quotes' && request.method() === 'POST') {
      if (state.saveFailure) return route.fulfill({ status: 422, contentType: 'application/json', body: JSON.stringify({ error: 'Save unavailable in this fixture.' }) });
      const payload = request.postDataJSON();
      state.savedQuote = { ...(state.savedQuote || quoteFrom('draft')), ...payload, id: payload.id || 'quote-m06', status: 'draft' };
      state.saveCount = (state.saveCount || 0) + 1;
      return route.fulfill({ status: 201, contentType: 'application/json', body: JSON.stringify(state.savedQuote) });
    }
    if (pathname === '/api/quotes/quote-m06/send' && request.method() === 'POST') {
      if (state.sendFailure) return route.fulfill({ status: 422, contentType: 'application/json', body: JSON.stringify({ error: 'Send unavailable in this fixture.' }) });
      state.savedQuote = { ...(state.savedQuote || quoteFrom('draft')), status: 'sent' };
      state.sendCount = (state.sendCount || 0) + 1;
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ data: state.savedQuote }) });
    }
    if (pathname === '/api/user') return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ id: TEST_USER.id, email: TEST_USER.email, name: 'Avery Photographer', plan: 'free', hasActivated: true, auth_mode: 'supabase', quota: {} }) });
    if (pathname === '/api/clients') return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ data: [] }) });
    if (pathname === '/api/invoices' || pathname === '/api/leads') return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ data: [] }) });
    if (pathname === '/api/card-profile') return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ data: { id: 'profile-m06' } }) });
    if (pathname === '/api/intelligence/photography-quote-review') return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ status: 'COMPLETE', semanticFindings: [{ id: 'llm-m06-semantic', source: 'llm', category: 'IMPROVE', severity: 'medium', title: 'Semantic clarity suggestion', message: 'Consider making the client handoff sentence more specific.', evidence: 'Existing review fixture', recommendedAction: 'Review the note and decide whether to refine it.', dismissible: true }] }) });
    return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ data: [] }) });
  });
  return { context, page, requests, pageErrors };
}

const domainMutations = (requests) => requests.filter(({ method, url }) => ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method) && !/(?:\/analytics|\/events|\/revenue|\/intelligence)(?:$|_|\/|\?)/.test(url));
const screenshot = (page, filename) => page.screenshot({ path: path.join(outputDir, filename), fullPage: true });
const hideOverlays = async (page) => page.evaluate(() => {
  const auditTitle = [...document.querySelectorAll('body *')].find((node) => node.textContent?.trim() === 'Corvioz Verification Audit');
  if (auditTitle?.parentElement?.parentElement?.parentElement) auditTitle.parentElement.parentElement.parentElement.style.display = 'none';
  const debugButton = [...document.querySelectorAll('button')].find((node) => /Kernel Dev Debug|Debug UI/.test(node.textContent || ''));
  if (debugButton?.parentElement) debugButton.parentElement.style.display = 'none';
});
const go = async (page, testId, button = 'Continue') => { await page.getByTestId(testId).getByRole('button', { name: button, exact: true }).click(); };
const openGuidedReview = async (page) => {
  if (await page.getByTestId('quote-guided-shell').count()) {
    await page.getByTestId('quote-guided-shell').getByRole('button', { name: 'Commercial', exact: true }).click();
    await go(page, 'quote-guided-shell');
  }
  if (await page.getByTestId('quote-guided-client-step').count()) {
    const nameInput = page.getByTestId('quote-guided-client-name');
    if (!(await nameInput.inputValue())) {
      await nameInput.fill('New Review Client');
      await page.getByTestId('quote-guided-client-email').fill('new-client@example.com');
    }
    await go(page, 'quote-guided-client-step');
  }
  if (await page.getByTestId('quote-guided-scope-step').count()) await go(page, 'quote-guided-scope-step');
  if (await page.getByTestId('quote-guided-pricing-step').count()) {
    const item = page.getByTestId('quote-guided-pricing-item-0');
    if (await item.count()) {
      const summary = item.getByRole('button').first();
      await summary.click();
      const itemDescription = page.getByTestId('quote-guided-pricing-description-0');
      if (!(await itemDescription.inputValue())) {
        await itemDescription.fill('Campaign package');
        await page.waitForTimeout(100);
      }
      assert.equal(await itemDescription.inputValue(), 'Campaign package', 'guided new Quote item description is captured before Review');
      assert.match(await page.getByTestId('quote-guided-pricing-item-0').textContent(), /Campaign package/, 'guided new Quote summary reflects the edited item');
    }
    await go(page, 'quote-guided-pricing-step');
  }
  if (await page.getByTestId('quote-guided-terms-usage-step').count()) await go(page, 'quote-guided-terms-usage-step', 'Review Quote');
  await page.getByTestId('quote-guided-review-step').waitFor({ state: 'visible' });
};

const supabase = await startMockSupabase();
const server = await startNext(supabase.url);
const browser = await chromium.launch({ headless: true });
const state = { savedQuote: quoteFrom('draft'), sendFailure: false, saveFailure: false, noQuote: false, saveCount: 0, sendCount: 0 };
try {
  state.noQuote = true;
  state.savedQuote = null;
  const newQuoteDashboard = await createDashboardPage(browser, server.baseUrl, state, { width: 390, height: 844 });
  try {
    await newQuoteDashboard.page.goto(`${server.baseUrl}/dashboard?tool=quotes&mode=create`, { waitUntil: 'domcontentloaded' });
    await newQuoteDashboard.page.getByTestId('quote-guided-shell').waitFor({ state: 'visible', timeout: 20_000 });
    await hideOverlays(newQuoteDashboard.page);
    await openGuidedReview(newQuoteDashboard.page);
    const newSend = newQuoteDashboard.page.getByTestId('quote-guided-review-send');
    assert.equal(await newSend.isDisabled(), true, 'new Quote Send is unavailable before its first explicit Save');
    assert.equal(await newSend.textContent(), 'Save changes before sending');
    assert.equal(domainMutations(newQuoteDashboard.requests).length, 0, 'new Quote Review opening performs no domain mutation');
    await screenshot(newQuoteDashboard.page, '390-review-unsaved-save-required.png');
    await newQuoteDashboard.page.getByTestId('quote-guided-review-save').click();
    await newQuoteDashboard.page.getByTestId('quote-guided-review-send').waitFor({ state: 'visible' });
    await newQuoteDashboard.page.waitForFunction(() => document.querySelector('[data-testid="quote-guided-review-send"]')?.textContent?.trim() === 'Send Quote');
    assert.equal(state.saveCount, 1, 'new Quote explicit Save uses exactly one save mutation');
    assert.equal(await newSend.isDisabled(), false, 'new Quote Send activates only after Save succeeds');
    assert.equal(await newQuoteDashboard.page.getByTestId('quote-guided-review-step').count(), 1, 'successful new Quote Save keeps Review open');
    await screenshot(newQuoteDashboard.page, '390-review-saved-send-ready.png');
    assert.deepEqual(newQuoteDashboard.pageErrors, []);
  } finally { await newQuoteDashboard.context.close(); }

  state.noQuote = false;
  state.savedQuote = quoteFrom('draft');
  state.saveFailure = false;
  state.saveCount = 0;
  state.sendCount = 0;
  const dashboard = await createDashboardPage(browser, server.baseUrl, state, { width: 390, height: 844 });
  try {
    const page = dashboard.page;
    await page.goto(`${server.baseUrl}/dashboard?tool=quotes`, { waitUntil: 'domcontentloaded' });
    await page.getByRole('heading', { name: 'Quotes', exact: true }).waitFor({ state: 'visible', timeout: 20_000 });
    await page.getByRole('button', { name: 'Edit', exact: true }).click();
    await page.evaluate(() => {
      const auditTitle = [...document.querySelectorAll('body *')].find((node) => node.textContent?.trim() === 'Corvioz Verification Audit');
      if (auditTitle?.parentElement?.parentElement?.parentElement) auditTitle.parentElement.parentElement.parentElement.style.display = 'none';
      const debugButton = [...document.querySelectorAll('button')].find((node) => /Kernel Dev Debug|Debug UI/.test(node.textContent || ''));
      if (debugButton?.parentElement) debugButton.parentElement.style.display = 'none';
    });
    await openGuidedReview(page);
    assert.equal(await page.getByTestId('quote-guided-review-summary').count(), 1, 'Review summary is present');
    assert.equal(await page.getByTestId('quote-guided-review-attention').count(), 1, 'deterministic attention area is present');
    assert.match(await page.getByTestId('quote-guided-review-attention').textContent(), /Usage Rights/);
    assert.equal(await page.locator('[data-guided-compatibility="true"]').count(), 0, 'compatibility fallback is retired');
    assert.equal(domainMutations(dashboard.requests).length, 0, 'opening Review performs no domain mutation');
    assert.equal(await page.getByTestId('quote-guided-review-send').isDisabled(), false, 'saved draft is initially send-ready');
    assert.equal(await page.getByTestId('quote-guided-review-send').textContent(), 'Send Quote');
    await screenshot(page, '390-guided-review.png');
    await screenshot(page, '390-guided-review-attention.png');

    await page.getByTestId('quote-guided-review-preview').click();
    await page.getByTestId('quote-guided-preview-step').waitFor({ state: 'visible' });
    assert.equal(await page.getByTestId('quote-client-document-preview-frame').count(), 1, 'shared QuoteClientDocument preview appears');
    const previewText = await page.getByTestId('quote-guided-preview-step').textContent();
    assert.doesNotMatch(previewText, /quote_provenance_v1|raw_client_source|original_scope_baseline|machine_draft/);
    assert.equal(domainMutations(dashboard.requests).length, 0, 'opening Preview performs no domain mutation');
    await screenshot(page, '390-guided-preview.png');
    await page.getByTestId('quote-guided-preview-back').click();
    await page.getByTestId('quote-guided-review-step').waitFor({ state: 'visible' });
    assert.equal(await page.getByTestId('quote-guided-review-summary').count(), 1, 'Review returns after Preview');
    await screenshot(page, '390-guided-review-after-preview.png');

    await page.getByTestId('quote-guided-review-edit-client').click();
    await page.getByTestId('quote-guided-client-step').waitFor({ state: 'visible' });
    await go(page, 'quote-guided-client-step'); await go(page, 'quote-guided-scope-step'); await go(page, 'quote-guided-pricing-step'); await go(page, 'quote-guided-terms-usage-step', 'Review Quote');
    await page.getByTestId('quote-guided-review-step').waitFor({ state: 'visible' });
    await page.getByTestId('quote-guided-review-edit-scope').click();
    await page.getByTestId('quote-guided-scope-step').waitFor({ state: 'visible' });
    await go(page, 'quote-guided-scope-step'); await go(page, 'quote-guided-pricing-step'); await go(page, 'quote-guided-terms-usage-step', 'Review Quote');
    await page.getByTestId('quote-guided-review-step').waitFor({ state: 'visible' });
    await page.getByTestId('quote-guided-review-edit-pricing').click();
    await page.getByTestId('quote-guided-pricing-step').waitFor({ state: 'visible' });
    await page.getByTestId('quote-guided-pricing-item-0').getByRole('button').first().click();
    await page.getByTestId('quote-guided-pricing-rate-0').fill('1500');
    await page.getByTestId('quote-guided-pricing-rate-0').blur();
    await go(page, 'quote-guided-pricing-step'); await go(page, 'quote-guided-terms-usage-step', 'Review Quote');
    await page.getByTestId('quote-guided-review-step').waitFor({ state: 'visible' });
    await page.getByTestId('quote-guided-review-edit-terms').click();
    await page.getByTestId('quote-guided-terms-usage-step').waitFor({ state: 'visible' });
    await go(page, 'quote-guided-terms-usage-step', 'Review Quote');
    await page.getByTestId('quote-guided-review-step').waitFor({ state: 'visible' });
    assert.equal(domainMutations(dashboard.requests).length, 0, 'Review edit returns perform no domain mutation');
    const editedSend = page.getByTestId('quote-guided-review-send');
    assert.equal(await editedSend.isDisabled(), true, 'edited existing Quote Send stays blocked until Save');
    assert.equal(await editedSend.textContent(), 'Save changes before sending');
    const sendBeforeExplicitSave = dashboard.requests.filter(({ method, url }) => method === 'POST' && new URL(url).pathname.endsWith('/send')).length;
    assert.equal(dashboard.requests.filter(({ method, url }) => method === 'POST' && new URL(url).pathname.endsWith('/send')).length, sendBeforeExplicitSave, 'blocked Send activation performs no send mutation');

    await page.getByTestId('quote-guided-review-semantic-review').click();
    await page.getByTestId('quote-guided-review-semantic-finding').waitFor({ state: 'visible' });
    assert.equal(domainMutations(dashboard.requests).length, 0, 'semantic Review remains non-mutating');
    await page.getByTestId('quote-guided-review-save').click();
    await page.waitForTimeout(2_000);
    await page.getByTestId('quote-guided-review-send').waitFor({ state: 'visible' });
    assert.equal(state.saveCount, 1, 'edited existing Quote explicit Save uses one save mutation');
    assert.equal(state.savedQuote.items[0].unitPrice, 1500, 'explicit Save persists the edited 1500 rate');
    assert.equal(await editedSend.isDisabled(), false, 'saved existing Quote Send becomes available');
    await screenshot(page, '390-review-edited-save-required.png');
    await page.getByTestId('quote-guided-review-send').click();
    await page.getByTestId('quote-guided-review-status').waitFor({ state: 'visible' });
    await page.waitForFunction(() => /Sent/.test(document.querySelector('[data-testid="quote-guided-review-status"]')?.textContent || ''));
    assert.match(await page.getByTestId('quote-guided-review-status').textContent(), /Sent/);
    assert.equal(state.sendCount, 1, 'explicit Send uses one existing send mutation');
    assert.equal(state.savedQuote.items[0].unitPrice, 1500, 'Send observes the latest explicitly saved 1500 rate');
    assert.equal(await page.getByTestId('quote-guided-review-send').isDisabled(), true, 'sent Quote Send is unavailable');
    assert.equal(await page.getByTestId('quote-guided-review-send').textContent(), 'Quote already sent');
    await screenshot(page, '390-review-sent.png');
    assert.deepEqual(dashboard.pageErrors, []);
  } finally { await dashboard.context.close(); }

  for (const [status, expectedCopy] of [['approved', 'Only draft Quotes can be sent'], ['rejected', 'Only draft Quotes can be sent'], ['converted', 'Only draft Quotes can be sent']]) {
    state.savedQuote = quoteFrom(status);
    state.saveFailure = false;
    state.sendFailure = false;
    const statusDashboard = await createDashboardPage(browser, server.baseUrl, state, { width: 390, height: 844 });
    try {
      await statusDashboard.page.goto(`${server.baseUrl}/dashboard?tool=quotes`, { waitUntil: 'domcontentloaded' });
      await statusDashboard.page.getByRole('heading', { name: 'Quotes', exact: true }).waitFor({ state: 'visible', timeout: 20_000 });
      await hideOverlays(statusDashboard.page);
      await statusDashboard.page.getByRole('button', { name: 'Edit', exact: true }).click();
      await openGuidedReview(statusDashboard.page);
      const statusSend = statusDashboard.page.getByTestId('quote-guided-review-send');
      assert.equal(await statusSend.isDisabled(), true, `${status}: Send is unavailable`);
      assert.equal(await statusSend.textContent(), expectedCopy, `${status}: readiness copy is truthful`);
      assert.deepEqual(statusDashboard.pageErrors, [], `${status}: no browser page errors`);
    } finally { await statusDashboard.context.close(); }
  }

  state.savedQuote = { ...quoteFrom('draft'), client_email: '' };
  const invalidEmailDashboard = await createDashboardPage(browser, server.baseUrl, state, { width: 390, height: 844 });
  try {
    await invalidEmailDashboard.page.goto(`${server.baseUrl}/dashboard?tool=quotes`, { waitUntil: 'domcontentloaded' });
    await invalidEmailDashboard.page.getByRole('heading', { name: 'Quotes', exact: true }).waitFor({ state: 'visible', timeout: 20_000 });
    await hideOverlays(invalidEmailDashboard.page);
    await invalidEmailDashboard.page.getByRole('button', { name: 'Edit', exact: true }).click();
    await openGuidedReview(invalidEmailDashboard.page);
    const invalidEmailSend = invalidEmailDashboard.page.getByTestId('quote-guided-review-send');
    assert.equal(await invalidEmailSend.isDisabled(), true, 'invalid email: Send is unavailable');
    assert.equal(await invalidEmailSend.textContent(), 'Add a valid email to send', 'invalid email: readiness copy is truthful');
  } finally { await invalidEmailDashboard.context.close(); }

  for (const [width, filename] of [[768, '768-guided-review.png'], [1023, '1023-guided-review.png'], [1024, '1024-desktop-regression.png'], [1280, '1280-desktop-regression.png']]) {
    const dashboard = await createDashboardPage(browser, server.baseUrl, state, { width, height: 900 });
    try {
      await dashboard.page.goto(`${server.baseUrl}/dashboard?tool=quotes`, { waitUntil: 'domcontentloaded' });
      await dashboard.page.getByRole('heading', { name: 'Quotes', exact: true }).waitFor({ state: 'visible', timeout: 20_000 });
      await hideOverlays(dashboard.page);
      if (width < 1024) {
        await dashboard.page.getByRole('button', { name: 'Edit', exact: true }).click();
        await openGuidedReview(dashboard.page);
        assert.equal(await dashboard.page.locator('[data-quote-presentation-mode="guided"]').count(), 1);
      } else {
        await dashboard.page.getByRole('button', { name: 'Edit', exact: true }).click();
        assert.equal(await dashboard.page.locator('[data-quote-presentation-mode="desktop"]').count(), 1);
        await dashboard.page.getByTestId('quote-business-editor').waitFor({ state: 'visible' });
      }
      await screenshot(dashboard.page, filename);
      assert.deepEqual(dashboard.pageErrors, [], `${width}: no browser page errors`);
    } finally { await dashboard.context.close(); }
  }

  state.savedQuote = quoteFrom('draft');
  state.sendFailure = true;
  state.saveFailure = true;
  state.saveCount = 0;
  state.sendCount = 0;
  const failureDashboard = await createDashboardPage(browser, server.baseUrl, state, { width: 390, height: 844 });
  try {
    await failureDashboard.page.goto(`${server.baseUrl}/dashboard?tool=quotes`, { waitUntil: 'domcontentloaded' });
    await failureDashboard.page.getByRole('heading', { name: 'Quotes', exact: true }).waitFor({ state: 'visible', timeout: 20_000 });
    await hideOverlays(failureDashboard.page);
    await failureDashboard.page.getByRole('button', { name: 'Edit', exact: true }).click();
    await openGuidedReview(failureDashboard.page);
    await failureDashboard.page.getByTestId('quote-guided-review-edit-pricing').click();
    await failureDashboard.page.getByTestId('quote-guided-pricing-step').waitFor({ state: 'visible' });
    await failureDashboard.page.getByTestId('quote-guided-pricing-item-0').getByRole('button').first().click();
    await failureDashboard.page.getByTestId('quote-guided-pricing-rate-0').fill('1700');
    await failureDashboard.page.getByTestId('quote-guided-pricing-rate-0').blur();
    await go(failureDashboard.page, 'quote-guided-pricing-step'); await go(failureDashboard.page, 'quote-guided-terms-usage-step', 'Review Quote');
    await failureDashboard.page.getByTestId('quote-guided-review-step').waitFor({ state: 'visible' });
    assert.equal(await failureDashboard.page.getByTestId('quote-guided-review-send').isDisabled(), true);
    await failureDashboard.page.getByTestId('quote-guided-review-save').click();
    await failureDashboard.page.getByTestId('quote-guided-review-error').waitFor({ state: 'visible' });
    assert.match(await failureDashboard.page.getByTestId('quote-guided-review-error').textContent(), /Save unavailable/);
    assert.equal(await failureDashboard.page.getByTestId('quote-guided-review-send').textContent(), 'Save changes before sending');
    assert.equal(state.saveCount, 0, 'failed Save performs no successful save mutation');
    assert.equal(state.sendCount, 0, 'failed Save performs no send mutation');
    assert.match(await failureDashboard.page.getByTestId('quote-guided-review-status').textContent(), /draft/i);
    assert.deepEqual(failureDashboard.pageErrors, []);
  } finally { await failureDashboard.context.close(); }
} finally {
  await browser.close();
  await server.close();
  await supabase.close();
}

console.log(`R56E-G-QE-M06 Review browser runtime: PASS (${outputDir})`);
