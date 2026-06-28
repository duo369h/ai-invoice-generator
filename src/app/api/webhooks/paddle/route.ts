import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { createServiceSupabaseClient } from '../../../lib/supabase';

function getUserEntitlements(plan: string) {
  if (plan === 'growth') {
    return {
      export_pdf: true,
      client_portal: true,
      crm: true,
      automation: false,
      advanced_invoicing: true,
      unlimited_invoices: true,
    };
  }

  if (plan === 'studio' || plan === 'agency') {
    return {
      export_pdf: true,
      client_portal: true,
      crm: true,
      automation: true,
      advanced_invoicing: true,
      unlimited_invoices: true,
    };
  }

  return {
    export_pdf: false,
    client_portal: false,
    crm: false,
    automation: false,
    advanced_invoicing: false,
    unlimited_invoices: false,
  };
}

// Timing-safe Paddle webhook signature verification helper
function verifyPaddleSignature(signatureHeader: string | null, rawBody: string, webhookSecret: string | undefined): boolean {
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

  // Prevent replay attacks (allow up to 5 minutes timestamp drift)
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

/**
 * Resolve plan key from a Paddle price ID.
 * Checks only env-var-configured price IDs. Unknown IDs must not grant access.
 */
function resolvePlanFromPriceId(priceId: string): string | null {
  if (!priceId) return null;
  // Studio / Agency tier
  const studioIds = [
    process.env.NEXT_PUBLIC_PADDLE_AGENCY_PRICE_ID,
    process.env.NEXT_PUBLIC_PADDLE_AGENCY_YEARLY_PRICE_ID,
    process.env.NEXT_PUBLIC_PADDLE_STUDIO_PRICE_ID,
    process.env.NEXT_PUBLIC_PADDLE_STUDIO_YEARLY_PRICE_ID,
  ].filter(Boolean) as string[];

  if (studioIds.includes(priceId)) {
    return 'studio';
  }

  // Growth tier
  const growthIds = [
    process.env.NEXT_PUBLIC_PADDLE_GROWTH_PRICE_ID,
    process.env.NEXT_PUBLIC_PADDLE_GROWTH_YEARLY_PRICE_ID,
  ].filter(Boolean) as string[];

  if (growthIds.includes(priceId)) {
    return 'growth';
  }

  // Pro tier
  const proIds = [
    process.env.NEXT_PUBLIC_PADDLE_PRO_PRICE_ID,
    process.env.NEXT_PUBLIC_PADDLE_PRO_YEARLY_PRICE_ID,
  ].filter(Boolean) as string[];

  if (proIds.includes(priceId)) {
    return 'pro';
  }

  console.error(`[Paddle Webhook] Unknown price ID "${priceId}" — refusing entitlement update.`);
  return null;
}

export async function POST(request: Request) {
  try {
    const signature = request.headers.get('paddle-signature');
    const rawBody = await request.text();
    const secret = process.env.PADDLE_WEBHOOK_SECRET;

    // Verify Paddle Webhook Signature
    const isProd = process.env.NODE_ENV === 'production';
    if (secret || isProd) {
      if (!signature) {
        console.error('Missing Paddle-Signature header');
        return NextResponse.json({ error: 'Missing signature' }, { status: 401 });
      }
      const isValid = verifyPaddleSignature(signature, rawBody, secret);
      if (!isValid) {
        console.error('Invalid Paddle webhook signature');
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
      }
    } else {
      console.warn('Paddle webhook secret is not set, skipping signature validation in development');
    }

    const payload = JSON.parse(rawBody);
    const eventType = payload.event_type;
    const data = payload.data;

    if (!eventType || !data) {
      return NextResponse.json({ error: 'Malformed request payload' }, { status: 400 });
    }

    console.log(`Processing Paddle webhook event: ${eventType} (ID: ${payload.event_id})`);

    // ── Allowlist: only process events we understand ───────────────────────────
    const HANDLED_EVENTS = [
      'subscription.created',
      'subscription.updated',
      'subscription.activated',
      'subscription.canceled',
      'subscription.paused',
      'subscription.resumed',
      'transaction.completed',
      'payment.completed',
    ];

    if (!HANDLED_EVENTS.includes(eventType)) {
      console.log(`[Paddle Webhook] Unhandled event type "${eventType}" — acknowledged without processing.`);
      return NextResponse.json({ received: true, processed: false });
    }

    const supabase = createServiceSupabaseClient();
    if (!supabase) {
      console.error('Supabase admin client not initialized');
      return NextResponse.json({ error: 'Supabase admin client not initialized' }, { status: 500 });
    }

    // Idempotency Check using event_id
    const { data: existingEvent, error: findEventError } = await supabase
      .from('billing_events')
      .select('id')
      .eq('event_id', payload.event_id)
      .maybeSingle();

    if (findEventError) {
      console.warn('Idempotency check lookup query failed:', findEventError.message);
    }

    if (existingEvent) {
      console.log(`Duplicate webhook event ignored: ${payload.event_id}`);
      return NextResponse.json({ received: true, duplicate: true });
    }

    // Resolve user ID
    const customData = data.custom_data || {};
    const userId = customData.user_id || customData.userId;
    const customerId = data.customer_id || (data.customer && data.customer.id);

    let resolvedUserId = userId;

    if (!resolvedUserId && customerId) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('paddle_customer_id', customerId)
        .maybeSingle();
      if (profile) {
        resolvedUserId = profile.id;
      }
    }

    if (!resolvedUserId) {
      const email = data.customer?.email ||
                    data.details?.customer?.email ||
                    data.customer_email ||
                    (payload.customer && payload.customer.email);
      if (email) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('id')
          .eq('email', email)
          .maybeSingle();
        if (profile) {
          resolvedUserId = profile.id;
        }
      }
    }

    if (!resolvedUserId) {
      console.error(`Could not resolve user_id for Paddle webhook event ${payload.event_id}`);
      return NextResponse.json({ error: 'Could not resolve user_id' }, { status: 400 });
    }

    // ── Determine target plan from subscription status ─────────────────────────
    const subId = data.subscription_id || data.id;
    const status = data.status || 'active';

    // Cancellation / pause events always downgrade to free regardless of price ID
    const isCancellationEvent = ['subscription.canceled', 'subscription.paused'].includes(eventType);
    const isActiveStatus = ['active', 'trialing'].includes(status) || eventType === 'transaction.completed' || eventType === 'payment.completed';
    const priceId = data.items?.[0]?.price?.id || '';
    const plan = isCancellationEvent ? 'free' : resolvePlanFromPriceId(priceId);

    if (!isCancellationEvent && !plan) {
      return NextResponse.json({ error: 'Unknown Paddle price ID' }, { status: 400 });
    }

    const targetPlan = (isCancellationEvent || !isActiveStatus) ? 'free' : plan;

    if (isCancellationEvent) {
      console.log(`[Paddle Webhook] ${eventType} — downgrading user ${resolvedUserId} to free plan.`);
    }

    const periodStart = data.current_period_active_from || data.current_period_start;
    const periodEnd = data.current_period_active_to || data.current_period_end;

    // 1. Update profiles table
    const { error: profileError } = await supabase
      .from('profiles')
      .update({
        plan: targetPlan,
        paddle_customer_id: customerId || '',
        updated_at: new Date().toISOString()
      })
      .eq('id', resolvedUserId);

    if (profileError) throw profileError;

    // 2. Update subscriptions table
    const { data: existingSub } = await supabase
      .from('subscriptions')
      .select('id')
      .eq('user_id', resolvedUserId)
      .maybeSingle();

    const subPayload = {
      paddle_subscription_id: subId || '',
      price_id: priceId || '',
      plan: targetPlan,
      status: status,
      current_period_start: periodStart ? new Date(periodStart).toISOString() : null,
      current_period_end: periodEnd ? new Date(periodEnd).toISOString() : null,
      updated_at: new Date().toISOString()
    };

    if (existingSub) {
      const { error: updateSubError } = await supabase
        .from('subscriptions')
        .update(subPayload)
        .eq('id', existingSub.id);
      if (updateSubError) throw updateSubError;
    } else {
      const { error: insertSubError } = await supabase
        .from('subscriptions')
        .insert({
          user_id: resolvedUserId,
          ...subPayload
        });
      if (insertSubError) throw insertSubError;
    }

    // 3. Update entitlements table
    const entitlementsPayload = getUserEntitlements(targetPlan);
    const { data: existingEnt } = await supabase
      .from('entitlements')
      .select('id')
      .eq('user_id', resolvedUserId)
      .maybeSingle();

    const entPayload = {
      plan: targetPlan,
      export_pdf: entitlementsPayload.export_pdf,
      client_portal: entitlementsPayload.client_portal,
      crm: entitlementsPayload.crm,
      automation: entitlementsPayload.automation,
      advanced_invoicing: entitlementsPayload.advanced_invoicing,
      unlimited_invoices: entitlementsPayload.unlimited_invoices,
      updated_at: new Date().toISOString()
    };

    if (existingEnt) {
      const { error: updateEntError } = await supabase
        .from('entitlements')
        .update(entPayload)
        .eq('id', existingEnt.id);
      if (updateEntError) throw updateEntError;
    } else {
      const { error: insertEntError } = await supabase
        .from('entitlements')
        .insert({
          user_id: resolvedUserId,
          ...entPayload
        });
      if (insertEntError) throw insertEntError;
    }

    // 4. Log billing audit event (using event_id as the unique column)
    const { error: logError } = await supabase
      .from('billing_events')
      .insert({
        event_type: eventType,
        event_id: payload.event_id,
        user_id: resolvedUserId,
        payload: payload,
        created_at: new Date().toISOString()
      });

    if (logError) {
      console.error('Failed to log billing event:', logError.message);
    }

    console.log(`Successfully synced subscription status: User ${resolvedUserId} is now plan "${targetPlan}" (event: ${eventType})`);

    return NextResponse.json({ received: true });
  } catch (err: any) {
    console.error('Error handling Paddle webhook:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
