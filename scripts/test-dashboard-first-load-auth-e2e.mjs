import assert from 'node:assert/strict';
import http from 'node:http';
import net from 'node:net';
import path from 'node:path';
import { createRequire } from 'node:module';
import { spawn } from 'node:child_process';

const cwd = process.cwd();
const sharedNodeModulesRoot = process.env.CORVIOZ_NODE_MODULES_ROOT || cwd;
const sharedRequire = createRequire(path.join(sharedNodeModulesRoot, 'package.json'));
const { chromium } = sharedRequire('playwright');
const nextCli = sharedRequire.resolve('next/dist/bin/next');
const REQUESTED_SCENARIO = process.env.DASHBOARD_E2E_SCENARIO || null;
const CLOSE_TIMEOUT_MS = 5_000;
const CORE_ENDPOINTS = [
  '/api/user',
  '/api/quotes',
  '/api/invoices',
  '/api/clients',
  '/api/leads',
  '/api/card-profile',
];
const TEST_USER = {
  id: '22222222-2222-4222-8222-222222222222',
  aud: 'authenticated',
  role: 'authenticated',
  email: 'dashboard-performance@example.com',
  app_metadata: { provider: 'email' },
  user_metadata: {},
};

function base64Url(value) {
  return Buffer.from(JSON.stringify(value)).toString('base64url');
}

function createSession() {
  const expiresAt = Math.floor(Date.now() / 1000) + 3600;
  const accessToken = [
    base64Url({ alg: 'none', typ: 'JWT' }),
    base64Url({ ...TEST_USER, exp: expiresAt }),
    'dashboard-test-signature',
  ].join('.');
  return {
    access_token: accessToken,
    refresh_token: 'dashboard-test-refresh-token',
    expires_in: 3600,
    expires_at: expiresAt,
    token_type: 'bearer',
    user: TEST_USER,
  };
}

function delay(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

function createDeferred() {
  let resolve;
  const promise = new Promise((done) => { resolve = done; });
  return { promise, resolve };
}

async function getFreePort() {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => {
      const { port } = server.address();
      server.close((error) => (error ? reject(error) : resolve(port)));
    });
  });
}

async function assertPortReleased(port) {
  if (!port) return;
  const server = net.createServer();
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(port, '127.0.0.1', resolve);
  });
  await new Promise((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())));
}

async function waitForChildExit(child, timeout = CLOSE_TIMEOUT_MS) {
  if (child.exitCode !== null) return true;
  return Promise.race([
    new Promise((resolve) => child.once('exit', () => resolve(true))),
    delay(timeout).then(() => false),
  ]);
}

function sendJson(response, status, body) {
  response.writeHead(status, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, apikey, content-type, x-client-info, x-supabase-api-version',
  });
  response.end(JSON.stringify(body));
}

async function startMockSupabase() {
  const sockets = new Set();
  let crmEnabled = false;
  const server = http.createServer((request, response) => {
    const requestUrl = new URL(request.url, 'http://127.0.0.1');
    if (request.method === 'OPTIONS') {
      response.writeHead(204, {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, apikey, content-type, x-client-info, x-supabase-api-version',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
      });
      response.end();
      return;
    }
    if (request.method === 'GET' && requestUrl.pathname === '/auth/v1/user') {
      sendJson(response, 200, TEST_USER);
      return;
    }
    if (request.method === 'POST' && requestUrl.pathname === '/auth/v1/logout') {
      response.writeHead(204, {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, apikey, content-type, x-client-info, x-supabase-api-version',
      });
      response.end();
      return;
    }
    if (request.method === 'GET' && requestUrl.pathname === '/rest/v1/entitlements') {
      sendJson(response, 200, [{
        user_id: TEST_USER.id,
        invoice: true,
        export_pdf: false,
        client_portal: false,
        crm: crmEnabled,
        automation: false,
        advanced_invoicing: false,
      }]);
      return;
    }
    sendJson(response, 404, { message: `Unhandled mock Supabase request: ${request.method} ${requestUrl.pathname}` });
  });
  server.on('connection', (socket) => {
    sockets.add(socket);
    socket.on('close', () => sockets.delete(socket));
  });
  const port = await getFreePort();
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(port, '127.0.0.1', resolve);
  });
  return {
    port,
    url: `http://127.0.0.1:${port}`,
    setCrmEnabled(value) {
      crmEnabled = Boolean(value);
    },
    async close() {
      server.closeIdleConnections?.();
      server.closeAllConnections?.();
      sockets.forEach((socket) => socket.destroy());
      await new Promise((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())));
    },
  };
}

async function waitForServer(baseUrl, child) {
  const deadline = Date.now() + 60_000;
  while (Date.now() < deadline) {
    if (child.exitCode !== null) throw new Error(`Next test server exited early with code ${child.exitCode}`);
    try {
      const response = await fetch(`${baseUrl}/auth`);
      if (response.ok) return;
    } catch (_) {
      // The local development server is still starting.
    }
    await delay(250);
  }
  throw new Error('Timed out waiting for the local Next server');
}

async function startNext(mockSupabaseUrl) {
  const port = await getFreePort();
  const baseUrl = `http://127.0.0.1:${port}`;
  const child = spawn(process.execPath, [nextCli, 'dev', '--webpack', '--hostname', '127.0.0.1', '--port', String(port)], {
    cwd,
    env: {
      ...process.env,
      NODE_PATH: path.join(sharedNodeModulesRoot, 'node_modules'),
      NEXT_PUBLIC_SUPABASE_URL: mockSupabaseUrl,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: 'dashboard-test-anon-key',
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  let output = '';
  child.stdout.on('data', (chunk) => { output += chunk.toString(); });
  child.stderr.on('data', (chunk) => { output += chunk.toString(); });
  try {
    await waitForServer(baseUrl, child);
  } catch (error) {
    child.kill('SIGTERM');
    await waitForChildExit(child);
    throw new Error(`${error.message}\n${output}`);
  }
  return {
    baseUrl,
    port,
    async close() {
      if (child.exitCode === null) {
        child.kill('SIGTERM');
        if (!(await waitForChildExit(child))) {
          child.kill('SIGKILL');
          if (!(await waitForChildExit(child))) throw new Error('Timed out closing Next test server');
        }
      }
    },
  };
}

function coreBody(pathname) {
  if (pathname === '/api/user') {
    return {
      id: TEST_USER.id,
      email: TEST_USER.email,
      name: 'Dashboard Performance Test',
      plan: 'free',
      hasActivated: true,
      auth_mode: 'supabase',
      quota: {},
    };
  }
  if (pathname === '/api/quotes') {
    return {
      data: [{
        id: 'quote-dashboard-e2e',
        quote_number: 'QT-DASHBOARD-E2E',
        client_name: 'Performance Client',
        client_email: 'client@example.com',
        currency: 'USD',
        total: 10000,
        status: 'draft',
      }],
    };
  }
  if (pathname === '/api/card-profile') return { id: 'profile-dashboard-e2e' };
  return { data: [] };
}

async function waitForCounts(counts, expected, timeout = 8_000) {
  const deadline = Date.now() + timeout;
  while (Date.now() < deadline) {
    if (CORE_ENDPOINTS.every((endpoint) => (counts.get(endpoint) || 0) >= expected)) return;
    await delay(20);
  }
  throw new Error(`Timed out waiting for core request count ${expected}: ${JSON.stringify(Object.fromEntries(counts))}`);
}

function assertExactCounts(counts, expected, label) {
  for (const endpoint of CORE_ENDPOINTS) {
    assert.equal(counts.get(endpoint), expected, `${label}: ${endpoint} request count`);
  }
}

async function broadcastAuthEvent(page, event, session, delayMs = 0) {
  await page.evaluate(async ({ nextEvent, nextSession, waitMs }) => {
    if (waitMs > 0) await new Promise((resolve) => setTimeout(resolve, waitMs));
    const channel = new BroadcastChannel('sb-127-auth-token');
    channel.postMessage({ event: nextEvent, session: nextSession });
    channel.close();
  }, { nextEvent: event, nextSession: session, waitMs: delayMs });
}

async function createDashboardPage(browser, baseUrl) {
  const session = createSession();
  const context = await browser.newContext();
  await context.addInitScript((storedSession) => {
    window.localStorage.setItem('corvioz_analytics_consent', 'accepted');
    if (!window.localStorage.getItem('__dashboard_e2e_disable_session')) {
      window.localStorage.setItem('sb-127-auth-token', JSON.stringify(storedSession));
    }
  }, session);
  await context.addCookies([{
    name: 'sb-127-auth-token.0',
    value: encodeURIComponent(JSON.stringify(session)),
    url: baseUrl,
  }, {
    name: 'corvioz_analytics_consent',
    value: 'accepted',
    url: baseUrl,
  }]);

  const page = await context.newPage();
  const counts = new Map();
  const pageErrors = [];
  const unmountedWarnings = [];
  let quotesGate = null;
  page.on('pageerror', (error) => pageErrors.push(error));
  page.on('console', (message) => {
    const text = message.text();
    if (/unmounted|state update on an unmounted component/i.test(text)) unmountedWarnings.push(text);
  });

  await page.route('**/api/**', async (route) => {
    const pathname = new URL(route.request().url()).pathname;
    if (CORE_ENDPOINTS.includes(pathname)) {
      counts.set(pathname, (counts.get(pathname) || 0) + 1);
      const activeGate = pathname === '/api/quotes' ? quotesGate : null;
      if (activeGate) await activeGate.promise;
      try {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(coreBody(pathname)),
        });
      } catch (error) {
        if (!/Target page, context or browser has been closed|Route is already handled/i.test(error.message)) throw error;
      }
      return;
    }
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ data: [] }),
    });
  });

  return {
    context,
    page,
    session,
    counts,
    pageErrors,
    unmountedWarnings,
    deferQuotes() {
      quotesGate = createDeferred();
      return () => {
        quotesGate?.resolve();
        quotesGate = null;
      };
    },
  };
}

async function runInitialDedupScenario(browser, baseUrl, timingLabel, initialEventDelay) {
  const dashboard = await createDashboardPage(browser, baseUrl);
  try {
    await dashboard.page.goto(`${baseUrl}/dashboard?tool=quotes`, { waitUntil: 'domcontentloaded' });
    await broadcastAuthEvent(dashboard.page, 'INITIAL_SESSION', dashboard.session, initialEventDelay);
    await waitForCounts(dashboard.counts, 1);
    await dashboard.page.getByText('QT-DASHBOARD-E2E').waitFor({ state: 'visible' });
    await delay(350);
    assertExactCounts(dashboard.counts, 1, `hydration + INITIAL_SESSION (${timingLabel})`);
    assert.deepEqual(dashboard.pageErrors, [], `${timingLabel} must not produce page errors`);
  } finally {
    await dashboard.context.close();
  }
}

async function runAuthEventsScenario(browser, baseUrl) {
  const dashboard = await createDashboardPage(browser, baseUrl);
  try {
    await dashboard.page.goto(`${baseUrl}/dashboard?tool=quotes`, { waitUntil: 'domcontentloaded' });
    await waitForCounts(dashboard.counts, 1);
    await dashboard.page.getByText('QT-DASHBOARD-E2E').waitFor({ state: 'visible' });
    assertExactCounts(dashboard.counts, 1, 'initial hydration');

    for (const [index, event] of ['SIGNED_IN', 'TOKEN_REFRESHED', 'USER_UPDATED'].entries()) {
      await broadcastAuthEvent(dashboard.page, event, dashboard.session);
      await waitForCounts(dashboard.counts, index + 2);
      assertExactCounts(dashboard.counts, index + 2, event);
    }
  } finally {
    await dashboard.context.close();
  }
}

async function runUnmountScenario(browser, baseUrl) {
  const dashboard = await createDashboardPage(browser, baseUrl);
  let releaseQuotes = null;
  try {
    await dashboard.page.goto(`${baseUrl}/dashboard?tool=quotes`, { waitUntil: 'domcontentloaded' });
    await waitForCounts(dashboard.counts, 1);
    await dashboard.page.getByText('QT-DASHBOARD-E2E').waitFor({ state: 'visible' });

    releaseQuotes = dashboard.deferQuotes();
    await broadcastAuthEvent(dashboard.page, 'TOKEN_REFRESHED', dashboard.session);
    await waitForCounts(dashboard.counts, 2);
    await dashboard.page.goto(`${baseUrl}/pricing`, { waitUntil: 'domcontentloaded' });
    releaseQuotes();
    releaseQuotes = null;
    await delay(200);
    assert.deepEqual(dashboard.pageErrors, [], 'Completing an old request after Dashboard unmount must not produce page errors');
    assert.deepEqual(dashboard.unmountedWarnings, [], 'Completing an old request after Dashboard unmount must not warn about state updates');
  } finally {
    releaseQuotes?.();
    await dashboard.context.close();
  }
}

async function runSignedOutScenario(browser, baseUrl) {
  const dashboard = await createDashboardPage(browser, baseUrl);
  const authNavigationGate = createDeferred();
  let releaseQuotes = null;
  try {
    await dashboard.page.goto(`${baseUrl}/dashboard?tool=quotes`, { waitUntil: 'domcontentloaded' });
    await waitForCounts(dashboard.counts, 1);
    await dashboard.page.getByText('QT-DASHBOARD-E2E').waitFor({ state: 'visible' });

    releaseQuotes = dashboard.deferQuotes();
    await broadcastAuthEvent(dashboard.page, 'TOKEN_REFRESHED', dashboard.session);
    await waitForCounts(dashboard.counts, 2);
    await dashboard.page.route(`${baseUrl}/auth**`, async (route) => {
      await authNavigationGate.promise;
      await route.continue();
    });
    await dashboard.page.evaluate(() => {
      window.localStorage.setItem('__dashboard_e2e_disable_session', '1');
      window.localStorage.removeItem('sb-127-auth-token');
      document.cookie = 'sb-127-auth-token.0=; Path=/; Max-Age=0; SameSite=Lax';
    });
    await broadcastAuthEvent(dashboard.page, 'SIGNED_OUT', null);
    await dashboard.page.getByText('QT-DASHBOARD-E2E').waitFor({ state: 'detached' });
    releaseQuotes();
    releaseQuotes = null;
    await delay(150);
    assert.equal(await dashboard.page.getByText('QT-DASHBOARD-E2E').count(), 0, 'A pre-sign-out Quotes response must not restore cleared data');
    authNavigationGate.resolve();
    await dashboard.page.waitForURL((url) => url.pathname === '/auth', { timeout: 8_000 });
    assert.deepEqual(dashboard.pageErrors, [], 'SIGNED_OUT invalidation must not produce page errors');
  } finally {
    releaseQuotes?.();
    authNavigationGate.resolve();
    await dashboard.context.close();
  }
}

async function waitForDashboardData(dashboard) {
  await waitForCounts(dashboard.counts, 1);
  await dashboard.page.getByRole('button', { name: 'Account', exact: true }).waitFor({ state: 'visible' });
}

async function assertClientDirectory(page, label) {
  await page.getByRole('heading', { name: 'Client Directory', exact: true }).waitFor({ state: 'visible' });
  await page.getByText('Manage client records in one centralized directory to prepare quotes and documents quickly.').waitFor({ state: 'visible' });
  await page.getByRole('heading', { name: 'Save Client Profile', exact: true }).waitFor({ state: 'visible' });
  assert.equal(await page.getByRole('button', { name: 'Save Client', exact: true }).count(), 1, `${label}: the existing Client form must remain available`);
}

async function runClientsRenderingScenarios(browser, baseUrl, mockSupabase) {
  mockSupabase.setCrmEnabled(false);
  const freeDashboard = await createDashboardPage(browser, baseUrl);
  try {
    await freeDashboard.page.goto(`${baseUrl}/dashboard?tool=quotes`, { waitUntil: 'domcontentloaded' });
    await waitForDashboardData(freeDashboard);

    await freeDashboard.page.getByRole('button', { name: 'Clients', exact: true }).click();
    await assertClientDirectory(freeDashboard.page, 'authenticated crm=false');

    await freeDashboard.page.getByRole('button', { name: 'Quotes', exact: true }).click();
    await freeDashboard.page.getByRole('heading', { name: 'Quotes', exact: true }).waitFor({ state: 'visible' });
    await freeDashboard.page.getByRole('button', { name: 'Clients', exact: true }).click();
    await assertClientDirectory(freeDashboard.page, 'Quotes -> Clients');
    await freeDashboard.page.getByRole('button', { name: 'Invoices', exact: true }).click();
    await freeDashboard.page.getByRole('heading', { name: 'Invoice Documents', exact: true }).waitFor({ state: 'visible' });
  } finally {
    await freeDashboard.context.close();
  }

  mockSupabase.setCrmEnabled(true);
  const crmDashboard = await createDashboardPage(browser, baseUrl);
  try {
    await crmDashboard.page.goto(`${baseUrl}/dashboard?tool=clients`, { waitUntil: 'domcontentloaded' });
    await waitForDashboardData(crmDashboard);
    await assertClientDirectory(crmDashboard.page, 'authenticated crm=true');
  } finally {
    await crmDashboard.context.close();
  }

  mockSupabase.setCrmEnabled(false);
  const guestDashboard = await createDashboardPage(browser, baseUrl);
  const authNavigationGate = createDeferred();
  try {
    await guestDashboard.page.goto(`${baseUrl}/dashboard?tool=clients`, { waitUntil: 'domcontentloaded' });
    await waitForDashboardData(guestDashboard);
    await assertClientDirectory(guestDashboard.page, 'authenticated before guest transition');
    await guestDashboard.page.route(`${baseUrl}/auth**`, async (route) => {
      await authNavigationGate.promise;
      await route.continue();
    });
    await guestDashboard.page.evaluate(() => {
      window.localStorage.setItem('__dashboard_e2e_disable_session', '1');
      window.localStorage.removeItem('sb-127-auth-token');
      document.cookie = 'sb-127-auth-token.0=; Path=/; Max-Age=0; SameSite=Lax';
    });
    await broadcastAuthEvent(guestDashboard.page, 'SIGNED_OUT', null);
    await guestDashboard.page.getByText('Available after account creation.').waitFor({ state: 'visible' });
    assert.equal(
      await guestDashboard.page.getByRole('button', { name: 'Save Client', exact: true }).count(),
      0,
      'unauthenticated Clients must keep the Guest lock instead of exposing the Client form',
    );
  } finally {
    authNavigationGate.resolve();
    await guestDashboard.context.close();
  }
}

async function openAccountMenu(page) {
  await page.getByRole('button', { name: 'Account', exact: true }).evaluate((button) => button.click());
  const menu = page.getByRole('menu', { name: 'Account menu' });
  await menu.waitFor({ state: 'visible' });
  return menu;
}

async function runSignOutSuccessScenario(browser, baseUrl) {
  const dashboard = await createDashboardPage(browser, baseUrl);
  const authNavigationGate = createDeferred();
  const authNavigations = [];
  try {
    dashboard.page.on('framenavigated', (frame) => {
      if (frame === dashboard.page.mainFrame() && new URL(frame.url()).pathname === '/auth') {
        authNavigations.push(frame.url());
      }
    });
    await dashboard.page.goto(`${baseUrl}/dashboard?tool=clients`, { waitUntil: 'domcontentloaded' });
    await waitForDashboardData(dashboard);
    await assertClientDirectory(dashboard.page, 'before successful sign out');
    await dashboard.page.route(`${baseUrl}/auth**`, async (route) => {
      await authNavigationGate.promise;
      await route.continue();
    });
    await dashboard.page.evaluate(() => {
      const client = window.supabaseClientInstance;
      const originalSignOut = client.auth.signOut.bind(client.auth);
      window.__uiInt03SignOutCalls = 0;
      client.auth.signOut = async () => {
        window.__uiInt03SignOutCalls += 1;
        await new Promise((resolve) => {
          window.__releaseUiInt03SignOut = resolve;
        });
        return originalSignOut();
      };
    });

    const menu = await openAccountMenu(dashboard.page);
    await menu.getByRole('menuitem', { name: 'Sign out', exact: true }).evaluate((button) => button.click());
    const signingOutState = dashboard.page.getByRole('status');
    await signingOutState.waitFor({ state: 'visible' });
    assert.equal(
      (await signingOutState.innerText()).trim(),
      'Signing out…',
      'isSigningOut=true must replace the Dashboard with a single stable sign-out state',
    );
    const signOutPresentation = await signingOutState.evaluate((element) => {
      const styles = getComputedStyle(element);
      const bounds = element.getBoundingClientRect();
      const alphaMatch = styles.backgroundColor.match(/rgba\([^,]+,[^,]+,[^,]+,\s*([^)]+)\)/);
      return {
        backgroundColor: styles.backgroundColor,
        backgroundAlpha: alphaMatch ? Number(alphaMatch[1]) : 1,
        position: styles.position,
        zIndex: Number(styles.zIndex),
        width: bounds.width,
        height: bounds.height,
        viewportWidth: window.innerWidth,
        viewportHeight: window.innerHeight,
        hitTargetIsStatus: element.contains(document.elementFromPoint(window.innerWidth / 2, window.innerHeight / 2)),
      };
    });
    assert.equal(signOutPresentation.position, 'fixed', 'the Sign out state must be fixed to the viewport');
    assert.ok(signOutPresentation.zIndex >= 2147483647, 'the Sign out state must cover global interactive UI');
    assert.equal(signOutPresentation.width, signOutPresentation.viewportWidth, 'the Sign out state must cover the viewport width');
    assert.equal(signOutPresentation.height, signOutPresentation.viewportHeight, 'the Sign out state must cover the viewport height');
    assert.equal(signOutPresentation.hitTargetIsStatus, true, 'the Sign out state must receive pointer hits above the Dashboard');
    assert.equal(signOutPresentation.backgroundAlpha, 1, `the Sign out state background must be opaque, received ${signOutPresentation.backgroundColor}`);
    assert.equal(
      await dashboard.page.getByRole('heading', { name: /^(Quotes|Client Directory|Invoice Documents|Public Profile Setup)$/ }).count(),
      0,
      'Dashboard tab content must be unmounted while sign-out is pending',
    );
    assert.equal(
      await dashboard.page.getByRole('button', { name: /^(Quotes|Clients|Invoices|Public Profile|Save Client)$/ }).count(),
      0,
      'Dashboard navigation and forms must not remain interactive while sign-out is pending',
    );
    assert.equal(await dashboard.page.evaluate(() => window.__uiInt03SignOutCalls), 1, 'the Sign out action must run once');

    await dashboard.page.evaluate(() => window.__releaseUiInt03SignOut());
    await delay(150);
    assert.equal(
      (await signingOutState.innerText()).trim(),
      'Signing out…',
      'session cleanup must not reveal Quotes, Clients, Invoices, Profile, Preview, or Guest content',
    );
    authNavigationGate.resolve();
    await dashboard.page.waitForURL((url) => url.pathname === '/auth', { timeout: 8_000 });
    assert.equal(authNavigations.length, 1, 'successful sign-out must navigate to /auth exactly once');
    assert.equal(await dashboard.page.evaluate(() => window.__uiInt03SignOutCalls), 1, 'successful sign-out must not repeat Supabase signOut');
  } finally {
    authNavigationGate.resolve();
    await dashboard.context.close();
  }
}

async function runSignOutFailureScenario(browser, baseUrl) {
  const dashboard = await createDashboardPage(browser, baseUrl);
  try {
    await dashboard.page.goto(`${baseUrl}/dashboard?tool=clients`, { waitUntil: 'domcontentloaded' });
    await waitForDashboardData(dashboard);
    await assertClientDirectory(dashboard.page, 'before failed sign out');
    await dashboard.page.evaluate(() => {
      const client = window.supabaseClientInstance;
      window.__uiInt03SignOutCalls = 0;
      client.auth.signOut = async () => {
        window.__uiInt03SignOutCalls += 1;
        return { error: new Error('Injected sign-out failure') };
      };
    });

    const menu = await openAccountMenu(dashboard.page);
    await menu.getByRole('menuitem', { name: 'Sign out', exact: true }).evaluate((button) => button.click());
    await dashboard.page.getByText('Sign out failed. Please try again.').waitFor({ state: 'visible' });
    assert.equal(new URL(dashboard.page.url()).pathname, '/dashboard', 'failed sign-out must remain on Dashboard');
    await assertClientDirectory(dashboard.page, 'after failed sign out');
    const restoredMenu = await openAccountMenu(dashboard.page);
    const restoredSignOut = restoredMenu.getByRole('menuitem', { name: 'Sign out', exact: true });
    assert.equal(await restoredSignOut.isEnabled(), true, 'failed sign-out must restore isSigningOut=false');
    assert.equal(await dashboard.page.evaluate(() => window.__uiInt03SignOutCalls), 1, 'failed sign-out must not retry automatically');
  } finally {
    await dashboard.context.close();
  }
}

async function closeResources(resources) {
  const failures = [];
  for (const resource of [resources.browser, resources.next, resources.mockSupabase]) {
    if (!resource) continue;
    try {
      await resource.close();
    } catch (error) {
      failures.push(error);
    }
  }
  try {
    await assertPortReleased(resources.next?.port);
    await assertPortReleased(resources.mockSupabase?.port);
  } catch (error) {
    failures.push(error);
  }
  if (failures.length === 1) throw failures[0];
  if (failures.length > 1) throw new AggregateError(failures, 'Multiple Dashboard E2E cleanup failures');
}

async function run() {
  const resources = { browser: null, next: null, mockSupabase: null };
  let primaryError = null;
  try {
    resources.mockSupabase = await startMockSupabase();
    resources.next = await startNext(resources.mockSupabase.url);
    resources.browser = await chromium.launch({ headless: true });
    console.log(`Dashboard mock Supabase: ${resources.mockSupabase.url}`);
    console.log(`Dashboard Next server: ${resources.next.baseUrl}`);

    if (REQUESTED_SCENARIO === 'ui-int-03') {
      console.log('Scenario: Clients content remains available across entitlement and auth states');
      await runClientsRenderingScenarios(resources.browser, resources.next.baseUrl, resources.mockSupabase);
      console.log('Scenario passed: Clients content and Guest lock behavior');

      console.log('Scenario: successful Sign out replaces Dashboard until /auth');
      await runSignOutSuccessScenario(resources.browser, resources.next.baseUrl);
      console.log('Scenario passed: stable successful Sign out transition');

      console.log('Scenario: failed Sign out restores Dashboard with a stable error');
      await runSignOutFailureScenario(resources.browser, resources.next.baseUrl);
      console.log('Scenario passed: failed Sign out recovery');
    } else {
      console.log('Scenario: real getSession + INITIAL_SESSION dedup under development Strict Mode');
      await runInitialDedupScenario(resources.browser, resources.next.baseUrl, 'listener-near-hydration', 0);
    }
    if (!REQUESTED_SCENARIO) {
      await runInitialDedupScenario(resources.browser, resources.next.baseUrl, 'listener-after-hydration', 200);
      console.log('Scenario passed: hydration and INITIAL_SESSION each load core endpoints exactly once');

      console.log('Scenario: later real auth events refresh Dashboard data');
      await runAuthEventsScenario(resources.browser, resources.next.baseUrl);
      console.log('Scenario passed: SIGNED_IN, TOKEN_REFRESHED, and USER_UPDATED each refresh once');

      console.log('Scenario: SIGNED_OUT clears data and invalidates a slow Quotes response');
      await runSignedOutScenario(resources.browser, resources.next.baseUrl);
      console.log('Scenario passed: SIGNED_OUT cleared Quotes and blocked the stale response');

      console.log('Scenario: Dashboard unmount invalidates a slow Quotes request');
      await runUnmountScenario(resources.browser, resources.next.baseUrl);
      console.log('Scenario passed: unmount completed without stale state warnings or page errors');
    }
  } catch (error) {
    primaryError = error;
  }

  try {
    await closeResources(resources);
  } catch (cleanupError) {
    if (primaryError) primaryError = new AggregateError([primaryError, cleanupError], 'Dashboard E2E failed and cleanup also failed');
    else primaryError = cleanupError;
  }

  if (primaryError) throw primaryError;
  console.log('Dashboard first-load Auth effect E2E tests passed');
}

await run();
