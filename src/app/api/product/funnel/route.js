import { NextResponse } from 'next/server';
import { requireInternalAdmin } from '../../../lib/internal-admin';
import { createServiceSupabaseClient, isSupabaseConfigured } from '../../../lib/supabase';

const FUNNEL = [
  { key: 'landing', event: 'landing_viewed', label: 'Landing' },
  { key: 'signup', event: 'signup_completed', label: 'Signup' },
  { key: 'proposal', event: 'proposal_created', label: 'Proposal' },
  { key: 'invoice', event: 'invoice_created', label: 'Invoice' },
  { key: 'paid', event: 'invoice_paid', label: 'Paid' },
];

function rate(numerator, denominator) {
  if (!denominator) return 0;
  return Math.round((numerator / denominator) * 1000) / 10;
}

function dateKey(value) {
  return new Date(value).toISOString().slice(0, 10);
}

export async function GET(request) {
  const admin = await requireInternalAdmin(request);
  if (admin.response) return admin.response;

  try {
    if (!isSupabaseConfigured()) {
      return NextResponse.json({ configured: false, reason: 'supabase_not_configured' });
    }
    const supabase = createServiceSupabaseClient();
    if (!supabase) {
      return NextResponse.json({ configured: false, reason: 'service_role_not_configured' });
    }

    const { searchParams } = new URL(request.url);
    const days = Math.max(1, Math.min(120, Number(searchParams.get('days') || 30)));
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

    const { data, error } = await supabase
      .from('growth_events')
      .select('event_name, session_id, user_id, created_at')
      .in('event_name', FUNNEL.map((step) => step.event))
      .gte('created_at', since)
      .order('created_at', { ascending: true })
      .limit(20000);

    if (error?.code === 'PGRST205' || error?.message?.includes('growth_events')) {
      return NextResponse.json({ configured: false, reason: 'growth_events_schema_not_applied' });
    }
    if (error) throw error;

    const events = data || [];
    const sessionsByEvent = Object.fromEntries(FUNNEL.map((step) => [step.event, new Set()]));
    const daily = {};

    events.forEach((event) => {
      const sessionKey = event.user_id || event.session_id || `${event.event_name}-${event.created_at}`;
      sessionsByEvent[event.event_name]?.add(sessionKey);
      const day = dateKey(event.created_at);
      daily[day] = daily[day] || Object.fromEntries(FUNNEL.map((step) => [step.key, 0]));
      const step = FUNNEL.find((item) => item.event === event.event_name);
      if (step) daily[day][step.key] += 1;
    });

    const steps = FUNNEL.map((step, index) => {
      const sessions = sessionsByEvent[step.event].size;
      const previous = index === 0 ? sessions : sessionsByEvent[FUNNEL[index - 1].event].size;
      return {
        ...step,
        sessions,
        conversion_rate: index === 0 ? 100 : rate(sessions, previous),
        dropoff_rate: index === 0 ? 0 : Math.max(0, rate(previous - sessions, previous)),
      };
    });

    return NextResponse.json({
      configured: true,
      days,
      generated_at: new Date().toISOString(),
      steps,
      daily_trend: Object.entries(daily).map(([date, counts]) => ({ date, ...counts })),
    });
  } catch (error) {
    console.error('Failed to load product funnel:', error);
    return NextResponse.json({ error: 'Failed to load product funnel' }, { status: 500 });
  }
}
