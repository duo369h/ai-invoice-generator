import assert from 'node:assert/strict';
import { register } from 'node:module';
import {
  configureRouteRuntime,
  getRouteRuntimeAuditLogs,
  getRouteRuntimeCalls,
} from './test-support/route-runtime-mocks.mjs';

register('./test-support/route-runtime-loader.mjs', import.meta.url);
const invoiceRoute = await import('../src/app/api/invoices/route.js');
const user = { id: 'user-1', email: 'owner@example.com' };
const context = () => ({ mode: 'supabase', user });
const requestIp = '203.0.113.7';
const request = (id) => new Request(
  id === undefined ? 'http://localhost/api/invoices' : `http://localhost/api/invoices?id=${id}`,
  { method: 'DELETE', headers: { 'x-forwarded-for': requestIp } },
);
const hasCall = (prefix) => getRouteRuntimeCalls().some((entry) => entry.startsWith(prefix));

assert.equal(typeof invoiceRoute.DELETE, 'function', 'Invoice route exports a DELETE handler');

configureRouteRuntime({
  operation: 'delete',
  context: context(),
  invoiceRecords: [{ id: 'invoice-1', user_id: user.id }],
});
let response = await invoiceRoute.DELETE(request('invoice-1'));
assert.equal(response.status, 200, 'an authenticated owner can delete an Invoice');
assert.deepEqual(await response.json(), { success: true, id: 'invoice-1' }, 'success returns the deleted Invoice id');
assert.deepEqual(getRouteRuntimeCalls(), [
  'rate-limit:invoiceApi:user-1',
  'delete:request:invoices',
  'eq:invoices:id:invoice-1',
  'eq:invoices:user_id:user-1',
  'select:invoices:id',
  'maybeSingle:invoices',
  'audit:invoice_deleted',
], 'deletion uses the exact request-client query chain before auditing');
assert.equal(hasCall('single:'), false, 'successful deletion never uses single()');
assert.deepEqual(getRouteRuntimeAuditLogs(), [{
  userId: user.id,
  action: 'invoice_deleted',
  resourceType: 'invoice',
  resourceId: 'invoice-1',
  ip: requestIp,
}], 'successful deletion writes the complete audit entry');

configureRouteRuntime({ operation: 'delete', context: context(), invoiceRecords: [] });
response = await invoiceRoute.DELETE(request());
assert.equal(response.status, 400, 'a missing Invoice id is rejected');
assert.deepEqual(await response.json(), { error: 'Invoice ID is required' });
assert.equal(hasCall('delete:'), false, 'missing id never calls delete');
assert.deepEqual(getRouteRuntimeAuditLogs(), [], 'missing id is not audited');

configureRouteRuntime({ operation: 'delete', context: { mode: 'unauthenticated' } });
response = await invoiceRoute.DELETE(request('invoice-1'));
assert.equal(response.status, 401, 'an unauthenticated delete is rejected before user access');
assert.equal(hasCall('rate-limit:'), false, 'unauthenticated requests never access context.user.id for rate limiting');
assert.equal(hasCall('delete:'), false, 'unauthenticated requests never call delete');
assert.deepEqual(getRouteRuntimeAuditLogs(), [], 'unauthenticated requests are not audited');

configureRouteRuntime({
  operation: 'delete',
  context: context(),
  invoiceRecords: [{ id: 'invoice-existing', user_id: user.id }],
});
response = await invoiceRoute.DELETE(request('invoice-missing'));
assert.equal(response.status, 404, 'an ID absent from the simulated database returns 404');
assert.deepEqual(await response.json(), { error: 'Invoice not found' });
assert.deepEqual(getRouteRuntimeAuditLogs(), [], 'a missing Invoice is not audited');

configureRouteRuntime({
  operation: 'delete',
  context: context(),
  invoiceRecords: [{ id: 'invoice-other-owner', user_id: 'user-2' }],
});
response = await invoiceRoute.DELETE(request('invoice-other-owner'));
assert.equal(response.status, 404, 'an existing Invoice owned by another user returns 404');
assert.deepEqual(await response.json(), { error: 'Invoice not found' });
assert.ok(hasCall('eq:invoices:user_id:user-1'), 'the non-owner query applies the authenticated user filter');
assert.deepEqual(getRouteRuntimeAuditLogs(), [], 'a non-owner Invoice is not audited');

configureRouteRuntime({
  operation: 'delete',
  context: context(),
  invoiceRecords: [{ id: 'invoice-1', user_id: user.id }],
  deleteError: { message: 'database unavailable' },
});
response = await invoiceRoute.DELETE(request('invoice-1'));
assert.equal(response.status, 500, 'database deletion errors return 500');
assert.deepEqual(await response.json(), { error: 'Failed to delete invoice' });
assert.deepEqual(getRouteRuntimeAuditLogs(), [], 'database deletion errors are not audited as successful');

configureRouteRuntime({
  operation: 'delete',
  context: context(),
  invoiceRecords: [{ id: 'invoice-1', user_id: user.id }],
  rateLimitResult: { success: false, status: 429, error: 'Too many requests' },
});
response = await invoiceRoute.DELETE(request('invoice-1'));
assert.equal(response.status, 429, 'rate-limited deletion returns 429');
assert.deepEqual(await response.json(), { error: 'Too many requests' });
assert.equal(hasCall('delete:'), false, 'rate-limited deletion never reaches the database');
assert.deepEqual(getRouteRuntimeAuditLogs(), [], 'rate-limited deletion is not audited');

configureRouteRuntime({
  operation: 'delete',
  context: context(),
  invoiceRecords: [{ id: 'invoice-audit-failure', user_id: user.id }],
  auditLogThrows: true,
});
const originalConsoleError = console.error;
const expectedErrors = [];
console.error = (...args) => expectedErrors.push(args);
try {
  response = await invoiceRoute.DELETE(request('invoice-audit-failure'));
} finally {
  console.error = originalConsoleError;
}
assert.equal(response.status, 200, 'audit exceptions do not change a completed deletion into a failure');
assert.deepEqual(await response.json(), { success: true, id: 'invoice-audit-failure' });
assert.equal(getRouteRuntimeCalls().filter((entry) => entry === 'delete:request:invoices').length, 1, 'audit failure never retries deletion');
assert.equal(expectedErrors.length, 1, 'the expected audit exception is logged once');
assert.equal(expectedErrors[0][0], 'Failed to write invoice deletion audit log:');

console.log('Invoice DELETE API runtime tests passed.');
