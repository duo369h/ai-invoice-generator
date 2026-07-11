import {
  canAccessFirstRevenueQuotePortal,
  resolveFirstRevenueLoop,
} from '../../core/revenue/firstRevenueLoop';

export async function getFirstRevenueLoopContext(supabase, userId, plan) {
  if (String(plan || '').toLowerCase() !== 'free') {
    return {
      loop: null,
      quote: null,
      invoice: null,
      decision: resolveFirstRevenueLoop({ plan }),
    };
  }

  const { data: loop, error: loopError } = await supabase
    .from('first_revenue_loops')
    .select('user_id, quote_id, invoice_id, legacy_blocked_at')
    .eq('user_id', userId)
    .maybeSingle();
  if (loopError) throw loopError;

  let quote = null;
  if (loop?.quote_id) {
    const { data, error } = await supabase
      .from('quotes')
      .select('*')
      .eq('id', loop.quote_id)
      .eq('user_id', userId)
      .maybeSingle();
    if (error) throw error;
    quote = data;
  }

  let invoice = null;
  if (loop?.invoice_id) {
    const { data, error } = await supabase
      .from('invoices')
      .select('*')
      .eq('id', loop.invoice_id)
      .eq('user_id', userId)
      .maybeSingle();
    if (error) throw error;
    invoice = data;
  }

  return {
    loop,
    quote,
    invoice,
    decision: resolveFirstRevenueLoop({ plan, loop, quote, invoice }),
  };
}

export function isFirstRevenueQuotePortalResource(loopContext, resourceType, resourceId, plan) {
  return canAccessFirstRevenueQuotePortal({
    plan,
    loop: loopContext?.loop,
    quote: loopContext?.quote,
    resourceType,
    resourceId,
  });
}

export function serializeFirstRevenueLoop(decision) {
  return {
    stage: decision.stage,
    quote_id: decision.quoteId,
    invoice_id: decision.invoiceId,
    can_create_quote: decision.canCreateQuote,
    can_send_quote: decision.canSendQuote,
    can_open_quote_portal: decision.canOpenQuotePortal,
    can_create_invoice_draft: decision.canCreateInvoiceDraft,
    can_prepare_payment: decision.canPreparePayment,
  };
}
