import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const BASE_COMMIT = '40ddb365cfd2da5b5744dc08be1f0c91f7ad07ec';
const scriptPath = fileURLToPath(import.meta.url);
const sourceArgument = process.argv.find((argument) => argument.startsWith('--source='));
const expectationArgument = process.argv.find((argument) => argument.startsWith('--expect='));
const requestedSource = sourceArgument?.slice('--source='.length);
const expectation = expectationArgument?.slice('--expect='.length) || 'green';

assert.ok(!requestedSource || ['base', 'current'].includes(requestedSource), '--source must be base or current');
assert.equal(expectation, 'green', '--expect must be green');

// The default command first proves that the real Base source fails a corrected
// assertion, then executes the complete GREEN suite against the current source.
if (!requestedSource) {
  const baseRun = spawnSync(process.execPath, [scriptPath, '--source=base', '--expect=green'], {
    encoding: 'utf8',
  });
  assert.notEqual(baseRun.status, 0, 'Base proof must fail at a corrected behavior assertion');
  const baseOutput = `${baseRun.stdout}\n${baseRun.stderr}`;
  assert.match(
    baseOutput,
    /delayed Clients error must be recorded before fetchData resolves/,
    `Base proof failed for a non-target reason:\n${baseOutput}`,
  );
  assert.doesNotMatch(
    baseOutput,
    /loadDashboardResources.*(?:not defined|missing)|missing callback marker|missing production function|Unbalanced function body|Cannot find module|SyntaxError/i,
    `Base proof failed while loading source instead of at the target assertion:\n${baseOutput}`,
  );
  console.log('Base RED proof passed: real Base source failed at "delayed Clients error must be recorded before fetchData resolves".');
}

const source = requestedSource || 'current';
const hookSource = source === 'base'
  ? execFileSync('git', ['show', `${BASE_COMMIT}:src/hooks/useDashboardData.js`], { encoding: 'utf8' })
  : await readFile(new URL('../src/hooks/useDashboardData.js', import.meta.url), 'utf8');
const dashboardSource = await readFile(new URL('../src/components/dashboard/Dashboard.js', import.meta.url), 'utf8');

function matchingBrace(source, openIndex) {
  let depth = 0;
  let quote = null;
  let escaped = false;
  for (let index = openIndex; index < source.length; index += 1) {
    const char = source[index];
    if (quote) {
      if (escaped) escaped = false;
      else if (char === '\\') escaped = true;
      else if (char === quote) quote = null;
      continue;
    }
    if (char === '\'' || char === '"' || char === '`') {
      quote = char;
      continue;
    }
    if (char === '{') depth += 1;
    if (char === '}') {
      depth -= 1;
      if (depth === 0) return index;
    }
  }
  throw new Error('Unbalanced function body');
}

function extractUseCallbackArrow(source, marker) {
  const start = source.indexOf(marker);
  assert.notEqual(start, -1, `missing callback marker: ${marker}`);
  const callbackStart = start + marker.length;
  const arrow = source.indexOf('=>', callbackStart);
  const open = source.indexOf('{', arrow);
  const close = matchingBrace(source, open);
  return source.slice(callbackStart, close + 1);
}

function extractNamedFunction(source, name) {
  const patterns = [`export async function ${name}`, `export function ${name}`, `async function ${name}`, `function ${name}`];
  const start = patterns.reduce((found, pattern) => found === -1 ? source.indexOf(pattern) : found, -1);
  assert.notEqual(start, -1, `missing production function: ${name}`);
  const parametersOpen = source.indexOf('(', start);
  let parameterDepth = 0;
  let parametersClose = -1;
  for (let index = parametersOpen; index < source.length; index += 1) {
    if (source[index] === '(') parameterDepth += 1;
    if (source[index] === ')') {
      parameterDepth -= 1;
      if (parameterDepth === 0) {
        parametersClose = index;
        break;
      }
    }
  }
  assert.notEqual(parametersClose, -1, `unbalanced parameters for: ${name}`);
  const open = source.indexOf('{', parametersClose);
  const close = matchingBrace(source, open);
  return source.slice(start, close + 1).replace(/^export\s+/, '');
}

function delay(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

function createDeferredDelay(milliseconds) {
  let finish;
  let timer;
  const promise = new Promise((resolve) => {
    finish = () => {
      clearTimeout(timer);
      resolve();
    };
    timer = setTimeout(resolve, milliseconds);
  });
  return { promise, finish };
}

function jsonResponse(body, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  };
}

const fetchDataCallback = extractUseCallbackArrow(hookSource, 'const fetchData = useCallback(');
const invalidateDashboardDataCallback = hookSource.includes('const invalidateDashboardData = useCallback(')
  ? extractUseCallbackArrow(hookSource, 'const invalidateDashboardData = useCallback(')
  : null;
const loadDashboardResourcesSource = hookSource.includes('function loadDashboardResources')
  ? extractNamedFunction(hookSource, 'loadDashboardResources')
  : null;

function createFetchDataHarness({ delays = {}, failures = {}, statuses = {}, fetchHandlers = {} } = {}) {
  const requestCounts = new Map();
  const state = {
    user: null,
    invoices: [],
    clients: [],
    leads: [],
    quotes: [],
    cardProfile: null,
    quotesLoading: null,
    quotesLoadingHistory: [],
    quoteVisibleAt: null,
    errors: [],
    unmounted: false,
    writesAfterUnmount: 0,
    resourceWrites: {
      invoices: 0,
      clients: 0,
      leads: 0,
      quotes: 0,
      cardProfile: 0,
    },
  };
  const startedAt = Date.now();

  const bodies = {
    '/api/user': { id: 'user-1', email: 'user@example.com', plan: 'free', hasActivated: true, quota: {} },
    '/api/invoices': { data: [{ id: 'invoice-1' }] },
    '/api/clients': { data: [{ id: 'client-1' }] },
    '/api/leads': { data: [{ id: 'lead-1' }] },
    '/api/quotes': { data: [{ id: 'quote-1', quote_number: 'QT-1' }] },
    '/api/card-profile': { id: 'profile-1' },
  };

  const fetch = (url) => {
    requestCounts.set(url, (requestCounts.get(url) || 0) + 1);
    const requestNumber = requestCounts.get(url);
    if (fetchHandlers[url]) return fetchHandlers[url]({ requestNumber, bodies, jsonResponse });
    return (async () => {
      if (delays[url]) await delays[url];
      if (failures[url]) throw failures[url];
      return jsonResponse(bodies[url], statuses[url] || 200);
    })();
  };

  const recordWrite = (callback) => (value) => {
    if (state.unmounted) state.writesAfterUnmount += 1;
    callback(value);
  };

  const dashboardLoadVersionRef = { current: 0 };
  const dependencies = {
    fetch,
    isLive: true,
    session: { access_token: 'session-token' },
    getAuthHeaders: (token) => token ? { Authorization: `Bearer ${token}` } : {},
    setUser: recordWrite((value) => { state.user = value; }),
    setInvoices: recordWrite((value) => {
      state.resourceWrites.invoices += 1;
      state.invoices = value;
    }),
    setClients: recordWrite((value) => {
      state.resourceWrites.clients += 1;
      state.clients = value;
    }),
    setLeads: recordWrite((value) => {
      state.resourceWrites.leads += 1;
      state.leads = value;
    }),
    setQuotes: recordWrite((value) => {
      state.resourceWrites.quotes += 1;
      state.quotes = value;
      if (value.length > 0 && state.quoteVisibleAt === null) state.quoteVisibleAt = Date.now() - startedAt;
    }),
    setCardProfile: recordWrite((value) => {
      state.resourceWrites.cardProfile += 1;
      state.cardProfile = value;
    }),
    setIsLoading: recordWrite(() => {}),
    setIsRefreshing: recordWrite(() => {}),
    setIsInitialLoad: recordWrite(() => {}),
    setIsQuotesLoading: recordWrite((value) => {
      state.quotesLoading = value;
      state.quotesLoadingHistory.push(value);
    }),
    isInitialLoadRef: { current: true },
    dashboardLoadVersionRef,
    console: {
      error: (...args) => state.errors.push(args),
    },
  };

  if (loadDashboardResourcesSource) {
    dependencies.loadDashboardResources = new Function(`return (${loadDashboardResourcesSource});`)();
  }

  const fetchData = new Function('dependencies', `
    const {
      fetch, isLive, session, getAuthHeaders,
      setUser, setInvoices, setClients, setLeads, setQuotes, setCardProfile,
      setIsLoading, setIsRefreshing, setIsInitialLoad, setIsQuotesLoading,
      isInitialLoadRef, dashboardLoadVersionRef, loadDashboardResources, console
    } = dependencies;
    return (${fetchDataCallback});
  `)(dependencies);

  const invalidateDashboardData = invalidateDashboardDataCallback
    ? new Function('dependencies', `
      const {
        dashboardLoadVersionRef, setIsLoading, setIsRefreshing,
        setIsInitialLoad, setIsQuotesLoading, isInitialLoadRef
      } = dependencies;
      return (${invalidateDashboardDataCallback});
    `)(dependencies)
    : () => {};

  return { fetchData, invalidateDashboardData, requestCounts, state };
}

function assertNoResourceWrites(state, message) {
  assert.deepEqual(state.resourceWrites, {
    invoices: 0,
    clients: 0,
    leads: 0,
    quotes: 0,
    cardProfile: 0,
  }, message);
}

async function assertUnactivatedUserConsumesDelayedClientsFailure() {
  let unhandledRejectionCount = 0;
  const onUnhandledRejection = () => { unhandledRejectionCount += 1; };
  process.on('unhandledRejection', onUnhandledRejection);
  const startedAt = Date.now();
  let resolvedAt = null;
  try {
    const harness = createFetchDataHarness({
      fetchHandlers: {
        '/api/user': ({ jsonResponse }) => Promise.resolve(jsonResponse({
          id: 'user-1',
          hasActivated: false,
        })),
        '/api/clients': () => new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Injected delayed Clients rejection')), 80);
        }),
      },
    });

    const loadPromise = harness.fetchData('access-token').then((result) => {
      resolvedAt = Date.now() - startedAt;
      return result;
    });
    await delay(30);
    assert.equal(resolvedAt, null, 'fetchData must not resolve before pending resource tasks settle');
    const result = await loadPromise;
    await delay(0);

    assert.ok(resolvedAt >= 70, `fetchData must await the delayed Clients task, resolved at ${resolvedAt}ms`);
    assert.equal(unhandledRejectionCount, 0, 'Clients rejection must not become unhandled');
    assert.ok(
      harness.state.errors.some((entry) => entry[0] === 'Failed to fetch clients:' && String(entry[1]).includes('Injected delayed Clients rejection')),
      'delayed Clients error must be recorded before fetchData resolves',
    );
    assert.equal(result.user?.hasActivated, false);
    assertNoResourceWrites(harness.state, 'An unactivated User must prevent all non-User resource writes');
  } finally {
    process.off('unhandledRejection', onUnhandledRejection);
  }
}

// Base has no helper or invalidation callback.  Execute its actual fetchData
// callback through the same harness, and stop immediately at the corrected
// behavior assertion so no unrelated legacy incompatibility can mask the RED.
if (source === 'base') {
  await assertUnactivatedUserConsumesDelayedClientsFailure();
  assert.fail('Base source unexpectedly passed the corrected delayed Clients assertion');
}

async function runSlowCardProfileScenario() {
  const cardDelay = createDeferredDelay(15_000);
  const scenarioStartedAt = Date.now();
  const { fetchData, state } = createFetchDataHarness({
    delays: {
      '/api/quotes': delay(100),
      '/api/card-profile': cardDelay.promise,
    },
  });
  const loadPromise = fetchData('access-token');

  try {
    assert.equal(state.quotesLoading, true, 'Quotes must expose a local loading state before their first response');
    await delay(500);
    assert.deepEqual(state.quotes.map((quote) => quote.id), ['quote-1'], 'Quotes must render before a 15-second Card Profile request completes');
    assert.equal(state.cardProfile, null, 'Card Profile must still be pending when Quotes render');
    assert.equal(state.quotesLoading, false, 'Quotes loading must clear as soon as Quotes finish');
    assert.ok(state.quoteVisibleAt >= 90 && state.quoteVisibleAt < 1_000, `Quotes should appear near 100ms, observed ${state.quoteVisibleAt}ms`);
    await loadPromise;
    const loadResolvedAt = Date.now() - scenarioStartedAt;
    assert.ok(loadResolvedAt >= 14_500, `fetchData must await Card Profile, resolved at ${loadResolvedAt}ms`);
    assert.ok(state.cardProfile, 'Card Profile should update after its independent request completes');
    return { quoteVisibleAt: state.quoteVisibleAt, loadResolvedAt };
  } catch (error) {
    cardDelay.finish();
    await loadPromise;
    throw error;
  }
}

{
  let unhandledRejectionCount = 0;
  const onUnhandledRejection = () => { unhandledRejectionCount += 1; };
  process.on('unhandledRejection', onUnhandledRejection);
  try {
    const { fetchData, state } = createFetchDataHarness({
      delays: { '/api/user': delay(120) },
      failures: { '/api/clients': new Error('Injected immediate Clients rejection') },
    });
    await fetchData('access-token');
    await delay(0);
    assert.equal(unhandledRejectionCount, 0, 'Every resource rejection must be handled in the turn in which its request is created');
    assert.deepEqual(state.quotes.map((quote) => quote.id), ['quote-1'], 'An early Clients rejection must not block Quotes');
    console.log(`Immediate resource rejection check passed (unhandledRejectionCount=${unhandledRejectionCount}).`);
  } finally {
    process.off('unhandledRejection', onUnhandledRejection);
  }
}

{
  let unhandledRejectionCount = 0;
  const onUnhandledRejection = () => { unhandledRejectionCount += 1; };
  process.on('unhandledRejection', onUnhandledRejection);
  const startedAt = Date.now();
  let resolvedAt = null;
  try {
    const harness = createFetchDataHarness({
      fetchHandlers: {
        '/api/user': ({ jsonResponse }) => Promise.resolve(jsonResponse({
          id: 'user-1',
          hasActivated: false,
        })),
        '/api/clients': () => new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Injected delayed Clients rejection')), 80);
        }),
      },
    });

    const loadPromise = harness.fetchData('access-token').then((result) => {
      resolvedAt = Date.now() - startedAt;
      return result;
    });
    await delay(30);
    assert.equal(resolvedAt, null, 'An unactivated User must not let fetchData resolve before delayed resource tasks settle');
    const result = await loadPromise;
    await delay(0);

    assert.ok(resolvedAt >= 70, `fetchData must await the delayed Clients task, resolved at ${resolvedAt}ms`);
    assert.equal(result.user?.hasActivated, false);
    assert.equal(unhandledRejectionCount, 0);
    assert.ok(
      harness.state.errors.some((entry) => entry[0] === 'Failed to fetch clients:' && String(entry[1]).includes('Injected delayed Clients rejection')),
      'The delayed Clients rejection must be logged once',
    );
    assertNoResourceWrites(harness.state, 'An unactivated User must prevent all non-User resource writes');
    console.log(`Unactivated User gate consumption check passed (resolvedAt=${resolvedAt}ms, unhandledRejectionCount=${unhandledRejectionCount}).`);
  } finally {
    process.off('unhandledRejection', onUnhandledRejection);
  }
}

{
  const startedAt = Date.now();
  const harness = createFetchDataHarness({
    delays: { '/api/leads': delay(70) },
    statuses: { '/api/quotes': 500 },
    failures: { '/api/user': new Error('Injected User network failure') },
  });

  const result = await harness.fetchData('access-token');
  const resolvedAt = Date.now() - startedAt;
  assert.ok(resolvedAt >= 60, `A User network failure must still await all resource tasks, resolved at ${resolvedAt}ms`);
  assert.ok(result.error instanceof Error);
  assert.ok(
    harness.state.errors.some((entry) => entry[0] === 'Failed to fetch user:' && String(entry[1]).includes('Injected User network failure')),
    'The User network failure must be logged',
  );
  assert.ok(
    harness.state.errors.some((entry) => entry[0] === 'Failed to fetch quotes:' && entry[1] === 500),
    'The Quotes HTTP failure must still be logged when the User request fails',
  );
  assertNoResourceWrites(harness.state, 'A User request failure must prevent all non-User resource writes');
}

{
  const harness = createFetchDataHarness({
    statuses: { '/api/user': 503 },
    fetchHandlers: {
      '/api/invoices': () => { throw new Error('Injected synchronous Invoices failure'); },
    },
  });

  const result = await harness.fetchData('access-token');
  assert.equal(result.user, null);
  assert.ok(result.error, 'A User HTTP failure must return a fail-closed error result');
  assert.equal(
    harness.state.errors.filter((entry) => entry[0] === 'Failed to fetch user:' && entry[1] === 503).length,
    1,
    'The User HTTP failure must be logged exactly once',
  );
  assert.equal(
    harness.state.errors.filter((entry) => entry[0] === 'Failed to fetch invoices:' && String(entry[1]).includes('Injected synchronous Invoices failure')).length,
    1,
    'A synchronous resource failure must be normalized and logged exactly once',
  );
  assertNoResourceWrites(harness.state, 'A User HTTP failure must prevent all non-User resource writes');
}

{
  let unhandledRejectionCount = 0;
  const onUnhandledRejection = () => { unhandledRejectionCount += 1; };
  process.on('unhandledRejection', onUnhandledRejection);
  try {
    const harness = createFetchDataHarness({
      fetchHandlers: {
        '/api/user': () => Promise.resolve({
          ok: true,
          status: 200,
          json: async () => { throw new Error('Injected User JSON failure'); },
        }),
        '/api/card-profile': () => Promise.resolve({
          ok: true,
          status: 200,
          json: async () => { throw new Error('Injected Card Profile JSON failure'); },
        }),
      },
    });

    await harness.fetchData('access-token');
    await delay(0);
    assert.equal(unhandledRejectionCount, 0);
    assert.ok(
      harness.state.errors.some((entry) => entry[0] === 'Failed to fetch user:' && String(entry[1]).includes('Injected User JSON failure')),
      'The User JSON failure must be logged',
    );
    assert.ok(
      harness.state.errors.some((entry) => entry[0] === 'Failed to fetch card profile:' && String(entry[1]).includes('Injected Card Profile JSON failure')),
      'The Card Profile JSON failure must still be logged when the User JSON parse fails',
    );
    assertNoResourceWrites(harness.state, 'A User JSON failure must prevent all non-User resource writes');
  } finally {
    process.off('unhandledRejection', onUnhandledRejection);
  }
}

{
  const { fetchData, state } = createFetchDataHarness({ statuses: { '/api/quotes': 500 } });
  await fetchData('access-token');
  assert.deepEqual(state.quotes, [], 'Quotes HTTP failure must preserve the stable empty result');
  assert.equal(state.quotesLoading, false, 'Quotes HTTP failure must release local loading');
  assert.ok(state.errors.some((entry) => entry[0] === 'Failed to fetch quotes:' && entry[1] === 500), 'Quotes HTTP failure must be logged with its status');
}

for (const scenario of [
  {
    label: 'network failure',
    handler: () => Promise.reject(new Error('Injected Quotes network failure')),
  },
  {
    label: 'JSON failure',
    handler: () => Promise.resolve({
      ok: true,
      status: 200,
      json: async () => { throw new Error('Injected Quotes JSON failure'); },
    }),
  },
]) {
  const harness = createFetchDataHarness({ fetchHandlers: { '/api/quotes': scenario.handler } });
  await harness.fetchData('access-token');
  assert.equal(harness.state.quotesLoading, false, `Quotes ${scenario.label} must release local loading`);
  assert.ok(
    harness.state.errors.some((entry) => entry[0] === 'Failed to fetch quotes:'),
    `Quotes ${scenario.label} must be logged`,
  );
  const skeletonEntries = harness.state.quotesLoadingHistory.filter(Boolean).length;
  await harness.fetchData('access-token');
  assert.equal(
    harness.state.quotesLoadingHistory.filter(Boolean).length,
    skeletonEntries,
    `Quotes ${scenario.label} must end the first-load phase before the next refresh`,
  );
}

const { quoteVisibleAt, loadResolvedAt } = await runSlowCardProfileScenario();

{
  const cardDelay = createDeferredDelay(15_000);
  const harness = createFetchDataHarness({
    delays: {
      '/api/quotes': delay(100),
      '/api/card-profile': cardDelay.promise,
    },
  });
  const initialLoad = harness.fetchData('access-token');
  await delay(250);
  assert.deepEqual(harness.state.quotes.map((quote) => quote.id), ['quote-1']);
  assert.equal(harness.state.quotesLoading, false);
  const skeletonEntriesBeforeRefresh = harness.state.quotesLoadingHistory.filter(Boolean).length;

  const refreshLoad = harness.fetchData('access-token');
  await delay(25);
  assert.deepEqual(harness.state.quotes.map((quote) => quote.id), ['quote-1'], 'Refreshing after Quotes settle must preserve the visible list');
  assert.equal(harness.state.quotesLoading, false);
  assert.equal(
    harness.state.quotesLoadingHistory.filter(Boolean).length,
    skeletonEntriesBeforeRefresh,
    'A refresh while Card Profile is still pending must not re-enter the first-Quotes skeleton',
  );

  cardDelay.finish();
  await Promise.all([initialLoad, refreshLoad]);
}

{
  const { fetchData, state } = createFetchDataHarness({
    delays: { '/api/quotes': delay(100) },
    failures: { '/api/clients': new Error('Injected Clients failure') },
  });
  await fetchData('access-token');
  assert.deepEqual(state.quotes.map((quote) => quote.id), ['quote-1'], 'Clients failure must not block Quotes');
  assert.ok(state.errors.some((entry) => entry.some((value) => String(value).includes('Clients'))), 'Clients failure must be logged');
}

const authEventAction = new Function(`return (${extractNamedFunction(dashboardSource, 'getDashboardAuthEventAction')});`)();
const quotesContentState = new Function(`return (${extractNamedFunction(dashboardSource, 'getQuotesContentState')});`)();

assert.equal(authEventAction('INITIAL_SESSION', { user: { id: 'user-1' } }), 'ignore');
assert.equal(authEventAction('SIGNED_OUT', null), 'clear');
assert.equal(authEventAction('SIGNED_IN', { user: { id: 'user-1' } }), 'refresh');
assert.equal(authEventAction('TOKEN_REFRESHED', { user: { id: 'user-1' } }), 'refresh');
assert.equal(authEventAction('USER_UPDATED', { user: { id: 'user-1' } }), 'refresh');
assert.equal(quotesContentState(true, 0), 'loading', 'Quotes list must render a local loading state while its request is pending');
assert.equal(quotesContentState(false, 0), 'empty');
assert.equal(quotesContentState(false, 1), 'ready');

{
  const quotesDelay = createDeferredDelay(1_000);
  const harness = createFetchDataHarness({ delays: { '/api/quotes': quotesDelay.promise } });
  const loadPromise = harness.fetchData('access-token');
  await delay(20);
  harness.state.unmounted = true;
  harness.invalidateDashboardData({ updateState: false, resetQuotesInitialLoad: true });
  quotesDelay.finish();
  await loadPromise;
  assert.equal(harness.state.writesAfterUnmount, 0, 'Unmount invalidation must not call React setters or allow old requests to write state');
}

{
  const quotesDelay = createDeferredDelay(1_000);
  const harness = createFetchDataHarness({ delays: { '/api/quotes': quotesDelay.promise } });
  const loadPromise = harness.fetchData('access-token');
  await delay(20);
  assert.equal(authEventAction('SIGNED_OUT', null), 'clear');
  harness.invalidateDashboardData({ resetQuotesInitialLoad: true });
  harness.state.user = null;
  harness.state.quotes = [];
  quotesDelay.finish();
  await loadPromise;
  assert.deepEqual(harness.state.quotes, [], 'A response from an invalidated pre-sign-out load must not restore old Quotes');
  assert.equal(harness.state.quotesLoading, false, 'Signing out must clear the Quotes loading state');

  const writesBeforeRelogin = harness.state.quotesLoadingHistory.length;
  const reloginLoad = harness.fetchData('access-token');
  assert.equal(harness.state.quotesLoadingHistory.at(-1), true, 'A login after SIGNED_OUT must restore the first-Quotes skeleton');
  assert.ok(harness.state.quotesLoadingHistory.length > writesBeforeRelogin);
  await reloginLoad;
}

{
  const oldQuotes = createDeferredDelay(1_000);
  const harness = createFetchDataHarness({
    fetchHandlers: {
      '/api/quotes': ({ requestNumber, jsonResponse }) => {
        if (requestNumber === 1) {
          return oldQuotes.promise.then(() => jsonResponse({ data: [{ id: 'quote-old' }] }));
        }
        return Promise.resolve(jsonResponse({ data: [{ id: 'quote-new' }] }));
      },
    },
  });
  const oldLoad = harness.fetchData('old-token');
  await delay(20);
  const newLoad = harness.fetchData('new-token');
  await newLoad;
  assert.deepEqual(harness.state.quotes.map((quote) => quote.id), ['quote-new']);
  oldQuotes.finish();
  await oldLoad;
  assert.deepEqual(harness.state.quotes.map((quote) => quote.id), ['quote-new'], 'An older Quotes response must not overwrite a newer refresh');
}

{
  const harness = createFetchDataHarness();
  await harness.fetchData('access-token'); // getSession hydration
  if (authEventAction('INITIAL_SESSION', { user: { id: 'user-1' } }) === 'refresh') {
    await harness.fetchData('access-token');
  }
  for (const endpoint of ['/api/user', '/api/invoices', '/api/clients', '/api/leads', '/api/quotes', '/api/card-profile']) {
    assert.equal(harness.requestCounts.get(endpoint), 1, `${endpoint} must be requested exactly once during hydration + INITIAL_SESSION`);
  }

  for (const event of ['SIGNED_IN', 'TOKEN_REFRESHED', 'USER_UPDATED']) {
    if (authEventAction(event, { user: { id: 'user-1' } }) === 'refresh') {
      await harness.fetchData('access-token');
    }
  }
  for (const endpoint of ['/api/user', '/api/invoices', '/api/clients', '/api/leads', '/api/quotes', '/api/card-profile']) {
    assert.equal(harness.requestCounts.get(endpoint), 4, `${endpoint} must refresh for later real auth events`);
  }
}

console.log(`Dashboard first-load performance runtime tests passed (Quotes visible at ${quoteVisibleAt}ms; fetchData resolved at ${loadResolvedAt}ms with Card Profile delayed 15000ms).`);
