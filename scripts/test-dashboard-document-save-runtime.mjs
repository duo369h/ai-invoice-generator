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
  assert.equal(first.retrySendOnly, true, 'PATCH failure marks the invoice for an explicit PATCH-only retry');
  assert.equal(first.error, 'Invoice was saved, but sending failed.');

  const retry = await saveAndSendDashboardInvoice({ ...options, invoiceId: first.invoiceId, retrySendOnly: first.retrySendOnly });
  assert.equal(retry.success, false, 'failed retry remains a send failure when PATCH fails');
  assert.deepEqual(calls, ['POST', 'PATCH', 'PATCH'], 'retry only PATCHes the saved invoice and never creates a duplicate');
}

{
  const calls = [];
  const editedPayload = { id: 'inv-existing-draft-1', client_name: 'Edited client', items: [{ quantity: 2, unitPrice: 250 }] };
  const result = await saveAndSendDashboardInvoice({
    endpoint: '/api/invoices', payload: editedPayload, invoiceId: 'inv-existing-draft-1', isDemo: false, isPreview: false,
    setDocuments: () => {}, fetchData: async () => {}, getAuthHeaders: () => ({}),
    fetchImpl: async (url, options) => {
      calls.push({ method: options.method, body: JSON.parse(options.body) });
      if (options.method === 'POST') return { ok: true, json: async () => ({ data: { id: 'inv-existing-draft-1' } }) };
      return { ok: true, json: async () => ({ id: 'inv-existing-draft-1', status: 'sent' }) };
    },
  });
  assert.equal(result.success, true, 'existing draft normal send reports success after persistence and send');
  assert.deepEqual(calls.map(({ method }) => method), ['POST', 'PATCH'], 'existing draft normal send POSTs latest edits before PATCH');
  assert.deepEqual(calls[0].body, editedPayload, 'existing draft normal send POST body includes the existing id and latest edited payload');
  assert.deepEqual(calls[1].body, { id: 'inv-existing-draft-1', status: 'sent' }, 'existing draft normal send PATCHes sent status after save');
}

{
  const calls = [];
  const result = await saveAndSendDashboardInvoice({
    endpoint: '/api/invoices', payload: { id: 'inv-existing-draft-post-failure' }, invoiceId: 'inv-existing-draft-post-failure', isDemo: false, isPreview: false,
    setDocuments: () => {}, fetchData: async () => {}, getAuthHeaders: () => ({}),
    fetchImpl: async (url, options) => {
      calls.push(options.method);
      return { ok: false, json: async () => ({ error: 'POST_FAILED' }) };
    },
  });
  assert.equal(result.success, false, 'existing draft POST failure does not report a sent invoice');
  assert.deepEqual(calls, ['POST'], 'existing draft POST failure never calls PATCH');
}

{
  const calls = [];
  const result = await saveAndSendDashboardInvoice({
    endpoint: '/api/invoices', payload: { id: 'inv-retry-1', client_name: 'Ignored on retry' }, invoiceId: 'inv-retry-1', retrySendOnly: true, isDemo: false, isPreview: false,
    setDocuments: () => {}, fetchData: async () => {}, getAuthHeaders: () => ({}),
    fetchImpl: async (url, options) => {
      calls.push(options.method);
      return { ok: true, json: async () => ({ id: 'inv-retry-1', status: 'sent' }) };
    },
  });
  assert.equal(result.success, true, 'successful retry reports a sent invoice');
  assert.equal(result.retrySendOnly, false, 'successful retry clears retry-only state');
  assert.deepEqual(calls, ['PATCH'], 'only an explicit retry-only request skips POST');
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
  assert.deepEqual(calls, ['POST', 'PATCH'], 'existing invoice id alone does not skip saving latest edits');
}

console.log('Dashboard document save runtime tests passed.');
