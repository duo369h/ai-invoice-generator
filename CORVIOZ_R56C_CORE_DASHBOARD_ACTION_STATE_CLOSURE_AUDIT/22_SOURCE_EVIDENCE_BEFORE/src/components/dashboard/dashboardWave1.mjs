import {
  PAYMENT_STATUSES,
  deriveInvoicePaymentState,
  resolveInvoicePaymentReadModel,
} from '../../core/revenue/invoicePaymentState.js';
import { deserializeQuoteNotes } from './quoteNotes.mjs';

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

function parsedTimestamp(value) {
  const timestamp = Date.parse(value || '');
  return Number.isFinite(timestamp) ? timestamp : null;
}

function compareTimestampDescending(left, right) {
  const leftTimestamp = parsedTimestamp(left);
  const rightTimestamp = parsedTimestamp(right);
  return (rightTimestamp ?? Number.NEGATIVE_INFINITY) - (leftTimestamp ?? Number.NEGATIVE_INFINITY);
}

function compareParsedTimestampDescending(leftTimestamp, rightTimestamp) {
  return (rightTimestamp ?? Number.NEGATIVE_INFINITY) - (leftTimestamp ?? Number.NEGATIVE_INFINITY);
}

function quoteTieBreaker(quote) {
  return `${quote?.id || ''}\u0000${quote?.quote_number || ''}`;
}

function compareQuotesByRecency(left, right) {
  const leftEffectiveRecency = parsedTimestamp(left?.updated_at) ?? parsedTimestamp(left?.created_at);
  const rightEffectiveRecency = parsedTimestamp(right?.updated_at) ?? parsedTimestamp(right?.created_at);

  return compareParsedTimestampDescending(leftEffectiveRecency, rightEffectiveRecency)
    || compareTimestampDescending(left?.created_at, right?.created_at)
    || quoteTieBreaker(left).localeCompare(quoteTieBreaker(right));
}

export function selectLatestQuote(quotes = []) {
  return (Array.isArray(quotes) ? quotes : []).slice().sort(compareQuotesByRecency)[0] || null;
}

export function buildScopeSnapshot(quotes = []) {
  const quote = selectLatestQuote(quotes);
  if (!quote) return null;

  const sourceItems = Array.isArray(quote.items) ? quote.items : [];
  return {
    id: quote.id || null,
    quoteNumber: quote.quote_number || null,
    status: quote.status || null,
    clientName: quote.client_name || null,
    items: sourceItems.slice(0, 4).map((item) => ({
      description: item?.description ?? null,
      quantity: item?.quantity ?? null,
    })),
    moreItemCount: Math.max(0, sourceItems.length - 4),
    hasItems: sourceItems.length > 0,
    total: quote.total ?? null,
    currency: quote.currency || null,
    notes: deserializeQuoteNotes(quote.notes).notes || null,
    updatedAt: parsedTimestamp(quote.updated_at) !== null
      ? quote.updated_at
      : parsedTimestamp(quote.created_at) !== null ? quote.created_at : null,
  };
}

export function getScopeSnapshotSurfaceState({ isLoading = false, error = null, quotes = [] } = {}) {
  const hasQuotes = Array.isArray(quotes) && quotes.length > 0;

  if (hasQuotes && error) {
    return {
      mode: 'stale',
      title: null,
      description: 'Some data could not be refreshed. Showing the latest available quote.',
      showRetry: false,
    };
  }

  if (!hasQuotes && isLoading) {
    return {
      mode: 'loading',
      title: 'Checking your latest quote…',
      description: null,
      showRetry: false,
    };
  }

  if (!hasQuotes && error) {
    return {
      mode: 'error',
      title: "Scope Snapshot couldn't be loaded.",
      description: 'Refresh to try again.',
      showRetry: true,
    };
  }

  if (!hasQuotes) {
    return {
      mode: 'empty',
      title: 'Create a quote to see a scope snapshot here.',
      description: null,
      showRetry: false,
    };
  }

  return {
    mode: 'ready',
    title: null,
    description: null,
    showRetry: false,
  };
}

function documentStatus(record, type) {
  const value = type === 'invoice' ? record?.payment_status || record?.status : record?.status;
  return value === undefined || value === null || value === '' ? null : String(value);
}

const NEEDS_ATTENTION_PRIORITY = Object.freeze({
  past_due: 0,
  partial: 1,
  approved_quote: 2,
  unpaid: 3,
  sent_quote: 4,
  draft_quote: 5,
});

function normalizeRecordStatus(value) {
  return typeof value === 'string' ? value.trim().toLowerCase() : '';
}

function attentionItem({ record, documentType, title, action, actionLabel, priority, paymentStatus = null, amountPaidCents = null, amountDueCents = null, dueDate = null }) {
  return {
    id: record?.id || `${documentType}-${record?.quote_number || record?.invoice_number || 'unknown'}`,
    documentType,
    documentId: record?.id || null,
    number: documentType === 'quote' ? record?.quote_number || null : record?.invoice_number || null,
    clientName: record?.client_name || null,
    currency: record?.currency || 'USD',
    title,
    action,
    actionLabel,
    paymentStatus,
    amountPaidCents,
    amountDueCents,
    dueDate,
    _priority: priority,
    _timestamp: timestampFor(record),
    _tieBreaker: `${documentType}:${record?.id || record?.quote_number || record?.invoice_number || ''}`,
  };
}

function invoiceIsPastDue(invoice, now) {
  return deriveInvoicePaymentState(
    { ...invoice, amount_paid_cents: 0 },
    now
  ).paymentStatus === PAYMENT_STATUSES.OVERDUE;
}

function stripAttentionSortFields(item) {
  const {
    _priority,
    _timestamp,
    _tieBreaker,
    ...publicItem
  } = item;
  return publicItem;
}

export function buildNeedsAttention({ quotes = [], invoices = [] } = {}, now = new Date()) {
  const quoteItems = (Array.isArray(quotes) ? quotes : []).flatMap((record) => {
    const status = normalizeRecordStatus(record?.status);
    if (status === 'draft') {
      return [attentionItem({
        record,
        documentType: 'quote',
        title: 'Finish and send quote',
        action: 'openQuotes',
        actionLabel: 'Open quote',
        priority: NEEDS_ATTENTION_PRIORITY.draft_quote,
      })];
    }
    if (status === 'sent') {
      return [attentionItem({
        record,
        documentType: 'quote',
        title: 'Awaiting client decision',
        action: 'openQuotes',
        actionLabel: 'Open quote',
        priority: NEEDS_ATTENTION_PRIORITY.sent_quote,
      })];
    }
    if (status === 'approved') {
      return [attentionItem({
        record,
        documentType: 'quote',
        title: 'Ready to create invoice',
        action: 'openQuotes',
        actionLabel: 'Open quote',
        priority: NEEDS_ATTENTION_PRIORITY.approved_quote,
      })];
    }
    return [];
  });

  const invoiceItems = (Array.isArray(invoices) ? invoices : []).flatMap((record) => {
    if (normalizeRecordStatus(record?.status) === 'draft') return [];

    const readModel = resolveInvoicePaymentReadModel(record, now);
    const pastDue = invoiceIsPastDue(record, now) && readModel.paymentStatus !== PAYMENT_STATUSES.PAID;

    if (pastDue) {
      return [attentionItem({
        record,
        documentType: 'invoice',
        title: 'Past-due balance',
        action: 'openInvoices',
        actionLabel: 'Open invoice',
        priority: NEEDS_ATTENTION_PRIORITY.past_due,
        paymentStatus: readModel.payment_status,
        amountPaidCents: readModel.amount_paid_cents,
        amountDueCents: readModel.amount_due_cents,
        dueDate: record?.due_date || null,
      })];
    }

    if (readModel.payment_status === PAYMENT_STATUSES.PARTIAL) {
      return [attentionItem({
        record,
        documentType: 'invoice',
        title: 'Remaining balance',
        action: 'openInvoices',
        actionLabel: 'Open invoice',
        priority: NEEDS_ATTENTION_PRIORITY.partial,
        paymentStatus: readModel.payment_status,
        amountPaidCents: readModel.amount_paid_cents,
        amountDueCents: readModel.amount_due_cents,
        dueDate: record?.due_date || null,
      })];
    }

    if (readModel.payment_status === PAYMENT_STATUSES.UNPAID) {
      return [attentionItem({
        record,
        documentType: 'invoice',
        title: 'Payment not recorded',
        action: 'openInvoices',
        actionLabel: 'Open invoice',
        priority: NEEDS_ATTENTION_PRIORITY.unpaid,
        paymentStatus: readModel.payment_status,
        amountDueCents: readModel.amount_due_cents,
        dueDate: record?.due_date || null,
      })];
    }

    return [];
  });

  return [...quoteItems, ...invoiceItems]
    .sort((left, right) => (
      left._priority - right._priority
      || right._timestamp - left._timestamp
      || left._tieBreaker.localeCompare(right._tieBreaker)
    ))
    .map(stripAttentionSortFields);
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

export function getNeedsAttentionSurfaceState({ itemCount = 0, surfaceState = 'empty', error = null } = {}) {
  const hasItems = Number(itemCount) > 0;
  const hasError = Boolean(error) || surfaceState === 'error';

  if (!hasItems && hasError) {
    return {
      mode: 'error',
      title: "Needs Attention couldn't be loaded.",
      description: 'Refresh to try again. Your existing document workflows are unchanged.',
      showRetry: true,
    };
  }

  if (!hasItems && surfaceState === 'loading') {
    return {
      mode: 'loading',
      title: 'Checking your quotes and invoices…',
      description: 'We are retrieving the latest document status.',
      showRetry: false,
    };
  }

  if (hasItems && hasError) {
    return {
      mode: 'stale',
      title: null,
      description: 'Some data could not be refreshed. Showing the latest available items.',
      showRetry: false,
    };
  }

  if (!hasItems) {
    return {
      mode: 'empty',
      title: 'No quotes or invoices need attention right now.',
      description: null,
      showRetry: false,
    };
  }

  return {
    mode: 'list',
    title: null,
    description: null,
    showRetry: false,
  };
}
