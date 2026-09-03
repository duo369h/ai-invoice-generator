import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  getDashboardSurfaceState,
  getNeedsAttentionSurfaceState,
} from '../src/components/dashboard/dashboardWave1.mjs';

const hookSource = readFileSync(new URL('../src/hooks/useDashboardData.js', import.meta.url), 'utf8');
const overviewSource = readFileSync(new URL('../src/app/dashboard/components/DashboardOverview.js', import.meta.url), 'utf8');

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
    if (character === '\'' || character === '"' || character === '`') {
      quote = character;
      continue;
    }
    if (character === '{') depth += 1;
    if (character === '}') {
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
  let depth = 0;
  let parametersClose = -1;
  for (let index = parametersOpen; index < source.length; index += 1) {
    if (source[index] === '(') depth += 1;
    if (source[index] === ')') {
      depth -= 1;
      if (depth === 0) {
        parametersClose = index;
        break;
      }
    }
  }
  const open = source.indexOf('{', parametersClose);
  return source.slice(start, matchingBrace(source, open) + 1).replace(/^export\s+/, '');
}

function response(body, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  };
}

const loadDashboardResources = new Function(
  `return (${extractNamedFunction(hookSource, 'loadDashboardResources')});`,
)();

const existingQuotes = [{ id: 'quote-last-good', status: 'sent' }];
const existingInvoices = [{ id: 'invoice-last-good', payment_status: 'partial' }];
const state = {
  quotes: existingQuotes,
  invoices: existingInvoices,
  quoteError: null,
  invoiceError: null,
  quoteSetCalls: 0,
  invoiceSetCalls: 0,
};

const fetchImpl = async (url) => {
  if (url === '/api/user') return response({ id: 'user-1', hasActivated: true });
  if (url === '/api/quotes') return response({ error: 'temporary outage' }, 503);
  if (url === '/api/invoices') return response({ error: 'temporary outage' }, 503);
  if (url === '/api/clients') return response({ data: [] });
  if (url === '/api/leads') return response({ data: [] });
  if (url === '/api/card-profile') return response({});
  throw new Error(`Unexpected test URL: ${url}`);
};

await loadDashboardResources({
  token: 'session-token',
  fetchImpl,
  getAuthHeaders: (token) => ({ Authorization: `Bearer ${token}` }),
  setUser: () => {},
  setInvoices: (value) => {
    state.invoices = value;
    state.invoiceSetCalls += 1;
  },
  setClients: () => {},
  setLeads: () => {},
  setQuotes: (value) => {
    state.quotes = value;
    state.quoteSetCalls += 1;
  },
  setCardProfile: () => {},
  setQuotesError: (value) => { state.quoteError = value; },
  setInvoicesError: (value) => { state.invoiceError = value; },
  consoleImpl: { error: () => {} },
});

assert.deepEqual(state.quotes, existingQuotes, 'Quote failure retains last known good records');
assert.deepEqual(state.invoices, existingInvoices, 'Invoice failure retains last known good records');
assert.equal(state.quoteSetCalls, 0, 'Quote failure does not silently clear the collection');
assert.equal(state.invoiceSetCalls, 0, 'Invoice failure does not silently clear the collection');
assert.ok(state.quoteError, 'Quote failure is disclosed through error state');
assert.ok(state.invoiceError, 'Invoice failure is disclosed through error state');

const dashboardState = getDashboardSurfaceState({
  quotes: state.quotes,
  invoices: state.invoices,
  error: state.quoteError,
});
assert.equal(dashboardState, 'ready', 'Dashboard keeps rendering last known good records during stale error');
const needsAttentionState = getNeedsAttentionSurfaceState({
  itemCount: 1,
  surfaceState: dashboardState,
  error: state.quoteError,
});
assert.equal(needsAttentionState.mode, 'stale', 'Needs Attention discloses stale/error state while retaining records');
assert.match(overviewSource, /Some data could not be refreshed\. Showing the latest available documents\./);
assert.match(overviewSource, /onClick=\{\(\) => resolveAction\(actionHandlers, 'retryDashboard'\)\}/);

console.log('R56C ERROR STALE DATA TEST=PASS');
