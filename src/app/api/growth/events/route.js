/*
CORVIOZ SYSTEM GUARANTEE v1
1. UI Layer = rendering only
2. Event Layer = facts only
3. Analytics Layer = passive only
4. Backend Layer = storage only
5. Intelligence Layer = offline only
NO CROSS-LAYER LOGIC ALLOWED
NO BUSINESS INFERENCE IN RUNTIME
*/

import { NextResponse } from 'next/server';
import { createServiceSupabaseClient, isSupabaseConfigured } from '../../../lib/supabase';
import { validateEvent } from '../../../../../events/eventValidator';

function cleanString(value, max = 500) {
  if (typeof value !== 'string') return '';
  return value.slice(0, max);
}

function cleanUuid(value) {
  if (typeof value !== 'string') return null;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
    ? value
    : null;
}

export async function GET(request) {
  try {
    if (!isSupabaseConfigured()) {
      return NextResponse.json({ data: [] });
    }
    const supabase = createServiceSupabaseClient();
    if (!supabase) {
      return NextResponse.json({ data: [] });
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const sessionId = searchParams.get('sessionId');

    let query = supabase.from('growth_events').select('*').order('created_at', { ascending: false }).limit(100);

    if (userId && userId !== 'null' && userId !== 'undefined') {
      query = query.eq('user_id', userId);
    } else if (sessionId) {
      query = query.eq('session_id', sessionId);
    }

    const { data, error } = await query;
    if (error) throw error;

    return NextResponse.json({ data: data || [] });
  } catch (error) {
    console.error('Failed to fetch growth events:', error);
    return NextResponse.json({ error: 'Failed to fetch growth events', data: [] }, { status: 500 });
  }
}

export async function POST(request) {
  // V3_REVENUE_HOOK_POINT
  // DO NOT IMPLEMENT YET
  try {
    const body = await request.json();
    
    // Pass incoming payload through the strict validation layer
    let validated;
    try {
      validated = validateEvent(body);
    } catch (valErr) {
      return NextResponse.json({ skipped: true, reason: valErr.message }, { status: 202 });
    }

    if (!isSupabaseConfigured()) {
      return NextResponse.json({ stored: false, reason: 'supabase_not_configured' }, { status: 202 });
    }

    const supabase = createServiceSupabaseClient();
    if (!supabase) {
      return NextResponse.json({ stored: false, reason: 'service_role_not_configured' }, { status: 202 });
    }

    const eventId = cleanUuid(body.id);
    const metadata = validated.metadata;

    const payload = {
      event_name: validated.event_type,
      session_id: cleanString(metadata.session_id || '', 120),
      user_id: cleanUuid(metadata.user_id),
      page_path: cleanString(metadata.page_path || '', 500),
      page_location: cleanString(metadata.page_location || '', 1000),
      source: cleanString(metadata.source || 'user', 120),
      properties: {
        ...metadata,
        event_id: body.id || undefined,
        timestamp: validated.timestamp,
        received_at: new Date().toISOString(),
      },
    };

    if (eventId) {
      payload.id = eventId;
    }

    const { error } = await supabase.from('growth_events').insert(payload);
    if (error?.code === 'PGRST205' || error?.message?.includes('growth_events')) {
      return NextResponse.json({ stored: false, reason: 'growth_events_schema_not_applied' }, { status: 202 });
    }
    if (error) throw error;

    return NextResponse.json({ stored: true });
  } catch (error) {
    console.error('Failed to store growth event:', error);
    return NextResponse.json({ error: 'Failed to store growth event' }, { status: 500 });
  }
}
