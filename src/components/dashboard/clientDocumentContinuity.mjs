export const CLIENT_DOCUMENT_DISPLAY_LIMIT = 5;

export function getEffectiveDocumentTimestamp(document) {
  const updatedTimestamp = document?.updated_at ? Date.parse(document.updated_at) : Number.NaN;
  if (Number.isFinite(updatedTimestamp)) return updatedTimestamp;

  const createdTimestamp = document?.created_at ? Date.parse(document.created_at) : Number.NaN;
  return Number.isFinite(createdTimestamp) ? createdTimestamp : null;
}

function stableDocumentKey(document) {
  return [
    document?.id,
    document?.quote_number || document?.invoice_number,
  ].map((value) => String(value ?? ''));
}

function compareDocuments(a, b) {
  const timestampDifference = (getEffectiveDocumentTimestamp(b) ?? 0) - (getEffectiveDocumentTimestamp(a) ?? 0);
  if (timestampDifference !== 0) return timestampDifference;

  const [idA, referenceA] = stableDocumentKey(a);
  const [idB, referenceB] = stableDocumentKey(b);
  for (const [valueA, valueB] of [[idA, idB], [referenceA, referenceB]]) {
    if (valueA === valueB) continue;
    return valueA < valueB ? -1 : 1;
  }
  return 0;
}

function linkedDocuments(documents, clientId) {
  if (clientId === null || clientId === undefined) return [];

  return (Array.isArray(documents) ? documents : [])
    .filter((document) => document?.client_id !== null && document?.client_id !== undefined)
    .filter((document) => document.client_id === clientId)
    .slice()
    .sort(compareDocuments);
}

export function getClientDocumentContinuity({
  client,
  quotes = [],
  invoices = [],
  isLoading = false,
  error = null,
  quoteResourceState,
  invoiceResourceState,
  quoteError = null,
  invoiceError = null,
  limit = CLIENT_DOCUMENT_DISPLAY_LIMIT,
}) {
  const allQuotes = linkedDocuments(quotes, client?.id);
  const allInvoices = linkedDocuments(invoices, client?.id);
  const displayLimit = Number.isFinite(Number(limit)) && Number(limit) >= 0
    ? Math.floor(Number(limit))
    : CLIENT_DOCUMENT_DISPLAY_LIMIT;
  const legacyResourceState = isLoading ? 'loading' : error ? 'error' : 'ready';
  const quoteState = quoteResourceState || legacyResourceState;
  const invoiceState = invoiceResourceState || legacyResourceState;
  const hasQuotes = allQuotes.length > 0;
  const hasInvoices = allInvoices.length > 0;
  const quoteStale = quoteState === 'error' && hasQuotes;
  const invoiceStale = invoiceState === 'error' && hasInvoices;
  const quoteUnavailable = quoteState === 'error' && !hasQuotes;
  const invoiceUnavailable = invoiceState === 'error' && !hasInvoices;
  const combinedEmptyEligible = quoteState === 'ready'
    && invoiceState === 'ready'
    && !hasQuotes
    && !hasInvoices;
  const state = quoteState === 'loading' || invoiceState === 'loading'
    ? 'loading'
    : quoteState === 'error' || invoiceState === 'error'
      ? (quoteStale || invoiceStale ? 'stale' : 'error')
      : 'ready';

  return {
    state,
    error: error || quoteError || invoiceError,
    quoteState,
    invoiceState,
    quoteError,
    invoiceError,
    quoteStale,
    invoiceStale,
    quoteUnavailable,
    invoiceUnavailable,
    quoteEmptyEligible: quoteState === 'ready' && !hasQuotes,
    invoiceEmptyEligible: invoiceState === 'ready' && !hasInvoices,
    combinedEmptyEligible,
    quotes: allQuotes.slice(0, displayLimit),
    invoices: allInvoices.slice(0, displayLimit),
    quoteCount: allQuotes.length,
    invoiceCount: allInvoices.length,
    moreQuotes: Math.max(0, allQuotes.length - displayLimit),
    moreInvoices: Math.max(0, allInvoices.length - displayLimit),
    emptyMessage: 'No documents are linked to this client yet.',
    quoteEmptyMessage: 'No quotes linked to this client.',
    invoiceEmptyMessage: 'No invoices linked to this client.',
  };
}
