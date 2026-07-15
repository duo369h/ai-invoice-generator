import assert from 'node:assert/strict';
import { saveDashboardDocument, claimAndEmitFirstActivation } from '../src/hooks/dashboard-document-save.js';

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

console.log('Dashboard document save runtime tests passed.');
