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
const screenshotDir = path.join(cwd, 'output/playwright/r56e-s4b');
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
    if (requestUrl.pathname === '/auth/v1/user') {
      sendJson(response, 200, TEST_USER);
      return;
    }
    if (requestUrl.pathname === '/auth/v1/token') {
      sendJson(response, 200, createSession());
      return;
    }
    if (requestUrl.pathname === '/auth/v1/logout') {
      response.writeHead(204, { 'Access-Control-Allow-Origin': '*' });
      response.end();
      return;
    }
    if (requestUrl.pathname === '/rest/v1/entitlements') {
      sendJson(response, 200, [{ user_id: TEST_USER.id, invoice: true, export_pdf: false, client_portal: false, crm: false, automation: false, advanced_invoicing: false }]);
      return;
    }
    sendJson(response, 200, []);
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
  if (pathname === '/api/quotes') return { data: [{ id: 'quote-browser', quote_number: 'QT-BROWSER', client_name: 'Starter Client', client_email: 'client@example.com', client_address: '100 Studio Way', currency: 'USD', total: 10000, status: 'draft', items: [{ description: 'Portrait session', quantity: 1, unit_price: 100 }] }] };
  if (pathname === '/api/clients') return { data: [] };
  if (pathname === '/api/invoices') return { data: [] };
  if (pathname === '/api/leads') return { data: [] };
  if (pathname === '/api/card-profile') return { data: { id: 'profile-browser' } };
  return { data: [] };
}

async function createDashboardPage(browser, baseUrl, viewport, locale = 'en-US') {
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

async function assertTrueScale(page, width) {
  const frame = page.getByTestId('quote-client-document-preview-frame');
  const paper = frame.locator('.quote-client-document');
  const frameBox = await frame.boundingBox();
  const paperBox = await paper.boundingBox();
  const canonicalWidth = await paper.evaluate((element) => element.offsetWidth);
  const renderScale = Number(await frame.getAttribute('data-render-scale'));

  assert.equal(canonicalWidth, 794, `${width}: canonical document layout width`);
  assert.ok(renderScale > 0 && renderScale <= 1, `${width}: render scale ${renderScale}`);
  assert.ok(paperBox.width <= frameBox.width + 1, `${width}: scaled paper fits frame ${paperBox.width}/${frameBox.width}`);
  assert.ok(Math.abs(paperBox.width / canonicalWidth - renderScale) < 0.03, `${width}: scale matches rendered width`);
  if (frameBox.width < canonicalWidth - 1) {
    assert.ok(renderScale < 1, `${width}: constrained frame must scale document`);
    assert.ok(paperBox.width < canonicalWidth - 1, `${width}: constrained paper must render below canonical width`);
  }
}

async function assertDesktop(browser, baseUrl, width) {
  const dashboard = await createDashboardPage(browser, baseUrl, { width, height: 900 });
  try {
    await openQuoteEditor(dashboard.page, baseUrl);
    const editor = dashboard.page.getByTestId('quote-business-editor');
    const canvas = dashboard.page.getByTestId('quote-client-document-canvas');
    assert.equal(await editor.isVisible(), true, `${width}: business editor visible`);
    assert.equal(await canvas.isVisible(), true, `${width}: client canvas visible`);
    const editorBox = await editor.boundingBox();
    assert.ok(editorBox.width >= 420 && editorBox.width <= 480, `${width}: editor width ${editorBox.width}`);
    assert.equal(await canvas.locator('input, textarea, select, button').count(), 0, `${width}: client paper is not editable`);
    await dashboard.page.screenshot({ path: path.join(screenshotDir, `${width}-desktop.png`), fullPage: true });
    await assertNoHorizontalOverflow(dashboard.page, `${width}`);
    assert.deepEqual(dashboard.pageErrors, [], `${width}: no page errors`);
  } finally {
    await dashboard.context.close();
  }
}

async function assertModeViewport(browser, baseUrl, width, height) {
  const dashboard = await createDashboardPage(browser, baseUrl, { width, height });
  try {
    await openQuoteEditor(dashboard.page, baseUrl);
    const editor = dashboard.page.getByTestId('quote-business-editor');
    const canvas = dashboard.page.getByTestId('quote-client-document-canvas');
    assert.equal(await editor.isVisible(), true, `${width}: Edit default visible`);
    assert.equal(await canvas.isVisible(), false, `${width}: Preview hidden in Edit mode`);
    await dashboard.page.screenshot({ path: path.join(screenshotDir, `${width}-edit.png`), fullPage: true });
    await dashboard.page.getByRole('button', { name: 'Preview', exact: true }).click();
    await canvas.waitFor({ state: 'visible' });
    assert.equal(await editor.isVisible(), false, `${width}: editor hidden in Preview mode`);
    await assertTrueScale(dashboard.page, width);
    await dashboard.page.screenshot({ path: path.join(screenshotDir, `${width}-preview.png`), fullPage: true });
    await assertNoHorizontalOverflow(dashboard.page, `${width} preview`);
    await dashboard.page.getByRole('button', { name: 'Edit', exact: true }).click();
    await editor.waitFor({ state: 'visible' });
    assert.deepEqual(dashboard.pageErrors, [], `${width}: no page errors`);
  } finally {
    await dashboard.context.close();
  }
}

async function assertLivePreview(browser, baseUrl) {
  const dashboard = await createDashboardPage(browser, baseUrl, { width: 390, height: 844 });
  try {
    await openQuoteEditor(dashboard.page, baseUrl);
    await dashboard.page.getByTestId('quote-client-name-input').fill('North Star Studio');
    await dashboard.page.getByTestId('quote-number-input').fill('QT-LIVE-CAD');
    await dashboard.page.getByTestId('quote-date-input').fill('2026-09-05');
    await dashboard.page.getByTestId('quote-line-description-0').fill('Editorial portrait package');
    await dashboard.page.locator('input[placeholder="Qty"]').fill('2');
    await dashboard.page.locator('input[placeholder="Rate"]').fill('125');
    await dashboard.page.getByTestId('quote-currency-select').selectOption('CAD');
    await dashboard.page.getByTestId('quote-tax-input').fill('13');
    await dashboard.page.getByTestId('quote-notes-input').fill('Delivery within 14 days.');
    const canvasText = dashboard.page.getByTestId('quote-client-document-canvas');
    await dashboard.page.getByRole('button', { name: 'Preview', exact: true }).click();
    await canvasText.waitFor({ state: 'visible' });
    await assertTrueScale(dashboard.page, 390);
    await canvasText.getByText('North Star Studio', { exact: true }).waitFor({ state: 'visible' });
    const renderedText = await canvasText.innerText();
    assert.match(renderedText, /QT-LIVE-CAD/);
    assert.match(renderedText, /2026-09-05/);
    assert.match(renderedText, /Editorial portrait package/);
    assert.match(renderedText, /CAD/);
    assert.match(renderedText, /Delivery within 14 days\./);
    await dashboard.page.getByRole('button', { name: 'Edit', exact: true }).click();
    assert.equal(await dashboard.page.getByTestId('quote-client-name-input').inputValue(), 'North Star Studio');
    assert.equal(await dashboard.page.getByTestId('quote-currency-select').inputValue(), 'CAD');
    assert.equal(await dashboard.page.getByTestId('quote-tax-input').inputValue(), '13');
    assert.equal(await dashboard.page.getByTestId('quote-notes-input').inputValue(), 'Delivery within 14 days.');
    assert.equal(await dashboard.page.getByRole('button', { name: 'Save Quote', exact: true }).isVisible(), true);
    const printableText = await dashboard.page.locator('#printable-quote').innerText();
    assert.match(printableText, /North Star Studio/);
    assert.match(printableText, /CAD/);
    await dashboard.page.screenshot({ path: path.join(screenshotDir, 'live-preview-390.png'), fullPage: true });
    await assertNoHorizontalOverflow(dashboard.page, '390 live preview');
    assert.deepEqual(dashboard.pageErrors, [], 'live preview: no page errors');
  } finally {
    await dashboard.context.close();
  }
}

async function assertZhCn(browser, baseUrl) {
  const dashboard = await createDashboardPage(browser, baseUrl, { width: 1280, height: 900 }, 'zh-CN');
  try {
    await openQuoteEditor(dashboard.page, baseUrl);
    const text = await dashboard.page.locator('body').innerText();
    assert.equal(/[\u3400-\u9fff\u3040-\u30ff]/.test(text), false, 'zh-CN browser locale must not leak CJK into Corvioz UI');
    await dashboard.page.screenshot({ path: path.join(screenshotDir, '1280-zh-CN.png'), fullPage: true });
    assert.deepEqual(dashboard.pageErrors, [], 'zh-CN: no page errors');
  } finally {
    await dashboard.context.close();
  }
}

const mockSupabase = await startMockSupabase();
const next = await startNext(mockSupabase.url);
const browser = await chromium.launch({ headless: true });
try {
  await assertDesktop(browser, next.baseUrl, 1280);
  await assertDesktop(browser, next.baseUrl, 1440);
  await assertModeViewport(browser, next.baseUrl, 768, 1024);
  await assertModeViewport(browser, next.baseUrl, 390, 844);
  await assertLivePreview(browser, next.baseUrl);
  await assertZhCn(browser, next.baseUrl);
  console.log(`R56E-F-S4B Browser Runtime: PASS screenshots=${screenshotDir}`);
} finally {
  await browser.close();
  await next.close();
  await mockSupabase.close();
}
