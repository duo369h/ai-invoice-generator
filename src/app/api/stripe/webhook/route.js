import crypto from 'crypto';
import { NextResponse } from 'next/server';
import { createServiceSupabaseClient, writeAuditLog } from '../../../lib/supabase';
import { getIp } from '../../../lib/security';

function timingSafeEqual(a, b) {
  const left = Buffer.from(a || '', 'utf8');
  const right = Buffer.from(b || '', 'utf8');
  return left.length === right.length && crypto.timingSafeEqual(left, right);
}

function verifyStripeSignature(payload, signatureHeader, secret) {
  if (!signatureHeader || !secret) return false;
  const parts = Object.fromEntries(
    signatureHeader.split(',').map((part) => {
      const [key, value] = part.split('=');
      return [key, value];
    })
  );

  if (!parts.t || !parts.v1) return false;
  const signedPayload = `${parts.t}.${payload}`;
  const expected = crypto.createHmac('sha256', secret).update(signedPayload).digest('hex');
  return timingSafeEqual(expected, parts.v1);
}

function planFromPriceId(priceId) {
  if (!priceId) return 'free';
  if (priceId === process.env.STRIPE_AGENCY_PRICE_ID) return 'agency';
  if (priceId === process.env.STRIPE_PRO_PRICE_ID) return 'pro';
  return 'pro';
}

function statusToPlan(status, priceId) {
  return status === 'active' || status === 'trialing' ? planFromPriceId(priceId) : 'free';
}

async function findUserId(serviceSupabase, object) {
  const metadataUserId = object?.metadata?.user_id || object?.client_reference_id;
  if (metadataUserId) return metadataUserId;

  const customerId = object?.customer;
  if (!customerId) return '';

  const { data } = await serviceSupabase
    .from('profiles')
    .select('id')
    .eq('stripe_customer_id', customerId)
    .maybeSingle();

  return data?.id || '';
}

async function upsertSubscription(serviceSupabase, {
  userId,
  customerId,
  subscriptionId,
  priceId,
  status,
  currentPeriodEnd,
}) {
  const plan = statusToPlan(status, priceId);

  await serviceSupabase
    .from('profiles')
    .update({
      plan,
      stripe_customer_id: customerId || '',
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId);

  const payload = {
    user_id: userId,
    stripe_customer_id: customerId || '',
    stripe_subscription_id: subscriptionId || '',
    price_id: priceId || '',
    plan,
    status: status || 'canceled',
    current_period_end: currentPeriodEnd ? new Date(currentPeriodEnd * 1000).toISOString() : null,
    updated_at: new Date().toISOString(),
  };

  const { data: existing } = await serviceSupabase
    .from('subscriptions')
    .select('id')
    .eq('user_id', userId)
    .maybeSingle();

  if (existing) {
    await serviceSupabase
      .from('subscriptions')
      .update(payload)
      .eq('id', existing.id)
      .eq('user_id', userId);
    return;
  }

  await serviceSupabase.from('subscriptions').insert(payload);
}

async function handleSubscriptionObject(serviceSupabase, object, ip) {
  const userId = await findUserId(serviceSupabase, object);
  if (!userId) return;

  const item = object?.items?.data?.[0];
  await upsertSubscription(serviceSupabase, {
    userId,
    customerId: object.customer,
    subscriptionId: object.id,
    priceId: item?.price?.id || object?.metadata?.price_id || '',
    status: object.status,
    currentPeriodEnd: object.current_period_end,
  });

  await writeAuditLog(serviceSupabase, {
    userId,
    action: 'subscription_changed',
    resourceType: 'subscription',
    resourceId: null,
    ip,
  });
}

async function handleCheckoutCompleted(serviceSupabase, object, ip) {
  const userId = await findUserId(serviceSupabase, object);
  if (!userId || !object.subscription) return;

  await upsertSubscription(serviceSupabase, {
    userId,
    customerId: object.customer,
    subscriptionId: object.subscription,
    priceId: object.metadata?.price_id || '',
    status: 'active',
    currentPeriodEnd: null,
  });

  await writeAuditLog(serviceSupabase, {
    userId,
    action: 'subscription_changed',
    resourceType: 'subscription',
    resourceId: null,
    ip,
  });
}

export async function POST(request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  const serviceSupabase = createServiceSupabaseClient();
  if (!secret || !serviceSupabase) {
    return NextResponse.json({ error: 'Stripe webhook is not configured' }, { status: 503 });
  }

  const payload = await request.text();
  const signature = request.headers.get('stripe-signature');
  if (!verifyStripeSignature(payload, signature, secret)) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  const event = JSON.parse(payload);
  const object = event?.data?.object;
  const ip = getIp(request);

  if (event.type === 'checkout.session.completed') {
    await handleCheckoutCompleted(serviceSupabase, object, ip);
  }

  if (
    event.type === 'customer.subscription.updated' ||
    event.type === 'customer.subscription.deleted' ||
    event.type === 'invoice.payment_failed'
  ) {
    await handleSubscriptionObject(serviceSupabase, object, ip);
  }

  return NextResponse.json({ received: true });
}
