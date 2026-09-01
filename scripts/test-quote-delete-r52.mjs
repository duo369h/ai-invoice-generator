import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { register } from 'node:module';

import {
  configureRouteRuntime,
  getRouteRuntimeAuditLogs,
  getRouteRuntimeCalls,
  getRouteRuntimeUpdates,
} from './test-support/route-runtime-mocks.mjs';

register('./test-support/route-runtime-loader.mjs', import.meta.url);
const quoteRoute = await import('../src/app/api/quotes/route.js');

const owner = { id: 'user-a', email: 'owner@example.com' };
const otherOwner = { id: 'user-b', email: 'other@example.com' };
const requestIp = '203.0.113.7';
const request = (id) => new Request(
  id === undefined ? 'http://localhost/api/quotes' : `http://localhost/api/quotes?id=${encodeURIComponent(id)}`,
  { method: 'DELETE', headers: { 'x-forwarded-for': requestIp } },
);
const quote = (id, status, userId = owner.id) => ({ id, status, user_id: userId });

assert.equal(typeof quoteRoute.DELETE, 'function', 'Quote route exports the R52 DELETE handler');

async function deleteQuote({ id, quoteRecords = [], ...config } = {}) {
  configureRouteRuntime({
    operation: 'delete',
    context: { mode: 'supabase', user: owner },
    quoteRecords,
    ...config,
  });
  const response = await quoteRoute.DELETE(request(id));
  return { response, body: await response.json(), quoteRecords };
}

{
  const auditQuote = quote('quote-draft', 'draft');
  const portalTokenRecords = [{
    id: 'token-1',
    owner_id: owner.id,
    resource_type: 'quote',
    resource_id: auditQuote.id,
    revoked_at: null,
  }];
  const { response, body, quoteRecords } = await deleteQuote({
    id: auditQuote.id,
    quoteRecords: [auditQuote],
    portalTokenRecords,
  });
  assert.equal(response.status, 200, 'an owner can delete an owned draft Quote');
  assert.deepEqual(body, { success: true, id: auditQuote.id });
  assert.deepEqual(quoteRecords, [], 'the owned draft Quote is removed');
  assert.deepEqual(getRouteRuntimeAuditLogs(), [{
    userId: owner.id,
    action: 'quote_deleted',
    resourceType: 'quote',
    resourceId: auditQuote.id,
    ip: requestIp,
  }], 'successful deletion writes the current audit authority');
  assert.equal(typeof portalTokenRecords[0].revoked_at, 'string', 'active Quote portal access is revoked');
  assert.ok(getRouteRuntimeCalls().includes('delete:service:quotes'), 'the destructive query uses the service-role client');
  assert.ok(!getRouteRuntimeCalls().includes('delete:request:quotes'), 'the request client is not used for deletion');
  assert.deepEqual(getRouteRuntimeUpdates(), [{
    kind: 'service',
    table: 'portal_tokens',
    values: { revoked_at: portalTokenRecords[0].revoked_at },
    filters: {
      owner_id: owner.id,
      resource_type: 'quote',
      resource_id: auditQuote.id,
      revoked_at: null,
    },
  }], 'token cleanup is owner/resource scoped and only targets active tokens');
  assert.ok(!getRouteRuntimeCalls().some((call) => call.startsWith('quota:')), 'deletion does not refund or decrement quota');
}

{
  const sentQuote = quote('quote-sent', 'sent');
  const { response, body, quoteRecords } = await deleteQuote({ id: sentQuote.id, quoteRecords: [sentQuote] });
  assert.equal(response.status, 200, 'an owner can delete an owned sent Quote');
  assert.deepEqual(body, { success: true, id: sentQuote.id });
  assert.deepEqual(quoteRecords, []);
}

{
  const { response, body } = await deleteQuote({ id: undefined });
  assert.equal(response.status, 400, 'a missing Quote id is rejected');
  assert.deepEqual(body, { error: 'Quote ID is required' });
  assert.ok(!getRouteRuntimeCalls().some((call) => call.startsWith('delete:')), 'missing id never reaches deletion');
}

{
  const { response, body } = await deleteQuote({ id: 'quote-missing', quoteRecords: [quote('quote-existing', 'draft')] });
  assert.equal(response.status, 404, 'an unknown Quote id returns not found');
  assert.equal(body.code, 'QUOTE_NOT_FOUND');
}

{
  const crossAccountQuote = quote('quote-cross-account', 'draft', otherOwner.id);
  const { response, body, quoteRecords } = await deleteQuote({ id: crossAccountQuote.id, quoteRecords: [crossAccountQuote] });
  assert.equal(response.status, 404, 'a cross-account Quote id behaves as not found');
  assert.equal(body.code, 'QUOTE_NOT_FOUND');
  assert.deepEqual(quoteRecords, [crossAccountQuote], 'a cross-account Quote remains unchanged');
}

for (const status of ['approved', 'declined', 'converted']) {
  const terminalQuote = quote(`quote-${status}`, status);
  const { response, body, quoteRecords } = await deleteQuote({ id: terminalQuote.id, quoteRecords: [terminalQuote] });
  assert.equal(response.status, 409, `${status} Quote deletion is blocked`);
  assert.equal(body.code, 'QUOTE_DELETE_STATE_CONFLICT');
  assert.deepEqual(quoteRecords, [terminalQuote], `${status} Quote remains unchanged`);
}

{
  const linkedQuote = quote('quote-first-revenue', 'draft');
  const firstRevenueLoopRecords = [{ user_id: owner.id, quote_id: linkedQuote.id, invoice_id: null }];
  const { response, body, quoteRecords } = await deleteQuote({
    id: linkedQuote.id,
    quoteRecords: [linkedQuote],
    firstRevenueLoopRecords,
  });
  assert.equal(response.status, 409, 'a first-revenue-linked Quote cannot be deleted');
  assert.equal(body.code, 'QUOTE_DELETE_WORKFLOW_LINKED');
  assert.deepEqual(quoteRecords, [linkedQuote]);
  assert.deepEqual(firstRevenueLoopRecords, [{ user_id: owner.id, quote_id: linkedQuote.id, invoice_id: null }], 'first revenue state remains unchanged');
}

{
  const linkedQuote = quote('quote-invoice-linked', 'sent');
  const linkedInvoice = { id: 'invoice-1', user_id: owner.id, quote_id: linkedQuote.id };
  const { response, body, quoteRecords } = await deleteQuote({
    id: linkedQuote.id,
    quoteRecords: [linkedQuote],
    invoiceRecords: [linkedInvoice],
  });
  assert.equal(response.status, 409, 'an Invoice-linked Quote cannot be deleted');
  assert.equal(body.code, 'QUOTE_DELETE_INVOICE_LINKED');
  assert.deepEqual(quoteRecords, [linkedQuote]);
  assert.deepEqual(linkedInvoice, { id: 'invoice-1', user_id: owner.id, quote_id: linkedQuote.id }, 'the Invoice relation remains unchanged');
}

{
  const staleQuote = quote('quote-concurrent', 'draft');
  const { response, body, quoteRecords } = await deleteQuote({
    id: staleQuote.id,
    quoteRecords: [staleQuote],
    concurrentQuoteStatusChange: 'approved',
  });
  assert.equal(response.status, 409, 'a concurrent terminal status change blocks stale deletion');
  assert.equal(body.code, 'QUOTE_DELETE_STATE_CONFLICT');
  assert.deepEqual(quoteRecords, [quote(staleQuote.id, 'approved')], 'the concurrently approved Quote remains');
}

{
  const cleanupQuote = quote('quote-token-cleanup', 'draft');
  const portalTokenRecords = [{
    id: 'token-2',
    owner_id: owner.id,
    resource_type: 'quote',
    resource_id: cleanupQuote.id,
    revoked_at: null,
  }];
  const originalConsoleError = console.error;
  const errors = [];
  console.error = (...args) => errors.push(args);
  try {
    const { response, body, quoteRecords } = await deleteQuote({
      id: cleanupQuote.id,
      quoteRecords: [cleanupQuote],
      portalTokenRecords,
      portalTokenRevokeError: { code: 'XX000', message: 'token service unavailable' },
    });
    assert.equal(response.status, 200, 'token cleanup failure does not report a deleted Quote as present');
    assert.deepEqual(body, { success: true, id: cleanupQuote.id });
    assert.deepEqual(quoteRecords, [], 'the Quote remains deleted after cleanup failure');
  } finally {
    console.error = originalConsoleError;
  }
  assert.equal(errors.length, 1, 'token cleanup failure is logged safely');
  assert.match(String(errors[0][0]), /portal token cleanup/i);
  assert.doesNotMatch(JSON.stringify({ success: true, id: cleanupQuote.id }), /token-value|token_hash/i, 'no portal token value is exposed');
}

{
  const dashboardSource = await readFile(new URL('../src/components/dashboard/Dashboard.js', import.meta.url), 'utf8');
  const hookSource = await readFile(new URL('../src/hooks/useDashboardData.js', import.meta.url), 'utf8');
  const quoteListStart = dashboardSource.indexOf("getActiveQuotes().map((q) => (");
  assert.notEqual(quoteListStart, -1, 'Dashboard Quote list remains present');
  const quoteList = dashboardSource.slice(quoteListStart, quoteListStart + 7000);
  assert.match(quoteList, /q\.status === 'draft' \|\| q\.status === 'sent'/, 'Delete is rendered only for owner-mutable Quote states');
  assert.match(quoteList, /q\.id !== firstRevenueLoop\?\.quote_id/, 'first-revenue-linked Quote hides Delete when known');
  assert.match(hookSource, /`\/api\/quotes\?id=\$\{encodeURIComponent\(id\)\}`/, 'client deletion remains canonical-id based');
  assert.match(hookSource, /method: 'DELETE'/, 'client deletion uses the existing DELETE endpoint');
}

console.log('Quote DELETE R52 dedicated test passed.');
