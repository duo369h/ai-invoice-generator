import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const hookSource = await readFile(new URL('../src/hooks/useDashboardData.js', import.meta.url), 'utf8');
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

function extractAsyncArrow(source, marker) {
  const start = source.indexOf(marker);
  assert.notEqual(start, -1, `missing function marker: ${marker}`);
  const asyncStart = source.indexOf('async', start);
  const open = source.indexOf('{', asyncStart);
  const close = matchingBrace(source, open);
  return source.slice(asyncStart, close + 1);
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

const getAuthHeadersHook = extractUseCallbackArrow(hookSource, 'const getAuthHeaders = useCallback(');
const deleteQuoteHook = extractAsyncArrow(hookSource, 'const deleteQuote = useCallback(');
const handleDeleteQuote = extractAsyncArrow(dashboardSource, 'const handleDeleteQuote =');

async function runHook({
  ok,
  body = {},
  jsonError = null,
  id = 'quote-1',
  token = 'access-token',
  isDemo = false,
  isPreview = false,
}) {
  const requests = [];
  const refreshes = [];
  const deletedIds = [];
  const factory = new Function('dependencies', `
    const { fetch, fetchData, setQuotes } = dependencies;
    const isPreview = ${isPreview};
    const isDemo = ${isDemo};
    const getAuthHeaders = (${getAuthHeadersHook});
    return (${deleteQuoteHook});
  `);
  const deleteQuote = factory({
    fetch: async (url, init) => {
      requests.push({ url, init });
      return {
        ok,
        json: async () => {
          if (jsonError) throw jsonError;
          return body;
        },
      };
    },
    fetchData: async (refreshToken) => refreshes.push(refreshToken),
    setQuotes: (update) => {
      const next = update([{ id: id }, { id: 'keep' }]);
      deletedIds.push(...next.map((quote) => quote.id));
    },
  });
  const result = await deleteQuote(id, token);
  return { result, requests, refreshes, deletedIds };
}

{
  const id = 'quote/id with spaces & symbols';
  const { result, requests, refreshes } = await runHook({ ok: true, id });
  assert.deepEqual(result, { success: true });
  assert.equal(requests[0].url, `/api/quotes?id=${encodeURIComponent(id)}`, 'Quote id is safely URL encoded');
  assert.equal(requests[0].init.method, 'DELETE', 'Quote deletion uses DELETE');
  assert.equal(requests[0].init.headers.Authorization, 'Bearer access-token', 'the production getAuthHeaders helper forwards the Bearer token');
  assert.deepEqual(refreshes, ['access-token'], 'a successful deletion refreshes dashboard data');
}

{
  const { result, refreshes } = await runHook({ ok: false, body: { error: 'Quote not found' } });
  assert.deepEqual(result, { success: false, error: 'Quote not found' }, '404 API error text is returned to the UI');
  assert.deepEqual(refreshes, [], 'a failed deletion does not refresh dashboard data');
}

{
  const { result, refreshes } = await runHook({
    ok: false,
    body: { error: 'This quote is linked to a revenue workflow and cannot be deleted.' },
  });
  assert.deepEqual(result, {
    success: false,
    error: 'This quote is linked to a revenue workflow and cannot be deleted.',
  }, '409 API error text is returned to the UI');
  assert.deepEqual(refreshes, [], 'a restricted deletion does not refresh dashboard data');
}

{
  const { result, refreshes } = await runHook({ ok: false, jsonError: new SyntaxError('Unexpected token') });
  assert.deepEqual(result, { success: false, error: 'Failed to delete quote' }, 'non-JSON failures use the stable fallback');
  assert.deepEqual(refreshes, [], 'a non-JSON failure does not refresh dashboard data');
}

{
  const { result, requests, refreshes, deletedIds } = await runHook({ ok: false, isDemo: true });
  assert.deepEqual(result, { success: true }, 'Demo deletion remains local and succeeds');
  assert.deepEqual(requests, [], 'Demo deletion does not call the API');
  assert.deepEqual(refreshes, [], 'Demo deletion does not refetch live data');
  assert.deepEqual(deletedIds, ['keep'], 'Demo deletion removes only the selected Quote');
}

{
  const { result, requests, refreshes } = await runHook({ ok: false, isPreview: true });
  assert.deepEqual(result, { success: true }, 'Preview deletion remains a no-op success');
  assert.deepEqual(requests, [], 'Preview deletion does not call the API');
  assert.deepEqual(refreshes, [], 'Preview deletion does not refetch live data');
}

async function runDashboard({ confirmed, deleteResult }) {
  const deletes = [];
  const toasts = [];
  const factory = new Function('dependencies', `
    const { confirm, deleteQuote, triggerToast } = dependencies;
    const session = { access_token: 'access-token' };
    const isDemo = false;
    return (${handleDeleteQuote});
  `);
  const handler = factory({
    confirm: () => confirmed,
    deleteQuote: async (id, token) => {
      deletes.push({ id, token });
      return deleteResult;
    },
    triggerToast: (message, type) => toasts.push({ message, type }),
  });
  await handler('quote-1');
  return { deletes, toasts };
}

{
  const { deletes, toasts } = await runDashboard({ confirmed: false, deleteResult: { success: true } });
  assert.deepEqual(deletes, [], 'cancelling confirmation skips Quote deletion');
  assert.deepEqual(toasts, [], 'cancelling confirmation shows no toast');
}

{
  const { deletes, toasts } = await runDashboard({ confirmed: true, deleteResult: { success: true } });
  assert.deepEqual(deletes, [{ id: 'quote-1', token: 'access-token' }]);
  assert.deepEqual(toasts, [{ message: 'Quote deleted successfully.', type: 'info' }], 'successful deletion shows a success toast');
}

{
  const { toasts } = await runDashboard({ confirmed: true, deleteResult: { success: false, error: 'Quote not found' } });
  assert.deepEqual(toasts, [{ message: 'Quote not found', type: 'error' }], '404 deletion failure shows the API error toast');
}

{
  const { toasts } = await runDashboard({
    confirmed: true,
    deleteResult: { success: false, error: 'This quote is linked to a revenue workflow and cannot be deleted.' },
  });
  assert.deepEqual(toasts, [{
    message: 'This quote is linked to a revenue workflow and cannot be deleted.',
    type: 'error',
  }], '409 deletion failure shows the API error toast');
}

console.log('Quote DELETE Dashboard runtime tests passed.');
