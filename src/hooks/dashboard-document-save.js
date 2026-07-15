const ACTIVATION_EVENTS = { quote: 'first_quote_created', invoice: 'first_invoice_created' };

// Beta decision: events created before consent are intentionally not backfilled.
export async function claimAndEmitFirstActivation({
  documentType,
  documentNumber = '',
  token = null,
  isDemo = false,
  isPreview = false,
  consent = typeof window === 'undefined' ? null : window.localStorage.getItem('corvioz_analytics_consent'),
  fetchImpl = fetch,
  sendEvent,
}) {
  const eventName = ACTIVATION_EVENTS[documentType];
  if (!eventName || isDemo || isPreview || consent !== 'accepted') return false;
  try {
    const response = await fetchImpl('/api/events/activation/claim', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      credentials: 'same-origin',
      body: JSON.stringify({ event_name: eventName }),
    });
    const result = await response.json();
    if (!response.ok || result?.claimed !== true) return false;
    sendEvent(eventName, { document_type: documentType, document_number: documentNumber, source: 'auth_flow' });
    return true;
  } catch {
    return false;
  }
}

export async function saveDashboardDocument({
  documentType,
  endpoint,
  payload,
  token = null,
  isDemo,
  isPreview,
  setDocuments,
  fetchData,
  getAuthHeaders,
  fetchImpl = fetch,
}) {
  if (isPreview) return { success: true };

  if (isDemo) {
    const id = payload.id || `mock-${Date.now()}`;
    const total = (payload.items || []).reduce(
      (sum, item) => sum + (Number(item.quantity || 1) * Number(item.unitPrice || item.unit_price || 0) * 100),
      0,
    );
    const document = { id, ...payload, total, created_at: new Date().toISOString() };
    setDocuments((previous) => {
      const index = previous.findIndex((item) => item.id === id);
      if (index > -1) {
        const next = [...previous];
        next[index] = document;
        return next;
      }
      return [...previous, document];
    });
    return { success: true, data: document };
  }

  try {
    const response = await fetchImpl(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders(token) },
      body: JSON.stringify(payload),
    });
    if (response.ok) {
      const data = await response.json();
      await fetchData(token);
      return { success: true, data: documentType === 'invoice' ? data.data || data : data };
    }
    const error = await response.json().catch(() => ({}));
    return { success: false, error: error.error || `Failed to save ${documentType}` };
  } catch (error) {
    return { success: false, error: error.message };
  }
}
