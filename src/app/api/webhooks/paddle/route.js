import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { createServiceSupabaseClient } from '../../../lib/supabase';
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

  const proIds = [
    process.env.NEXT_PUBLIC_PADDLE_PRO_PRICE_ID,
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
      'payment.completed',
    ];

    if (!handledEvents.includes(eventType)) {
      return NextResponse.json({ received: true, processed: false });
    }

    const supabase = createServiceSupabaseClient();
    if (!supabase) {
      return NextResponse.json({ error: 'Supabase admin client not initialized' }, { status: 500 });
    }

    const { data: existingEvent, error: findEventError } = await supabase
      .from('billing_events')
      .select('id')
      .eq('event_id', payload.event_id)
      .maybeSingle();

    if (findEventError) {
      console.warn('Paddle idempotency lookup failed:', findEventError.message);
    }

    if (existingEvent) {
      return NextResponse.json({ received: true, duplicate: true });
    }

    const resolvedUserId = await resolveUserId(supabase, data, payload);
    if (!resolvedUserId) {
      return NextResponse.json({ error: 'Could not resolve user_id' }, { status: 400 });
    }

    const status = data.status || 'active';
    const isCancellationEvent = ['subscription.canceled', 'subscription.paused'].includes(eventType);
    const isActiveStatus =
      ['active', 'trialing'].includes(status) ||
      eventType === 'transaction.completed' ||
      eventType === 'payment.completed';
    const priceId = extractPriceId(data);
    const plan = isCancellationEvent ? 'free' : resolvePlanFromPriceId(priceId);

    if (!isCancellationEvent && !plan) {
      return NextResponse.json({ error: 'Unknown Paddle price ID' }, { status: 400 });
    }

    const targetPlan = (isCancellationEvent || !isActiveStatus) ? 'free' : plan;
    const customerId = data.customer_id || data.customer?.id || '';
    const subId = data.subscription_id || data.id || '';
    const periodStart = data.current_period_active_from || data.current_period_start;
    const periodEnd = data.current_period_active_to || data.current_period_end;

    const { error: profileError } = await supabase
      .from('profiles')
      .update({
        plan: targetPlan,
        paddle_customer_id: customerId,
        updated_at: new Date().toISOString(),
      })
      .eq('id', resolvedUserId);

    if (profileError) throw profileError;

    const { data: existingSub } = await supabase
      .from('subscriptions')
      .select('id')
      .eq('user_id', resolvedUserId)
      .maybeSingle();

    const subPayload = {
      paddle_subscription_id: subId,
      price_id: priceId,
      paddle_price_id: priceId,
      plan: targetPlan,
      status,
      current_period_start: periodStart ? new Date(periodStart).toISOString() : null,
      current_period_end: periodEnd ? new Date(periodEnd).toISOString() : null,
      updated_at: new Date().toISOString(),
    };

    if (existingSub) {
      const { error } = await supabase
        .from('subscriptions')
        .update(subPayload)
        .eq('id', existingSub.id);
      if (error) throw error;
    } else {
      const { error } = await supabase
        .from('subscriptions')
        .insert({ user_id: resolvedUserId, ...subPayload });
      if (error) throw error;
    }

    const entitlementsPayload = getUserEntitlements(targetPlan);
    const { data: existingEnt } = await supabase
      .from('entitlements')
      .select('id')
      .eq('user_id', resolvedUserId)
      .maybeSingle();

    const entPayload = {
      plan: targetPlan,
      ...entitlementsPayload,
      updated_at: new Date().toISOString(),
    };

    if (existingEnt) {
      const { error } = await supabase
        .from('entitlements')
        .update(entPayload)
        .eq('id', existingEnt.id);
      if (error) throw error;
    } else {
      const { error } = await supabase
        .from('entitlements')
        .insert({ user_id: resolvedUserId, ...entPayload });
      if (error) throw error;
    }

    const { error: logError } = await supabase
      .from('billing_events')
      .insert({
        event_type: eventType,
        event_id: payload.event_id,
        user_id: resolvedUserId,
        payload,
        created_at: new Date().toISOString(),
      });

    if (logError) {
      console.error('Failed to log Paddle billing event:', logError.message);
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error('Error handling Paddle webhook:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
