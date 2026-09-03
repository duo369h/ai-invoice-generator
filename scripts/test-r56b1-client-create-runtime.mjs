import assert from 'node:assert/strict';
import { register } from 'node:module';

register('./test-support/route-runtime-loader.mjs', import.meta.url);

const { configureRouteRuntime, getRouteRuntimeCalls, getRouteRuntimeInserts } = await import('./test-support/route-runtime-mocks.mjs');
const { POST } = await import('../src/app/api/clients/route.js');

for (const plan of ['free', 'starter', 'pro']) {
  configureRouteRuntime({
    context: { mode: 'supabase', user: { id: `user-${plan}` } },
    plan,
    clientCreated: { id: `client-${plan}`, name: `${plan} client` },
  });

  const response = await POST(new Request('http://localhost/api/clients', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ name: `${plan} client`, email: `${plan}@example.com` }),
  }));
  const body = await response.json();

  assert.equal(response.status, 200, `${plan} client creation must reach the save path`);
  assert.equal(body.id, `client-${plan}`);
  assert.equal(getRouteRuntimeCalls().includes('persist:clients'), true, `${plan} must persist through the canonical client API`);
  assert.equal(getRouteRuntimeInserts()[0].table, 'clients');
}

console.log('R56B1 client create runtime tests passed.');
