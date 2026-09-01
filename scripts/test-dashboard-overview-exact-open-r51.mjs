import assert from 'node:assert/strict';
import http from 'node:http';
import net from 'node:net';
import path from 'node:path';
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import { spawn } from 'node:child_process';

const root = process.cwd();
const dashboard = readFileSync(path.join(root, 'src/components/dashboard/Dashboard.js'), 'utf8');
const overview = readFileSync(path.join(root, 'src/app/dashboard/components/DashboardOverview.js'), 'utf8');
const dependencyRoot = process.env.CORVIOZ_NODE_MODULES_ROOT || root;
const sharedRequire = createRequire(path.join(dependencyRoot, 'package.json'));
const nextCli = sharedRequire.resolve('next/dist/bin/next');

function matchingBrace(source, openIndex) {
  let depth = 0;
  let quote = null;
  let escaped = false;
  for (let index = openIndex; index < source.length; index += 1) {
    const character = source[index];
    if (quote) {
      if (escaped) escaped = false;
      else if (character === '\\') escaped = true;
      else if (character === quote) quote = null;
      continue;
    }
    if (character === "'" || character === '"' || character === '`') {
      quote = character;
      continue;
    }
    if (character === '{') depth += 1;
    if (character === '}') {
      depth -= 1;
      if (depth === 0) return index;
    }
  }
  throw new Error('Unbalanced Dashboard handler body');
}

function extractHandler(name) {
  const start = dashboard.indexOf(`${name}:`);
  assert.notEqual(start, -1, `Dashboard must define ${name}`);
  const arrow = dashboard.indexOf('=>', start);
  const open = dashboard.indexOf('{', arrow);
  return dashboard.slice(start, matchingBrace(dashboard, open) + 1);
}

const openQuotesSource = extractHandler('openQuotes');
const openInvoicesSource = extractHandler('openInvoices');

assert.match(openQuotesSource, /openQuotes:\s*\(\{\s*id\s*\}\s*=\s*\{\}\)\s*=>/);
assert.match(openInvoicesSource, /openInvoices:\s*\(\{\s*id\s*\}\s*=\s*\{\}\)\s*=>/);
assert.match(openQuotesSource, /if\s*\(id\)[\s\S]*?openDocument\(\{\s*documentType:\s*'quote',\s*id\s*\}\)/);
assert.match(openInvoicesSource, /if\s*\(id\)[\s\S]*?openDocument\(\{\s*documentType:\s*'invoice',\s*id\s*\}\)/);
assert.match(openQuotesSource, /handleDashboardTabChange\('quotes', 'overview'\)/);
assert.match(openInvoicesSource, /handleDashboardTabChange\('invoices', 'overview'\)/);

assert.match(
  overview,
  /resolveAction\(actionHandlers, openAction, \{\s*id: document\.id,\s*documentType: isQuote \? 'quote' : 'invoice'\s*\}\)/,
  'Recent Documents must pass each row canonical ID and type',
);
assert.match(overview, /Open \{typeLabel\}/, 'Recent Documents must describe an exact singular document action');
assert.doesNotMatch(overview, /Open \{typeLabel\}s/, 'Recent Documents must not retain plural list copy');
assert.match(overview, /resolveAction\(actionHandlers, 'openQuotes', \{ id: snapshot\.id \}\)/);
assert.match(overview, /resolveAction\(actionHandlers, item\.action, \{ id: item\.documentId, documentType: item\.documentType \}\)/);

function createActionHarness() {
  const calls = [];
  const openDocument = (payload) => {
    calls.push({ type: 'openDocument', payload });
    return payload?.id !== 'missing-document';
  };
  const handleDashboardTabChange = (tab, source) => {
    calls.push({ type: 'tab', tab, source });
    return undefined;
  };
  const factory = new Function('openQuotesSource', 'openInvoicesSource', 'openDocument', 'handleDashboardTabChange', `
    const openQuotes = eval('(' + openQuotesSource.replace(/^openQuotes:\\s*/, '') + ')');
    const openInvoices = eval('(' + openInvoicesSource.replace(/^openInvoices:\\s*/, '') + ')');
    return { openQuotes, openInvoices };
  `);
  return { ...factory(openQuotesSource, openInvoicesSource, openDocument, handleDashboardTabChange), calls };
}

const actionHarness = createActionHarness();
assert.equal(actionHarness.openQuotes({ id: 'quote-overview' }), true, 'Quote exact action returns shared open result');
assert.deepEqual(actionHarness.calls.at(-1), { type: 'openDocument', payload: { documentType: 'quote', id: 'quote-overview' } });
assert.equal(actionHarness.openInvoices({ id: 'invoice-overview' }), true, 'Invoice exact action returns shared open result');
assert.deepEqual(actionHarness.calls.at(-1), { type: 'openDocument', payload: { documentType: 'invoice', id: 'invoice-overview' } });
assert.equal(actionHarness.openQuotes(), undefined, 'generic Quote action remains available');
assert.deepEqual(actionHarness.calls.at(-1), { type: 'tab', tab: 'quotes', source: 'overview' });
assert.equal(actionHarness.openInvoices(), undefined, 'generic Invoice action remains available');
assert.deepEqual(actionHarness.calls.at(-1), { type: 'tab', tab: 'invoices', source: 'overview' });
const beforeUnknown = actionHarness.calls.length;
assert.equal(actionHarness.openQuotes({ id: 'missing-document' }), false, 'unknown Quote ID fails closed');
assert.equal(actionHarness.calls.length, beforeUnknown + 1, 'unknown ID is delegated once without generic fallback');
assert.equal(actionHarness.calls.at(-1).type, 'openDocument');

function createBrowserSession() {
  const user = { id: 'r51-overview-user', aud: 'authenticated', role: 'authenticated', email: 'r51@example.com', app_metadata: { provider: 'email' }, user_metadata: {} };
  const expiresAt = Math.floor(Date.now() / 1000) + 3600;
  const encode = (value) => Buffer.from(JSON.stringify(value)).toString('base64url');
  return {
    access_token: [encode({ alg: 'none', typ: 'JWT' }), encode({ ...user, exp: expiresAt }), 'r51-test-signature'].join('.'),
    refresh_token: 'r51-refresh',
    expires_in: 3600,
    expires_at: expiresAt,
    token_type: 'bearer',
    user,
  };
}

function sendJson(response, status, body) {
  response.writeHead(status, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, apikey, content-type, x-client-info, x-supabase-api-version' });
  response.end(JSON.stringify(body));
}

async function getFreePort() {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => {
      const port = server.address().port;
      server.close((error) => (error ? reject(error) : resolve(port)));
    });
  });
}

async function startMockSupabase() {
  const server = http.createServer((request, response) => {
    const requestUrl = new URL(request.url, 'http://127.0.0.1');
    if (request.method === 'GET' && requestUrl.pathname === '/auth/v1/user') {
      sendJson(response, 200, createBrowserSession().user);
      return;
    }
    if (request.method === 'GET' && requestUrl.pathname === '/rest/v1/entitlements') {
      sendJson(response, 200, [{ user_id: 'r51-overview-user', invoice: true, export_pdf: false, client_portal: false, crm: false, automation: false, advanced_invoicing: false }]);
      return;
    }
    sendJson(response, 404, { error: 'unhandled mock request' });
  });
  const port = await getFreePort();
  await new Promise((resolve, reject) => { server.once('error', reject); server.listen(port, '127.0.0.1', resolve); });
  return { url: `http://127.0.0.1:${port}`, close: () => new Promise((resolve, reject) => server.close((error) => (error ? reject(error) : resolve()))) };
}

async function startNextTestServer(mockSupabaseUrl) {
  const port = await getFreePort();
  const baseUrl = `http://127.0.0.1:${port}`;
  const child = spawn(process.execPath, [nextCli, 'dev', '--webpack', '--hostname', '127.0.0.1', '--port', String(port)], {
    cwd: root,
    env: { ...process.env, NODE_PATH: path.join(dependencyRoot, 'node_modules'), NEXT_PUBLIC_SUPABASE_URL: mockSupabaseUrl, NEXT_PUBLIC_SUPABASE_ANON_KEY: 'r51-test-anon-key' },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  let serverOutput = '';
  child.stdout.on('data', (chunk) => { serverOutput += chunk.toString(); });
  child.stderr.on('data', (chunk) => { serverOutput += chunk.toString(); });
  const deadline = Date.now() + 60_000;
  try {
    while (Date.now() < deadline) {
      if (child.exitCode !== null) throw new Error(`Next test server exited with ${child.exitCode}`);
      try {
        const healthResponse = await fetch(`${baseUrl}/auth`);
        if (healthResponse.ok) return { baseUrl, close: () => closeNextTestServer(child) };
      } catch (_) {}
      await new Promise((resolve) => setTimeout(resolve, 250));
    }
    throw new Error('Timed out waiting for Next test server');
  } catch (error) {
    child.kill('SIGTERM');
    throw new Error(`${error.message}\n${serverOutput}`);
  }
}

async function closeNextTestServer(child) {
  if (child.exitCode !== null) return;
  child.kill('SIGTERM');
  await Promise.race([new Promise((resolve) => child.once('exit', resolve)), new Promise((resolve) => setTimeout(resolve, 5000))]);
  if (child.exitCode === null) child.kill('SIGKILL');
}

const quoteNeeds = { id: 'quote-needs', quote_number: 'QT-DUPLICATE', client_id: 'client-r51', client_name: 'Needs Attention Quote Client', client_email: 'needs-quote@example.com', client_address: 'Needs quote address', items: [{ description: 'Needs quote unique scope', quantity: 1, unitPrice: 111 }], tax_rate: 5, discount_rate: 0, total: 11100, currency: 'USD', notes: 'Needs quote unique note', created_at: '2026-08-28T00:00:00Z', updated_at: '2026-08-30T10:00:00Z', status: 'sent' };
const quoteSnapshot = { id: 'quote-snapshot', quote_number: 'QT-DUPLICATE', client_id: 'client-r51', client_name: 'Scope Snapshot Quote Client', client_email: 'snapshot-quote@example.com', client_address: 'Snapshot quote address', items: [{ description: 'Scope snapshot unique scope', quantity: 2, unitPrice: 222 }], tax_rate: 7, discount_rate: 1, total: 22200, currency: 'EUR', notes: 'Scope snapshot unique note', created_at: '2026-08-29T00:00:00Z', updated_at: '2026-08-30T12:00:00Z', status: 'approved' };
const quoteRecent = { id: 'quote-recent', quote_number: 'QT-DUPLICATE', client_id: 'client-r51', client_name: 'Recent Quote Client', client_email: 'recent-quote@example.com', client_address: 'Recent quote address', items: [{ description: 'Recent quote unique scope', quantity: 3, unitPrice: 333 }], tax_rate: 8, discount_rate: 2, total: 33300, currency: 'GBP', notes: 'Recent quote unique note', created_at: '2026-08-29T00:00:00Z', updated_at: '2026-08-30T11:00:00Z', status: 'draft' };
const invoiceNeeds = { id: 'invoice-needs', invoice_number: 'INV-DUPLICATE', client_id: 'client-r51', client_name: 'Needs Attention Invoice Client', client_email: 'needs-invoice@example.com', client_address: 'Needs invoice address', items: [{ description: 'Needs invoice unique item', quantity: 1, unitPrice: 444 }], tax_rate: 0, discount_rate: 0, total: 44400, currency: 'CAD', notes: 'Needs invoice unique note', invoice_date: '2026-08-27', due_date: '2026-09-27', payment_terms: 'Net 30', status: 'sent', payment_status: 'unpaid', amount_due_cents: 44400, quote_id: 'quote-needs', updated_at: '2026-08-30T09:00:00Z' };
const invoiceRecentPaid = { id: 'invoice-recent-paid', invoice_number: 'INV-DUPLICATE', client_id: 'client-r51', client_name: 'Recent Paid Invoice Client', client_email: 'recent-invoice@example.com', client_address: 'Recent invoice address', items: [{ description: 'Recent invoice unique item', quantity: 2, unitPrice: 555 }], tax_rate: 0, discount_rate: 0, total: 55500, currency: 'AUD', notes: 'Recent invoice unique note', invoice_date: '2026-08-26', due_date: '2026-09-26', payment_terms: 'Net 14', status: 'paid', payment_status: 'paid', amount_due_cents: 0, quote_id: 'quote-recent', updated_at: '2026-08-30T08:00:00Z' };

function normalApiBody(pathname) {
  if (pathname === '/api/user') return { id: 'r51-overview-user', email: 'r51@example.com', name: 'R51 Test User', plan: 'pro', hasActivated: true, auth_mode: 'supabase', quota: {} };
  if (pathname === '/api/clients') return { data: [{ id: 'client-r51', name: 'R51 Client', email: 'client-r51@example.com', address: 'R51 address' }] };
  if (pathname === '/api/quotes') return { data: [quoteNeeds, quoteSnapshot, quoteRecent] };
  if (pathname === '/api/invoices') return { data: [invoiceNeeds, invoiceRecentPaid] };
  if (pathname === '/api/card-profile') return { id: 'r51-profile' };
  return { data: [] };
}

async function runBrowserChecks() {
  const { chromium } = sharedRequire('playwright');
  const mockSupabase = await startMockSupabase();
  const nextServer = await startNextTestServer(mockSupabase.url);
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await context.newPage();
  const session = createBrowserSession();
  const requestCounts = new Map();
  const mutationRequests = [];
  const pageErrors = [];
  try {
    await context.addInitScript((storedSession) => {
      window.localStorage.setItem('corvioz_analytics_consent', 'accepted');
      window.localStorage.setItem('sb-127-auth-token', JSON.stringify(storedSession));
    }, session);
    await context.addCookies([{ name: 'sb-127-auth-token.0', value: encodeURIComponent(JSON.stringify(session)), url: nextServer.baseUrl }]);
    page.on('pageerror', (error) => pageErrors.push(error));
    await page.route('**/api/**', async (route) => {
      const request = route.request();
      const pathname = new URL(request.url()).pathname;
      requestCounts.set(pathname, (requestCounts.get(pathname) || 0) + 1);
      if (request.method() !== 'GET') mutationRequests.push({ pathname, method: request.method() });
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(normalApiBody(pathname)) });
    });

    await page.goto(`${nextServer.baseUrl}/dashboard`, { waitUntil: 'domcontentloaded' });
    await page.getByRole('heading', { name: 'Overview', exact: true }).waitFor({ state: 'visible' });
    await page.getByTestId('recent-documents').waitFor({ state: 'visible' });

    const assertQuoteEditor = async (clientName) => {
      await page.getByRole('heading', { name: 'Edit Quote QT-DUPLICATE', exact: true }).waitFor({ state: 'visible' });
      const values = await page.locator('input, textarea').evaluateAll((elements) => elements.map((element) => element.value));
      assert.ok(values.includes(clientName), `Quote editor must hydrate ${clientName}; values=${JSON.stringify(values)}`);
      assert.doesNotMatch(page.url(), /(?:quoteId|invoiceId|documentId)=/);
      await page.getByRole('button', { name: 'Cancel', exact: true }).click();
      await page.getByRole('button', { name: 'Overview', exact: true }).click();
      await page.getByTestId('dashboard-overview').waitFor({ state: 'visible' });
    };

    const assertInvoiceEditor = async (heading, clientName, readOnly = false) => {
      await page.getByRole('heading', { name: heading, exact: true }).waitFor({ state: 'visible' });
      const values = await page.locator('input, textarea').evaluateAll((elements) => elements.map((element) => element.value));
      assert.ok(values.includes(clientName), `Invoice editor must hydrate ${clientName}; values=${JSON.stringify(values)}`);
      if (readOnly) {
        assert.equal(await page.getByText('Read only · Recorded payment', { exact: true }).count(), 2);
        assert.equal(await page.getByRole('button', { name: 'Save draft', exact: true }).count(), 0);
        assert.equal(await page.getByRole('button', { name: 'Continue to preview', exact: true }).count(), 0);
        const controls = await page.locator('input, textarea, select').evaluateAll((elements) => elements.map((element) => ({ disabled: element.disabled, readOnly: element.readOnly })));
        assert.ok(controls.length > 0 && controls.every(({ disabled, readOnly: locked }) => disabled || locked), 'paid Invoice remains read-only');
      }
      assert.doesNotMatch(page.url(), /(?:quoteId|invoiceId|documentId)=/);
      await page.getByRole('button', { name: 'Exit to dashboard', exact: true }).click();
      await page.getByTestId('dashboard-overview').waitFor({ state: 'visible' });
    };

    const attentionQuote = page.getByTestId('needs-attention-item').filter({ hasText: 'Needs Attention Quote Client' });
    await attentionQuote.getByRole('button', { name: 'Open quote', exact: true }).click();
    await assertQuoteEditor('Needs Attention Quote Client');

    const attentionInvoice = page.getByTestId('needs-attention-item').filter({ hasText: 'Needs Attention Invoice Client' });
    await attentionInvoice.getByRole('button', { name: 'Open invoice', exact: true }).click();
    await assertInvoiceEditor('Edit Document INV-DUPLICATE', 'Needs Attention Invoice Client');

    await page.getByTestId('scope-snapshot').getByRole('button', { name: 'Open Quote', exact: true }).click();
    await assertQuoteEditor('Scope Snapshot Quote Client');

    await page.getByTestId('recent-document-quote').filter({ hasText: 'Recent Quote Client' }).getByRole('button', { name: 'Open Quote', exact: true }).click();
    await assertQuoteEditor('Recent Quote Client');

    await page.getByTestId('recent-document-invoice').filter({ hasText: 'Recent Paid Invoice Client' }).getByRole('button', { name: 'Open Invoice', exact: true }).click();
    await assertInvoiceEditor('View Invoice INV-DUPLICATE', 'Recent Paid Invoice Client', true);

    await page.getByRole('button', { name: 'Quotes', exact: true }).click();
    await page.getByRole('heading', { name: 'Quotes', exact: true }).waitFor({ state: 'visible' });
    assert.equal(await page.getByRole('heading', { name: 'Edit Quote QT-DUPLICATE', exact: true }).count(), 0, 'generic Quotes action stays on list');
    await page.getByRole('button', { name: 'Invoices', exact: true }).click();
    await page.getByRole('heading', { name: 'Invoice Documents', exact: true }).waitFor({ state: 'visible' });
    assert.equal(await page.getByRole('heading', { name: 'View Invoice INV-DUPLICATE', exact: true }).count(), 0, 'generic Invoices action stays on list');

    assert.deepEqual(pageErrors, [], 'R51.3 browser runtime has no page errors');
    assert.equal(requestCounts.get('/api/quotes'), 1, 'Overview exact Quote open adds no Quote fetch');
    assert.equal(requestCounts.get('/api/invoices'), 1, 'Overview exact Invoice open adds no Invoice fetch');
    assert.deepEqual(
      mutationRequests.filter(({ pathname }) => pathname === '/api/quotes' || pathname === '/api/invoices'),
      [],
      'Overview exact open performs no Quote or Invoice API mutation',
    );
    console.log('R51_3_BROWSER_RUNTIME=PASS');
  } finally {
    await context.close();
    await browser.close();
    await nextServer.close();
    await mockSupabase.close();
  }
}

await runBrowserChecks();
console.log('CORVIOZ_R51_3_OVERVIEW_EXACT_DOCUMENT_OPEN_TEST=PASS');
