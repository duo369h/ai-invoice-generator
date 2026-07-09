/**
 * Corvioz Real Behavior Capture Layer — Backend Event Ingestion
 * Sprint C Phase 2.6
 *
 * POST /api/events/track
 *
 * Receives an analytics event payload and persists it to Supabase.
 * No processing, no scoring, no business logic.
 * Fire-and-forget endpoint.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const VALID_EVENTS = new Set([
  'LANDING_VIEW',
  'CTA_CLICK',
  'SCROLL_DEPTH_50',
  'SCROLL_DEPTH_90',
  'PRICING_VIEW',
  'PLAN_HOVER',
  'PLAN_SELECTED',
  'CHECKOUT_STARTED',
  'SIGNUP_STARTED',
  'SIGNUP_COMPLETED',
  'DASHBOARD_ENTERED',
  'FIRST_ACTION_TAKEN',
  'TEMPLATE_VIEWED',
  'QUOTE_CREATED_INTENT',
  'signup_to_first_quote_completed',
  'INVOICE_CREATED_INTENT',
  'FIRST_VALUE_CREATED',
  'ONBOARDING_DROPOFF',
]);

function getServiceSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  // Prefer service role key; fall back to anon key for dev environments
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { event, sessionId, userId, metadata, timestamp } = body;

    // Validate event name against canonical allow-list
    if (!event || !VALID_EVENTS.has(event)) {
      return NextResponse.json({ error: 'invalid_event' }, { status: 400 });
    }

    const supabase = getServiceSupabase();
    if (!supabase) {
      // Supabase not configured — accept the request but skip DB write
      return NextResponse.json({ ok: true, stored: false }, { status: 202 });
    }

    const { error } = await supabase.from('analytics_events').insert({
      event,
      user_id: userId ?? null,
      session_id: sessionId ?? null,
      metadata: metadata ?? null,
      created_at: timestamp ? new Date(timestamp).toISOString() : new Date().toISOString(),
    });

    if (error) {
      // Table may not exist yet — don't 500, return 202 with warning
      console.warn('[events/track] Supabase insert skipped:', error.message);
      return NextResponse.json({ ok: true, stored: false, reason: error.message }, { status: 202 });
    }

    return NextResponse.json({ ok: true, stored: true }, { status: 202 });
  } catch (err) {
    console.error('[events/track] Unexpected error:', err);
    return NextResponse.json({ error: 'internal' }, { status: 500 });
  }
}
