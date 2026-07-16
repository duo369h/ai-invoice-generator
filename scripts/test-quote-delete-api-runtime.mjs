import assert from 'node:assert/strict';
import { register } from 'node:module';
import {
  configureRouteRuntime,
  getRouteRuntimeAuditLogs,
  getRouteRuntimeCalls,
} from './test-support/route-runtime-mocks.mjs';

register('./test-support/route-runtime-loader.mjs', import.meta.url);
const quoteRoute = await import('../src/app/api/quotes/route.js');
const user = { id: 'user-1', email: 'owner@example.com' };
const context = () => ({ mode: 'supabase', user });
const requestIp = '203.0.113.7';
const request = (id) => new Request(
  id === undefined ? 'http://localhost/api/quotes' : `http://localhost/api/quotes?id=${id}`,
  { method: 'DELETE', headers: { 'x-forwarded-for': requestIp } },
);
const hasCall = (prefix) => getRouteRuntimeCalls().some((entry) => entry.startsWith(prefix));

assert.equal(typeof quoteRoute.DELETE, 'function', 'Quote route exports a DELETE handler');

configureRouteRuntime({
  operation: 'delete',
  context: context(),
  quoteRecords: [{ id: 'quote-1', user_id: user.id }],
});
let response = await quoteRoute.DELETE(request('quote-1'));
assert.equal(response.status, 200, 'an authenticated owner can delete a Quote');
assert.deepEqual(await response.json(), { success: true, id: 'quote-1' }, 'success returns the deleted Quote id');
assert.deepEqual(getRouteRuntimeCalls(), [
  'rate-limit:invoiceApi:user-1',
  'delete:request:quotes',
  'eq:quotes:id:quote-1',
  'eq:quotes:user_id:user-1',
  'select:quotes:id',
  'maybeSingle:quotes',
  'audit:quote_deleted',
], 'deletion uses the request-client owner-scoped query chain before auditing');
assert.equal(hasCall('single:'), false, 'successful deletion never uses single()');
assert.deepEqual(getRouteRuntimeAuditLogs(), [{
  userId: user.id,
  action: 'quote_deleted',
  resourceType: 'quote',
  resourceId: 'quote-1',
  ip: requestIp,
}], 'successful deletion writes the complete audit entry');

configureRouteRuntime({ operation: 'delete', context: context(), quoteRecords: [] });
response = await quoteRoute.DELETE(request());
assert.equal(response.status, 400, 'a missing Quote id is rejected');
assert.deepEqual(await response.json(), { error: 'Quote ID is required' });
assert.equal(hasCall('delete:'), false, 'missing id never calls delete');
assert.deepEqual(getRouteRuntimeAuditLogs(), [], 'missing id is not audited');

configureRouteRuntime({ operation: 'delete', context: { mode: 'unauthenticated' } });
response = await quoteRoute.DELETE(request('quote-1'));
assert.equal(response.status, 401, 'an unauthenticated delete is rejected before user access');
assert.equal(hasCall('rate-limit:'), false, 'unauthenticated requests never access context.user.id for rate limiting');
assert.equal(hasCall('delete:'), false, 'unauthenticated requests never call delete');
assert.deepEqual(getRouteRuntimeAuditLogs(), [], 'unauthenticated requests are not audited');

configureRouteRuntime({
  operation: 'delete',
  context: context(),
  quoteRecords: [{ id: 'quote-existing', user_id: user.id }],
});
response = await quoteRoute.DELETE(request('quote-missing'));
assert.equal(response.status, 404, 'an ID absent from the simulated database returns 404');
assert.deepEqual(await response.json(), { error: 'Quote not found' });
assert.deepEqual(getRouteRuntimeAuditLogs(), [], 'a missing Quote is not audited');

configureRouteRuntime({
  operation: 'delete',
  context: context(),
  quoteRecords: [{ id: 'quote-other-owner', user_id: 'user-2' }],
});
response = await quoteRoute.DELETE(request('quote-other-owner'));
assert.equal(response.status, 404, 'an existing Quote owned by another user returns 404');
assert.deepEqual(await response.json(), { error: 'Quote not found' });
assert.ok(hasCall('eq:quotes:user_id:user-1'), 'the non-owner query applies the authenticated user filter');
assert.deepEqual(getRouteRuntimeAuditLogs(), [], 'a non-owner Quote is not audited');

configureRouteRuntime({
  operation: 'delete',
  context: context(),
  quoteRecords: [{ id: 'quote-1', user_id: user.id }],
  quoteDeleteError: { code: 'XX000', message: 'database unavailable' },
});
response = await quoteRoute.DELETE(request('quote-1'));
assert.equal(response.status, 500, 'ordinary database deletion errors return 500');
assert.deepEqual(await response.json(), { error: 'Failed to delete quote' });
assert.deepEqual(getRouteRuntimeAuditLogs(), [], 'database deletion errors are not audited as successful');

configureRouteRuntime({
  operation: 'delete',
  context: context(),
  quoteRecords: [{ id: 'quote-restricted', user_id: user.id }],
  quoteDeleteError: {
    code: '23503',
    message: 'update or delete on table quotes violates foreign key constraint',
  },
});
response = await quoteRoute.DELETE(request('quote-restricted'));
assert.equal(response.status, 409, 'a first-revenue foreign-key restriction returns a stable conflict');
assert.deepEqual(await response.json(), {
  error: 'This quote is linked to a revenue workflow and cannot be deleted.',
});
assert.deepEqual(getRouteRuntimeAuditLogs(), [], 'a restricted Quote is not audited');
assert.equal(getRouteRuntimeCalls().filter((entry) => entry === 'delete:request:quotes').length, 1, 'a restricted deletion is never retried');

configureRouteRuntime({
  operation: 'delete',
  context: context(),
  quoteRecords: [{ id: 'quote-1', user_id: user.id }],
  rateLimitResult: { success: false, status: 429, error: 'Too many requests' },
});
response = await quoteRoute.DELETE(request('quote-1'));
assert.equal(response.status, 429, 'rate-limited deletion returns 429');
assert.deepEqual(await response.json(), { error: 'Too many requests' });
assert.equal(hasCall('delete:'), false, 'rate-limited deletion never reaches the database');
assert.deepEqual(getRouteRuntimeAuditLogs(), [], 'rate-limited deletion is not audited');

configureRouteRuntime({
  operation: 'delete',
  context: context(),
  quoteRecords: [{ id: 'quote-audit-failure', user_id: user.id }],
  auditLogThrows: true,
});
const originalConsoleError = console.error;
const expectedErrors = [];
console.error = (...args) => expectedErrors.push(args);
try {
  response = await quoteRoute.DELETE(request('quote-audit-failure'));
} finally {
  console.error = originalConsoleError;
}
assert.equal(response.status, 200, 'audit exceptions do not change a completed deletion into a failure');
assert.deepEqual(await response.json(), { success: true, id: 'quote-audit-failure' });
assert.equal(getRouteRuntimeCalls().filter((entry) => entry === 'delete:request:quotes').length, 1, 'audit failure never retries deletion');
assert.equal(expectedErrors.length, 1, 'the expected audit exception is logged once');
assert.equal(expectedErrors[0][0], 'Failed to write quote deletion audit log:');

console.log('Quote DELETE API runtime tests passed.');
