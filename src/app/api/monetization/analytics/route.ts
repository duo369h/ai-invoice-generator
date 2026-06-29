import { NextResponse } from 'next/server';
import { createServiceSupabaseClient, isSupabaseConfigured } from '../../../lib/supabase';
import { requireInternalAdmin } from '../../../lib/internal-admin';

export async function GET(request: Request) {
  try {
    const gate = await requireInternalAdmin(request);
    if (gate.response) return gate.response;
    if (!isSupabaseConfigured()) {
      return NextResponse.json({
        success: false,
        source: 'degraded_no_supabase',
        ...getEmptyAnalytics(),
      }, { status: 503 });
    }

    const supabase = createServiceSupabaseClient();
    if (!supabase) {
      return NextResponse.json({
        success: false,
        source: 'degraded_no_service_role',
        ...getEmptyAnalytics(),
      }, { status: 503 });
    }

    // 1. Fetch all events from revenue_events
    let { data: events, error } = await supabase
      .from('revenue_events')
      .select('*')
      .order('created_at', { ascending: true });

    // 2. If table doesn't exist, fall back to growth_events where event_name starts with 'rev_'
    if (error && (error.code === 'PGRST205' || error.message?.includes('revenue_events') || error.message?.includes('relation "public.revenue_events" does not exist'))) {
      const { data: fallbackEvents, error: fallbackError } = await supabase
        .from('growth_events')
        .select('*')
        .filter('event_name', 'like', 'rev_%')
        .order('created_at', { ascending: true });
      
      if (!fallbackError && fallbackEvents) {
        // Map growth_events to revenue_events format
        events = fallbackEvents.map((e) => {
          const props = e.properties || {};
          return {
            id: e.id,
            event_name: e.event_name.replace('rev_', ''),
            session_id: e.session_id,
            user_id: e.user_id,
            page_path: e.page_path,
            trigger_type: props.trigger_type || '',
            target_plan: props.target_plan || '',
            offer_type: props.offer_type || '',
            properties: props.properties || {},
            created_at: e.created_at,
          };
        });
      }
    }

    // 3. If no events exist yet, return explicit empty analytics.
    if (!events || events.length === 0) {
      return NextResponse.json({
        success: true,
        source: 'database_empty',
        ...getEmptyAnalytics(),
      });
    }

    // 4. Compute metrics
    const conversion_rate_per_trigger_type: Record<string, { shown: number; converted: number }> = {
      usage: { shown: 0, converted: 0 },
      intent: { shown: 0, converted: 0 },
      risk: { shown: 0, converted: 0 },
      revenue_opportunity: { shown: 0, converted: 0 },
    };

    const revenue_per_user_segment: Record<string, number> = {
      free: 0,
      power: 0,
      high_intent: 0,
    };

    const funnel_drop_off_step: Record<string, number> = {};

    // For time to convert
    const firstOfferShownAt: Record<string, number> = {}; // session_id -> timestamp
    const convertDurations: number[] = [];

    // Track user segment at the time of offer_shown for purchase attribution
    const sessionToSegment: Record<string, string> = {};

    for (const event of events) {
      const sessionId = event.session_id;
      const t = event.trigger_type || 'usage';

      if (event.event_name === 'offer_shown') {
        if (!conversion_rate_per_trigger_type[t]) {
          conversion_rate_per_trigger_type[t] = { shown: 0, converted: 0 };
        }
        conversion_rate_per_trigger_type[t].shown++;

        if (sessionId && !firstOfferShownAt[sessionId]) {
          firstOfferShownAt[sessionId] = new Date(event.created_at).getTime();
        }

        // Infer user segment if stored in properties
        const segment = event.properties?.user_segment || 'free';
        sessionToSegment[sessionId] = segment;

      } else if (event.event_name === 'payment_success') {
        const rev = Number(event.properties?.revenue || event.properties?.price || 19);
        const segment = sessionToSegment[sessionId] || 'free';
        revenue_per_user_segment[segment] = (revenue_per_user_segment[segment] || 0) + rev;

        // Mark conversion for trigger type
        if (t && conversion_rate_per_trigger_type[t]) {
          conversion_rate_per_trigger_type[t].converted++;
        }

        // Time to convert calculation
        if (sessionId && firstOfferShownAt[sessionId]) {
          const shownTime = firstOfferShownAt[sessionId];
          const convertTime = new Date(event.created_at).getTime();
          const durationSec = Math.max(0, (convertTime - shownTime) / 1000);
          convertDurations.push(durationSec);
        }

      } else if (event.event_name === 'drop_off') {
        const step = event.properties?.drop_off_step || 'unknown';
        funnel_drop_off_step[step] = (funnel_drop_off_step[step] || 0) + 1;
      }
    }

    // Format final conversion rates
    const formattedRates: Record<string, number> = {};
    for (const key of Object.keys(conversion_rate_per_trigger_type)) {
      const { shown, converted } = conversion_rate_per_trigger_type[key];
      formattedRates[key] = shown > 0 ? Math.round((converted / shown) * 100) : 0;
    }

    // Average time to convert
    const avgTimeToConvert = convertDurations.length > 0
      ? Math.round(convertDurations.reduce((a, b) => a + b, 0) / convertDurations.length)
      : 0;

    return NextResponse.json({
      success: true,
      source: 'database',
      conversion_rate_per_trigger_type: formattedRates,
      revenue_per_user_segment,
      time_to_convert: avgTimeToConvert,
      funnel_drop_off_step,
      total_events: events.length,
    });
  } catch (error: any) {
    console.error('[REVENUE ANALYTICS] Failed to compute analytics:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Internal server error',
    }, { status: 500 });
  }
}

function getEmptyAnalytics() {
  return {
    conversion_rate_per_trigger_type: {
      usage: 0,
      intent: 0,
      risk: 0,
      revenue_opportunity: 0,
    },
    revenue_per_user_segment: {
      free: 0,
      power: 0,
      high_intent: 0,
    },
    time_to_convert: 0,
    funnel_drop_off_step: {},
    total_events: 0,
  };
}
