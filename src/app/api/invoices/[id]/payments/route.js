import { NextResponse } from 'next/server';
import {
  getRequestUser,
  mapSupabaseInvoice,
} from '../../../../lib/supabase';
import {
  createServiceSupabaseClient,
  ensureProfile,
  recordServerGrowthEvent,
  writeAuditLog,
} from '../../../../lib/supabase-service';
import { rateLimitAuthenticated } from '../../../../lib/rate-limit';
import { getIp, requestContextResponse } from '../../../../lib/security';
import { validateObject, validationResponse } from '../../../../lib/validation';
import { recordProductAnalyticsEvent } from '../../../../lib/product-analytics-server';

const RPC_ERROR_STATUS = {
  invoice_payment_exceeds_amount_due: 409,
  invoice_payment_idempotency_key_reused: 409,
  invoice_payment_currency_mismatch: 409,
  invoice_not_found: 404,
  invoice_payment_amount_invalid: 400,
  invoice_payment_source_invalid: 400,
  invoice_payment_idempotency_key_invalid: 400,
};

function rpcErrorResponse(error) {
  const code = Object.keys(RPC_ERROR_STATUS).find((candidate) => String(error?.message || '').includes(candidate));
  if (!code) return NextResponse.json({ error: 'Failed to record payment' }, { status: 500 });
  return NextResponse.json({ error: code }, { status: RPC_ERROR_STATUS[code] });
}

async function runNonBlockingPaymentSideEffects({ context, id, ip, amountCents, invoice }) {
  const effects = [
    ['audit log', () => writeAuditLog(context.supabase, {
      userId: context.user.id,
      action: 'invoice_payment_recorded',
      resourceType: 'invoice',
      resourceId: id,
      ip,
    })],
    ['growth event', () => recordServerGrowthEvent(context.supabase, {
      eventName: 'invoice_payment_recorded',
      userId: context.user.id,
      source: 'user',
      properties: { invoice_id: id, amount_cents: amountCents, payment_status: invoice.payment_status },
    })],
  ];

  if (invoice.payment_status === 'paid') {
    effects.push(['paid analytics', async () => {
      const profile = await ensureProfile(context.supabase, context.user);
      await recordProductAnalyticsEvent({
        eventName: 'Invoice Paid',
        userId: context.user.id,
        source: 'invoice_payment_api',
        properties: { user_id: context.user.id, plan: profile?.plan || 'free', invoice_id: id, total: invoice.total, currency: invoice.currency },
      });
    }]);
  }

  const results = await Promise.allSettled(effects.map(([, effect]) => effect()));
  results.forEach((result, index) => {
    if (result.status === 'rejected') console.error(`Payment ${effects[index][0]} failed after payment commit:`, result.reason);
  });
}

export async function POST(request, { params }) {
  try {
    const ip = getIp(request);
    const context = await getRequestUser(request);
    const contextFailure = requestContextResponse(context, 'invoice payments');
    if (contextFailure) return contextFailure;

    const limitResult = await rateLimitAuthenticated('invoiceApi', context.user.id);
    if (!limitResult.success) {
      return NextResponse.json({ error: limitResult.error || 'Too many requests' }, { status: limitResult.status || 429 });
    }

    const body = validateObject(await request.json());
    const amountCents = Number(body.amount_cents);
    if (!Number.isSafeInteger(amountCents) || amountCents <= 0) {
      return NextResponse.json({ error: 'amount_cents must be a positive integer' }, { status: 400 });
    }

    const idempotencyKey = String(body.idempotency_key || request.headers.get('idempotency-key') || '').trim();
    if (!idempotencyKey || idempotencyKey.length > 200) {
      return NextResponse.json({ error: 'Idempotency-Key header is required and must be at most 200 characters' }, { status: 400 });
    }

    const { id } = await params;
    const serviceSupabase = createServiceSupabaseClient();
    if (!serviceSupabase) {
      return NextResponse.json({ error: 'Invoice payment service is unavailable' }, { status: 503 });
    }

    const { data: existing, error: invoiceError } = await serviceSupabase
      .from('invoices')
      .select('id, currency, status, payment_status')
      .eq('id', id)
      .eq('user_id', context.user.id)
      .maybeSingle();
    if (invoiceError || !existing) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }
    if (existing.status === 'draft') {
      return NextResponse.json({ error: 'Invoice is not eligible for another payment' }, { status: 409 });
    }

    const currency = String(body.currency || existing.currency || 'USD').toUpperCase();
    const { data: invoice, error } = await serviceSupabase.rpc('record_invoice_payment', {
      p_user_id: context.user.id,
      p_invoice_id: id,
      p_amount_cents: amountCents,
      p_currency: currency,
      p_source: 'manual',
      p_received_at: new Date().toISOString(),
      p_idempotency_key: idempotencyKey,
    });
    if (error || !invoice) return rpcErrorResponse(error);

    await runNonBlockingPaymentSideEffects({ context, id, ip, amountCents, invoice });

    return NextResponse.json(mapSupabaseInvoice(invoice), { status: 201 });
  } catch (error) {
    const validation = validationResponse(error);
    if (validation) return validation;
    console.error('Error recording invoice payment:', error);
    return NextResponse.json({ error: 'Failed to record payment' }, { status: 500 });
  }
}
