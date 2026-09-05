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
const screenshotDir = path.join(cwd, 'output/playwright/r56e-g-qe-m02-fix1');
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
  if (pathname === '/api/quotes') return { data: [{ id: 'quote-m02-fix1', quote_number: 'QT-M02-FIX1', client_name: 'Starter Client', client_email: 'client@example.com', client_address: '100 Studio Way', currency: 'USD', total: 100, status: 'draft', items: [{ description: 'Portrait session', quantity: 1, unit_price: 100 }] }] };
  if (pathname === '/api/clients') return { data: [{ id: 'client-m02-fix1', name: 'Existing M02 Client', email: 'existing@example.com', address: '200 Client Lane' }] };
  if (pathname === '/api/invoices') return { data: [] };
  if (pathname === '/api/leads') return { data: [] };
  if (pathname === '/api/card-profile') return { data: { id: 'profile-m02-fix1' } };
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

async function assertNoOverflow(page, label) {
  const dimensions = await page.evaluate(() => ({ innerWidth: window.innerWidth, documentWidth: document.documentElement.scrollWidth, bodyWidth: document.body.scrollWidth }));
  assert.ok(dimensions.documentWidth <= dimensions.innerWidth, `${label}: document overflow ${JSON.stringify(dimensions)}`);
  assert.ok(dimensions.bodyWidth <= dimensions.innerWidth, `${label}: body overflow ${JSON.stringify(dimensions)}`);
}

async function assertWorkflowStep(page, label) {
  const root = page.locator('[data-quote-presentation-mode]');
  assert.equal(await root.getAttribute('data-quote-presentation-mode'), 'guided', `${label}: guided mode`);
  assert.equal(await root.getAttribute('data-active-quote-presentation-trees'), '1', `${label}: one active tree`);
  assert.equal(await page.getByTestId('quote-guided-shell').getAttribute('data-guided-step'), 'WORKFLOW', `${label}: Workflow step`);
  assert.equal(await page.getByTestId('quote-business-editor').count(), 0, `${label}: compatibility editor absent`);
}

async function assertClientStep(page, label) {
  const step = page.getByTestId('quote-guided-client-step');
  await step.waitFor({ state: 'visible' });
  assert.equal(await step.getAttribute('data-guided-step'), 'CLIENT', `${label}: Client step`);
  for (const testId of ['quote-guided-client-select', 'quote-guided-client-name', 'quote-guided-client-email', 'quote-guided-client-address']) {
    assert.equal(await page.getByTestId(testId).count(), 1, `${label}: ${testId}`);
  }
  await assertNoOverflow(page, label);
}

const isMutating = ({ method }) => ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method);
const capture = (page, filename) => page.screenshot({ path: path.join(screenshotDir, filename), fullPage: true });

const supabase = await startMockSupabase();
const server = await startNext(supabase.url);
const browser = await chromium.launch({ headless: true });
try {
  for (const [width, height, filename] of [[390, 844, '390-guided-client.png'], [768, 1000, '768-guided-client.png'], [1023, 1000, '1023-guided-client.png']]) {
    const dashboard = await createDashboardPage(browser, server.baseUrl, { width, height });
    try {
      await openQuoteEditor(dashboard.page, server.baseUrl);
      await assertWorkflowStep(dashboard.page, `${width}: initial`);
      await dashboard.page.getByRole('button', { name: 'Commercial', exact: true }).click();
      dashboard.requests.length = 0;
      await dashboard.page.getByRole('button', { name: 'Continue', exact: true }).click();
      await assertClientStep(dashboard.page, `${width}: immediate Workflow→Client`);
      assert.equal(await dashboard.page.getByText('Applied "Commercial / Advertising" workflow template.', { exact: true }).count(), 0, `${width}: previous workflow toast absent from Client`);
      if (filename) await capture(dashboard.page, filename);
      assert.equal(await dashboard.page.getByTestId('quote-guided-client-select').locator('option').count(), 2, `${width}: existing client option available`);
      await dashboard.page.getByTestId('quote-guided-client-select').selectOption('client-m02-fix1');
      assert.equal(await dashboard.page.getByTestId('quote-guided-client-name').inputValue(), 'Existing M02 Client', `${width}: selection hydrates name`);
      assert.equal(await dashboard.page.getByTestId('quote-guided-client-email').inputValue(), 'existing@example.com', `${width}: selection hydrates email`);
      await dashboard.page.getByTestId('quote-guided-client-name').fill('');
      await dashboard.page.getByTestId('quote-guided-client-email').fill('invalid');
      await dashboard.page.getByTestId('quote-guided-client-email').blur();
      assert.equal(await dashboard.page.getByText('Please enter a valid email address.', { exact: true }).count(), 1, `${width}: invalid email uses shared error`);
      await dashboard.page.getByRole('button', { name: 'Continue', exact: true }).click();
      assert.equal(await dashboard.page.getByTestId('quote-guided-client-step').count(), 1, `${width}: required name blocks invalid Client continuation`);
      assert.equal(await dashboard.page.getByText('Recipient client name is required.', { exact: true }).count(), 1, `${width}: required name uses shared error`);
      await dashboard.page.getByTestId('quote-guided-client-name').fill('M02 Fix Client');
      await dashboard.page.getByTestId('quote-guided-client-email').fill('valid@example.com');
      await dashboard.page.getByTestId('quote-guided-client-address').fill('300 Guided Avenue');
      await dashboard.page.getByRole('button', { name: 'Back', exact: true }).click();
      await assertWorkflowStep(dashboard.page, `${width}: Client→Workflow`);
      assert.deepEqual(dashboard.requests.filter(isMutating), [], `${width}: guided navigation has no mutation`);
      await dashboard.page.getByRole('button', { name: 'Continue', exact: true }).click();
      await assertClientStep(dashboard.page, `${width}: Client re-entry`);
      assert.equal(await dashboard.page.getByTestId('quote-guided-client-name').inputValue(), 'M02 Fix Client', `${width}: name survives re-entry`);
      await dashboard.page.getByRole('button', { name: 'Continue', exact: true }).click();
      await dashboard.page.locator('[data-guided-compatibility="true"]').waitFor({ state: 'visible' });
      assert.equal(await dashboard.page.getByTestId('quote-business-editor').isVisible(), true, `${width}: existing editor reachable`);
      assert.equal(await dashboard.page.getByTestId('quote-client-name-input').inputValue(), 'M02 Fix Client', `${width}: name survives compatibility handoff`);
      assert.deepEqual(dashboard.requests.filter(isMutating), [], `${width}: compatibility handoff has no mutation`);
      await dashboard.page.getByRole('button', { name: 'Back', exact: true }).click();
      await assertClientStep(dashboard.page, `${width}: compatibility Back→Client`);
      await dashboard.page.getByTestId('quote-guided-client-email').fill('');
      await dashboard.page.getByRole('button', { name: 'Continue', exact: true }).click();
      await dashboard.page.locator('[data-guided-compatibility="true"]').waitFor({ state: 'visible' });
      assert.equal(await dashboard.page.getByText('Please enter a valid email address.', { exact: true }).count(), 0, `${width}: empty optional email is accepted`);
      assert.deepEqual(dashboard.pageErrors, [], `${width}: no page errors`);
    } finally {
      await dashboard.context.close();
    }
  }

  for (const [width, filename] of [[1024, '1024-desktop.png'], [1280, '1280-desktop.png']]) {
    const dashboard = await createDashboardPage(browser, server.baseUrl, { width, height: 900 });
    try {
      await openQuoteEditor(dashboard.page, server.baseUrl);
      const root = dashboard.page.locator('[data-quote-presentation-mode]');
      assert.equal(await root.getAttribute('data-quote-presentation-mode'), 'desktop', `${width}: desktop mode`);
      assert.equal(await root.getAttribute('data-active-quote-presentation-trees'), '1', `${width}: one active tree`);
      assert.equal(await dashboard.page.getByTestId('quote-guided-shell').count(), 0, `${width}: Guided tree absent`);
      assert.equal(await dashboard.page.getByTestId('quote-business-editor').isVisible(), true, `${width}: desktop editor visible`);
      assert.equal(await dashboard.page.getByTestId('quote-client-document-canvas').isVisible(), true, `${width}: desktop document visible`);
      assert.deepEqual(dashboard.pageErrors, [], `${width}: no page errors`);
      await capture(dashboard.page, filename);
    } finally {
      await dashboard.context.close();
    }
  }

  const resizeDashboard = await createDashboardPage(browser, server.baseUrl, { width: 1280, height: 900 });
  try {
    await openQuoteEditor(resizeDashboard.page, server.baseUrl);
    await resizeDashboard.page.getByTestId('quote-client-name-input').fill('M02 Resize Client');
    resizeDashboard.requests.length = 0;
    await resizeDashboard.page.setViewportSize({ width: 768, height: 1000 });
    await resizeDashboard.page.waitForFunction(() => document.querySelector('[data-quote-presentation-mode]')?.dataset.quotePresentationMode === 'guided');
    await assertWorkflowStep(resizeDashboard.page, '1280→768');
    await resizeDashboard.page.getByRole('button', { name: 'Continue', exact: true }).click();
    await assertClientStep(resizeDashboard.page, '1280→768 Client');
    assert.equal(await resizeDashboard.page.getByTestId('quote-guided-client-name').inputValue(), 'M02 Resize Client', '1280→768: shared value survives');
    await resizeDashboard.page.setViewportSize({ width: 1280, height: 900 });
    await resizeDashboard.page.waitForFunction(() => document.querySelector('[data-quote-presentation-mode]')?.dataset.quotePresentationMode === 'desktop');
    assert.equal(await resizeDashboard.page.getByTestId('quote-client-name-input').inputValue(), 'M02 Resize Client', '768→1280: shared value survives');
    assert.deepEqual(resizeDashboard.requests.filter(isMutating), [], 'resize has no mutation');
    assert.deepEqual(resizeDashboard.pageErrors, [], 'resize: no page errors');
  } finally {
    await resizeDashboard.context.close();
  }

  const zhDashboard = await createDashboardPage(browser, server.baseUrl, { width: 390, height: 844 }, 'zh-CN');
  try {
    await openQuoteEditor(zhDashboard.page, server.baseUrl);
    await assertWorkflowStep(zhDashboard.page, 'zh-CN initial');
    await zhDashboard.page.getByRole('button', { name: 'Continue', exact: true }).click();
    await assertClientStep(zhDashboard.page, 'zh-CN Client');
    const guidedText = await zhDashboard.page.getByTestId('quote-guided-client-step').innerText();
    assert.equal((guidedText.match(/[\u3400-\u9fff]/g) || []).length, 0, 'zh-CN: Guided Client UI remains English');
    assert.deepEqual(zhDashboard.pageErrors, [], 'zh-CN: no page errors');
  } finally {
    await zhDashboard.context.close();
  }
} finally {
  await browser.close();
  await server.close();
  await supabase.close();
}

console.log(`R56E-G-QE-M02-FIX-1 browser runtime: PASS (${screenshotDir})`);
