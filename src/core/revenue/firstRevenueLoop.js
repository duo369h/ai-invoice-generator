import { PAYMENT_STATUSES, paymentStatusForInvoice } from './invoicePaymentState.js';

const FREE_PLAN = 'free';

const noActions = {
  canCreateQuote: false,
  canSendQuote: false,
  canCreateInvoiceDraft: false,
  canPreparePayment: false,
};

function result(stage, mode, loop = {}, actions = {}) {
  return {
    stage,
    mode,
    quoteId: loop.quote_id || null,
    invoiceId: loop.invoice_id || null,
    ...noActions,
    ...actions,
  };
}

export function resolveFirstRevenueLoop({ plan = FREE_PLAN, loop = null, quote = null, invoice = null } = {}) {
  if (String(plan).toLowerCase() !== FREE_PLAN) {
    return result('unavailable', 'plan', loop || {});
  }

  if (loop?.legacy_blocked_at) {
    return result('unavailable', 'blocked', loop);
  }

  if (!loop?.quote_id) {
    return result('no_quote', 'allowance', loop || {}, { canCreateQuote: true });
  }

  if (!quote || quote.id !== loop.quote_id) {
    return result('no_quote', 'allowance', loop, { canCreateQuote: true });
  }

  if (loop.invoice_id) {
    if (!invoice || invoice.id !== loop.invoice_id) {
      return result('unavailable', 'blocked', loop);
    }

    // SAFE-03B2A: the closing stage is driven by settled payment state only.
    // A checkout link is not evidence of settlement.
    const paymentStatus = paymentStatusForInvoice(invoice);

    if (paymentStatus === PAYMENT_STATUSES.PAID) {
      return result('complete', 'allowance', loop);
    }

    if (paymentStatus === PAYMENT_STATUSES.PARTIAL) {
      return result('first_payment_received', 'allowance', loop, { canPreparePayment: true });
    }

    return result('invoice_created', 'allowance', loop, { canPreparePayment: true });
  }

  switch (quote.status) {
    case 'draft':
      return result('draft', 'allowance', loop, { canSendQuote: true });
    case 'sent':
      return result('sent', 'allowance', loop);
    case 'approved':
      return result('approved', 'allowance', loop, { canCreateInvoiceDraft: true });
    case 'declined':
      return result('rejected', 'allowance', loop);
    default:
      return result('unavailable', 'blocked', loop);
  }
}

export function canTransitionFirstRevenueQuote({
  plan = FREE_PLAN,
  loop = null,
  quote = null,
  requestedStatus,
} = {}) {
  if (String(plan).toLowerCase() !== FREE_PLAN) {
    return { allowed: true, reason: null };
  }

  if (!loop?.quote_id || loop.legacy_blocked_at || quote?.id !== loop.quote_id) {
    return { allowed: false, reason: 'first_revenue_quote_unavailable' };
  }

  if (quote.status === 'draft' && ['draft', 'sent'].includes(requestedStatus)) {
    return { allowed: true, reason: null };
  }

  if (quote.status === 'sent' && requestedStatus === 'sent') {
    return { allowed: true, reason: null };
  }

  return { allowed: false, reason: 'first_revenue_quote_transition_forbidden' };
}

export function canCreateFirstRevenueInvoiceDraft({
  plan = FREE_PLAN,
  loop = null,
  quote = null,
} = {}) {
  if (String(plan).toLowerCase() !== FREE_PLAN) {
    return { allowed: true, reason: null };
  }

  if (!loop?.quote_id || loop.legacy_blocked_at || quote?.id !== loop.quote_id) {
    return { allowed: false, reason: 'first_revenue_quote_unavailable' };
  }

  if (loop.invoice_id) {
    return { allowed: false, reason: 'first_revenue_invoice_already_claimed' };
  }

  if (quote.status !== 'approved') {
    return { allowed: false, reason: 'first_revenue_quote_not_approved' };
  }

  return { allowed: true, reason: null };
}

export function isFirstRevenueTrackedResource({ loop = null, quote = null, resourceType, resourceId } = {}) {
  if (!loop?.quote_id || loop.legacy_blocked_at) return false;
  if (resourceType === 'quote') {
    return loop.quote_id === resourceId && quote?.id === resourceId;
  }
  if (resourceType === 'invoice') {
    return Boolean(loop.invoice_id && loop.invoice_id === resourceId);
  }
  return false;
}
