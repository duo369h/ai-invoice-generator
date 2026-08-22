import assert from 'node:assert/strict';
import {
  buildDashboardEntitlementState,
  resolveDashboardEntitlements,
  DASHBOARD_ENTITLEMENT_STATUS,
} from '../src/core/state/dashboardEntitlementState.js';

const session = { access_token: 'test-token' };
const user = (plan) => ({ id: `user-${plan}`, plan });
const fallback = (plan) => ({
  invoice: true,
  export_pdf: plan !== 'free',
  client_portal: plan === 'pro' || plan === 'studio',
  crm: plan === 'pro' || plan === 'studio',
  automation: plan === 'studio',
  advanced_invoicing: plan === 'pro' || plan === 'studio',
});

const apiResponse = (body, ok = true) => ({ ok, json: async () => body });

{
  const result = await resolveDashboardEntitlements({
    user: user('pro'), session, getFallbackEntitlements: fallback,
    fetchImpl: async (url, options) => {
      assert.equal(url, '/api/user/entitlements');
      assert.equal(options.headers.Authorization, 'Bearer test-token');
      return apiResponse({ entitlements: { export_pdf: true, client_portal: true, advanced_invoicing: true } });
    },
  });
  assert.equal(result.status, DASHBOARD_ENTITLEMENT_STATUS.READY, 'authenticated Pro API result is READY');
  assert.equal(result.entitlements.client_portal, true, 'Pro API result enables client portal');
}

for (const [plan, portal] of [['starter', false], ['free', false]]) {
  const result = await resolveDashboardEntitlements({
    user: user(plan), session, getFallbackEntitlements: fallback,
    fetchImpl: async () => apiResponse({ entitlements: null }),
  });
  assert.equal(result.status, DASHBOARD_ENTITLEMENT_STATUS.READY, `authenticated ${plan} resolves READY`);
  assert.equal(result.entitlements.client_portal, portal, `${plan} does not enable portal`);
}

{
  const result = await resolveDashboardEntitlements({
    user: user('pro'), session, getFallbackEntitlements: fallback,
    fetchImpl: async () => apiResponse({ error: 'unavailable' }, false),
  });
  assert.equal(result.status, DASHBOARD_ENTITLEMENT_STATUS.READY, 'API outage falls back to authenticated Pro plan');
  assert.equal(result.entitlements.client_portal, true, 'authenticated Pro fallback enables portal');
}

{
  let calls = 0;
  const result = await resolveDashboardEntitlements({
    user: user('unknown'), session, getFallbackEntitlements: fallback,
    fetchImpl: async () => { calls += 1; throw new Error('API unavailable'); },
  });
  assert.equal(calls, 1, 'unresolved entitlement path calls only the authenticated API');
  assert.equal(result.status, DASHBOARD_ENTITLEMENT_STATUS.ERROR, 'API outage without trusted plan is ERROR');
}

{
  const result = await resolveDashboardEntitlements({
    user: user('pro'), session, getFallbackEntitlements: fallback,
    fetchImpl: async () => apiResponse({ entitlements: { client_portal: true } }),
  });
  assert.equal(result.status, DASHBOARD_ENTITLEMENT_STATUS.READY, 'server truth resolves without browser Supabase');
  assert.equal(result.entitlements.client_portal, true, 'browser Supabase read failure cannot override server truth');
}

{
  const state = buildDashboardEntitlementState({ mode: 'live', authChecked: true, session: null });
  assert.equal(state.status, DASHBOARD_ENTITLEMENT_STATUS.READY, 'unauthenticated state preserves existing auth behavior');
}

console.log('Dashboard entitlement runtime tests passed.');
