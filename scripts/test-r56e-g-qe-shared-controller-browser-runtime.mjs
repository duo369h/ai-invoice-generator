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
const screenshotDir = path.join(cwd, 'output/playwright/r56e-g-qe-shared-01');
fs.mkdirSync(screenshotDir, { recursive: true });

const TEST_USER = {
  id: '22222222-2222-4222-8222-222222222222',
  aud: 'authenticated',
  role: 'authenticated',
  email: 'photographer@example.com',
  app_metadata: { provider: 'email' },
  user_metadata: {},
};

const base64Url = (value) => Buffer.from(JSON.stringify(value)).toString('base64url');
const createSession = () => {
  const expiresAt = Math.floor(Date.now() / 1000) + 3600;
  return {
    access_token: [base64Url({ alg: 'none', typ: 'JWT' }), base64Url({ ...TEST_USER, exp: expiresAt }), 'browser-test-signature'].join('.'),
    refresh_token: 'browser-test-refresh-token',
    expires_in: 3600,
    expires_at: expiresAt,
    token_type: 'bearer',
    user: TEST_USER,
  };
};

const getFreePort = () => new Promise((resolve, reject) => {
  const server = net.createServer();
  server.once('error', reject);
  server.listen(0, '127.0.0.1', () => {
    const port = server.address().port;
    server.close((error) => (error ? reject(error) : resolve(port)));
  });
});

const sendJson = (response, status, body) => {
  response.writeHead(status, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
  response.end(JSON.stringify(body));
};

async function startMockSupabase() {
  const server = http.createServer((request, response) => {
    const requestUrl = new URL(request.url, 'http://127.0.0.1');
    if (request.method === 'OPTIONS') {
      response.writeHead(204, {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, apikey, content-type, x-client-info, x-supabase-api-version',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
      });
      response.end();
      return;
    }
    if (requestUrl.pathname === '/auth/v1/user') return sendJson(response, 200, TEST_USER);
    if (requestUrl.pathname === '/auth/v1/token') return sendJson(response, 200, createSession());
    if (requestUrl.pathname === '/auth/v1/logout') {
      response.writeHead(204, { 'Access-Control-Allow-Origin': '*' });
      response.end();
      return;
    }
    if (requestUrl.pathname === '/rest/v1/entitlements') {
      return sendJson(response, 200, [{ user_id: TEST_USER.id, invoice: true, export_pdf: false, client_portal: false, crm: false, automation: false, advanced_invoicing: false }]);
    }
    return sendJson(response, 200, []);
  });
  const port = await getFreePort();
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(port, '127.0.0.1', resolve);
  });
  return { url: `http://127.0.0.1:${port}`, close: () => new Promise((resolve) => server.close(() => resolve())) };
}

async function startNext(mockSupabaseUrl) {
  const port = await getFreePort();
  const baseUrl = `http://127.0.0.1:${port}`;
  const child = spawn(process.execPath, [nextCli, 'dev', '--webpack', '--hostname', '127.0.0.1', '--port', String(port)], {
    cwd,
    env: { ...process.env, NEXT_PUBLIC_SUPABASE_URL: mockSupabaseUrl, NEXT_PUBLIC_SUPABASE_ANON_KEY: 'browser-test-anon-key' },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  let output = '';
  child.stdout.on('data', (chunk) => { output += chunk.toString(); });
  child.stderr.on('data', (chunk) => { output += chunk.toString(); });
  const deadline = Date.now() + 60_000;
  while (Date.now() < deadline) {
    if (child.exitCode !== null) throw new Error(`Next server exited early: ${output}`);
    try {
      const response = await fetch(`${baseUrl}/auth`);
      if (response.ok) return { baseUrl, close: () => new Promise((resolve) => { child.once('exit', resolve); child.kill('SIGTERM'); }) };
    } catch (_) {}
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  child.kill('SIGTERM');
  throw new Error(`Timed out waiting for Next server: ${output}`);
}

function apiBody(pathname) {
  if (pathname === '/api/user') return { id: TEST_USER.id, email: TEST_USER.email, name: 'Avery Photographer', plan: 'free', hasActivated: true, auth_mode: 'supabase', quota: {} };
  if (pathname === '/api/quotes') return { data: [{ id: 'quote-device', quote_number: 'QT-DEVICE', client_name: 'Starter Client', client_email: 'client@example.com', client_address: '100 Studio Way', currency: 'USD', total: 100, status: 'draft', items: [{ description: 'Portrait session', quantity: 1, unit_price: 100 }] }] };
  if (pathname === '/api/clients') return { data: [] };
  if (pathname === '/api/invoices') return { data: [] };
  if (pathname === '/api/leads') return { data: [] };
  if (pathname === '/api/card-profile') return { data: { id: 'profile-device' } };
  return { data: [] };
}

async function createDashboardPage(browser, baseUrl, viewport) {
  const context = await browser.newContext({ viewport, locale: 'en-US' });
  const session = createSession();
  await context.addInitScript((storedSession) => {
    window.localStorage.setItem('corvioz_analytics_consent', 'accepted');
    window.localStorage.setItem('sb-127-auth-token', JSON.stringify(storedSession));
  }, session);
  await context.addCookies([{ name: 'sb-127-auth-token.0', value: encodeURIComponent(JSON.stringify(session)), url: baseUrl }, { name: 'corvioz_analytics_consent', value: 'accepted', url: baseUrl }]);
  const page = await context.newPage();
  const pageErrors = [];
  const requests = [];
  page.on('pageerror', (error) => pageErrors.push(error.message));
  page.on('request', (request) => requests.push({ method: request.method(), url: request.url() }));
  await page.route('**/api/**', async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(apiBody(new URL(route.request().url()).pathname)) });
  });
  return { context, page, pageErrors, requests };
}

async function openQuoteEditor(page, baseUrl) {
  await page.goto(`${baseUrl}/dashboard?tool=quotes`, { waitUntil: 'domcontentloaded' });
  await page.getByRole('heading', { name: 'Quotes', exact: true }).waitFor({ state: 'visible', timeout: 20_000 });
  await page.getByRole('button', { name: 'Create Quote', exact: true }).click();
  await page.getByRole('heading', { name: 'Create Quote', exact: true }).waitFor({ state: 'visible' });
  await page.locator('[data-quote-presentation-mode]').waitFor({ state: 'attached' });
  await page.waitForFunction(() => document.querySelector('[data-quote-presentation-mode]')?.dataset.quotePresentationMode !== 'unresolved');
  await page.getByTestId('quote-client-document-canvas').waitFor({ state: 'visible' });
  await page.getByTestId('quote-business-editor').waitFor({ state: 'visible' });
  await page.evaluate(() => {
    const auditTitle = [...document.querySelectorAll('body *')].find((node) => node.textContent?.trim() === 'Corvioz Verification Audit');
    if (auditTitle?.parentElement?.parentElement?.parentElement) auditTitle.parentElement.parentElement.parentElement.style.display = 'none';
    const debugButton = [...document.querySelectorAll('button')].find((node) => /Kernel Dev Debug|Debug UI/.test(node.textContent || ''));
    if (debugButton?.parentElement) debugButton.parentElement.style.display = 'none';
  });
}

async function assertMode(page, width, expected) {
  const root = page.locator('[data-quote-presentation-mode]');
  assert.equal(await root.count(), 1, `${width}: exactly one active presentation tree`);
  assert.equal(await root.getAttribute('data-quote-presentation-mode'), expected, `${width}: presentation mode`);
  assert.equal(await root.getAttribute('data-quote-presentation-compatibility'), expected === 'guided' ? 'true' : 'false', `${width}: compatibility marker`);
  assert.equal(await page.locator('[data-testid="quote-client-name-input"]').count(), 1, `${width}: one QE01 client field`);
  assert.equal(await page.getByTestId('quote-client-document-canvas').isVisible(), true, `${width}: document remains reachable`);
  const editor = page.getByTestId('quote-business-editor');
  await editor.waitFor({ state: 'visible' });
  assert.equal(await editor.isVisible(), true, `${width}: editor bridge remains reachable`);
  assert.equal(await page.locator('.quote-context-editor-mobile-breakout').count(), 0, `${width}: no QE02 mobile breakout`);
  assert.equal(await page.locator('.quote-workspace-mode-switch').count(), 0, `${width}: no parallel mode switch`);
}

async function assertNoHorizontalOverflow(page, width) {
  const dimensions = await page.evaluate(() => ({ innerWidth: window.innerWidth, documentWidth: document.documentElement.scrollWidth, bodyWidth: document.body.scrollWidth }));
  assert.ok(dimensions.documentWidth <= dimensions.innerWidth, `${width}: document horizontal overflow ${JSON.stringify(dimensions)}`);
  assert.ok(dimensions.bodyWidth <= dimensions.innerWidth, `${width}: body horizontal overflow ${JSON.stringify(dimensions)}`);
}

async function capture(page, filename) {
  await page.screenshot({ path: path.join(screenshotDir, filename), fullPage: true });
}

const supabase = await startMockSupabase();
const server = await startNext(supabase.url);
const browser = await chromium.launch({ headless: true });
try {
  for (const [width, height, expected, filename] of [
    [390, 844, 'guided', '390-guided-compatibility.png'],
    [768, 1000, 'guided', '768-guided-compatibility.png'],
    [1023, 1000, 'guided', '1023-guided-compatibility.png'],
    [1024, 900, 'desktop', '1024-desktop.png'],
    [1280, 900, 'desktop', null],
    [1440, 900, 'desktop', '1440-desktop.png'],
  ]) {
    const dashboard = await createDashboardPage(browser, server.baseUrl, { width, height });
    try {
      await openQuoteEditor(dashboard.page, server.baseUrl);
      await assertMode(dashboard.page, width, expected);
      await assertNoHorizontalOverflow(dashboard.page, width);
      if (filename) await capture(dashboard.page, filename);
      assert.deepEqual(dashboard.pageErrors, [], `${width}: no browser page errors`);
    } finally {
      await dashboard.context.close();
    }
  }

  const dashboard = await createDashboardPage(browser, server.baseUrl, { width: 1280, height: 900 });
  try {
    await openQuoteEditor(dashboard.page, server.baseUrl);
    await assertMode(dashboard.page, 1280, 'desktop');
    const clientName = dashboard.page.getByTestId('quote-client-name-input');
    const clientEmail = dashboard.page.locator('input[type="email"]');
    assert.equal(await clientEmail.count(), 1, '1280: one shared client email field');
    await clientName.fill('DEVICE01 Resize Client');
    assert.equal(await clientName.inputValue(), 'DEVICE01 Resize Client', '1280: distinctive unsaved value entered');
    dashboard.requests.length = 0;

    await dashboard.page.setViewportSize({ width: 768, height: 1000 });
    await dashboard.page.waitForFunction(() => document.querySelector('[data-quote-presentation-mode]')?.dataset.quotePresentationMode === 'guided');
    await assertMode(dashboard.page, 768, 'guided');
    assert.equal(await clientName.inputValue(), 'DEVICE01 Resize Client', '1280→768: unsaved value preserved');
    await clientEmail.fill('invalid-email');
    await clientEmail.blur();
    assert.equal(await dashboard.page.getByText('Please enter a valid email address.', { exact: true }).isVisible(), true, '768: existing email validation remains visible');

    await dashboard.page.setViewportSize({ width: 1280, height: 900 });
    await dashboard.page.waitForFunction(() => document.querySelector('[data-quote-presentation-mode]')?.dataset.quotePresentationMode === 'desktop');
    await assertMode(dashboard.page, 1280, 'desktop');
    assert.equal(await clientName.inputValue(), 'DEVICE01 Resize Client', '768→1280: unsaved value preserved');
    assert.equal(await clientEmail.inputValue(), 'invalid-email', '768→1280: second unsaved value preserved');
    assert.equal(await dashboard.page.getByText('Please enter a valid email address.', { exact: true }).isVisible(), true, '1280: shared validation remains visible after mode change');
    await clientEmail.fill('client@device.example');
    assert.equal(await dashboard.page.getByText('Please enter a valid email address.', { exact: true }).isVisible(), false, '1280: existing email validation clears for valid input');
    const mutatingRequests = dashboard.requests.filter(({ method }) => ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method));
    assert.deepEqual(mutatingRequests, [], `resize must not trigger Save/network mutation: ${JSON.stringify(mutatingRequests)}`);
    assert.deepEqual(dashboard.pageErrors, [], 'resize continuity: no browser page errors');
  } finally {
    await dashboard.context.close();
  }
} finally {
  await browser.close();
  await server.close();
  await supabase.close();
}

console.log(`R56E-G-QE-SHARED-01 browser state continuity: PASS (${screenshotDir})`);
