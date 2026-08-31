import assert from 'node:assert/strict';
import http from 'node:http';
import net from 'node:net';
import path from 'node:path';
import { createRequire } from 'node:module';
import { readFileSync, lstatSync } from 'node:fs';
import { spawn } from 'node:child_process';

const AUTHORITY_SHA = '6ce3ea03133612c74043c39e178ca3456701fbed';
const APP_ROOT = process.cwd();
const DEPENDENCY_ROOT = process.env.CORVIOZ_NODE_MODULES_ROOT || APP_ROOT;
const SHARED_MAIN_NODE_MODULES = '/Users/duo/Documents/想做个网站/corvioz/node_modules';
const requireFromAuthority = createRequire(path.join(DEPENDENCY_ROOT, 'package.json'));
const { chromium } = requireFromAuthority('playwright');
const nextCli = requireFromAuthority.resolve('next/dist/bin/next');

const STORAGE_KEY = 'sb-127-auth-token';
const FIXED_EXPIRY = 4102444800;
const HOLD_PATHS = new Set(['/api/clients', '/api/quotes', '/api/invoices']);

const accounts = {
  A: {
    key: 'A',
    user: {
      id: 'r50-account-a-user',
      email: 'r50-account-a@example.test',
      name: 'Account A User',
      plan: 'pro',
      hasActivated: true,
    },
    client: {
      id: 'r50-account-a-client',
      name: 'Client A',
      email: 'client-a@example.test',
      address: 'A Studio Address',
    },
    quote: {
      id: 'r50-account-a-quote',
      quote_number: 'QT-R50-A',
      client_id: 'r50-account-a-client',
      client_name: 'Client A',
      client_email: 'client-a@example.test',
      client_address: 'A Studio Address',
      items: [{ description: 'Account A quote line', quantity: 1, unitPrice: 120 }],
      total: 12000,
      currency: 'USD',
      status: 'sent',
      notes: 'Account A quote notes',
      created_at: '2026-08-01T00:00:00.000Z',
    },
    invoice: {
      id: 'r50-account-a-invoice',
      invoice_number: 'INV-R50-A',
      client_id: 'r50-account-a-client',
      client_name: 'Client A',
      client_email: 'client-a@example.test',
      client_address: 'A Studio Address',
      items: [{ description: 'Account A invoice line', quantity: 1, unitPrice: 120 }],
      total: 12000,
      currency: 'USD',
      status: 'pending',
      payment_status: 'pending',
      invoice_date: '2026-08-02',
      due_date: '2026-09-01',
      notes: 'Account A invoice notes',
      created_at: '2026-08-02T00:00:00.000Z',
    },
  },
  B: {
    key: 'B',
    user: {
      id: 'r50-account-b-user',
      email: 'r50-account-b@example.test',
      name: 'Account B User',
      plan: 'pro',
      hasActivated: true,
    },
    client: {
      id: 'r50-account-b-client',
      name: 'Client B',
      email: 'client-b@example.test',
      address: 'B Studio Address',
    },
    quote: {
      id: 'r50-account-b-quote',
      quote_number: 'QT-R50-B',
      client_id: 'r50-account-b-client',
      client_name: 'Client B',
      client_email: 'client-b@example.test',
      client_address: 'B Studio Address',
      items: [{ description: 'Account B quote line', quantity: 1, unitPrice: 220 }],
      total: 22000,
      currency: 'USD',
      status: 'sent',
      notes: 'Account B quote notes',
      created_at: '2026-08-03T00:00:00.000Z',
    },
    invoice: {
      id: 'r50-account-b-invoice',
      invoice_number: 'INV-R50-B',
      client_id: 'r50-account-b-client',
      client_name: 'Client B',
      client_email: 'client-b@example.test',
      client_address: 'B Studio Address',
      items: [{ description: 'Account B invoice line', quantity: 1, unitPrice: 220 }],
      total: 22000,
      currency: 'USD',
      status: 'pending',
      payment_status: 'pending',
      invoice_date: '2026-08-04',
      due_date: '2026-09-03',
      notes: 'Account B invoice notes',
      created_at: '2026-08-04T00:00:00.000Z',
    },
  },
};

const accountForKey = (key) => accounts[key];
const accountKeyForId = (id) => Object.keys(accounts).find((key) => accounts[key].user.id === id) || null;

function base64Url(value) {
  return Buffer.from(JSON.stringify(value)).toString('base64url');
}

function sessionFor(account, version = 0) {
  const token = `${base64Url({ alg: 'none', typ: 'JWT' })}.${base64Url({
    sub: account.user.id,
    email: account.user.email,
    exp: FIXED_EXPIRY,
    r50_version: version,
  })}.r50-${account.key}-${version}`;
  return {
    access_token: token,
    refresh_token: `r50-${account.key.toLowerCase()}-refresh-token`,
    expires_at: FIXED_EXPIRY,
    expires_in: 3600,
    token_type: 'bearer',
    user: {
      ...account.user,
      aud: 'authenticated',
      role: 'authenticated',
      app_metadata: { provider: 'email' },
      user_metadata: {},
    },
  };
}

function accountKeyFromToken(token) {
  try {
    const payload = JSON.parse(Buffer.from(String(token).split('.')[1], 'base64url').toString());
    return accountKeyForId(payload.sub);
  } catch {
    return null;
  }
}

function sendJson(response, status, body, extraHeaders = {}) {
  response.writeHead(status, {
    'content-type': 'application/json',
    'access-control-allow-origin': '*',
    'access-control-allow-headers': 'authorization, apikey, content-type, x-client-info, x-supabase-api-version',
    'access-control-allow-methods': 'GET, POST, OPTIONS',
    ...extraHeaders,
  });
  response.end(JSON.stringify(body));
}

async function createSupabaseAuthority() {
  const refreshCounts = new Map();
  const server = http.createServer(async (request, response) => {
    const requestUrl = new URL(request.url, 'http://127.0.0.1');
    if (request.method === 'OPTIONS') {
      response.writeHead(204, {
        'access-control-allow-origin': '*',
        'access-control-allow-headers': 'authorization, apikey, content-type, x-client-info, x-supabase-api-version',
        'access-control-allow-methods': 'GET, POST, OPTIONS',
      });
      response.end();
      return;
    }

    if (request.method === 'GET' && requestUrl.pathname === '/auth/v1/user') {
      const key = accountKeyFromToken((request.headers.authorization || '').replace(/^Bearer\s+/i, ''));
      if (!key) {
        sendJson(response, 401, { message: 'unauthorized test session' });
        return;
      }
      sendJson(response, 200, accounts[key].user);
      return;
    }

    if (request.method === 'POST' && requestUrl.pathname === '/auth/v1/token') {
      let raw = '';
      for await (const chunk of request) raw += chunk;
      let body = {};
      try { body = JSON.parse(raw || '{}'); } catch {}
      const key = Object.keys(accounts).find((candidate) => body.refresh_token === sessionFor(accounts[candidate]).refresh_token);
      if (!key) {
        sendJson(response, 400, { error: 'invalid_refresh_token' });
        return;
      }
      const version = (refreshCounts.get(key) || 0) + 1;
      refreshCounts.set(key, version);
      sendJson(response, 200, sessionFor(accounts[key], version));
      return;
    }

    if (request.method === 'GET' && requestUrl.pathname === '/rest/v1/entitlements') {
      sendJson(response, 200, []);
      return;
    }

    sendJson(response, 404, { message: 'unhandled mock Supabase request' });
  });
  await new Promise((resolve, reject) => server.listen(0, '127.0.0.1', resolve).once('error', reject));
  const port = server.address().port;
  return {
    url: `http://127.0.0.1:${port}`,
    close: () => new Promise((resolve) => server.close(resolve)),
  };
}

class HeldResponseController {
  constructor() {
    this.heldAccountKey = null;
    this.released = true;
    this.pending = [];
  }

  arm(accountKey) {
    this.heldAccountKey = accountKey;
    this.released = false;
    this.pending = [];
  }

  shouldHold(accountKey, pathname) {
    return accountKey === this.heldAccountKey && HOLD_PATHS.has(pathname) && !this.released;
  }

  wait(pathname) {
    let release;
    const promise = new Promise((resolve) => { release = resolve; });
    this.pending.push({ pathname, release });
    return promise;
  }

  pendingPaths() {
    return this.pending.map(({ pathname }) => pathname);
  }

  release() {
    this.released = true;
    const pending = this.pending.splice(0);
    pending.forEach(({ release }) => release());
  }
}

function businessResponse(accountKey, pathname) {
  const account = accountForKey(accountKey);
  if (pathname === '/api/user') return { ...account.user, hasActivated: true };
  if (pathname === '/api/user/entitlements') {
    return { entitlements: { export_pdf: true, client_portal: true, crm: true, automation: true, advanced_invoicing: true } };
  }
  if (pathname === '/api/clients') return { data: [account.client] };
  if (pathname === '/api/quotes') return { data: [account.quote] };
  if (pathname === '/api/invoices') return { data: [account.invoice] };
  return null;
}

async function installApiMocks(page, controller, requestLog) {
  await page.route('**/api/**', async (route) => {
    const request = route.request();
    const pathname = new URL(request.url()).pathname;
    const bearer = (request.headers().authorization || '').replace(/^Bearer\s+/i, '');
    const accountKey = accountKeyFromToken(bearer);
    requestLog.push({ pathname, accountKey, hasBearer: Boolean(bearer) });

    if (controller.shouldHold(accountKey, pathname)) await controller.wait(pathname);

    if (HOLD_PATHS.has(pathname) || pathname === '/api/user' || pathname === '/api/user/entitlements') {
      if (!accountKey) {
        await route.fulfill({ status: 401, contentType: 'application/json', body: JSON.stringify({ error: 'missing test Bearer identity' }) });
        return;
      }
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(businessResponse(accountKey, pathname)) });
      return;
    }

    if (pathname === '/api/pricing') {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, plans: [] }) });
      return;
    }
    if (pathname === '/api/card-profile') {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ username: 'r50-test-user', name: 'R50 Test User', services: [], portfolio: [], testimonials: [] }) });
      return;
    }
    if (pathname === '/api/leads') {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ data: [] }) });
      return;
    }
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ data: [] }) });
  });
}

async function getFreePort() {
  const server = net.createServer();
  await new Promise((resolve, reject) => server.listen(0, '127.0.0.1', resolve).once('error', reject));
  const port = server.address().port;
  await new Promise((resolve) => server.close(resolve));
  return port;
}

async function startNext(supabaseUrl) {
  const port = await getFreePort();
  const nextEnvironment = { ...process.env };
  delete nextEnvironment.NODE_PATH;
  nextEnvironment.CORVIOZ_NODE_MODULES_ROOT = APP_ROOT;
  nextEnvironment.NEXT_PUBLIC_SUPABASE_URL = supabaseUrl;
  nextEnvironment.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'r50-test-anon-key';
  const child = spawn(process.execPath, [nextCli, 'dev', '--webpack', '--hostname', '127.0.0.1', '--port', String(port)], {
    cwd: APP_ROOT,
    env: nextEnvironment,
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  let output = '';
  child.stdout.on('data', (chunk) => { output += chunk.toString(); });
  child.stderr.on('data', (chunk) => { output += chunk.toString(); });
  const baseUrl = `http://127.0.0.1:${port}`;
  for (let attempt = 0; attempt < 240; attempt += 1) {
    try {
      if ((await fetch(`${baseUrl}/auth`)).ok) {
        return {
          baseUrl,
          startupOutput: () => output,
          close: async () => {
            child.kill('SIGTERM');
            await Promise.race([
              new Promise((resolve) => child.once('exit', resolve)),
              new Promise((resolve) => setTimeout(resolve, 5000)),
            ]);
            if (child.exitCode === null) child.kill('SIGKILL');
          },
        };
      }
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  child.kill('SIGKILL');
  throw new Error(`Next test server did not start. Output: ${output}`);
}

function sessionStorageScript(initialSession) {
  return ({ storageKey, session }) => {
    window.localStorage.setItem(storageKey, JSON.stringify(session));
    window.localStorage.setItem('corvioz_analytics_consent', 'accepted');
  };
}

async function openDashboard(browser, baseUrl, initialAccount) {
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  const page = await context.newPage();
  await page.addInitScript(sessionStorageScript(initialAccount), { storageKey: STORAGE_KEY, session: sessionFor(initialAccount) });
  return { context, page, open: () => page.goto(`${baseUrl}/dashboard?tool=clients`, { waitUntil: 'domcontentloaded' }) };
}

async function waitForText(page, text) {
  await page.getByText(text, { exact: true }).first().waitFor({ state: 'visible', timeout: 15000 });
}

async function clickDashboardTab(page, label, heading) {
  await page.getByRole('button', { name: label, exact: true }).click();
  await page.getByRole('heading', { name: heading, exact: true }).waitFor({ state: 'visible', timeout: 15000 });
}

async function bodyText(page) {
  return page.locator('body').innerText();
}

async function postReactCommit(page) {
  await page.evaluate(() => new Promise((resolve) => {
    setTimeout(() => requestAnimationFrame(() => requestAnimationFrame(resolve)), 0);
  }));
}

async function installAuthEventTrace(page) {
  await page.evaluate(() => {
    window.__r50AuthEvents = [];
    window.supabaseClientInstance.auth.onAuthStateChange((event, session) => {
      window.__r50AuthEvents.push({ event, userId: session?.user?.id || null });
    });
  });
}

async function waitForAuthEvent(page, userId) {
  await page.waitForFunction((expectedUserId) => window.__r50AuthEvents?.some((item) => item.userId === expectedUserId), userId, { timeout: 15000 });
}

async function currentSessionUserId(page) {
  return page.evaluate(async () => (await window.supabaseClientInstance.auth.getSession()).data?.session?.user?.id || null);
}

function hasAny(body, labels) {
  return labels.some((label) => body.includes(label));
}

function hasExactText(body, label) {
  return body.split(/\r?\n/).some((line) => line.trim() === label);
}

function safeTransitionVisible(body) {
  return /Loading|Preparing|validating|unavailable|stale|retrieving/i.test(body);
}

class P12RuntimeDefect extends Error {
  constructor(message, evidence) {
    super(message);
    this.name = 'P12RuntimeDefect';
    this.evidence = evidence;
  }
}

async function runBusinessAuthorityScenario(baseUrl, browser, supabaseUrl) {
  const accountA = accountForKey('A');
  const accountB = accountForKey('B');
  const controller = new HeldResponseController();
  const requestLog = [];
  const { context, page } = await openDashboard(browser, baseUrl, accountA);
  try {
    await installApiMocks(page, controller, requestLog);
    await page.goto(`${baseUrl}/dashboard?tool=clients`, { waitUntil: 'domcontentloaded' });
    await waitForText(page, 'Client A');
    const initialIdentity = await currentSessionUserId(page);
    assert.equal(initialIdentity, accountA.user.id, 'Account A must be the initial authoritative browser identity');
    const clientsBody = await bodyText(page);
    assert.match(clientsBody, /Client A/);

    await clickDashboardTab(page, 'Quotes', 'Quotes');
    await waitForText(page, 'QT-R50-A');
    const quotesBody = await bodyText(page);
    await clickDashboardTab(page, 'Invoices', 'Invoice Documents');
    await waitForText(page, 'INV-R50-A');
    const invoicesBody = await bodyText(page);
    const baselineBody = `${clientsBody}\n${quotesBody}\n${invoicesBody}`;
    assert.equal(hasExactText(baselineBody, 'Client B') || hasAny(baselineBody, ['QT-R50-B', 'INV-R50-B']), false, 'Account B data must not appear under Account A');
    console.log('ACCOUNT_A_IDENTITY=PASS');
    console.log('CLIENT_A_VISIBLE=YES');
    console.log('QUOTE_A_VISIBLE=YES');
    console.log('INVOICE_A_VISIBLE=YES');
    console.log('ACCOUNT_B_DATA_VISIBLE_UNDER_A=NO');

    await installAuthEventTrace(page);
    await page.evaluate(() => {
      window.__r50AuthEvents = [];
      void window.supabaseClientInstance.auth.refreshSession().catch((error) => {
        window.__r50RefreshError = error?.message || String(error);
      });
    });
    await page.waitForFunction(() => window.__r50AuthEvents?.some((item) => item.event === 'TOKEN_REFRESHED' || item.event === 'SIGNED_IN'), undefined, { timeout: 15000 });
    await postReactCommit(page);
    const refreshIdentity = await currentSessionUserId(page);
    await clickDashboardTab(page, 'Clients', 'Client Directory');
    await waitForText(page, 'Client A');
    const refreshBody = await bodyText(page);
    assert.equal(refreshIdentity, accountA.user.id, 'same-user refresh must not change identity');
    assert.equal(Boolean(await page.evaluate(() => window.__r50RefreshError)), false, 'same-user refresh must complete without auth error');
    assert.match(refreshBody, /Client A/);
    console.log('SAME_USER_REFRESH=PASS');
    console.log('IDENTITY_CHANGED=NO');
    console.log('CLIENT_A_REMAINS_AVAILABLE=YES');
    console.log('SAME_USER_DATA_UNNECESSARILY_CLEARED=NO');

    await clickDashboardTab(page, 'Quotes', 'Quotes');
    await waitForText(page, 'QT-R50-A');
    controller.arm('B');
    void page.evaluate((nextSession) => {
      void window.supabaseClientInstance.auth.setSession(nextSession).catch((error) => {
        window.__r50SetSessionError = error?.message || String(error);
      });
    }, sessionFor(accountB));
    await waitForAuthEvent(page, accountB.user.id);
    await postReactCommit(page);
    for (const expectedPath of HOLD_PATHS) {
      const deadline = Date.now() + 15000;
      while (!controller.pendingPaths().includes(expectedPath) && Date.now() < deadline) {
        await new Promise((resolve) => setTimeout(resolve, 25));
      }
    }

    const heldTransitionBody = await bodyText(page);
    const samples = {
      quotes: heldTransitionBody,
      clients: heldTransitionBody,
      invoices: heldTransitionBody,
    };
    const authenticatedUserId = await currentSessionUserId(page);
    const observed = {
      authenticatedUserId,
      transitionPhase: 'B identity event observed; post-React-commit sample; B business responses held',
      clientAVisible: hasExactText(samples.clients, 'Client A'),
      quoteAVisible: samples.quotes.includes('QT-R50-A'),
      invoiceAVisible: samples.invoices.includes('INV-R50-A'),
      loadingTextOrSafeTransitionUiVisible: Object.values(samples).some(safeTransitionVisible),
      bBusinessDataVisible: hasExactText(Object.values(samples).join('\n'), 'Client B') || hasAny(Object.values(samples).join('\n'), ['QT-R50-B', 'INV-R50-B']),
      heldBRequestList: controller.pendingPaths(),
      setSessionError: await page.evaluate(() => window.__r50SetSessionError || null),
    };
    console.log(`A_TO_B_HELD_RESPONSE_EVIDENCE=${JSON.stringify(observed)}`);
    if (authenticatedUserId !== accountB.user.id || observed.clientAVisible || observed.quoteAVisible || observed.invoiceAVisible || observed.bBusinessDataVisible || !observed.loadingTextOrSafeTransitionUiVisible) {
      throw new P12RuntimeDefect(
        'P1_2_RUNTIME_DEFECT:\nold Account A business data remained rendered after Account B became authoritative',
        observed,
      );
    }
    controller.release();
    await waitForText(page, 'QT-R50-B');
    const postLoadQuotes = await bodyText(page);
    await clickDashboardTab(page, 'Clients', 'Client Directory');
    await waitForText(page, 'Client B');
    const postLoadClients = await bodyText(page);
    await clickDashboardTab(page, 'Invoices', 'Invoice Documents');
    await waitForText(page, 'INV-R50-B');
    const postLoadInvoices = await bodyText(page);
    const postLoadBody = `${postLoadQuotes}\n${postLoadClients}\n${postLoadInvoices}`;
    assert.equal(hasExactText(postLoadBody, 'Client A'), false, 'Account A client must not reappear after Account B loads');
    assert.equal(postLoadBody.includes('QT-R50-A'), false, 'Account A quote must not reappear after Account B loads');
    assert.equal(postLoadBody.includes('INV-R50-A'), false, 'Account A invoice must not reappear after Account B loads');
    console.log('A_TO_B_SESSION_CHANGE=PASS');
    console.log('A_TO_B_PRIOR_DATA_INVALIDATED=PASS');
    console.log('OLD_ACCOUNT_DATA_RENDERED_AS_AUTHORITATIVE=NO');
    console.log('IDENTITY_TRANSITION_LOADING_STATE_SAFE=YES');
    console.log('CLIENT_B_VISIBLE=YES');
    console.log('QUOTE_B_VISIBLE=YES');
    console.log('INVOICE_B_VISIBLE=YES');
    console.log('ACCOUNT_A_DATA_REAPPEARS_UNDER_B=NO');
  } finally {
    controller.release();
    await context.close();
  }
}

async function runTrueOpenEditorScenario(baseUrl, browser, supabaseUrl) {
  const accountA = accountForKey('A');
  const accountB = accountForKey('B');
  const controller = new HeldResponseController();
  const requestLog = [];
  const { context, page } = await openDashboard(browser, baseUrl, accountA);
  try {
    await installApiMocks(page, controller, requestLog);
    await page.goto(`${baseUrl}/dashboard?tool=quotes`, { waitUntil: 'domcontentloaded' });
    await waitForText(page, 'QT-R50-A');
    const quoteRow = page.getByRole('row', { name: /QT-R50-A/ });
    await quoteRow.getByRole('button', { name: 'Edit', exact: true }).click();
    await page.getByRole('heading', { name: 'Edit Quote QT-R50-A', exact: true }).waitFor({ state: 'visible', timeout: 15000 });
    const editorBeforeSwitch = await bodyText(page);
    assert.match(editorBeforeSwitch, /Edit Quote QT-R50-A/);
    await installAuthEventTrace(page);
    controller.arm('B');
    void page.evaluate((nextSession) => {
      void window.supabaseClientInstance.auth.setSession(nextSession).catch((error) => {
        window.__r50SetSessionError = error?.message || String(error);
      });
    }, sessionFor(accountB));
    await waitForAuthEvent(page, accountB.user.id);
    await postReactCommit(page);
    for (const expectedPath of HOLD_PATHS) {
      const deadline = Date.now() + 15000;
      while (!controller.pendingPaths().includes(expectedPath) && Date.now() < deadline) {
        await new Promise((resolve) => setTimeout(resolve, 25));
      }
    }
    const bodyDuringHeldSwitch = await bodyText(page);
    const evidence = {
      authenticatedUserId: await currentSessionUserId(page),
      transitionPhase: 'true Quote A editor open; B identity event observed; post-React-commit sample; B business responses held',
      quoteAEditorVisible: bodyDuringHeldSwitch.includes('Edit Quote QT-R50-A'),
      quoteAContentVisible: bodyDuringHeldSwitch.includes('Account A quote line') || hasExactText(bodyDuringHeldSwitch, 'Client A'),
      loadingTextOrSafeTransitionUiVisible: safeTransitionVisible(bodyDuringHeldSwitch),
      heldBRequestList: controller.pendingPaths(),
    };
    console.log(`TRUE_OPEN_EDITOR_EVIDENCE=${JSON.stringify(evidence)}`);
    if (evidence.authenticatedUserId !== accountB.user.id && evidence.quoteAEditorVisible) {
      throw new P12RuntimeDefect('P1_2_RUNTIME_DEFECT:\nold Account A Quote editor remained rendered after Account B became authoritative', evidence);
    }
    if (evidence.quoteAEditorVisible || evidence.quoteAContentVisible || !evidence.loadingTextOrSafeTransitionUiVisible) {
      throw new P12RuntimeDefect('P1_2_RUNTIME_DEFECT:\nold Account A Quote editor/content remained rendered during the held account switch', evidence);
    }
    console.log('TRUE_OPEN_EDITOR_HELD_TRANSITION=PASS');
    controller.release();
    await waitForText(page, 'QT-R50-B');
    const postLoadBody = await bodyText(page);
    const postLoadEvidence = {
      authenticatedUserId: await currentSessionUserId(page),
      quoteAEditorVisible: postLoadBody.includes('Edit Quote QT-R50-A'),
      quoteAContentVisible: postLoadBody.includes('Account A quote line') || hasExactText(postLoadBody, 'Client A'),
      quoteBVisible: postLoadBody.includes('QT-R50-B'),
    };
    console.log(`TRUE_OPEN_EDITOR_POST_LOAD_EVIDENCE=${JSON.stringify(postLoadEvidence)}`);
    assert.equal(postLoadEvidence.quoteAEditorVisible, false, 'Quote A editor must not reappear after Account B loads');
    assert.equal(postLoadEvidence.quoteAContentVisible, false, 'Quote A content must not reappear after Account B loads');
    assert.equal(postLoadEvidence.quoteBVisible, true, 'Account B quote must become visible after the switch');
    console.log('OPEN_EDITOR_A_REAPPEARS_AFTER_B_LOAD=NO');
    console.log('ACCOUNT_B_VISIBLE_AFTER_EDITOR_SWITCH=YES');
    return evidence;
  } finally {
    controller.release();
    await context.close();
  }
}

function verifyDependencyAuthority() {
  const packageJson = JSON.parse(readFileSync(path.join(APP_ROOT, 'package.json'), 'utf8'));
  const packageLock = JSON.parse(readFileSync(path.join(APP_ROOT, 'package-lock.json'), 'utf8'));
  const nodeModulesStat = lstatSync(path.join(DEPENDENCY_ROOT, 'node_modules'));
  assert.equal(nodeModulesStat.isDirectory(), true, 'node_modules must be a real directory');
  assert.equal(nodeModulesStat.isSymbolicLink(), false, 'node_modules must not be a symlink');
  assert.equal(packageJson.dependencies.next, '16.2.7');
  assert.equal(packageLock.packages['node_modules/next']?.version, '16.2.7');
  assert.equal(packageLock.packages['node_modules/@swc/helpers']?.version, '0.5.15');
  assert.doesNotMatch(String(process.env.NODE_PATH || ''), new RegExp(SHARED_MAIN_NODE_MODULES.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  console.log('DEPENDENCY_ISOLATION=PASS');
  console.log('NEXT=16.2.7');
  console.log('@swc/helpers=0.5.15');
  console.log(`NODE_PATH=${process.env.NODE_PATH || ''}`);
  console.log('HAS_AB_BUSINESS_FIXTURES=YES');
  console.log('HAS_HELD_RESPONSE_CONTROL=YES');
  console.log('HAS_POST_REACT_RENDER_SAMPLE=YES');
  console.log('HAS_SAME_USER_REFRESH_SCENARIO=YES');
  console.log('HAS_TRUE_OPEN_EDITOR_SWITCH=YES');
  console.log('HAS_TARGETED_P1_2_RED=YES');
}

async function main() {
  verifyDependencyAuthority();
  const supabase = await createSupabaseAuthority();
  const next = await startNext(supabase.url);
  const browser = await chromium.launch({ headless: true });
  const targetedFailures = [];
  try {
    try {
      await runBusinessAuthorityScenario(next.baseUrl, browser, supabase.url);
    } catch (error) {
      if (error instanceof P12RuntimeDefect) targetedFailures.push({ scenario: 'A_TO_B_HELD_RESPONSE', message: error.message, evidence: error.evidence });
      else throw error;
    }
    try {
      await runTrueOpenEditorScenario(next.baseUrl, browser, supabase.url);
    } catch (error) {
      if (error instanceof P12RuntimeDefect) targetedFailures.push({ scenario: 'TRUE_OPEN_EDITOR_SWITCH', message: error.message, evidence: error.evidence });
      else throw error;
    }
    if (targetedFailures.length > 0) {
      console.log('BASELINE_RED_PROOF=PASS');
      console.log('BASELINE_RED_TARGET=P1_2_RUNTIME_DEFECT');
      console.log('UNRELATED_AUTH_FAILURE=NO');
      console.log('DEPENDENCY_FAILURE=NO');
      console.log('TEST_INFRASTRUCTURE_FAILURE=NO');
      console.log(`TARGETED_FAILURES=${JSON.stringify(targetedFailures)}`);
      throw new Error(targetedFailures[0].message);
    }
    console.log('P1_2_GREEN_PROOF=PASS');
  } finally {
    await browser.close();
    await next.close();
    await supabase.close();
  }
}

await main();
