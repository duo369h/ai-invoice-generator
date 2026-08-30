import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { getClientDocumentContinuity } from '../src/components/dashboard/clientDocumentContinuity.mjs';

const hookSource = readFileSync(new URL('../src/hooks/useDashboardData.js', import.meta.url), 'utf8');

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

function extractUseCallbackArrow(source, marker) {
  const start = source.indexOf(marker);
  assert.notEqual(start, -1, `missing callback marker: ${marker}`);
  const arrow = source.indexOf('=>', start + marker.length);
  const open = source.indexOf('{', arrow);
  return source.slice(start + marker.length, matchingBrace(source, open) + 1);
}

function deferred() {
  let resolve;
  const promise = new Promise((nextResolve) => {
    resolve = nextResolve;
  });
  return { promise, resolve };
}

function response(body, status = 200) {
  return { ok: status >= 200 && status < 300, status, json: async () => body };
}

function createRealLoadingHarness({ quoteStatus = 200, invoiceStatus = 200 } = {}) {
  const quoteGate = deferred();
  const invoiceGate = deferred();
  const state = {
    quotes: [],
    invoices: [],
    quoteLoading: true,
    invoiceLoading: true,
    quoteError: null,
    invoiceError: null,
  };
  const fetchImpl = (url) => {
    if (url === '/api/user') return Promise.resolve(response({ id: 'user-1', hasActivated: true }));
    if (url === '/api/quotes') return quoteGate.promise.then(() => response({ data: [] }, quoteStatus));
    if (url === '/api/invoices') return invoiceGate.promise.then(() => response({ data: [] }, invoiceStatus));
    if (url === '/api/clients') return Promise.resolve(response({ data: [{ id: 'client-a' }] }));
    if (url === '/api/leads') return Promise.resolve(response({ data: [] }));
    if (url === '/api/card-profile') return Promise.resolve(response({ id: 'profile-1' }));
    throw new Error(`Unexpected test URL: ${url}`);
  };
  const dependencies = {
    fetch: fetchImpl,
    isLive: true,
    session: { access_token: 'session-token' },
    getAuthHeaders: (token) => token ? { Authorization: `Bearer ${token}` } : {},
    setUser: () => {},
    setInvoices: (value) => { state.invoices = value; },
    setClients: () => {},
    setLeads: () => {},
    setQuotes: (value) => { state.quotes = value; },
    setQuotesError: (value) => { state.quoteError = value; },
    setInvoicesError: (value) => { state.invoiceError = value; },
    setCardProfile: () => {},
    setIsLoading: () => {},
    setIsRefreshing: () => {},
    setIsInitialLoad: () => {},
    setIsQuotesLoading: (value) => { state.quoteLoading = value; },
    setIsInvoicesLoading: (value) => { state.invoiceLoading = value; },
    isInitialLoadRef: { current: true },
    isInvoiceInitialLoadRef: { current: true },
    dashboardLoadVersionRef: { current: 0 },
    console: { error: () => {} },
  };
  const loadDashboardResources = new Function(`return (${extractNamedFunction(hookSource, 'loadDashboardResources')});`)();
  const fetchDataCallback = extractUseCallbackArrow(hookSource, 'const fetchData = useCallback(');
  const fetchData = new Function('dependencies', `
    const {
      fetch, isLive, session, getAuthHeaders,
      setUser, setInvoices, setClients, setLeads, setQuotes, setQuotesError, setInvoicesError, setCardProfile,
      setIsLoading, setIsRefreshing, setIsInitialLoad, setIsQuotesLoading, setIsInvoicesLoading,
      isInitialLoadRef, isInvoiceInitialLoadRef, dashboardLoadVersionRef, loadDashboardResources, console
    } = dependencies;
    return (${fetchDataCallback});
  `)( { ...dependencies, loadDashboardResources } );
  return { fetchData, quoteGate, invoiceGate, state };
}

function continuityFromLoadingState(state) {
  return getClientDocumentContinuity({
    client: { id: 'client-a' },
    quotes: state.quotes,
    invoices: state.invoices,
    quoteResourceState: state.quoteLoading ? 'loading' : state.quoteError ? 'error' : 'ready',
    invoiceResourceState: state.invoiceLoading ? 'loading' : state.invoiceError ? 'error' : 'ready',
    quoteError: state.quoteError,
    invoiceError: state.invoiceError,
  });
}

async function runRealLoadingLifecycleChecks() {
  const quoteFirst = createRealLoadingHarness();
  const quoteFirstLoad = quoteFirst.fetchData('access-token');
  quoteFirst.quoteGate.resolve();
  await new Promise((resolve) => setTimeout(resolve, 0));
  const quoteFirstProjection = continuityFromLoadingState(quoteFirst.state);
  assert.equal(quoteFirst.state.quoteLoading, false, 'real Quote task settles its own loading state first');
  assert.equal(quoteFirst.state.invoiceLoading, true, 'real Invoice loading remains while its response is delayed');
  assert.equal(quoteFirstProjection.quoteState, 'ready', 'Quote is ready after the real Quote task settles');
  assert.equal(quoteFirstProjection.invoiceState, 'loading', 'Invoice remains loading after Quote settles first');
  assert.equal(quoteFirstProjection.invoiceEmptyEligible, false, 'delayed Invoice cannot produce a successful empty group');
  assert.equal(quoteFirstProjection.combinedEmptyEligible, false, 'delayed Invoice blocks combined empty');
  quoteFirst.invoiceGate.resolve();
  await quoteFirstLoad;
  assert.equal(quoteFirst.state.invoiceLoading, false, 'Invoice loading settles when the real Invoice task settles');
  assert.equal(continuityFromLoadingState(quoteFirst.state).combinedEmptyEligible, true, 'both real tasks resolved empty allows combined empty');

  const invoiceFirst = createRealLoadingHarness();
  const invoiceFirstLoad = invoiceFirst.fetchData('access-token');
  invoiceFirst.invoiceGate.resolve();
  await new Promise((resolve) => setTimeout(resolve, 0));
  const invoiceFirstProjection = continuityFromLoadingState(invoiceFirst.state);
  assert.equal(invoiceFirst.state.invoiceLoading, false, 'real Invoice task settles its own loading state first');
  assert.equal(invoiceFirst.state.quoteLoading, true, 'real Quote loading remains while its response is delayed');
  assert.equal(invoiceFirstProjection.invoiceState, 'ready', 'Invoice is ready after the real Invoice task settles');
  assert.equal(invoiceFirstProjection.quoteState, 'loading', 'Quote remains loading after Invoice settles first');
  assert.equal(invoiceFirstProjection.quoteEmptyEligible, false, 'delayed Quote cannot produce a successful empty group');
  assert.equal(invoiceFirstProjection.combinedEmptyEligible, false, 'delayed Quote blocks combined empty');
  invoiceFirst.quoteGate.resolve();
  await invoiceFirstLoad;

  const invoiceFailure = createRealLoadingHarness({ invoiceStatus: 503 });
  const invoiceFailureLoad = invoiceFailure.fetchData('access-token');
  invoiceFailure.quoteGate.resolve();
  invoiceFailure.invoiceGate.resolve();
  await invoiceFailureLoad;
  const invoiceFailureProjection = continuityFromLoadingState(invoiceFailure.state);
  assert.equal(invoiceFailure.state.invoiceLoading, false, 'Invoice HTTP failure settles the real Invoice loading state');
  assert.equal(invoiceFailureProjection.invoiceUnavailable, true, 'Invoice HTTP failure becomes unavailable');
  assert.equal(invoiceFailureProjection.invoiceEmptyEligible, false, 'Invoice HTTP failure cannot become successful empty');

  const quoteFailure = createRealLoadingHarness({ quoteStatus: 503 });
  const quoteFailureLoad = quoteFailure.fetchData('access-token');
  quoteFailure.quoteGate.resolve();
  quoteFailure.invoiceGate.resolve();
  await quoteFailureLoad;
  const quoteFailureProjection = continuityFromLoadingState(quoteFailure.state);
  assert.equal(quoteFailure.state.quoteLoading, false, 'Quote HTTP failure settles the real Quote loading state');
  assert.equal(quoteFailureProjection.quoteUnavailable, true, 'Quote HTTP failure becomes unavailable');
  assert.equal(quoteFailureProjection.quoteEmptyEligible, false, 'Quote HTTP failure cannot become successful empty');
}

const client = { id: 'client-a', name: 'Same Name', email: 'same@example.com' };
const quotes = [
  { id: 'q-old', quote_number: 'QT-OLD', client_id: 'client-a', client_name: 'Same Name', client_email: 'same@example.com', total: 1000, currency: 'USD', status: 'draft', created_at: '2026-08-01T10:00:00Z' },
  { id: 'q-new', quote_number: 'QT-NEW', client_id: 'client-a', client_name: 'Different Snapshot', total: 2000, currency: 'EUR', status: 'sent', updated_at: '2026-08-03T10:00:00Z', created_at: '2026-08-02T10:00:00Z' },
  { id: 'q-other', quote_number: 'QT-OTHER', client_id: 'client-b', client_name: 'Same Name', client_email: 'same@example.com', created_at: '2026-08-04T10:00:00Z' },
  { id: 'q-legacy', quote_number: 'QT-LEGACY', client_id: null, client_name: 'Same Name', client_email: 'same@example.com', created_at: '2026-08-05T10:00:00Z' },
];
const invoices = [
  { id: 'i-old', invoice_number: 'INV-OLD', client_id: 'client-a', client_name: 'Same Name', client_email: 'same@example.com', total: 3000, currency: 'USD', status: 'paid', created_at: '2026-08-01T10:00:00Z' },
  { id: 'i-new', invoice_number: 'INV-NEW', client_id: 'client-a', client_name: 'Different Snapshot', total: 4000, currency: 'EUR', payment_status: 'partial', updated_at: '2026-08-04T10:00:00Z', created_at: '2026-08-02T10:00:00Z' },
  { id: 'i-other', invoice_number: 'INV-OTHER', client_id: 'client-b', client_name: 'Same Name', client_email: 'same@example.com', created_at: '2026-08-05T10:00:00Z' },
  { id: 'i-legacy', invoice_number: 'INV-LEGACY', client_id: null, client_name: 'Same Name', client_email: 'same@example.com', created_at: '2026-08-06T10:00:00Z' },
];

const sourceSnapshot = structuredClone({ client, quotes, invoices });
const ready = getClientDocumentContinuity({ client, quotes, invoices });

assert.equal(ready.state, 'ready', 'loaded document data produces a ready continuity state');
assert.deepEqual(ready.quotes.map((quote) => quote.id), ['q-new', 'q-old'], 'matching Quote client_id records are included and sorted');
assert.deepEqual(ready.invoices.map((invoice) => invoice.id), ['i-new', 'i-old'], 'matching Invoice client_id records are included and sorted');
assert.equal(ready.quoteCount, 2, 'Quote count excludes unrelated and legacy records');
assert.equal(ready.invoiceCount, 2, 'Invoice count excludes unrelated and legacy records');
assert.deepEqual(
  getClientDocumentContinuity({
    client,
    quotes: [
      { id: 'q-b', client_id: 'client-a', created_at: '2026-08-10T10:00:00Z' },
      { id: 'q-a', client_id: 'client-a', created_at: '2026-08-10T10:00:00Z' },
    ],
  }).quotes.map((quote) => quote.id),
  ['q-a', 'q-b'],
  'equal timestamps use a deterministic id tie-break',
);
assert.ok(!ready.quotes.some((quote) => quote.id === 'q-other'), 'another Quote client_id is excluded');
assert.ok(!ready.invoices.some((invoice) => invoice.id === 'i-other'), 'another Invoice client_id is excluded');
assert.ok(!ready.quotes.some((quote) => quote.id === 'q-legacy'), 'null Quote client_id remains unlinked');
assert.ok(!ready.invoices.some((invoice) => invoice.id === 'i-legacy'), 'null Invoice client_id remains unlinked');
assert.deepEqual(getClientDocumentContinuity({ client, quotes: [quotes[2]], invoices: [invoices[2]] }).quotes, [], 'matching name does not establish a Quote relation');
assert.deepEqual(getClientDocumentContinuity({ client, quotes: [quotes[3]], invoices: [invoices[3]] }).invoices, [], 'matching email or name does not establish an Invoice relation');
assert.equal(ready.quotes.length, 2, 'one Client can show multiple Quotes');
assert.equal(ready.invoices.length, 2, 'one Client can show multiple Invoices');
assert.deepEqual(getClientDocumentContinuity({ client, quotes, invoices, limit: 1 }).quotes.map((quote) => quote.id), ['q-new'], 'Quote display limit is applied after deterministic sorting');
assert.deepEqual(getClientDocumentContinuity({ client, quotes, invoices, limit: 1 }).invoices.map((invoice) => invoice.id), ['i-new'], 'Invoice display limit is applied after deterministic sorting');
assert.equal(getClientDocumentContinuity({ client, quotes, invoices, limit: 1 }).moreQuotes, 1, 'Quote overflow count is accurate');
assert.equal(getClientDocumentContinuity({ client, quotes, invoices, limit: 1 }).moreInvoices, 1, 'Invoice overflow count is accurate');
assert.equal(getClientDocumentContinuity({ client, quotes: [], invoices: [] }).emptyMessage, 'No documents are linked to this client yet.', 'both empty groups use the truthful Client document message');
assert.equal(getClientDocumentContinuity({ client, quotes: [], invoices: [] }).quoteEmptyMessage, 'No quotes linked to this client.', 'empty Quote group uses the truthful message');
assert.equal(getClientDocumentContinuity({ client, quotes: [], invoices: [] }).invoiceEmptyMessage, 'No invoices linked to this client.', 'empty Invoice group uses the truthful message');
assert.equal(getClientDocumentContinuity({ client, quotes, invoices, isLoading: true }).state, 'loading', 'successful empty content is not exposed while documents load');
assert.equal(getClientDocumentContinuity({ client, quotes: [], invoices: [], error: new Error('refresh failed') }).state, 'error', 'document failures are not presented as successful empty content');

const bothResourcesResolvedEmpty = getClientDocumentContinuity({
  client,
  quotes: [],
  invoices: [],
  quoteResourceState: 'ready',
  invoiceResourceState: 'ready',
});
assert.equal(bothResourcesResolvedEmpty.combinedEmptyEligible, true, 'combined empty is eligible only after both resources resolve');
assert.equal(bothResourcesResolvedEmpty.state, 'ready', 'both resolved empty resources produce a ready state');

const quotePending = getClientDocumentContinuity({
  client,
  quotes: [],
  invoices: [invoices[0]],
  quoteResourceState: 'loading',
  invoiceResourceState: 'ready',
});
assert.equal(quotePending.quoteState, 'loading', 'pending Quote resource remains loading');
assert.equal(quotePending.quoteEmptyEligible, false, 'pending Quote resource cannot produce a successful empty state');
assert.equal(quotePending.combinedEmptyEligible, false, 'pending Quote resource blocks combined empty');

const invoicePending = getClientDocumentContinuity({
  client,
  quotes: [quotes[0]],
  invoices: [],
  quoteResourceState: 'ready',
  invoiceResourceState: 'loading',
});
assert.equal(invoicePending.invoiceState, 'loading', 'pending Invoice resource remains loading');
assert.equal(invoicePending.invoiceEmptyEligible, false, 'pending Invoice resource cannot produce a successful empty state');
assert.equal(invoicePending.combinedEmptyEligible, false, 'pending Invoice resource blocks combined empty');

const quoteUnavailable = getClientDocumentContinuity({
  client,
  quotes: [],
  invoices: [invoices[0]],
  quoteResourceState: 'error',
  invoiceResourceState: 'ready',
});
assert.equal(quoteUnavailable.quoteState, 'error', 'Quote resource error is preserved');
assert.equal(quoteUnavailable.quoteUnavailable, true, 'Quote resource without retained rows is unavailable');
assert.equal(quoteUnavailable.quoteEmptyEligible, false, 'Quote resource error cannot become a successful Quote empty state');
assert.equal(quoteUnavailable.invoiceState, 'ready', 'resolved Invoice resource remains independently resolved');
assert.equal(quoteUnavailable.combinedEmptyEligible, false, 'one resource error blocks combined empty');

const invoiceUnavailable = getClientDocumentContinuity({
  client,
  quotes: [quotes[0]],
  invoices: [],
  quoteResourceState: 'ready',
  invoiceResourceState: 'error',
});
assert.equal(invoiceUnavailable.invoiceState, 'error', 'Invoice resource error is preserved');
assert.equal(invoiceUnavailable.invoiceUnavailable, true, 'Invoice resource without retained rows is unavailable');
assert.equal(invoiceUnavailable.invoiceEmptyEligible, false, 'Invoice resource error cannot become a successful Invoice empty state');
assert.equal(invoiceUnavailable.quoteState, 'ready', 'resolved Quote resource remains independently resolved');

const quoteStale = getClientDocumentContinuity({
  client,
  quotes: [quotes[0]],
  invoices: [],
  quoteResourceState: 'error',
  invoiceResourceState: 'ready',
});
assert.equal(quoteStale.quoteStale, true, 'Quote error with retained rows is explicitly stale');
assert.deepEqual(quoteStale.quotes.map((quote) => quote.id), ['q-old'], 'retained Quote rows remain visible');

const invoiceStale = getClientDocumentContinuity({
  client,
  quotes: [],
  invoices: [invoices[0]],
  quoteResourceState: 'ready',
  invoiceResourceState: 'error',
});
assert.equal(invoiceStale.invoiceStale, true, 'Invoice error with retained rows is explicitly stale');
assert.deepEqual(invoiceStale.invoices.map((invoice) => invoice.id), ['i-old'], 'retained Invoice rows remain visible');

const invalidUpdatedAt = { id: 'q-invalid-updated', client_id: 'client-a', updated_at: 'not-a-date', created_at: '2026-08-09T10:00:00Z' };
const invalidBothTimestamps = { id: 'q-invalid-both', client_id: 'client-a', updated_at: 'not-a-date', created_at: 'also-not-a-date' };
assert.deepEqual(
  getClientDocumentContinuity({ client, quotes: [invalidUpdatedAt, invalidBothTimestamps] }).quotes.map((quote) => quote.id),
  ['q-invalid-updated', 'q-invalid-both'],
  'valid created_at remains sortable when updated_at is invalid',
);
assert.deepEqual({ client, quotes, invoices }, sourceSnapshot, 'grouping never mutates source data');

await runRealLoadingLifecycleChecks();

const helperSource = readFileSync(new URL('../src/components/dashboard/clientDocumentContinuity.mjs', import.meta.url), 'utf8');
const studioSource = readFileSync(new URL('../src/app/dashboard/components/StudioSpace.js', import.meta.url), 'utf8');
const dashboardSource = readFileSync(new URL('../src/components/dashboard/Dashboard.js', import.meta.url), 'utf8');
assert.doesNotMatch(helperSource, /\.(?:insert|update|upsert|delete)\s*\(/, 'grouping helper has no document relationship mutation path');
assert.doesNotMatch(helperSource, /\bfetch\s*\(/, 'grouping helper does not add a fetch path');
assert.doesNotMatch(helperSource, /\b(?:Job|Project|Shoot|Booking|Engagement)\b/, 'grouping helper does not infer Job or Project continuity');
assert.match(studioSource, /getClientDocumentContinuity/, 'selected Client surface uses the canonical continuity helper');
assert.doesNotMatch(studioSource, /invoices\.filter\(inv => inv\.client_name ===/, 'Invoice grouping has no client_name fallback');
assert.doesNotMatch(studioSource, /quotes\.filter\(q => q\.client_name ===/, 'Quote grouping has no client_name fallback');
assert.match(studioSource, />Documents<|>Documents&(?:amp;)?lt;?\/?/, 'selected Client surface exposes a Documents section');
assert.match(studioSource, /clientDocuments\.quoteEmptyMessage/, 'selected Client surface uses the truthful Quote empty state');
assert.match(studioSource, /clientDocuments\.invoiceEmptyMessage/, 'selected Client surface uses the truthful Invoice empty state');
assert.match(studioSource, /clientDocuments\.quoteUnavailable/, 'selected Client surface has a resource-specific Quote unavailable state');
assert.match(studioSource, /clientDocuments\.invoiceUnavailable/, 'selected Client surface has a resource-specific Invoice unavailable state');
assert.match(studioSource, /clientDocuments\.quoteStale/, 'selected Client surface discloses retained Quote data as stale');
assert.match(studioSource, /clientDocuments\.invoiceStale/, 'selected Client surface discloses retained Invoice data as stale');
assert.match(studioSource, /quoteResourceState: isQuoteDataLoading \? 'loading'/, 'Studio maps Quote loading independently');
assert.match(studioSource, /invoiceResourceState: isInvoiceDataLoading \? 'loading'/, 'Studio maps Invoice loading independently');
assert.match(dashboardSource, /isQuoteDataLoading=\{isQuotesLoading\}/, 'Dashboard passes Quote loading independently');
assert.match(dashboardSource, /isInvoiceDataLoading=\{isInvoicesLoading\}/, 'Dashboard passes Invoice loading independently');
assert.doesNotMatch(dashboardSource, /isDocumentDataLoading=\{isRefreshing \|\| isQuotesLoading\}/, 'Dashboard does not share one loading blanket across documents');
assert.match(hookSource, /onInvoicesSettled/, 'resource loader exposes an Invoice settle callback');
assert.match(studioSource, /getEffectiveDocumentTimestamp/, 'selected Client surface validates timestamps before rendering dates');
assert.doesNotMatch(studioSource, /new Date\(quote\.updated_at \|\| quote\.created_at\)/, 'Quote rendering does not expose invalid updated_at as a date');
assert.doesNotMatch(studioSource, /new Date\(invoice\.updated_at \|\| invoice\.created_at\)/, 'Invoice rendering does not expose invalid updated_at as a date');
assert.match(studioSource, /more quotes|more invoices/, 'selected Client surface discloses overflow counts');
assert.doesNotMatch(studioSource, /onClick=\{\(.*(?:link|unlink).*\)\s*=>/, 'continuity surface does not add link or unlink actions');

console.log('CORVIOZ_CLIENT_ID_DOCUMENT_CONTINUITY_R46_TEST=PASS');
