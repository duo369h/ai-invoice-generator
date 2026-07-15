import assert from 'node:assert/strict';
import { claimAndEmitFirstActivation, saveDashboardDocument } from '../src/hooks/dashboard-document-save.js';

async function claim({ token = null, consent = 'accepted', isDemo = false, isPreview = false, response = { ok: true, claimed: true } } = {}) {
  const calls = [];
  const emitted = [];
  const claimed = await claimAndEmitFirstActivation({
    documentType: 'quote',
    documentNumber: 'Q-1001',
    token,
    consent,
    isDemo,
    isPreview,
    sendEvent: (name) => emitted.push(name),
    fetchImpl: async (url, init) => {
      calls.push({ url, init });
      return { ok: response.ok, json: async () => ({ claimed: response.claimed }) };
    },
  });
  return { claimed, calls, emitted };
}

{
  const result = await claim({ token: 'access-token' });
  assert.equal(result.claimed, true, 'a granted authenticated claim emits activation');
  assert.equal(result.calls.length, 1, 'activation claim is requested once');
  assert.equal(result.calls[0].url, '/api/events/activation/claim');
  assert.equal(result.calls[0].init.credentials, 'same-origin', 'claim sends same-origin credentials for cookie-session compatibility');
  assert.equal(result.calls[0].init.headers.Authorization, 'Bearer access-token', 'claim forwards the current access token');
  assert.deepEqual(result.emitted, ['first_quote_created']);
}

{
  const result = await claim();
  assert.equal(result.claimed, true, 'a cookie-session claim remains eligible without a bearer token');
  assert.equal(result.calls[0].init.headers.Authorization, undefined, 'a missing token does not send an empty authorization header');
  assert.equal(result.calls[0].init.credentials, 'same-origin');
}

for (const options of [{ isDemo: true }, { isPreview: true }, { consent: 'declined' }]) {
  const result = await claim(options);
  assert.equal(result.claimed, false, 'demo, preview, and non-consented flows do not claim activation');
  assert.equal(result.calls.length, 0, 'blocked flows do not request the claim endpoint');
}

for (const response of [{ ok: false, claimed: false, status: 401 }, { ok: false, claimed: false, status: 500 }]) {
  const result = await claim({ token: 'access-token', response });
  assert.equal(result.claimed, false, `claim HTTP ${response.status} is non-blocking`);
  assert.deepEqual(result.emitted, [], `claim HTTP ${response.status} never emits activation`);
}

{
  const saved = await saveDashboardDocument({
    documentType: 'quote',
    endpoint: '/api/quotes',
    payload: { items: [] },
    token: 'access-token',
    isDemo: false,
    isPreview: false,
    getAuthHeaders: (token) => ({ Authorization: `Bearer ${token}` }),
    fetchData: async () => {},
    setDocuments: () => {},
    fetchImpl: async () => ({ ok: true, json: async () => ({ id: 'quote-1' }) }),
  });
  const claimFailure = await claim({ token: 'access-token', response: { ok: false, claimed: false } });
  assert.equal(saved.success, true, 'a successful Quote save remains successful when its later claim fails');
  assert.equal(claimFailure.claimed, false);
}

console.log('Dashboard activation claim authentication runtime tests passed.');
