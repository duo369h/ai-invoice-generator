import assert from 'node:assert/strict';
import http from 'node:http';
import net from 'node:net';
import path from 'node:path';
import { createRequire } from 'node:module';
import { spawn } from 'node:child_process';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';

const BASE = '36368b952b0ad0bd4bc92be3cc899dc184d9a181';
const appRootArgument = process.argv.find((value) => value.startsWith('--app-root='));
const sourceArgument = process.argv.find((value) => value.startsWith('--source='));
const source = sourceArgument ? sourceArgument.slice('--source='.length) : 'all';
const expectArgument = process.argv.find((value) => value.startsWith('--expect='));
const expectation = expectArgument ? expectArgument.slice('--expect='.length) : 'green';
assert.ok(['all', 'current', 'base'].includes(source), `unsupported --source=${source}`);
assert.equal(expectation, 'green', `unsupported --expect=${expectation}`);
const appRoot = appRootArgument ? appRootArgument.slice('--app-root='.length) : process.cwd();
const sharedRoot = process.env.CORVIOZ_NODE_MODULES_ROOT || '/Users/duo/Documents/想做个网站/corvioz';
const require = createRequire(path.join(sharedRoot, 'package.json'));
const { chromium } = require('playwright');
const nextCli = require.resolve('next/dist/bin/next');

const accounts = {
  A: { id: 'user-a', email: 'account-a@example.com' },
  B: { id: 'user-b', email: 'account-b@example.com' },
  C: { id: 'user-c', email: 'account-c@example.com' },
};

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const b64 = (value) => Buffer.from(JSON.stringify(value)).toString('base64url');
function sessionFor(account) {
  const token = `${b64({ alg: 'none', typ: 'JWT' })}.${b64({ sub: account.id, email: account.email, exp: Math.floor(Date.now() / 1000) + 3600 })}.test`;
  return { access_token: token, refresh_token: `refresh-${account.id}`, expires_at: Math.floor(Date.now() / 1000) + 3600, expires_in: 3600, token_type: 'bearer', user: account };
}
function accountFromToken(token) {
  try {
    const payload = JSON.parse(Buffer.from(String(token).split('.')[1], 'base64url').toString());
    return Object.values(accounts).find((account) => account.id === payload.sub) || null;
  } catch { return null; }
}
async function port() {
  const server = net.createServer();
  await new Promise((resolve, reject) => server.listen(0, '127.0.0.1', resolve).once('error', reject));
  const value = server.address().port;
  await new Promise((resolve) => server.close(resolve));
  return value;
}
async function mockSupabase() {
  let logoutRequests = 0;
  const server = http.createServer(async (request, response) => {
    const url = new URL(request.url, 'http://127.0.0.1');
    const send = (status, body) => { response.writeHead(status, { 'content-type': 'application/json', 'access-control-allow-origin': '*' }); response.end(JSON.stringify(body)); };
    if (request.method === 'POST' && url.pathname === '/auth/v1/token') { send(200, sessionFor(accounts.B)); return; }
    if (request.method === 'GET' && url.pathname === '/auth/v1/user') {
      const account = accountFromToken((request.headers.authorization || '').replace(/^Bearer\s+/i, ''));
      send(account ? 200 : 401, account || { message: 'unauthorized' }); return;
    }
    if (request.method === 'POST' && url.pathname === '/auth/v1/logout') {
      logoutRequests += 1;
      response.writeHead(204, { 'access-control-allow-origin': '*' });
      response.end();
      return;
    }
    if (request.method === 'GET' && url.pathname === '/rest/v1/entitlements') { send(200, []); return; }
    send(404, { message: 'unhandled mock request' });
  });
  const value = await port();
  await new Promise((resolve, reject) => server.listen(value, '127.0.0.1', resolve).once('error', reject));
  return { url: `http://127.0.0.1:${value}`, get logoutRequests() { return logoutRequests; }, close: () => new Promise((resolve) => server.close(resolve)) };
}
async function nextServer(supabaseUrl) {
  const value = await port();
  const child = spawn(process.execPath, [nextCli, 'dev', '--webpack', '--hostname', '127.0.0.1', '--port', String(value)], {
    cwd: appRoot,
    env: { ...process.env, NODE_PATH: path.join(sharedRoot, 'node_modules'), NEXT_PUBLIC_SUPABASE_URL: supabaseUrl, NEXT_PUBLIC_SUPABASE_ANON_KEY: 'test-anon-key' },
    stdio: 'ignore',
  });
  const baseUrl = `http://127.0.0.1:${value}`;
  for (let attempt = 0; attempt < 240; attempt += 1) {
    try { if ((await fetch(`${baseUrl}/auth`)).ok) break; } catch {}
    await wait(250);
    if (attempt === 239) throw new Error('Next test server did not start');
  }
  return { baseUrl, async close() { child.kill('SIGTERM'); await Promise.race([new Promise((resolve) => child.once('exit', resolve)), wait(5000)]); if (child.exitCode === null) child.kill('SIGKILL'); } };
}

async function runAccountSwitchScenario(baseUrl, browser, { failureMode = null, delayedInitialA = false, probeQuote = true } = {}) {
  const context = await browser.newContext();
  const sessionA = sessionFor(accounts.A);
  const page = await context.newPage();
  const calls = [];
  let releasePostLoginUserResponse = null;
  let sequence = 0;
  const diagnostics = { loginRequests: 0, submits: 0, navigations: [], consoleErrors: [], pageErrors: [], httpErrors: [], timeline: [], loginResponseSequence: 0 };
  const event = (label, details = {}) => diagnostics.timeline.push({ sequence: ++sequence, label, ...details });
  page.on('console', (message) => { if (message.type() === 'error') diagnostics.consoleErrors.push(message.text()); });
  page.on('pageerror', (error) => diagnostics.pageErrors.push(error.message));
  page.on('response', (response) => {
    if (response.status() >= 400) {
      const url = new URL(response.url());
      diagnostics.httpErrors.push({ status: response.status(), pathname: url.pathname });
    }
  });
  page.on('framenavigated', (frame) => { if (frame === page.mainFrame()) { diagnostics.navigations.push(frame.url()); event('frame navigation', { pathname: new URL(frame.url()).pathname }); } });
  await page.addInitScript((initialSession) => {
    window.addEventListener('submit', () => { window.__authSubmitCount = (window.__authSubmitCount || 0) + 1; }, true);
    if (window.location.pathname !== '/auth' || !initialSession) return;
    let client;
    Object.defineProperty(window, 'supabaseClientInstance', {
      configurable: true,
      get: () => client,
      set: (nextClient) => {
        client = nextClient;
        const originalGetSession = client.auth.getSession.bind(client.auth);
        let firstGetSession = true;
        client.auth.getSession = async (...args) => {
          if (!firstGetSession) return originalGetSession(...args);
          firstGetSession = false;
          window.__staleInitialSyncStarted = true;
          return new Promise((resolve) => {
            window.__releaseStaleInitialSync = () => {
              window.__staleInitialSyncCompleted = true;
              resolve({ data: { session: initialSession }, error: null });
            };
          });
        };
      },
    });
  }, delayedInitialA ? sessionA : null);
  await page.route('**/api/**', async (route) => {
    const request = route.request();
    const pathname = new URL(request.url()).pathname;
    if (pathname === '/api/auth/login') { diagnostics.loginRequests += 1; event('auth login request started'); return route.continue(); }
    if (pathname === '/api/user' || pathname === '/api/quotes') {
      const bearer = (request.headers().authorization || '').replace(/^Bearer\s+/i, '');
      const bearerAccount = accountFromToken(bearer);
      const cookieHeader = request.headers().cookie || '';
      const cookieAccount = Object.entries(accounts).find(([, account]) => cookieHeader.includes(account.id))?.[0] || 'none';
      const account = bearerAccount || accounts[cookieAccount] || accounts.A;
      calls.push({ sequence: ++sequence, pathname, account: account.id, bearer: bearerAccount ? Object.entries(accounts).find(([, candidate]) => candidate.id === bearerAccount.id)?.[0] : 'none', cookie: cookieAccount, postLogin: diagnostics.loginResponseSequence > 0 });
      if (delayedInitialA && pathname === '/api/user' && diagnostics.loginResponseSequence > 0) {
        await new Promise((resolve) => { releasePostLoginUserResponse = resolve; });
      }
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(pathname === '/api/user' ? { ...account, hasActivated: true } : { data: [] }) });
    }
    return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ data: [] }) });
  });
  await page.goto(`${baseUrl}/auth`, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => Boolean(window.supabaseClientInstance));
  if (delayedInitialA) {
    await page.waitForFunction(() => window.__staleInitialSyncStarted === true);
    event('A initial sync started');
  }
  await page.evaluate((accountId) => {
    window.__authIdentityEvents = [];
    window.supabaseClientInstance.auth.onAuthStateChange((authEvent, session) => {
      if (authEvent === 'SIGNED_IN' && session?.user?.id === accountId) {
        window.__authIdentityEvents.push('B setSession event');
      }
    });
  }, accounts.B.id);
  await page.locator('button[type="submit"]').waitFor({ state: 'visible' });
  await page.waitForFunction(() => !document.querySelector('button[type="submit"]')?.disabled);
  await page.locator('#auth-email').fill(accounts.B.email);
  await page.locator('#auth-password').fill('test-password');
  if (failureMode) {
    await page.evaluate(async ({ account, mode }) => {
      const client = window.supabaseClientInstance;
      await client.auth.setSession(account);
      const originalSetSession = client.auth.setSession.bind(client.auth);
      const originalGetSession = client.auth.getSession.bind(client.auth);
      if (mode === 'set-error') {
        client.auth.setSession = async () => ({ data: { session: null }, error: { message: 'internal mock failure' } });
      } else if (mode === 'set-wrong-user') {
        client.auth.setSession = async () => originalSetSession(account);
      } else if (mode === 'get-wrong-user') {
        window.__getWrongUserAudit = { injections: 0, setSessionB: 0, signOut: 0, finalRealGetSessionCalls: 0, finalRealGetSessionUserId: null, events: [] };
        let wrongUserInjectionArmed = false;
        client.auth.setSession = async (...args) => {
          const result = await originalSetSession(...args);
          if (result.data?.session?.user?.id === 'user-b') {
            wrongUserInjectionArmed = true;
            window.__getWrongUserAudit.setSessionB += 1;
            window.__getWrongUserAudit.events.push('setSession B');
          }
          return result;
        };
        const originalSignOut = client.auth.signOut.bind(client.auth);
        client.auth.signOut = async (...args) => {
          window.__getWrongUserAudit.signOut += 1;
          window.__getWrongUserAudit.events.push('signOut called');
          return originalSignOut(...args);
        };
        client.auth.getSession = async (...args) => {
          if (wrongUserInjectionArmed) {
            wrongUserInjectionArmed = false;
            window.__getWrongUserAudit.injections += 1;
            window.__getWrongUserAudit.events.push('verification getSession injected A');
            return { data: { session: account }, error: null };
          }
          const result = await originalGetSession(...args);
          window.__getWrongUserAudit.finalRealGetSessionCalls += 1;
          window.__getWrongUserAudit.finalRealGetSessionUserId = result.data?.session?.user?.id || null;
          return result;
        };
      }
    }, { account: sessionA, mode: failureMode });
    await wait(50);
  }
  const loginResponsePromise = page.waitForResponse((response) => new URL(response.url()).pathname === '/api/auth/login');
  await page.locator('button[type="submit"]').click();
  const loginResponse = await loginResponsePromise;
  diagnostics.loginResponse = { status: loginResponse.status(), keys: Object.keys(await loginResponse.json().catch(() => ({}))).sort() };
  diagnostics.loginResponseSequence = ++sequence;
  event('auth login response completed', { status: diagnostics.loginResponse.status });
  if (delayedInitialA) {
    await page.waitForFunction(() => window.__authIdentityEvents?.includes('B setSession event'));
    event('B setSession event');
    await page.evaluate(() => window.__releaseStaleInitialSync());
    await page.waitForFunction(() => window.__staleInitialSyncCompleted === true);
    await wait(25);
    event('A initial sync completed');
    assert.ok(releasePostLoginUserResponse, 'password login must issue /api/user before the stale A sync is released');
    releasePostLoginUserResponse();
  }
  await wait(2500);
  const readState = () => page.evaluate(async ({ shouldProbeQuote }) => {
    const storage = localStorage.getItem('sb-127-auth-token');
    let userId = null;
    try { userId = JSON.parse(storage || 'null')?.user?.id || null; } catch {}
    const { data } = await window.supabaseClientInstance.auth.getSession();
    const quoteResponse = shouldProbeQuote ? await fetch('/api/quotes', {
      headers: data?.session?.access_token ? { Authorization: `Bearer ${data.session.access_token}` } : {},
    }) : null;
    return {
      userId,
      getSessionUserId: data?.session?.user?.id || null,
      storage,
      text: document.body.innerText,
      quoteStatus: quoteResponse?.status || null,
      url: window.location.pathname,
      getWrongUserAudit: window.__getWrongUserAudit || null,
      submits: window.__authSubmitCount || 0,
    };
  }, { shouldProbeQuote: probeQuote });
  let state;
  try { state = await readState(); } catch { await wait(500); state = await readState(); }
  const cookies = await context.cookies();
  await context.close();
  diagnostics.submits = state.submits;
  return { state, calls, cookies, diagnostics };
}

function assertFailClosed(result, label) {
  const postLoginBusinessCalls = result.calls.filter((call) => call.postLogin && (call.pathname === '/api/user' || call.pathname === '/api/quotes'));
  assert.equal(result.diagnostics.loginRequests, 1, `${label}: password login must be requested once`);
  assert.equal(result.diagnostics.loginResponse.status, 200, `${label}: password login response must be successful`);
  assert.equal(result.state.url, '/auth', `${label}: must remain on Auth`);
  assert.equal(postLoginBusinessCalls.length, 0, `${label}: must not issue post-login business requests`);
  assert.equal(result.state.userId, null, `${label}: browser storage must be cleared`);
  assert.equal(result.state.getSessionUserId, null, `${label}: getSession must be cleared`);
  assert.equal(result.cookies.some((cookie) => cookie.name === 'sb-127-auth-token.0' && /user-[ac]/.test(decodeURIComponent(cookie.value))), false, `${label}: stale auth cookie must be cleared`);
  assert.match(result.state.text, /Unable to establish the requested account session/, `${label}: must show a safe login error`);
  assert.doesNotMatch(result.state.text, /internal mock failure|refresh-|dashboard-test-signature/, `${label}: must not reveal internal auth details`);
  assert.equal(result.diagnostics.consoleErrors.length, 0, `${label}: must not emit console errors`);
  assert.equal(result.diagnostics.pageErrors.length, 0, `${label}: must not emit page errors`);
}

async function run(app) {
  const supabase = await mockSupabase();
  const next = await nextServer(supabase.url);
  const browser = await chromium.launch({ headless: true });
  try {
    const switched = await runAccountSwitchScenario(next.baseUrl, browser, { delayedInitialA: true });
    const postLoginUsers = switched.calls.filter((call) => call.pathname === '/api/user' && call.sequence > switched.diagnostics.loginResponseSequence);
    console.log(`timeline=${JSON.stringify(switched.diagnostics.timeline)} postLoginUsers=${JSON.stringify(postLoginUsers)} loginRequests=${switched.diagnostics.loginRequests} loginStatus=${switched.diagnostics.loginResponse.status} httpErrors=${JSON.stringify(switched.diagnostics.httpErrors)} consoleErrors=${JSON.stringify(switched.diagnostics.consoleErrors)} pageErrors=${JSON.stringify(switched.diagnostics.pageErrors)}`);
    assert.equal(switched.state.userId, accounts.B.id, 'browser session must switch from Account A to Account B');
    assert.equal(switched.state.getSessionUserId, accounts.B.id, 'browser getSession must remain Account B');
    assert.ok(postLoginUsers.length >= 1, 'password login must issue a post-login /api/user request');
    assert.equal(postLoginUsers[0].bearer, 'B', 'post-login /api/user must use Account B Bearer');
    assert.equal(postLoginUsers.some((call) => call.account !== accounts.B.id), false, 'post-login business identity must remain Account B');
    assert.equal(switched.state.storage.includes(accounts.B.id), true, 'localStorage must retain Account B rather than Account A');
    assert.match(switched.state.text, /account-b@example\.com/, 'Dashboard must display Account B email');
    assert.equal(switched.state.quoteStatus, 200, 'Dashboard Quotes probe must complete');
    assert.ok(switched.calls.some((call) => call.pathname === '/api/quotes' && call.account === accounts.B.id && call.bearer === 'B'), 'subsequent /api/quotes must use Account B');
    assert.ok(switched.cookies.some((cookie) => cookie.name === 'sb-127-auth-token.0' && cookie.value.includes(accounts.B.id)), 'stale Account A cookie sync must not overwrite Account B');
    assert.equal(switched.diagnostics.consoleErrors.length, 0, 'current scenario must not emit browser console errors');
    assert.equal(switched.diagnostics.pageErrors.length, 0, 'current scenario must not emit page errors');
    assert.equal(supabase.logoutRequests, 0, 'successful stale-A to B handoff must not call logout');

    for (const failureMode of ['set-error', 'set-wrong-user', 'get-wrong-user']) {
      const logoutBefore = supabase.logoutRequests;
      const rejected = await runAccountSwitchScenario(next.baseUrl, browser, { failureMode, probeQuote: false });
      assertFailClosed(rejected, failureMode);
      assert.equal(supabase.logoutRequests - logoutBefore, 1, `${failureMode}: fail-closed handoff must call logout once`);
      if (failureMode === 'get-wrong-user') {
        assert.deepEqual(rejected.state.getWrongUserAudit?.events, ['setSession B', 'verification getSession injected A', 'signOut called'], 'get-wrong-user: injection timeline');
        assert.equal(rejected.state.getWrongUserAudit?.injections, 1, 'get-wrong-user: wrong account must be injected exactly once');
        assert.equal(rejected.state.getWrongUserAudit?.setSessionB, 1, 'get-wrong-user: setSession B must occur once');
        assert.equal(rejected.state.getWrongUserAudit?.signOut, 1, 'get-wrong-user: signOut must occur once');
        assert.ok(rejected.state.getWrongUserAudit?.finalRealGetSessionCalls >= 1, 'get-wrong-user: final audit must call real getSession');
        assert.equal(rejected.state.getWrongUserAudit?.finalRealGetSessionUserId, null, 'get-wrong-user: final real getSession must be empty');
      }
      console.log(`${failureMode} fail-closed scenario passed.`);
    }
    const noPriorSession = await runAccountSwitchScenario(next.baseUrl, browser);
    assert.equal(noPriorSession.state.userId, accounts.B.id, 'no-prior-session login must establish Account B');
    assert.equal(noPriorSession.state.getSessionUserId, accounts.B.id, 'no-prior-session getSession must establish Account B');
    assert.equal(noPriorSession.state.url, '/dashboard', 'no-prior-session login must navigate to Dashboard');
    assert.ok(noPriorSession.calls.some((call) => call.pathname === '/api/quotes' && call.bearer === 'B'), 'no-prior-session Quotes probe must use Account B');
    assert.equal(supabase.logoutRequests, 3, 'successful no-prior-session login must not call logout');
    console.log('Account A to B session identity scenarios passed.');
  } finally { await browser.close(); await next.close(); await supabase.close(); }
}

let baseProofOnly = false;
if (!appRootArgument && source !== 'current') {
  const baseRoot = await mkdtemp(path.join(tmpdir(), 'corvioz-auth-base-'));
  try {
    const add = spawn('git', ['worktree', 'add', '--detach', baseRoot, BASE], { cwd: process.cwd(), stdio: 'inherit' });
    await new Promise((resolve, reject) => add.once('exit', (code) => code === 0 ? resolve() : reject(new Error(`base worktree add failed: ${code}`))));
    const child = spawn(process.execPath, [process.argv[1], `--app-root=${baseRoot}`, '--source=current', '--expect=green'], { env: process.env, stdio: 'pipe' });
    let output = ''; child.stdout.on('data', (chunk) => { output += chunk; }); child.stderr.on('data', (chunk) => { output += chunk; });
    const code = await new Promise((resolve) => child.once('exit', resolve));
    assert.notEqual(code, 0, 'Base must fail the account-switch identity assertion');
    assert.match(output, /(browser session must switch from Account A to Account B|post-login \/api\/user must use Account B Bearer|stale Account A cookie sync must not overwrite Account B|post-login business identity must remain Account B)/, output);
    console.log(`base child output:\n${output.trim()}`);
    console.log('Base RED proof passed at a targeted post-login identity assertion.');
    baseProofOnly = source === 'base';
  } finally {
    await new Promise((resolve) => spawn('git', ['worktree', 'remove', '--force', baseRoot], { cwd: process.cwd(), stdio: 'ignore' }).once('exit', resolve));
    await rm(baseRoot, { recursive: true, force: true });
  }
}
if (!baseProofOnly) await run(appRoot);
if (baseProofOnly) process.exitCode = 1;
