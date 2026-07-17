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
const CLOSE_TIMEOUT_MS = 5_000;
const NAVIGATION_TIMEOUT_MS = 8_000;
const REQUESTED_SCENARIO = process.env.AUTH_E2E_SCENARIO || null;

const TEST_USER = {
  id: '11111111-1111-4111-8111-111111111111',
  aud: 'authenticated',
  role: 'authenticated',
  email: 'auth-test@example.com',
  app_metadata: { provider: 'email' },
  user_metadata: {},
};

function base64Url(value) {
  return Buffer.from(JSON.stringify(value)).toString('base64url');
}

function createSession(email = TEST_USER.email) {
  const expiresAt = Math.floor(Date.now() / 1000) + 60 * 60;
  const accessToken = [
    base64Url({ alg: 'none', typ: 'JWT' }),
    base64Url({ ...TEST_USER, email, exp: expiresAt }),
    'test-signature',
  ].join('.');

  return {
    access_token: accessToken,
    refresh_token: 'test-refresh-token',
    expires_in: 3600,
    expires_at: expiresAt,
    token_type: 'bearer',
    user: { ...TEST_USER, email },
  };
}

function delay(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
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
  const server = http.createServer(async (request, response) => {
    const requestUrl = new URL(request.url, 'http://127.0.0.1');

    if (request.method === 'OPTIONS') {
      response.writeHead(204, {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, apikey, content-type, x-client-info, x-supabase-api-version',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      });
      response.end();
      return;
    }

    if (request.method === 'POST' && requestUrl.pathname === '/auth/v1/token') {
      const body = await new Promise((resolve) => {
        let value = '';
        request.on('data', (chunk) => { value += chunk; });
        request.on('end', () => resolve(value));
      });
      const credentials = body ? JSON.parse(body) : {};

      if (credentials.email === 'invalid@example.com') {
        sendJson(response, 400, {
          error: 'invalid_grant',
          error_description: 'Invalid login credentials',
        });
        return;
      }

      sendJson(response, 200, createSession(credentials.email));
      return;
    }

    if (request.method === 'GET' && requestUrl.pathname === '/auth/v1/user') {
      sendJson(response, 200, TEST_USER);
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
    url: `http://127.0.0.1:${port}`,
    port,
    async close() {
      server.closeIdleConnections?.();
      server.closeAllConnections?.();
      sockets.forEach((socket) => socket.destroy());
      await Promise.race([
        new Promise((resolve, reject) => server.close((error) => (error ? reject(error) : resolve()))),
        delay(CLOSE_TIMEOUT_MS).then(() => {
          throw new Error('Timed out closing mock Supabase server');
        }),
      ]);
    },
  };
}

async function waitForServer(url, child) {
  const deadline = Date.now() + 60_000;
  while (Date.now() < deadline) {
    if (child.exitCode !== null) {
      throw new Error(`Next test server exited early with code ${child.exitCode}`);
    }
    try {
      const response = await fetch(`${url}/auth`);
      if (response.ok) return;
    } catch (_) {
      // The development server has not started yet.
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
      NEXT_PUBLIC_SUPABASE_ANON_KEY: 'test-anon-key',
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
          if (!(await waitForChildExit(child))) {
            throw new Error('Timed out closing Next test server');
          }
        }
      }
    },
  };
}

async function routeDashboardApi(page, {
  hasActivated = true,
  userApiMode = 'success',
  loginDelayMs = 0,
  loginApiMode = 'success',
} = {}) {
  let loginRequests = 0;
  let currentLoginApiMode = loginApiMode;
  await page.route('**/api/**', async (route) => {
    const pathname = new URL(route.request().url()).pathname;
    if (pathname === '/api/auth/login') {
      loginRequests += 1;
      if (loginDelayMs > 0) await delay(loginDelayMs);
      if (currentLoginApiMode === 'missing-session') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({}),
        });
        return;
      }
      await route.continue();
      return;
    }

    if (pathname === '/api/user') {
      if (userApiMode === 'network-error') {
        await route.abort('failed');
        return;
      }
      if (userApiMode === 'http-500') {
        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Temporary profile failure' }),
        });
        return;
      }
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: TEST_USER.id,
          email: TEST_USER.email,
          name: 'Auth Test',
          plan: 'free',
          hasActivated,
          auth_mode: 'supabase',
          quota: {},
        }),
      });
      return;
    }

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([]),
    });
  });

  return {
    getLoginRequests: () => loginRequests,
    setLoginApiMode: (mode) => { currentLoginApiMode = mode; },
  };
}

function authUrl(baseUrl, parameter, value) {
  return `${baseUrl}/auth?${parameter}=${encodeURIComponent(value)}`;
}

async function createReadyPage(browser, baseUrl, options = {}) {
  const context = await browser.newContext();
  if (options.authStorageBehavior) {
    await context.addInitScript(() => {
      const originalSetItem = Storage.prototype.setItem;
      Storage.prototype.setItem = function patchedAuthStorageSetItem(key, value) {
        if (String(key).includes('auth-token')) {
          if (window.__authStorageBehavior === 'throw') {
            throw new Error('Injected browser session storage failure');
          }
          if (window.__authStorageBehavior === 'drop') return undefined;
        }
        return originalSetItem.call(this, key, value);
      };
    });
  }
  const page = await context.newPage();
  const api = await routeDashboardApi(page, options);
  await page.goto(`${baseUrl}/auth`, { waitUntil: 'domcontentloaded' });
  if (options.authStorageBehavior) {
    await page.evaluate((behavior) => { window.__authStorageBehavior = behavior; }, options.authStorageBehavior);
  }
  await page.locator('button[type="submit"]').waitFor({ state: 'visible' });
  assert.equal(await page.locator('button[type="submit"]').isDisabled(), false, 'Sign In must enable once the browser client is ready');
  return { context, page, api };
}

async function createSessionPage(browser, baseUrl, options = {}) {
  const session = createSession();
  const context = await browser.newContext();
  await context.addInitScript((storedSession) => {
    window.localStorage.setItem('sb-127-auth-token', JSON.stringify(storedSession));
  }, session);
  await context.addCookies([{
    name: 'sb-127-auth-token.0',
    value: encodeURIComponent(JSON.stringify(session)),
    url: baseUrl,
  }]);
  const page = await context.newPage();
  const api = await routeDashboardApi(page, options);
  return { context, page, api };
}

function matchesExpectedLocation(url, expected, includeHash = true) {
  return url.pathname === expected.pathname
    && url.search === (expected.search || '')
    && (!includeHash || url.hash === (expected.hash || ''));
}

async function expectDocumentNavigation(page, baseUrl, expected, trigger) {
  const externalNavigations = [];
  const origin = new URL(baseUrl).origin;
  const collectExternalNavigation = (request) => {
    if (request.isNavigationRequest() && new URL(request.url()).origin !== origin) {
      externalNavigations.push(request.url());
    }
  };
  page.on('request', collectExternalNavigation);

  try {
    const documentRequestPromise = page.waitForRequest((request) => {
      const requestUrl = new URL(request.url());
      return requestUrl.origin === origin
        && matchesExpectedLocation(requestUrl, expected, false)
        && request.isNavigationRequest()
        && request.resourceType() === 'document';
    }, { timeout: NAVIGATION_TIMEOUT_MS });

    await trigger();
    const request = await documentRequestPromise;
    const headers = request.headers();
    assert.equal(request.isNavigationRequest(), true, 'Redirect must issue a navigation request');
    assert.equal(request.resourceType(), 'document', 'Redirect must load a document, not only an RSC payload');
    if (headers['sec-fetch-dest'] !== undefined) {
      assert.equal(headers['sec-fetch-dest'], 'document', 'Document navigation must carry sec-fetch-dest: document');
    }
    assert.notEqual(headers.rsc, '1', 'Document navigation must not be an RSC request');
    assert.equal(new URL(request.url()).searchParams.has('_rsc'), false, 'Document navigation must not rely on an _rsc fetch');
    await page.waitForURL((url) => matchesExpectedLocation(url, expected), { timeout: NAVIGATION_TIMEOUT_MS });
    assert.deepEqual(externalNavigations, [], 'Auth redirects must not issue an external navigation request');
    return request;
  } finally {
    page.off('request', collectExternalNavigation);
  }
}

async function fillPasswordCredentials(page, email) {
  await page.locator('#auth-email').fill(email);
  await page.locator('#auth-password').fill('Correct-Password-123!');
}

async function runScenario(key, name, callback) {
  if (REQUESTED_SCENARIO && REQUESTED_SCENARIO !== key) return false;
  console.log(`Scenario: ${name}`);
  try {
    await callback();
    console.log(`Scenario passed: ${name}`);
    return true;
  } catch (error) {
    error.message = `${name} failed: ${error.message}`;
    throw error;
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
  if (failures.length === 1) throw failures[0];
  if (failures.length > 1) throw new AggregateError(failures, 'Multiple Auth E2E cleanup failures');
}

async function run() {
  const resources = { browser: null, next: null, mockSupabase: null };
  let primaryError = null;
  let completedScenarios = 0;

  try {
    resources.mockSupabase = await startMockSupabase();
    resources.next = await startNext(resources.mockSupabase.url);
    resources.browser = await chromium.launch({ headless: true });

    console.log(`Local mock Supabase: ${resources.mockSupabase.url}`);
    console.log(`Local Next server: ${resources.next.baseUrl}`);

    completedScenarios += await runScenario('redirect-literal-backslash', 'malicious next backslash falls back to Dashboard', async () => {
      const { page } = await createSessionPage(resources.browser, resources.next.baseUrl);
      await page.route('https://evil.example/**', (route) => route.abort());
      await expectDocumentNavigation(page, resources.next.baseUrl, { pathname: '/dashboard' }, () => page.goto(
        authUrl(resources.next.baseUrl, 'next', '/\\evil.example'),
        { waitUntil: 'domcontentloaded' },
      ));
    });

    completedScenarios += await runScenario('redirect-encoded-backslash', 'encoded backslashes fall back to Dashboard', async () => {
      const { page } = await createSessionPage(resources.browser, resources.next.baseUrl);
      await page.route('https://evil.example/**', (route) => route.abort());
      await expectDocumentNavigation(page, resources.next.baseUrl, { pathname: '/dashboard' }, () => page.goto(
        authUrl(resources.next.baseUrl, 'redirect', '/%5Cevil.example'),
        { waitUntil: 'domcontentloaded' },
      ));
    });

    completedScenarios += await runScenario('redirect-double-encoded-backslash', 'double-encoded backslashes fall back to Dashboard', async () => {
      const { page } = await createSessionPage(resources.browser, resources.next.baseUrl);
      await page.route('https://evil.example/**', (route) => route.abort());
      await expectDocumentNavigation(page, resources.next.baseUrl, { pathname: '/dashboard' }, () => page.goto(
        `${resources.next.baseUrl}/auth?next=%2F%255Cevil.example`,
        { waitUntil: 'domcontentloaded' },
      ));
    });

    completedScenarios += await runScenario('redirect-protocol-relative', 'protocol-relative next falls back to Dashboard', async () => {
      const { page } = await createSessionPage(resources.browser, resources.next.baseUrl);
      await page.route('https://evil.example/**', (route) => route.abort());
      await expectDocumentNavigation(page, resources.next.baseUrl, { pathname: '/dashboard' }, () => page.goto(
        authUrl(resources.next.baseUrl, 'next', '//evil.example'),
        { waitUntil: 'domcontentloaded' },
      ));
    });

    completedScenarios += await runScenario('redirect-legal-internal', 'legal next preserves path query and hash', async () => {
      const { page } = await createSessionPage(resources.browser, resources.next.baseUrl);
      await expectDocumentNavigation(page, resources.next.baseUrl, { pathname: '/dashboard', search: '?tab=quotes', hash: '#section' }, () => page.goto(
        authUrl(resources.next.baseUrl, 'next', '/dashboard?tab=quotes#section'),
        { waitUntil: 'domcontentloaded' },
      ));
    });

    completedScenarios += await runScenario('redirect-unauthenticated', 'unauthenticated malicious next remains on Auth', async () => {
      const { page, api } = await createReadyPage(resources.browser, resources.next.baseUrl);
      await page.route('https://evil.example/**', (route) => route.abort());
      await page.goto(authUrl(resources.next.baseUrl, 'next', '/\\evil.example'), { waitUntil: 'domcontentloaded' });
      await delay(300);
      assert.equal(new URL(page.url()).pathname, '/auth', 'An unauthenticated visitor must remain on /auth');
      assert.equal(api.getLoginRequests(), 0, 'An unauthenticated redirect guard must not submit a login');
    });

    completedScenarios += await runScenario('rapid-double-click', 'rapid double click sends one password login request', async () => {
      const { page, api } = await createReadyPage(resources.browser, resources.next.baseUrl, { loginDelayMs: 250 });
      await fillPasswordCredentials(page, 'double-click@example.com');
      const button = page.locator('button[type="submit"]');
      const box = await button.boundingBox();
      assert.ok(box, 'Sign In button must be measurable for the real double-click interaction');
      await expectDocumentNavigation(page, resources.next.baseUrl, { pathname: '/dashboard' }, () => page.mouse.dblclick(box.x + (box.width / 2), box.y + (box.height / 2)));
      assert.equal(api.getLoginRequests(), 1, 'Rapid double-click must send exactly one password-login request');
    });

    completedScenarios += await runScenario('enter-click', 'Enter followed immediately by click sends one password login request', async () => {
      const { page, api } = await createReadyPage(resources.browser, resources.next.baseUrl, { loginDelayMs: 250 });
      await fillPasswordCredentials(page, 'enter-click@example.com');
      const button = page.locator('button[type="submit"]');
      const box = await button.boundingBox();
      assert.ok(box, 'Sign In button must be measurable for the real click interaction');
      await expectDocumentNavigation(page, resources.next.baseUrl, { pathname: '/dashboard' }, async () => {
        await page.locator('#auth-password').press('Enter');
        await page.mouse.click(box.x + (box.width / 2), box.y + (box.height / 2));
      });
      assert.equal(api.getLoginRequests(), 1, 'Enter followed by click must send exactly one password-login request');
    });

    completedScenarios += await runScenario('hard-navigation', 'click password sign-in uses a full-page Dashboard navigation', async () => {
      const { page } = await createReadyPage(resources.browser, resources.next.baseUrl);
      await fillPasswordCredentials(page, 'click@example.com');
      await expectDocumentNavigation(page, resources.next.baseUrl, { pathname: '/dashboard' }, () => page.locator('button[type="submit"]').click());
    });

    completedScenarios += await runScenario('invalid-password-retry', 'invalid password stays on Auth and releases the submit lock for retry', async () => {
      const { page, api } = await createReadyPage(resources.browser, resources.next.baseUrl);
      await fillPasswordCredentials(page, 'invalid@example.com');
      await page.locator('button[type="submit"]').click();
      await page.getByText(/Invalid login credentials/i).waitFor({ state: 'visible' });
      assert.equal(new URL(page.url()).pathname, '/auth');
      assert.equal(await page.locator('button[type="submit"]').isDisabled(), false, 'A failed login must re-enable Sign In');

      await fillPasswordCredentials(page, 'retry@example.com');
      await expectDocumentNavigation(page, resources.next.baseUrl, { pathname: '/dashboard' }, () => page.locator('button[type="submit"]').click());
      assert.equal(api.getLoginRequests(), 2, 'A retry after failure must issue exactly one additional login request');
    });

    completedScenarios += await runScenario('client-unavailable', 'browser client unavailable has no interactive submit control', async () => {
      const context = await resources.browser.newContext();
      const page = await context.newPage();
      await page.route('**/_next/static/**', (route) => route.abort());
      await page.goto(`${resources.next.baseUrl}/auth`, { waitUntil: 'domcontentloaded' });
      assert.equal(await page.locator('button[type="submit"]').count(), 0, 'Sign In must not be interactive before the browser client initializes');
    });

    completedScenarios += await runScenario('existing-session-dashboard', 'existing activated session navigates to Dashboard', async () => {
      const { page } = await createSessionPage(resources.browser, resources.next.baseUrl, { hasActivated: true });
      await expectDocumentNavigation(page, resources.next.baseUrl, { pathname: '/dashboard' }, () => page.goto(
        `${resources.next.baseUrl}/auth`,
        { waitUntil: 'domcontentloaded' },
      ));
    });

    completedScenarios += await runScenario('existing-session-onboarding', 'existing onboarding session navigates to onboarding', async () => {
      const { page } = await createSessionPage(resources.browser, resources.next.baseUrl, { hasActivated: false });
      await expectDocumentNavigation(page, resources.next.baseUrl, { pathname: '/onboarding' }, () => page.goto(
        `${resources.next.baseUrl}/auth`,
        { waitUntil: 'domcontentloaded' },
      ));
    });

    completedScenarios += await runScenario('existing-session-network-fallback', 'existing session with profile network failure uses Dashboard fallback', async () => {
      const { page } = await createSessionPage(resources.browser, resources.next.baseUrl, { userApiMode: 'network-error' });
      await expectDocumentNavigation(page, resources.next.baseUrl, { pathname: '/dashboard' }, () => page.goto(
        `${resources.next.baseUrl}/auth`,
        { waitUntil: 'domcontentloaded' },
      ));
    });

    completedScenarios += await runScenario('existing-session-http-fallback', 'existing session with profile HTTP 500 uses Dashboard fallback', async () => {
      const { page } = await createSessionPage(resources.browser, resources.next.baseUrl, { userApiMode: 'http-500' });
      await expectDocumentNavigation(page, resources.next.baseUrl, { pathname: '/dashboard' }, () => page.goto(
        `${resources.next.baseUrl}/auth`,
        { waitUntil: 'domcontentloaded' },
      ));
    });

    completedScenarios += await runScenario('password-navigation-lock', 'navigation keeps the password submit lock until the document request completes', async () => {
      const { page, api } = await createReadyPage(resources.browser, resources.next.baseUrl);
      let releaseDashboard;
      const dashboardReleased = new Promise((resolve) => { releaseDashboard = resolve; });
      let documentRequestStarted;
      const documentRequestObserved = new Promise((resolve) => { documentRequestStarted = resolve; });
      let submitDisabledDuringUnload = null;
      page.on('console', (message) => {
        const text = message.text();
        if (text.startsWith('__AUTH_SUBMIT_DISABLED_DURING_UNLOAD__:')) {
          submitDisabledDuringUnload = text.endsWith('true');
        }
      });
      await page.route('**/dashboard', async (route) => {
        const request = route.request();
        if (request.isNavigationRequest() && request.resourceType() === 'document') {
          documentRequestStarted();
          await dashboardReleased;
        }
        await route.continue();
      });
      await fillPasswordCredentials(page, 'navigation-lock@example.com');
      await page.evaluate(() => {
        window.addEventListener('beforeunload', () => {
          const form = document.querySelector('form');
          const button = document.querySelector('button[type="submit"]');
          console.log(`__AUTH_SUBMIT_DISABLED_DURING_UNLOAD__:${button?.disabled === true}`);
          form?.requestSubmit();
        }, { once: true });
      });
      const documentRequestPromise = page.waitForRequest((request) => (
        new URL(request.url()).pathname === '/dashboard'
        && request.isNavigationRequest()
        && request.resourceType() === 'document'
      ));
      await page.locator('button[type="submit"]').click();
      await documentRequestPromise;
      await documentRequestObserved;
      releaseDashboard();
      await page.waitForURL((url) => url.pathname === '/dashboard', { timeout: NAVIGATION_TIMEOUT_MS });
      await delay(100);
      assert.equal(submitDisabledDuringUnload, true, 'Sign In must remain disabled after document navigation starts');
      assert.equal(api.getLoginRequests(), 1, 'A submit after navigation starts must not issue a second login request');
    });

    completedScenarios += await runScenario('missing-session-retry', 'a login response without a session stays on Auth and permits retry', async () => {
      const { page, api } = await createReadyPage(resources.browser, resources.next.baseUrl, { loginApiMode: 'missing-session' });
      await fillPasswordCredentials(page, 'missing-session@example.com');
      await page.locator('button[type="submit"]').click();
      await page.getByText('Login failed').waitFor({ state: 'visible' });
      assert.equal(await page.locator('button[type="submit"]').isDisabled(), false, 'A missing login session must release Sign In');
      api.setLoginApiMode('success');
      await expectDocumentNavigation(page, resources.next.baseUrl, { pathname: '/dashboard' }, () => page.locator('button[type="submit"]').click());
      assert.equal(api.getLoginRequests(), 2, 'A retry after a missing session must issue one additional request');
    });

    completedScenarios += await runScenario('set-session-throw-retry', 'a browser setSession failure stays on Auth and permits retry', async () => {
      const { page, api } = await createReadyPage(resources.browser, resources.next.baseUrl, { authStorageBehavior: 'throw' });
      await fillPasswordCredentials(page, 'set-session-throw@example.com');
      await page.locator('button[type="submit"]').click();
      await page.getByText('Injected browser session storage failure').waitFor({ state: 'visible' });
      assert.equal(await page.locator('button[type="submit"]').isDisabled(), false, 'A setSession failure must release Sign In');
      await page.evaluate(() => { window.__authStorageBehavior = 'normal'; });
      await expectDocumentNavigation(page, resources.next.baseUrl, { pathname: '/dashboard' }, () => page.locator('button[type="submit"]').click());
      assert.equal(api.getLoginRequests(), 2, 'A retry after setSession failure must issue one additional request');
    });

    if (REQUESTED_SCENARIO && completedScenarios === 0) {
      throw new Error(`Unknown AUTH_E2E_SCENARIO: ${REQUESTED_SCENARIO}`);
    }
  } catch (error) {
    primaryError = error;
  }

  let cleanupError = null;
  try {
    await closeResources(resources);
    await assertPortReleased(resources.next?.port);
    await assertPortReleased(resources.mockSupabase?.port);
  } catch (error) {
    cleanupError = error;
  }

  if (primaryError && cleanupError) {
    throw new AggregateError([primaryError, cleanupError], 'Auth E2E assertion and cleanup failed');
  }
  if (primaryError) throw primaryError;
  if (cleanupError) throw cleanupError;

  console.log('Auth password redirect E2E tests passed');
}

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
