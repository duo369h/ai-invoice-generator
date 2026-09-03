import assert from 'node:assert/strict';
import { register } from 'node:module';

register('./test-support/route-runtime-loader.mjs', import.meta.url);

const { configureRouteRuntime, getRouteRuntimeCalls } = await import('./test-support/route-runtime-mocks.mjs');
const { POST } = await import('../src/app/api/portal/token/generate/route.js');

for (const plan of ['free', 'starter', 'pro']) {
  configureRouteRuntime({
    context: { mode: 'supabase', user: { id: 'user-r56b1' } },
    plan,
    entitlements: {
      client_portal: false,
      client_approval: false,
      approval_scope: 'none',
      unlimited_invoices: false,
    },
  });

  const response = await POST(new Request('http://localhost/api/portal/token/generate', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ resource_id: 'doc-r56b1', resource_type: 'invoice' }),
  }));
  const body = await response.json();

  assert.equal(response.status, 403, `${plan} must fail closed`);
  assert.deepEqual(body, { error: 'FEATURE_NOT_AVAILABLE' });
  assert.equal(Object.hasOwn(body, 'requiredPlan'), false);
  assert.deepEqual(getRouteRuntimeCalls(), [], `${plan} must not perform side effects before entitlement denial`);
}

console.log('R56B1 Portal token route runtime tests passed.');
