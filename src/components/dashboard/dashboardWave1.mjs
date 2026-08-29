const DASHBOARD_TAB_BY_TOOL = {
  quote: 'quotes',
  quotes: 'quotes',
  invoice: 'invoices',
  invoices: 'invoices',
  client: 'clients',
  clients: 'clients',
  profile: 'profile',
  studio: 'studio',
  portfolio: 'portfolio',
  brand: 'brand',
  reports: 'reports',
  automation: 'automation',
};

export function getDashboardTabForTool(tool) {
  return DASHBOARD_TAB_BY_TOOL[tool] || 'overview';
}

export function getDashboardRouteForTab(tab) {
  if (tab === 'quotes') return '/dashboard?tool=quote';
  if (tab === 'invoices') return '/dashboard?tool=invoice';
  if (tab === 'clients') return '/dashboard?tool=client';
  if (tab === 'profile') return '/dashboard?tool=profile';
  return '/dashboard';
}

export function getDashboardQuickActions() {
  return [
    { id: 'createQuote', label: 'Create Quote', description: 'Prepare a client-ready quote.' },
    { id: 'createInvoice', label: 'Create Invoice', description: 'Start an invoice from the dashboard.' },
  ];
}

function timestampFor(record) {
  const timestamp = Date.parse(record?.updated_at || record?.created_at || '');
  return Number.isFinite(timestamp) ? timestamp : 0;
}

function documentStatus(record, type) {
  const value = type === 'invoice' ? record?.payment_status || record?.status : record?.status;
  return value === undefined || value === null || value === '' ? null : String(value);
}

export function buildRecentDocuments({ quotes = [], invoices = [] } = {}, limit = 6) {
  const quoteDocuments = (Array.isArray(quotes) ? quotes : []).map((record, index) => ({
    type: 'quote',
    id: record?.id || `quote-${index}`,
    number: record?.quote_number || null,
    clientName: record?.client_name || null,
    total: record?.total ?? null,
    currency: record?.currency || 'USD',
    status: documentStatus(record, 'quote'),
    timestamp: timestampFor(record),
    source: record,
  }));
  const invoiceDocuments = (Array.isArray(invoices) ? invoices : []).map((record, index) => ({
    type: 'invoice',
    id: record?.id || `invoice-${index}`,
    number: record?.invoice_number || null,
    clientName: record?.client_name || null,
    total: record?.total ?? null,
    currency: record?.currency || 'USD',
    status: documentStatus(record, 'invoice'),
    timestamp: timestampFor(record),
    source: record,
  }));

  return [...quoteDocuments, ...invoiceDocuments]
    .sort((left, right) => right.timestamp - left.timestamp)
    .slice(0, Math.max(0, limit));
}

export function getDashboardSurfaceState({ isLoading = false, error = null, quotes = [], invoices = [] } = {}) {
  const hasDocuments = (Array.isArray(quotes) && quotes.length > 0) || (Array.isArray(invoices) && invoices.length > 0);
  if (error && !hasDocuments) return 'error';
  if (isLoading && !hasDocuments) return 'loading';
  return hasDocuments ? 'ready' : 'empty';
}
