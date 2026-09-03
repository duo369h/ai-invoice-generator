import assert from 'node:assert/strict';
import { register } from 'node:module';

register('./test-support/route-runtime-loader.mjs', import.meta.url);

const { configureRouteRuntime } = await import('./test-support/route-runtime-mocks.mjs');
const { GET } = await import('../src/app/api/user/entitlements/route.js');

for (const plan of ['free', 'starter', 'pro']) {
  configureRouteRuntime({
    context: { mode: 'supabase', user: { id: `user-${plan}` } },
    plan,
    entitlementRecord: {
      export_pdf: true,
      pdf_branding: plan === 'free' ? 'branded' : 'clean',
      client_portal: true,
      client_approval: true,
      approval_scope: 'quotes_only',
      unlimited_invoices: true,
    },
  });

  const response = await GET(new Request('http://localhost/api/user/entitlements'));
  const body = await response.json();

  assert.equal(response.status, 200);
  assert.equal(body.entitlements.client_portal, false, `${plan} API contract must deny Portal`);
  assert.equal(body.entitlements.client_approval, false, `${plan} API contract must deny Approval`);
  assert.equal(body.entitlements.approval_scope, 'none', `${plan} API contract must deny Approval scope`);
  assert.equal(body.entitlements.unlimited_invoices, false, `${plan} API contract must deny unlimited compatibility claims`);
}

configureRouteRuntime({
  context: { mode: 'supabase', user: { id: 'user-feature' } },
  entitlementRecord: { client_portal: true, client_approval: true, approval_scope: 'quotes_only', unlimited_invoices: true },
});
const featureResponse = await GET(new Request('http://localhost/api/user/entitlements?feature=client_portal'));
assert.equal(featureResponse.status, 200);
assert.deepEqual(await featureResponse.json(), { access: false });

console.log('R56B1 entitlements route runtime tests passed.');
