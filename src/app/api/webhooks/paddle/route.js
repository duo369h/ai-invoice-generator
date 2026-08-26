import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { createServiceSupabaseClient } from '../../../lib/supabase-service';
import { getUserEntitlements } from '../../../../../lib/entitlements';

function verifyPaddleSignature(signatureHeader, rawBody, webhookSecret) {
  if (!signatureHeader || !rawBody || !webhookSecret) {
    return false;
  }

  const parts = signatureHeader.split(';');
  let ts = '';
  let h1 = '';

  for (const part of parts) {
    const [key, val] = part.split('=');
    if (key === 'ts') ts = val;
    if (key === 'h1') h1 = val;
  }

  if (!ts || !h1) {
    return false;
  }

  const parsedTs = parseInt(ts, 10);
  const now = Math.floor(Date.now() / 1000);
  if (Math.abs(now - parsedTs) > 300) {
    return false;
  }

  const payload = `${ts}:${rawBody}`;
  const computedHash = crypto
    .createHmac('sha256', webhookSecret)
    .update(payload)
    .digest('hex');

  try {
    return crypto.timingSafeEqual(
      Buffer.from(computedHash, 'hex'),
      Buffer.from(h1, 'hex')
    );
  } catch {
    return false;
  }
}

function resolvePlanFromPriceId(priceId) {
  if (!priceId) return null;

  const studioIds = [
    process.env.NEXT_PUBLIC_PADDLE_STUDIO_PRICE_ID,
    process.env.NEXT_PUBLIC_PADDLE_STUDIO_YEARLY_PRICE_ID,
  ].filter(Boolean);

  if (studioIds.includes(priceId)) {
    return 'studio';
  }

  const canonicalProMonthlyId = process.env.NEXT_PUBLIC_PADDLE_PRO_MONTHLY_PRICE_ID?.trim() || '';
  const legacyProMonthlyId = process.env.NEXT_PUBLIC_PADDLE_PRO_PRICE_ID?.trim() || '';
  const hasConflictingProMonthlyIds =
    Boolean(canonicalProMonthlyId) &&
    Boolean(legacyProMonthlyId) &&
    canonicalProMonthlyId !== legacyProMonthlyId;

  if (hasConflictingProMonthlyIds) {
    console.error('[Paddle Webhook] Conflicting Pro monthly price IDs - refusing monthly resolution.');
  }

  const proMonthlyId = hasConflictingProMonthlyIds
    ? null
    : (canonicalProMonthlyId || legacyProMonthlyId);
  const proIds = [
    proMonthlyId,
    process.env.NEXT_PUBLIC_PADDLE_PRO_YEARLY_PRICE_ID,
  ].filter(Boolean);

  if (proIds.includes(priceId)) {
    return 'pro';
  }

  const starterIds = [
    process.env.NEXT_PUBLIC_PADDLE_STARTER_PRICE_ID,
    process.env.NEXT_PUBLIC_PADDLE_STARTER_YEARLY_PRICE_ID,
  ].filter(Boolean);

  if (starterIds.includes(priceId)) {
    return 'starter';
  }

  console.error(`[Paddle Webhook] Unknown price ID "${priceId}" - refusing entitlement update.`);
  return null;
}

function extractPriceId(data) {
  return (
    data?.items?.[0]?.price?.id ||
    data?.items?.[0]?.price_id ||
    data?.details?.line_items?.[0]?.price_id ||
    ''
  );
}

async function resolveUserId(supabase, data, payload) {
  const customData = data?.custom_data || {};
  const explicitUserId = customData.user_id || customData.userId;
  if (explicitUserId) return explicitUserId;

  const customerId = data?.customer_id || data?.customer?.id;
  if (customerId) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('paddle_customer_id', customerId)
      .maybeSingle();
    if (profile?.id) return profile.id;
  }

  const email =
    data?.customer?.email ||
    data?.details?.customer?.email ||
    data?.customer_email ||
    payload?.customer?.email;

  if (email) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', email)
      .maybeSingle();
    if (profile?.id) return profile.id;
  }

  return null;
}

export async function POST(request) {
  try {
    const signature = request.headers.get('paddle-signature');
    const rawBody = await request.text();
    const secret = process.env.PADDLE_WEBHOOK_SECRET;

    if (secret || process.env.NODE_ENV === 'production') {
      if (!signature) {
        return NextResponse.json({ error: 'Missing signature' }, { status: 401 });
      }
      if (!verifyPaddleSignature(signature, rawBody, secret)) {
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
      }
    }

    const payload = JSON.parse(rawBody);
    const eventType = payload.event_type;
    const data = payload.data;

    if (!eventType || !data) {
      return NextResponse.json({ error: 'Malformed request payload' }, { status: 400 });
    }

    const handledEvents = [
      'subscription.created',
      'subscription.updated',
      'subscription.activated',
      'subscription.canceled',
      'subscription.paused',
      'subscription.resumed',
      'transaction.completed',
    ];

    if (!handledEvents.includes(eventType)) {
      return NextResponse.json({ received: true, processed: false });
    }

    const supabase = createServiceSupabaseClient();
    if (!supabase) {
      return NextResponse.json({ error: 'Supabase admin client not initialized' }, { status: 500 });
    }

    if (!payload.event_id) {
      return NextResponse.json({ error: 'Missing event_id' }, { status: 400 });
    }

    const resolvedUserId = await resolveUserId(supabase, data, payload);
    if (!resolvedUserId) {
      return NextResponse.json({ error: 'Could not resolve user_id' }, { status: 400 });
    }

    // Paddle transaction.completed is the settlement signal for checkout.
    // Never persist Paddle's terminal transaction status as subscription status.
    const status = eventType === 'transaction.completed'
      ? 'active'
      : eventType === 'subscription.paused'
        ? 'paused'
        : eventType === 'subscription.resumed'
          ? 'active'
          : (data.status || 'active');
    const isDowngradeEvent =
      ['subscription.canceled', 'subscription.paused'].includes(eventType) ||
      ['canceled', 'paused', 'past_due', 'incomplete', 'unpaid'].includes(status);
    const priceId = extractPriceId(data);
    const plan = isDowngradeEvent ? 'free' : resolvePlanFromPriceId(priceId);

    if (!isDowngradeEvent && !plan) {
      return NextResponse.json({ error: 'Unknown Paddle price ID' }, { status: 400 });
    }

    const targetPlan = isDowngradeEvent ? 'free' : plan;
    const customerId = data.customer_id || data.customer?.id || '';
    const subId = data.subscription_id || data.id || '';
    const periodStart =
      data.current_billing_period?.starts_at ||
      data.current_period_active_from ||
      data.current_period_start;
    const periodEnd =
      data.current_billing_period?.ends_at ||
      data.current_period_active_to ||
      data.current_period_end;
    const billingInterval =
      data.billing_cycle?.interval === 'month'
        ? 'monthly'
        : data.billing_cycle?.interval === 'year'
          ? 'yearly'
          : null;

    const entitlementsPayload = getUserEntitlements(targetPlan);
    const occurredAtValue = payload.occurred_at || data.occurred_at || data.updated_at;
    const occurredAt = occurredAtValue ? new Date(occurredAtValue) : new Date();
    if (Number.isNaN(occurredAt.getTime())) {
      return NextResponse.json({ error: 'Invalid occurred_at' }, { status: 400 });
    }

    const { data: result, error: applyError } = await supabase.rpc('apply_paddle_webhook_event', {
      p_event_id: payload.event_id,
      p_event_type: eventType,
      p_user_id: resolvedUserId,
      p_customer_id: customerId,
      p_subscription_id: subId,
      p_price_id: priceId,
      p_plan: targetPlan,
      p_status: status,
      p_billing_interval: billingInterval,
      p_period_start: periodStart || null,
      p_period_end: periodEnd || null,
      p_occurred_at: occurredAt.toISOString(),
      p_payload: payload,
      ...Object.fromEntries(Object.entries(entitlementsPayload).map(([key, value]) => [`p_${key}`, value])),
    });

    if (applyError) throw applyError;

    return NextResponse.json({ received: true, ...result });
  } catch (err) {
    console.error('Error handling Paddle webhook:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
