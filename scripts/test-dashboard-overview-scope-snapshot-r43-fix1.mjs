import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const hookSource = await readFile(new URL('../src/hooks/useDashboardData.js', import.meta.url), 'utf8');

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
    if (char === "'" || char === '"' || char === '`') {
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

function extractNamedFunction(source, name) {
  const start = source.indexOf(`export async function ${name}`);
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

function jsonResponse(body, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  };
}

const loadDashboardResources = new Function(`return (${extractNamedFunction(hookSource, 'loadDashboardResources')});`)();

async function runScenario(statuses = {}) {
  const initialQuotes = [{ id: 'existing-quote', quote_number: 'QT-EXISTING' }];
  const initialInvoices = [{ id: 'existing-invoice' }];
  const initialClients = [{ id: 'existing-client' }];
  const initialLeads = [{ id: 'existing-lead' }];
  const state = {
    quotes: initialQuotes,
    invoices: initialInvoices,
    clients: initialClients,
    leads: initialLeads,
    quoteError: 'previous quote error',
    quoteErrorWrites: [],
    writes: { quotes: 0, invoices: 0, clients: 0, leads: 0 },
  };
  const set = (key) => (value) => {
    state[key] = value;
    if (key === 'quoteError') state.quoteErrorWrites.push(value);
    else state.writes[key] += 1;
  };
  const fetchImpl = async (url) => {
    const status = statuses[url] || 200;
    if (url === '/api/user') return jsonResponse({ id: 'user-1', hasActivated: true }, status);
    if (url === '/api/card-profile') return jsonResponse({ id: 'profile-1' }, status);
    return jsonResponse({ data: [{ id: `${url.slice(5)}-fresh` }] }, status);
  };

  await loadDashboardResources({
    token: 'session-token',
    fetchImpl,
    getAuthHeaders: (token) => ({ Authorization: `Bearer ${token}` }),
    setUser: () => {},
    setInvoices: set('invoices'),
    setClients: set('clients'),
    setLeads: set('leads'),
    setQuotes: set('quotes'),
    setQuotesError: set('quoteError'),
    setCardProfile: () => {},
    onQuotesSettled: () => {},
    consoleImpl: { error: () => {} },
  });

  return { state, initialQuotes };
}

const failedRefresh = await runScenario({
  '/api/quotes': 503,
  '/api/invoices': 503,
  '/api/clients': 503,
  '/api/leads': 503,
});
assert.strictEqual(failedRefresh.state.quotes, failedRefresh.initialQuotes, 'existing quotes must remain available on Quote HTTP refresh failure');
assert.equal(failedRefresh.state.writes.quotes, 0, 'Quote HTTP refresh failure must not clear or replace existing quotes');
assert.equal(failedRefresh.state.quoteErrorWrites.length, 1, 'Quote HTTP refresh failure must set quoteError');
assert.ok(failedRefresh.state.quoteErrorWrites[0] instanceof Error, 'quoteError must contain an Error');
assert.deepEqual(failedRefresh.state.invoices, [], 'invoice HTTP error must preserve pre-R43 clear behavior');
assert.deepEqual(failedRefresh.state.clients, [], 'client HTTP error must preserve pre-R43 clear behavior');
assert.deepEqual(failedRefresh.state.leads, [], 'lead HTTP error must preserve pre-R43 clear behavior');
assert.deepEqual(failedRefresh.state.writes, { quotes: 0, invoices: 1, clients: 1, leads: 1 });

const successfulRefresh = await runScenario();
assert.equal(successfulRefresh.state.quotes[0].id, 'quotes-fresh', 'successful Quote refresh must replace the list');
assert.deepEqual(successfulRefresh.state.quoteErrorWrites, [null], 'later successful Quote refresh must clear quoteError');

console.log('DASHBOARD_OVERVIEW_SCOPE_SNAPSHOT_R43_FIX1_TEST=PASS');
