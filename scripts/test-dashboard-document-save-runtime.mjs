import assert from 'node:assert/strict';
import {
  saveDashboardDocument,
  saveAndSendDashboardInvoice,
  claimAndEmitFirstActivation,
} from '../src/hooks/dashboard-document-save.js';

const payload = { items: [{ quantity: 1, unitPrice: 100 }] };

for (const documentType of ['quote', 'invoice']) {
  for (const mode of ['preview', 'demo']) {
    let fetchCalls = 0;
    let stateUpdates = 0;
    const result = await saveDashboardDocument({
      documentType,
      endpoint: `/api/${documentType}s`,
      payload,
      isPreview: mode === 'preview',
      isDemo: mode === 'demo',
      fetchImpl: async () => { fetchCalls += 1; throw new Error('persistence must not run'); },
      setDocuments: () => { stateUpdates += 1; },
      fetchData: async () => { fetchCalls += 1; },
      getAuthHeaders: () => ({}),
    });

    assert.equal(result.success, true, `${mode} ${documentType} save succeeds locally`);
    assert.equal(fetchCalls, 0, `${mode} ${documentType} save does not persist`);
    const emitted = [];
    const claimed = await claimAndEmitFirstActivation({ isDemo: mode === 'demo', isPreview: mode === 'preview', documentType, sendEvent: (event) => emitted.push(event), fetchImpl: async () => { fetchCalls += 1; } });
    assert.equal(claimed, false, `${mode} ${documentType} save cannot claim activation`);
    assert.deepEqual(emitted, [], `${mode} ${documentType} save cannot emit activation`);
    if (mode === 'demo') assert.equal(stateUpdates, 1, `demo ${documentType} keeps its local state update`);
  }
}

for (const consent of [null, 'declined']) {
  let calls = 0;
  const emitted = [];
  const claimed = await claimAndEmitFirstActivation({ documentType: 'quote', consent, sendEvent: (event) => emitted.push(event), fetchImpl: async () => { calls += 1; } });
  assert.equal(claimed, false, 'missing consent does not claim');
  assert.equal(calls, 0, 'missing consent does not call claim endpoint');
  assert.deepEqual(emitted, [], 'missing consent does not emit');
}

for (const claimResult of [true, false]) {
  let calls = 0;
  const emitted = [];
  const claimed = await claimAndEmitFirstActivation({ documentType: 'invoice', consent: 'accepted', sendEvent: (event) => emitted.push(event), fetchImpl: async () => { calls += 1; return { ok: true, json: async () => ({ claimed: claimResult }) }; } });
  assert.equal(claimed, claimResult, 'accepted consent returns claim result');
  assert.equal(calls, 1, 'accepted consent calls the claim endpoint once');
  assert.equal(emitted.length, claimResult ? 1 : 0, 'only granted claims emit');
}

{
  const calls = [];
  const result = await saveAndSendDashboardInvoice({
    endpoint: '/api/invoices',
    payload,
    token: 'test-token',
    isDemo: false,
    isPreview: false,
    setDocuments: () => {},
    fetchData: async () => {},
    getAuthHeaders: (token) => ({ Authorization: `Bearer ${token}` }),
    fetchImpl: async (url, options) => {
      calls.push({ url, options });
      if (options.method === 'POST') return { ok: true, json: async () => ({ data: { id: 'inv-created-1' } }) };
      return { ok: true, json: async () => ({ id: 'inv-created-1', status: 'sent' }) };
    },
  });
  assert.equal(result.success, true, 'POST 201 plus PATCH 200 reports a sent invoice');
  assert.equal(calls.length, 2, 'new send performs exactly POST then PATCH');
  assert.equal(calls[0].options.method, 'POST');
  assert.equal(calls[1].options.method, 'PATCH');
  assert.deepEqual(JSON.parse(calls[1].options.body), { id: 'inv-created-1', status: 'sent' }, 'PATCH body contains only the created invoice id and sent status');
}

{
  const calls = [];
  const result = await saveAndSendDashboardInvoice({
    endpoint: '/api/invoices', payload, isDemo: false, isPreview: false,
    setDocuments: () => {}, fetchData: async () => {}, getAuthHeaders: () => ({}),
    fetchImpl: async (url, options) => {
      calls.push(options.method);
      return { ok: false, json: async () => ({ error: 'POST_FAILED' }) };
    },
  });
  assert.equal(result.success, false, 'POST failure does not report a sent invoice');
  assert.deepEqual(calls, ['POST'], 'POST failure never calls PATCH');
}

{
  const calls = [];
  const options = {
    endpoint: '/api/invoices', payload, isDemo: false, isPreview: false,
    setDocuments: () => {}, fetchData: async () => {}, getAuthHeaders: () => ({}),
    fetchImpl: async (url, request) => {
      calls.push(request.method);
      if (request.method === 'POST') return { ok: true, json: async () => ({ id: 'inv-saved-1' }) };
      return { ok: false, json: async () => ({ error: 'SEND_FAILED' }) };
    },
  };
  const first = await saveAndSendDashboardInvoice(options);
  assert.equal(first.success, false, 'PATCH failure does not report a sent invoice');
  assert.equal(first.saved, true, 'PATCH failure preserves the saved invoice state');
  assert.equal(first.invoiceId, 'inv-saved-1', 'PATCH failure preserves the created invoice id');
  assert.equal(first.error, 'Invoice was saved, but sending failed.');

  const retry = await saveAndSendDashboardInvoice({ ...options, invoiceId: first.invoiceId });
  assert.equal(retry.success, false, 'failed retry remains a send failure when PATCH fails');
  assert.deepEqual(calls, ['POST', 'PATCH', 'PATCH'], 'retry only PATCHes the saved invoice and never creates a duplicate');
}

{
  const calls = [];
  await saveAndSendDashboardInvoice({
    endpoint: '/api/invoices', payload, invoiceId: 'inv-existing-1', isDemo: false, isPreview: false,
    setDocuments: () => {}, fetchData: async () => {}, getAuthHeaders: () => ({}),
    fetchImpl: async (url, options) => {
      calls.push(options.method);
      return { ok: true, json: async () => ({ id: 'inv-existing-1', status: 'sent' }) };
    },
  });
  assert.deepEqual(calls, ['PATCH'], 'existing invoice retry only PATCHes status=sent');
}

console.log('Dashboard document save runtime tests passed.');
