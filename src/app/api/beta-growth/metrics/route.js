import { NextResponse } from 'next/server';
import { createServiceSupabaseClient, isSupabaseConfigured } from '../../../lib/supabase';

const EVENTS = [
  'landing_view',
  'invoice_create',
  'quote_create',
  'export_attempt',
  'pricing_view',
  'signup_start',
  'signup_complete',
  'payment_success',
];

function rate(numerator, denominator) {
  if (!denominator) return 0;
  return Math.round((numerator / denominator) * 1000) / 10;
}

export async function GET(request) {
  try {
    if (!isSupabaseConfigured()) {
      return NextResponse.json({ configured: false, reason: 'supabase_not_configured' }, { status: 200 });
    }

    const supabase = createServiceSupabaseClient();
    if (!supabase) {
      return NextResponse.json({ configured: false, reason: 'service_role_not_configured' }, { status: 200 });
    }

    const { searchParams } = new URL(request.url);
    const days = Math.max(1, Math.min(90, Number(searchParams.get('days') || 30)));
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

    const { data, error } = await supabase
      .from('growth_events')
      .select('event_name, session_id, user_id, page_path, created_at')
      .in('event_name', EVENTS)
      .gte('created_at', since)
      .order('created_at', { ascending: false })
      .limit(10000);

    if (error?.code === 'PGRST205' || error?.message?.includes('growth_events')) {
      return NextResponse.json({
        configured: false,
        reason: 'growth_events_schema_not_applied',
        days,
        generated_at: new Date().toISOString(),
      }, { status: 200 });
    }
    if (error) throw error;

    const events = data || [];
    const counts = Object.fromEntries(EVENTS.map((eventName) => [eventName, 0]));
    const sessionsByEvent = Object.fromEntries(EVENTS.map((eventName) => [eventName, new Set()]));
    const usersByEvent = Object.fromEntries(EVENTS.map((eventName) => [eventName, new Set()]));
    const allSessions = new Set();

    events.forEach((event) => {
      const eventName = event.event_name;
      const sessionKey = event.session_id || event.user_id || `event-${event.created_at}-${event.page_path}`;
      counts[eventName] = (counts[eventName] || 0) + 1;
      sessionsByEvent[eventName]?.add(sessionKey);
      if (event.user_id) usersByEvent[eventName]?.add(event.user_id);
      allSessions.add(sessionKey);
    });

    const activatedSessions = new Set([
      ...sessionsByEvent.invoice_create,
      ...sessionsByEvent.quote_create,
    ]);
    const landingSessions = sessionsByEvent.landing_view.size || allSessions.size;
    const signupStartSessions = sessionsByEvent.signup_start.size;
    const signupCompleteSessions = sessionsByEvent.signup_complete.size;

    return NextResponse.json({
      configured: true,
      days,
      generated_at: new Date().toISOString(),
      totals: counts,
      sessions: {
        total: allSessions.size,
        landing: landingSessions,
        activated: activatedSessions.size,
        export_attempt: sessionsByEvent.export_attempt.size,
        pricing_view: sessionsByEvent.pricing_view.size,
        signup_start: signupStartSessions,
        signup_complete: signupCompleteSessions,
        paid: sessionsByEvent.payment_success.size,
      },
      event_sessions: Object.fromEntries(EVENTS.map((eventName) => [eventName, sessionsByEvent[eventName].size])),
      unique_users: Object.fromEntries(EVENTS.map((eventName) => [eventName, usersByEvent[eventName].size])),
      rates: {
        activation_rate: rate(activatedSessions.size, landingSessions),
        export_rate: rate(sessionsByEvent.export_attempt.size, activatedSessions.size || landingSessions),
        signup_rate: rate(signupCompleteSessions, signupStartSessions || landingSessions),
        paid_conversion_rate: rate(sessionsByEvent.payment_success.size, signupCompleteSessions || landingSessions),
      },
      recent_events: events.slice(0, 25),
    });
  } catch (error) {
    console.error('Failed to load beta growth metrics:', error);
    return NextResponse.json({ error: 'Failed to load beta growth metrics' }, { status: 500 });
  }
}
