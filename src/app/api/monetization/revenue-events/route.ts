import { NextResponse } from 'next/server';
import { createServiceSupabaseClient, isSupabaseConfigured } from '../../../lib/supabase';
import { requireInternalAdmin } from '../../../lib/internal-admin';

function cleanString(value: any, max = 500): string {
  if (typeof value !== 'string') return '';
  return value.slice(0, max);
}

export async function POST(request: Request) {
  try {
    const gate = await requireInternalAdmin(request);
    if (gate.response) return gate.response;
    const authUserId = gate.context.user.id;

    const body = await request.json().catch(() => ({}));
    
    const eventName = cleanString(body.event_name, 100);
    const sessionId = cleanString(body.session_id, 120);
    const pagePath = cleanString(body.page_path, 500);
    const triggerType = cleanString(body.trigger_type, 50);
    const targetPlan = cleanString(body.target_plan, 50);
    const offerType = cleanString(body.offer_type, 50);
    const properties = body.properties && typeof body.properties === 'object' ? body.properties : {};

    if (!eventName) {
      return NextResponse.json({ error: 'Missing event_name' }, { status: 400 });
    }

    const ALLOWED_EVENTS = new Set(['invoice_created', 'invoice_sent', 'invoice_paid']);
    if (!ALLOWED_EVENTS.has(eventName)) {
      return NextResponse.json({ skipped: true, reason: 'unpermitted_event' }, { status: 202 });
    }

    if (!isSupabaseConfigured()) {
      return NextResponse.json({ stored: false, reason: 'supabase_not_configured' }, { status: 202 });
    }

    const supabase = createServiceSupabaseClient();
    if (!supabase) {
      return NextResponse.json({ stored: false, reason: 'service_role_not_configured' }, { status: 202 });
    }

    const payload = {
      event_name: eventName,
      session_id: sessionId,
      user_id: authUserId,
      page_path: pagePath,
      trigger_type: triggerType,
      target_plan: targetPlan,
      offer_type: offerType,
      properties: {
        ...properties,
        received_at: new Date().toISOString(),
      },
    };

    // 1. Try to insert into revenue_events table
    const { error: revError } = await supabase.from('revenue_events').insert(payload);

    if (revError) {
      // 2. If table doesn't exist, fall back to growth_events
      if (revError.code === 'PGRST205' || revError.message?.includes('revenue_events') || revError.message?.includes('relation "public.revenue_events" does not exist')) {
        console.warn('[REVENUE FEEDBACK] revenue_events table not found, falling back to growth_events');
        
        const growthPayload = {
          event_name: `rev_${eventName}`,
          session_id: sessionId,
          user_id: authUserId,
          page_path: pagePath,
          source: 'revenue_loop',
          properties: {
            ...payload,
            fallback_from_revenue_events: true,
          },
        };
        
        const { error: growthError } = await supabase.from('growth_events').insert(growthPayload);
        if (growthError) {
          console.error('[REVENUE FEEDBACK] Failed to write fallback growth event:', growthError);
          return NextResponse.json({ stored: false, error: growthError.message }, { status: 500 });
        }
        
        return NextResponse.json({ stored: true, fallback: true });
      }

      console.error('[REVENUE FEEDBACK] Database error inserting revenue event:', revError);
      return NextResponse.json({ stored: false, error: revError.message }, { status: 500 });
    }

    return NextResponse.json({ stored: true });
  } catch (error: any) {
    console.error('[REVENUE FEEDBACK] Unexpected error in route:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
