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
const screenshotDir = path.join(cwd, 'output/playwright/r56e-g-qe-m01');
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
  if (pathname === '/api/quotes') return { data: [{ id: 'quote-m01', quote_number: 'QT-M01', client_name: 'Starter Client', client_email: 'client@example.com', client_address: '100 Studio Way', currency: 'USD', total: 100, status: 'draft', items: [{ description: 'Portrait session', quantity: 1, unit_price: 100 }] }] };
  if (pathname === '/api/clients') return { data: [] };
  if (pathname === '/api/invoices') return { data: [] };
  if (pathname === '/api/leads') return { data: [] };
  if (pathname === '/api/card-profile') return { data: { id: 'profile-m01' } };
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
  await page.locator('[data-quote-presentation-mode]').waitFor({ state: 'attached' });
  await page.waitForFunction(() => document.querySelector('[data-quote-presentation-mode]')?.dataset.quotePresentationMode !== 'unresolved');
  await page.evaluate(() => {
    const auditTitle = [...document.querySelectorAll('body *')].find((node) => node.textContent?.trim() === 'Corvioz Verification Audit');
    if (auditTitle?.parentElement?.parentElement?.parentElement) auditTitle.parentElement.parentElement.parentElement.style.display = 'none';
    const debugButton = [...document.querySelectorAll('button')].find((node) => /Kernel Dev Debug|Debug UI/.test(node.textContent || ''));
    if (debugButton?.parentElement) debugButton.parentElement.style.display = 'none';
  });
}

async function assertGuidedInitial(page, width) {
  const root = page.locator('[data-quote-presentation-mode]');
  assert.equal(await root.getAttribute('data-quote-presentation-mode'), 'guided', `${width}: guided mode`);
  assert.equal(await root.getAttribute('data-active-quote-presentation-trees'), '1', `${width}: one active tree`);
  assert.equal(await page.getByTestId('quote-guided-shell').count(), 1, `${width}: guided shell mounted`);
  assert.equal(await page.getByTestId('quote-guided-shell').getAttribute('data-guided-step'), 'WORKFLOW', `${width}: initial Workflow step`);
  assert.equal(await page.getByTestId('quote-guided-workflow-selector').count(), 1, `${width}: compact selector visible`);
  assert.equal(await page.locator('.quote-guided-workflow-tab').count(), 4, `${width}: four primary workflows`);
  for (const label of ['Commercial', 'Wedding', 'Portrait', 'Event']) {
    assert.equal(await page.getByRole('button', { name: label, exact: true }).count(), 1, `${width}: ${label} reachable`);
  }
  assert.equal(await page.getByTestId('quote-client-document-canvas').count(), 0, `${width}: no permanent document preview`);
  assert.equal(await page.getByTestId('quote-business-editor').count(), 0, `${width}: compatibility editor not initially mounted`);
  assert.equal(await page.getByRole('button', { name: 'Continue', exact: true }).count(), 1, `${width}: one dominant Continue`);
  const more = page.locator('.quote-guided-more-workflows');
  await more.locator('summary').click();
  for (const label of ['Product', 'Food & Beverage', 'Architecture & Interior', 'Blank Quote']) {
    assert.equal(await more.getByRole('button', { name: label, exact: true }).count(), 1, `${width}: ${label} additional workflow reachable`);
  }
  await more.locator('summary').click();
}

async function assertNoOverflow(page, width) {
  const dimensions = await page.evaluate(() => ({ innerWidth: window.innerWidth, documentWidth: document.documentElement.scrollWidth, bodyWidth: document.body.scrollWidth }));
  assert.ok(dimensions.documentWidth <= dimensions.innerWidth, `${width}: document overflow ${JSON.stringify(dimensions)}`);
  assert.ok(dimensions.bodyWidth <= dimensions.innerWidth, `${width}: body overflow ${JSON.stringify(dimensions)}`);
}

async function assertDesktopInitial(page, width) {
  const root = page.locator('[data-quote-presentation-mode]');
  assert.equal(await root.getAttribute('data-quote-presentation-mode'), 'desktop', `${width}: desktop mode`);
  assert.equal(await root.getAttribute('data-active-quote-presentation-trees'), '1', `${width}: one active tree`);
  assert.equal(await page.getByTestId('quote-client-document-canvas').isVisible(), true, `${width}: desktop document visible`);
  const editor = page.getByTestId('quote-business-editor');
  await editor.waitFor({ state: 'visible' });
  assert.equal(await editor.isVisible(), true, `${width}: desktop editor visible`);
  assert.equal(await page.getByTestId('quote-guided-shell').count(), 0, `${width}: guided shell absent`);
}

async function capture(page, filename) {
  await page.screenshot({ path: path.join(screenshotDir, filename), fullPage: true });
}

const supabase = await startMockSupabase();
const server = await startNext(supabase.url);
const browser = await chromium.launch({ headless: true });
try {
  for (const [width, height, filename] of [
    [390, 844, '390-guided-workflow.png'],
    [768, 1000, '768-guided-workflow.png'],
    [1023, 1000, null],
  ]) {
    const dashboard = await createDashboardPage(browser, server.baseUrl, { width, height });
    try {
      await openQuoteEditor(dashboard.page, server.baseUrl);
      if (filename) await capture(dashboard.page, filename);
      await assertGuidedInitial(dashboard.page, width);
      await assertNoOverflow(dashboard.page, width);
      await dashboard.page.getByRole('button', { name: 'Commercial', exact: true }).click();
      assert.equal(await dashboard.page.locator('[data-workflow-id="commercial-shoot"]').getAttribute('aria-pressed'), 'true', `${width}: workflow selection uses shared command`);
      dashboard.requests.length = 0;
      await dashboard.page.getByRole('button', { name: 'Continue', exact: true }).click();
      await dashboard.page.locator('[data-guided-compatibility="true"]').waitFor({ state: 'visible' });
      assert.equal(await dashboard.page.getByTestId('quote-business-editor').isVisible(), true, `${width}: compatibility details reachable`);
      assert.equal(await dashboard.page.getByTestId('quote-client-document-canvas').isVisible(), true, `${width}: existing Quote capability preserved`);
      const mutatingRequests = dashboard.requests.filter(({ method }) => ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method));
      assert.deepEqual(mutatingRequests, [], `${width}: Continue caused no mutation`);
      if (width === 390) await capture(dashboard.page, '390-guided-compatibility-details.png');
      assert.deepEqual(dashboard.pageErrors, [], `${width}: no page errors`);
    } finally {
      await dashboard.context.close();
    }
  }

  for (const [width, filename] of [[1024, '1024-desktop.png'], [1280, '1280-desktop.png']]) {
    const dashboard = await createDashboardPage(browser, server.baseUrl, { width, height: 900 });
    try {
      await openQuoteEditor(dashboard.page, server.baseUrl);
      await assertDesktopInitial(dashboard.page, width);
      assert.deepEqual(dashboard.pageErrors, [], `${width}: no page errors`);
      await capture(dashboard.page, filename);
    } finally {
      await dashboard.context.close();
    }
  }

  const resizeDashboard = await createDashboardPage(browser, server.baseUrl, { width: 1280, height: 900 });
  try {
    await openQuoteEditor(resizeDashboard.page, server.baseUrl);
    await assertDesktopInitial(resizeDashboard.page, 1280);
    await resizeDashboard.page.getByTestId('quote-client-name-input').fill('M01 Resize Client');
    resizeDashboard.requests.length = 0;
    await resizeDashboard.page.setViewportSize({ width: 768, height: 1000 });
    await resizeDashboard.page.waitForFunction(() => document.querySelector('[data-quote-presentation-mode]')?.dataset.quotePresentationMode === 'guided');
    await assertGuidedInitial(resizeDashboard.page, 768);
    await resizeDashboard.page.getByRole('button', { name: 'Continue', exact: true }).click();
    await resizeDashboard.page.getByTestId('quote-client-name-input').waitFor({ state: 'visible' });
    assert.equal(await resizeDashboard.page.getByTestId('quote-client-name-input').inputValue(), 'M01 Resize Client', '1280→768: shared Quote value survives');
    await resizeDashboard.page.setViewportSize({ width: 1280, height: 900 });
    await resizeDashboard.page.waitForFunction(() => document.querySelector('[data-quote-presentation-mode]')?.dataset.quotePresentationMode === 'desktop');
    await assertDesktopInitial(resizeDashboard.page, 1280);
    assert.equal(await resizeDashboard.page.getByTestId('quote-client-name-input').inputValue(), 'M01 Resize Client', '768→1280: shared Quote value survives');
    const mutatingRequests = resizeDashboard.requests.filter(({ method }) => ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method));
    assert.deepEqual(mutatingRequests, [], `resize caused no mutation: ${JSON.stringify(mutatingRequests)}`);
    assert.deepEqual(resizeDashboard.pageErrors, [], 'resize: no page errors');
  } finally {
    await resizeDashboard.context.close();
  }

  const zhDashboard = await createDashboardPage(browser, server.baseUrl, { width: 390, height: 844 }, 'zh-CN');
  try {
    await openQuoteEditor(zhDashboard.page, server.baseUrl);
    await assertGuidedInitial(zhDashboard.page, 390);
    const guidedText = await zhDashboard.page.getByTestId('quote-guided-shell').innerText();
    assert.equal((guidedText.match(/[\u3400-\u9fff]/g) || []).length, 0, 'zh-CN: Guided primary UI remains English');
    assert.deepEqual(zhDashboard.pageErrors, [], 'zh-CN: no page errors');
  } finally {
    await zhDashboard.context.close();
  }
} finally {
  await browser.close();
  await server.close();
  await supabase.close();
}

console.log(`R56E-G-QE-M01 browser runtime: PASS (${screenshotDir})`);
