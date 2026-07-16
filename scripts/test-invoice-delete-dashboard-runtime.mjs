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
const deleteInvoiceHook = extractAsyncArrow(hookSource, 'const deleteInvoice = useCallback(');
const handleDeleteInvoice = extractAsyncArrow(dashboardSource, 'const handleDeleteInvoice =');

async function runHook({ ok, body = {}, jsonError = null, id = 'invoice-1', token = 'access-token' }) {
  const requests = [];
  const refreshes = [];
  const factory = new Function('dependencies', `
    const { fetch, fetchData } = dependencies;
    const isPreview = false;
    const isDemo = false;
    const setInvoices = () => {};
    const getAuthHeaders = (${getAuthHeadersHook});
    return (${deleteInvoiceHook});
  `);
  const deleteInvoice = factory({
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
  });
  const result = await deleteInvoice(id, token);
  return { result, requests, refreshes };
}

{
  const id = 'invoice/id with spaces';
  const { result, requests, refreshes } = await runHook({ ok: true, id });
  assert.deepEqual(result, { success: true });
  assert.equal(requests[0].url, `/api/invoices?id=${encodeURIComponent(id)}`, 'Invoice id is safely URL encoded');
  assert.equal(requests[0].init.method, 'DELETE', 'Invoice deletion uses DELETE');
  assert.equal(requests[0].init.headers.Authorization, 'Bearer access-token', 'the production getAuthHeaders helper forwards the Bearer token');
  assert.deepEqual(refreshes, ['access-token'], 'a successful deletion refreshes dashboard data');
}

{
  const { result, refreshes } = await runHook({ ok: false, body: { error: 'Invoice not found' } });
  assert.deepEqual(result, { success: false, error: 'Invoice not found' }, 'API error text is returned to the UI');
  assert.deepEqual(refreshes, [], 'a failed deletion does not refresh dashboard data');
}

{
  const { result, refreshes } = await runHook({ ok: false, jsonError: new SyntaxError('Unexpected token') });
  assert.deepEqual(result, { success: false, error: 'Failed to delete invoice' }, 'non-JSON failures use the stable fallback');
  assert.deepEqual(refreshes, [], 'a non-JSON failure does not refresh dashboard data');
}

async function runDashboard({ confirmed, deleteResult }) {
  const deletes = [];
  const toasts = [];
  const factory = new Function('dependencies', `
    const { confirm, deleteInvoice, triggerToast } = dependencies;
    const session = { access_token: 'access-token' };
    const isDemo = false;
    return (${handleDeleteInvoice});
  `);
  const handler = factory({
    confirm: () => confirmed,
    deleteInvoice: async (id, token) => {
      deletes.push({ id, token });
      return deleteResult;
    },
    triggerToast: (message, type) => toasts.push({ message, type }),
  });
  await handler('invoice-1');
  return { deletes, toasts };
}

{
  const { deletes, toasts } = await runDashboard({ confirmed: false, deleteResult: { success: true } });
  assert.deepEqual(deletes, [], 'cancelling confirmation skips Invoice deletion');
  assert.deepEqual(toasts, [], 'cancelling confirmation shows no toast');
}

{
  const { deletes, toasts } = await runDashboard({ confirmed: true, deleteResult: { success: true } });
  assert.deepEqual(deletes, [{ id: 'invoice-1', token: 'access-token' }]);
  assert.deepEqual(toasts, [{ message: 'Invoice deleted successfully.', type: 'info' }], 'successful deletion shows a success toast');
}

{
  const { toasts } = await runDashboard({ confirmed: true, deleteResult: { success: false, error: 'Invoice not found' } });
  assert.deepEqual(toasts, [{ message: 'Invoice not found', type: 'error' }], 'failed deletion shows the API error toast');
}

console.log('Invoice DELETE Dashboard runtime tests passed.');
