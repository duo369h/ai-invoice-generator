import assert from 'node:assert/strict';
import { register } from 'node:module';
import {
  configureRouteRuntime,
  getRouteRuntimeCalls,
  getRouteRuntimeUpdates,
} from './test-support/route-runtime-mocks.mjs';

register('./test-support/route-runtime-loader.mjs', import.meta.url);
const invoiceRoute = await import('../src/app/api/invoices/route.js');

const user = { id: 'user-1', email: 'owner@example.com' };
const context = () => ({ mode: 'supabase', user });
const baseInvoice = {
  id: 'invoice-1',
  user_id: user.id,
  status: 'pending',
  payment_status: 'unpaid',
  total: 100000,
  amount_paid_cents: 0,
  amount_due_cents: 100000,
  due_date: '2026-12-31',
};

let passed = 0;
let failed = 0;
const failures = [];

function check(label, condition) {
  if (condition) {
    passed += 1;
    console.log(`PASS: ${label}`);
  } else {
    failed += 1;
    failures.push(label);
    console.error(`FAIL: ${label}`);
  }
}

function patchRequest(status, extra = {}) {
  return new Request('http://localhost/api/invoices', {
    method: 'PATCH',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ id: 'invoice-1', status, ...extra }),
  });
}

function deleteRequest(id = 'invoice-1') {
  return new Request(`http://localhost/api/invoices?id=${encodeURIComponent(id)}`, {
    method: 'DELETE',
  });
}

async function runPatch(invoice, status, extra = {}) {
  configureRouteRuntime({
    operation: 'patch',
    logRequestFlow: true,
    logDatabaseCalls: true,
    context: context(),
    invoiceRecords: invoice ? [invoice] : [],
  });
  const response = await invoiceRoute.PATCH(patchRequest(status, extra));
  return { response, body: await response.json(), calls: getRouteRuntimeCalls(), updates: getRouteRuntimeUpdates() };
}

async function runDelete(invoice, id = 'invoice-1') {
  configureRouteRuntime({
    operation: 'delete',
    logRequestFlow: true,
    logDatabaseCalls: true,
    context: context(),
    invoiceRecords: invoice ? [invoice] : [],
  });
  const response = await invoiceRoute.DELETE(deleteRequest(id));
  return { response, body: await response.json(), calls: getRouteRuntimeCalls() };
}

for (const allowedStatus of ['draft', 'pending', 'sent', 'approved']) {
  const result = await runPatch(baseInvoice, allowedStatus);
  check(`unpaid invoice PATCH allows canonical legacy status=${allowedStatus}`, result.response.status === 200);
  check(`status=${allowedStatus} writes only the requested legacy status`, result.updates.length === 1
    && result.updates[0].kind === 'service'
    && result.updates[0].table === 'invoices'
    && JSON.stringify(result.updates[0].values) === JSON.stringify({ status: allowedStatus }));
}

{
  const result = await runDelete(baseInvoice);
  check('unpaid invoice DELETE remains allowed', result.response.status === 200 && result.body.success === true);
  check('unpaid invoice DELETE uses the service-role client', result.calls.includes('delete:service:invoices'));
}

for (const operation of ['patch', 'delete']) {
  configureRouteRuntime({
    operation,
    logRequestFlow: true,
    logDatabaseCalls: true,
    context: context(),
    invoiceRecords: [baseInvoice],
    invoiceWriteRecords: [{
      ...baseInvoice,
      payment_status: 'partial',
      amount_paid_cents: 1,
      amount_due_cents: 99999,
    }],
  });
  const response = operation === 'patch'
    ? await invoiceRoute.PATCH(patchRequest('draft'))
    : await invoiceRoute.DELETE(deleteRequest());
  const body = await response.json();
  check(`${operation.toUpperCase()}: concurrent payment snapshot change returns stable 409`,
    response.status === 409 && body.error === 'SETTLED_INVOICE_WRITE_CONFLICT');
}

for (const [label, invoice] of [
  ['partial payment_status', { ...baseInvoice, payment_status: 'partial', amount_paid_cents: 40000, amount_due_cents: 60000 }],
  ['paid payment_status', { ...baseInvoice, status: 'sent', payment_status: 'paid', amount_paid_cents: 100000, amount_due_cents: 0 }],
  ['positive amount_paid_cents', { ...baseInvoice, payment_status: 'unpaid', amount_paid_cents: 1, amount_due_cents: 99999 }],
  ['legacy paid status', { ...baseInvoice, status: 'paid', payment_status: undefined, amount_paid_cents: undefined, amount_due_cents: undefined }],
]) {
  const patch = await runPatch(invoice, 'draft');
  check(`${label}: PATCH is blocked with a stable 409`, patch.response.status === 409
    && patch.body.error === 'SETTLED_INVOICE_WRITE_CONFLICT');
  check(`${label}: blocked PATCH performs no update`, patch.updates.length === 0);

  const deletion = await runDelete(invoice);
  check(`${label}: DELETE is blocked with a stable 409`, deletion.response.status === 409
    && deletion.body.error === 'SETTLED_INVOICE_WRITE_CONFLICT');
  check(`${label}: blocked DELETE performs no delete`, !deletion.calls.includes('delete:service:invoices'));
}

for (const [label, status] of [
  ['paid', 'paid'],
  ['unknown string', 'not-a-real-status'],
  ['empty string', ''],
  ['non-string', { value: 'sent' }],
]) {
  const result = await runPatch(baseInvoice, status);
  check(`${label} status is rejected with HTTP 400`, result.response.status === 400);
  check(`${label} status never reaches UPDATE`, result.updates.length === 0);
}

for (const operation of ['patch', 'delete']) {
  const otherOwner = { ...baseInvoice, user_id: 'user-2' };
  const missing = operation === 'patch'
    ? await runPatch(null, 'draft')
    : await runDelete(null);
  const nonOwner = operation === 'patch'
    ? await runPatch(otherOwner, 'draft')
    : await runDelete(otherOwner);
  check(`${operation.toUpperCase()}: missing and non-owner are indistinguishable 404 responses`,
    missing.response.status === 404
    && nonOwner.response.status === 404
    && JSON.stringify(missing.body) === JSON.stringify(nonOwner.body));
}

configureRouteRuntime({
  operation: 'patch',
  logRequestFlow: true,
  logDatabaseCalls: true,
  context: context(),
  invoiceRecords: [baseInvoice],
  invoiceLookupError: { code: 'XX000', message: 'sensitive database detail' },
});
{
  const response = await invoiceRoute.PATCH(patchRequest('draft'));
  const body = await response.json();
  check('lookup database errors return a generic server error', response.status === 500);
  check('lookup database errors do not leak internal details', !JSON.stringify(body).includes('sensitive database detail'));
}

console.log(`\nSettled invoice write guard runtime tests: ${passed} passed, ${failed} failed.`);
if (failed > 0) {
  console.error(failures.map((failure) => `- ${failure}`).join('\n'));
}
assert.equal(failed, 0, `${failed} settled invoice write guard runtime check(s) failed`);
