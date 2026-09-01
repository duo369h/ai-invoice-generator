import { NextResponse } from 'next/server';
import { getRequestUser } from '../../../../lib/supabase';
import {
  createServiceSupabaseClient,
  createSupabasePortalToken,
  writeAuditLog,
  recordServerGrowthEvent,
  trackProfileMetric,
} from '../../../../lib/supabase-service';
import { rateLimitAuthenticated } from '../../../../lib/rate-limit';
import { authRequiredResponse, getIp, requestContextResponse } from '../../../../lib/security';
import { recordProductAnalyticsEvent } from '../../../../lib/product-analytics-server';
import { getSiteUrl } from '../../../../lib/config';
import { getUserEntitlements } from '../../../../../../lib/entitlements';
import { sendQuoteSentEmail } from '../../../../lib/email';

const DRAFT_STATUS = 'draft';

function quoteNotFoundResponse() {
  return NextResponse.json({ error: 'Quote not found' }, { status: 404 });
}

function quoteNotEligibleResponse() {
  return NextResponse.json({
    error: 'Only draft Quotes can be sent for the first delivery.',
    code: 'QUOTE_SEND_NOT_ELIGIBLE',
  }, { status: 409 });
}

function quoteRecipientRequiredResponse() {
  return NextResponse.json({
    error: 'A valid recipient email is required before sending this Quote.',
    code: 'QUOTE_RECIPIENT_EMAIL_REQUIRED',
  }, { status: 400 });
}

function quoteDeliveryFailedResponse() {
  return NextResponse.json({
    error: 'Quote delivery failed. The Quote remains a draft.',
    code: 'QUOTE_DELIVERY_FAILED',
  }, { status: 502 });
}

function statusUpdateFailedResponse() {
  return NextResponse.json({
    error: 'Quote delivery succeeded, but the Quote status could not be updated.',
    code: 'DELIVERY_SUCCEEDED_STATUS_UPDATE_FAILED',
  }, { status: 500 });
}

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || '').trim());
}

export async function POST(request, { params }) {
  let deliverySucceeded = false;
  try {
    const ip = getIp(request);
    const context = await getRequestUser(request);
    const contextFailure = requestContextResponse(context, 'quote send');
    if (contextFailure) return contextFailure;

    const limitResult = await rateLimitAuthenticated('invoiceApi', context.user.id);
    if (!limitResult.success) {
      return NextResponse.json({ error: limitResult.error || 'Too many requests' }, { status: limitResult.status || 429 });
    }

    const { id } = await params;
    if (!id) return quoteNotFoundResponse();

    const serviceSupabase = createServiceSupabaseClient();
    if (!serviceSupabase) {
      return NextResponse.json({ error: 'Quote service is unavailable' }, { status: 503 });
    }

    const { data: quote, error: quoteError } = await serviceSupabase
      .from('quotes')
      .select('*')
      .eq('id', id)
      .eq('user_id', context.user.id)
      .maybeSingle();
    if (quoteError) throw quoteError;
    if (!quote) return quoteNotFoundResponse();
    if (quote.status !== DRAFT_STATUS) return quoteNotEligibleResponse();
    if (!isValidEmail(quote.client_email)) return quoteRecipientRequiredResponse();

    const { data: profile, error: profileError } = await serviceSupabase
      .from('profiles')
      .select('plan, name, email')
      .eq('id', context.user.id)
      .maybeSingle();
    if (profileError) throw profileError;
    const plan = profile?.plan || 'free';
    const entitlements = getUserEntitlements(plan);
    let portalUrl = null;
    if (entitlements.client_portal) {
      const { error: revokeError } = await serviceSupabase
        .from('portal_tokens')
        .update({ revoked_at: new Date().toISOString() })
        .eq('resource_id', quote.id)
        .eq('resource_type', 'quote')
        .eq('owner_id', context.user.id)
        .is('revoked_at', null);
      if (revokeError) throw revokeError;

      const portalToken = await createSupabasePortalToken(context.supabase, {
        ownerId: context.user.id,
        resourceType: 'quote',
        resourceId: quote.id,
      });
      if (portalToken) portalUrl = `${getSiteUrl()}/portal/${portalToken}`;
    }

    const replyTo = profile?.email || context.user.email || '';
    let mailResult;
    try {
      mailResult = await sendQuoteSentEmail(
        quote.client_email,
        quote,
        portalUrl,
        profile?.name || context.user.user_metadata?.name || context.user.email?.split('@')[0] || 'Photographer',
        replyTo,
      );
    } catch (mailError) {
      console.error('Quote delivery provider error:', mailError?.message || 'unknown provider error');
      return quoteDeliveryFailedResponse();
    }
    if (!mailResult?.success) return quoteDeliveryFailedResponse();
    deliverySucceeded = true;

    const { data: sentQuote, error: statusError } = await serviceSupabase
      .from('quotes')
      .update({ status: 'sent', updated_at: new Date().toISOString() })
      .eq('id', quote.id)
      .eq('user_id', context.user.id)
      .eq('status', DRAFT_STATUS)
      .select('*')
      .maybeSingle();
    if (statusError || !sentQuote) {
      console.error('Quote delivery succeeded but status transition failed:', statusError?.message || 'no row updated');
      return statusUpdateFailedResponse();
    }

    await writeAuditLog(context.supabase, {
      userId: context.user.id,
      action: 'quote_status_changed',
      resourceType: 'quote',
      resourceId: sentQuote.id,
      ip,
    });
    await trackProfileMetric(context.supabase, context.user.id, 'quote_sent_timestamp');
    await recordServerGrowthEvent(context.supabase, {
      eventName: 'quote_sent',
      userId: context.user.id,
      source: 'user',
      properties: {
        quote_id: sentQuote.id,
        quote_number: sentQuote.quote_number,
        client_email: sentQuote.client_email,
      },
    });
    try {
      await recordProductAnalyticsEvent({
        eventName: 'Quote Sent',
        userId: context.user.id,
        source: 'quotes_api',
        properties: {
          identity: context.user.id,
          user_id: context.user.id,
          plan,
          country: '',
          quote_id: sentQuote.id,
          quote_number: sentQuote.quote_number,
          source: 'quotes_api',
          timestamp: new Date().toISOString(),
        },
      });
    } catch (analyticsError) {
      console.error('Failed to record Quote Sent analytics:', analyticsError);
    }

    return NextResponse.json({ data: sentQuote });
  } catch (error) {
    if (deliverySucceeded) return statusUpdateFailedResponse();
    console.error('Error sending Quote:', error?.message || 'unknown error');
    return NextResponse.json({ error: 'Failed to send Quote' }, { status: 500 });
  }
}
