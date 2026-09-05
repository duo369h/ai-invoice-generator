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
const screenshotDir = path.join(cwd, 'output/playwright/r56e-g-qe-01');
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
  if (pathname === '/api/quotes') return { data: [{ id: 'quote-browser', quote_number: 'QT-BROWSER', client_name: 'Starter Client', client_email: 'client@example.com', client_address: '100 Studio Way', currency: 'USD', total: 100, status: 'draft', items: [{ description: 'Portrait session', quantity: 1, unit_price: 100 }] }] };
  if (pathname === '/api/clients') return { data: [] };
  if (pathname === '/api/invoices') return { data: [] };
  if (pathname === '/api/leads') return { data: [] };
  if (pathname === '/api/card-profile') return { data: { id: 'profile-browser' } };
  return { data: [] };
}

async function createDashboardPage(browser, baseUrl, viewport, locale) {
  const context = await browser.newContext({ viewport, locale });
  const session = createSession();
  await context.addInitScript((storedSession) => {
    window.localStorage.setItem('corvioz_analytics_consent', 'accepted');
    window.localStorage.setItem('sb-127-auth-token', JSON.stringify(storedSession));
  }, session);
  await context.addCookies([{ name: 'sb-127-auth-token.0', value: encodeURIComponent(JSON.stringify(session)), url: baseUrl }, { name: 'corvioz_analytics_consent', value: 'accepted', url: baseUrl }]);
  const page = await context.newPage();
  const pageErrors = [];
  page.on('pageerror', (error) => pageErrors.push(error.message));
  await page.route('**/api/**', async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(apiBody(new URL(route.request().url()).pathname)) });
  });
  return { context, page, pageErrors };
}

async function openQuoteEditor(page, baseUrl) {
  await page.goto(`${baseUrl}/dashboard?tool=quotes`, { waitUntil: 'domcontentloaded' });
  await page.getByRole('heading', { name: 'Quotes', exact: true }).waitFor({ state: 'visible', timeout: 20_000 });
  await page.getByRole('button', { name: 'Create Quote', exact: true }).click();
  await page.getByRole('heading', { name: 'Create Quote', exact: true }).waitFor({ state: 'visible' });
  await page.evaluate(() => {
    const auditTitle = [...document.querySelectorAll('body *')].find((node) => node.textContent?.trim() === 'Corvioz Verification Audit');
    if (auditTitle?.parentElement?.parentElement?.parentElement) auditTitle.parentElement.parentElement.parentElement.style.display = 'none';
    const debugButton = [...document.querySelectorAll('button')].find((node) => /Kernel Dev Debug|Debug UI/.test(node.textContent || ''));
    if (debugButton?.parentElement) debugButton.parentElement.style.display = 'none';
  });
}

async function assertNoHorizontalOverflow(page, label) {
  const overflow = await page.evaluate(() => ({ innerWidth: window.innerWidth, documentWidth: document.documentElement.scrollWidth, bodyWidth: document.body.scrollWidth }));
  assert.ok(overflow.documentWidth <= overflow.innerWidth, `${label}: document horizontal overflow ${JSON.stringify(overflow)}`);
  assert.ok(overflow.bodyWidth <= overflow.innerWidth, `${label}: body horizontal overflow ${JSON.stringify(overflow)}`);
}

async function assertDocumentFirst(page, label) {
  assert.equal(await page.getByTestId('quote-client-document-canvas').isVisible(), true, `${label}: document is visible`);
  assert.equal(await page.getByTestId('quote-business-editor').isVisible(), true, `${label}: editor bridge is reachable`);
  const order = await page.evaluate(() => {
    const canvas = document.querySelector('[data-testid="quote-client-document-canvas"]');
    const bridge = document.querySelector('[data-testid="quote-business-editor"]');
    return Boolean(canvas && bridge && canvas.compareDocumentPosition(bridge) & Node.DOCUMENT_POSITION_FOLLOWING);
  });
  assert.equal(order, true, `${label}: document precedes editor bridge`);
  assert.equal(await page.locator('.quote-workspace-mode-switch').count(), 0, `${label}: no Edit/Preview mode switch`);
  assert.equal(await page.locator('.quote-workspace-layout').count(), 0, `${label}: no permanent split workspace`);
  const workflowLabels = await page.locator('[data-testid="quote-workflow-selector"] .quote-workflow-tab').allTextContents();
  assert.deepEqual(workflowLabels, ['Commercial', 'Wedding', 'Portrait', 'Event'], `${label}: compact primary workflows`);
  assert.equal(await page.getByText('More workflows', { exact: true }).isVisible(), true, `${label}: More workflows reachable`);
  await page.getByText('More workflows', { exact: true }).click();
  for (const labelText of ['Product', 'Food & Beverage', 'Architecture & Interior', 'Blank Quote']) {
    assert.equal(await page.locator('.quote-workflow-more-menu button').filter({ hasText: labelText }).isVisible(), true, `${label}: ${labelText} reachable`);
  }
  await page.getByText('More workflows', { exact: true }).click();
}

async function assertTrueScale(page, label) {
  const frame = page.getByTestId('quote-client-document-preview-frame');
  const paper = frame.locator('.quote-client-document');
  const frameBox = await frame.boundingBox();
  const paperBox = await paper.boundingBox();
  const canonicalWidth = await paper.evaluate((element) => element.offsetWidth);
  const renderScale = Number(await frame.getAttribute('data-render-scale'));
  assert.equal(canonicalWidth, 794, `${label}: canonical document width`);
  assert.ok(renderScale > 0 && renderScale <= 1, `${label}: render scale ${renderScale}`);
  assert.ok(paperBox.width <= frameBox.width + 1, `${label}: paper fits frame ${paperBox.width}/${frameBox.width}`);
  assert.ok(Math.abs(paperBox.width / canonicalWidth - renderScale) < 0.03, `${label}: render scale matches paper width`);
}

const supabase = await startMockSupabase();
const server = await startNext(supabase.url);
const browser = await chromium.launch({ headless: true });
try {
  for (const [width, height] of [[1440, 900], [1280, 900], [768, 1000], [390, 844]]) {
    const label = `${width}`;
    const dashboard = await createDashboardPage(browser, server.baseUrl, { width, height }, 'en-US');
    try {
      await openQuoteEditor(dashboard.page, server.baseUrl);
      await assertDocumentFirst(dashboard.page, label);
      await assertTrueScale(dashboard.page, label);
      await assertNoHorizontalOverflow(dashboard.page, label);
      assert.deepEqual(dashboard.pageErrors, [], `${label}: no browser page errors`);
      await dashboard.page.screenshot({ path: path.join(screenshotDir, `${label}.png`), fullPage: true });
    } finally {
      await dashboard.context.close();
    }
  }

  const zhDashboard = await createDashboardPage(browser, server.baseUrl, { width: 1280, height: 900 }, 'zh-CN');
  try {
    await openQuoteEditor(zhDashboard.page, server.baseUrl);
    await assertDocumentFirst(zhDashboard.page, '1280-zh-CN');
    await assertTrueScale(zhDashboard.page, '1280-zh-CN');
    await assertNoHorizontalOverflow(zhDashboard.page, '1280-zh-CN');
    assert.equal(await zhDashboard.page.getByRole('heading', { name: 'Create Quote', exact: true }).isVisible(), true, 'zh-CN: Corvioz UI remains English');
    assert.equal(await zhDashboard.page.getByText('Workflow', { exact: true }).isVisible(), true, 'zh-CN: workflow selector remains English');
    assert.deepEqual(zhDashboard.pageErrors, [], 'zh-CN: no browser page errors');
    await zhDashboard.page.screenshot({ path: path.join(screenshotDir, '1280-zh-CN.png'), fullPage: true });
  } finally {
    await zhDashboard.context.close();
  }
} finally {
  await browser.close();
  await server.close();
  await supabase.close();
}

console.log(`R56E-G-QE-01 browser runtime: PASS (${screenshotDir})`);
