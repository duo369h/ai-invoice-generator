'use client';

export type FunnelStep =
  | 'landing_view'
  | 'signup_start'
  | 'signup_complete'
  | 'dashboard_view'
  | 'quote_create'
  | 'first_quote_created'
  | 'invoice_create'
  | 'first_invoice_created'
  | 'export_attempt'
  | 'pricing_view'
  | 'pricing_select_plan'
  | 'payment_start'
  | 'payment_success';

export type FunnelEventPayload = {
  user_id?: string | null;
  user_intent?: string;
  clicked_feature?: string;
  selected_plan?: string;
  source_page?: string;
  cta_clicked?: string;
  [key: string]: unknown;
};

export type StoredFunnelEvent = FunnelEventPayload & {
  event: FunnelStep;
  funnel_step: FunnelStep;
  funnel_step_index: number;
  session_id: string;
  timestamp: string;
  milliseconds_since_previous_step: number;
  milliseconds_since_first_step: number;
};

export const FUNNEL_STEPS: FunnelStep[] = [
  'landing_view',
  'signup_start',
  'signup_complete',
  'dashboard_view',
  'quote_create',
  'first_quote_created',
  'invoice_create',
  'first_invoice_created',
  'export_attempt',
  'pricing_view',
  'pricing_select_plan',
  'payment_start',
  'payment_success',
];

const SESSION_ID_KEY = 'corvioz_session_id';
const FUNNEL_EVENTS_KEY = 'corvioz_funnel_events';
const USER_FUNNEL_KEY = 'corvioz_user_funnel_progression';

function canUseStorage() {
  return typeof window !== 'undefined' && Boolean(window.sessionStorage);
}

function safeSessionGet(key: string) {
  try {
    return canUseStorage() ? window.sessionStorage.getItem(key) : null;
  } catch (_) {
    return null;
  }
}

function safeSessionSet(key: string, value: string) {
  try {
    if (canUseStorage()) window.sessionStorage.setItem(key, value);
  } catch (_) {
    // Funnel persistence must never block product usage.
  }
}

function safeParseArray(value: string | null): StoredFunnelEvent[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch (_) {
    return [];
  }
}

export function getOrCreateSessionId() {
  const existing = safeSessionGet(SESSION_ID_KEY);
  if (existing) return existing;

  const generated =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : `session-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  safeSessionSet(SESSION_ID_KEY, generated);
  return generated;
}

export function getStoredFunnelEvents() {
  return safeParseArray(safeSessionGet(FUNNEL_EVENTS_KEY));
}

export function trackFunnelProgression(step: FunnelStep, payload: FunnelEventPayload = {}) {
  if (!FUNNEL_STEPS.includes(step)) return null;

  const session_id = getOrCreateSessionId();
  const events = getStoredFunnelEvents();
  const now = Date.now();
  const firstTimestamp = events[0]?.timestamp ? Date.parse(events[0].timestamp) : now;
  const previousTimestamp = events[events.length - 1]?.timestamp ? Date.parse(events[events.length - 1].timestamp) : now;

  const nextEvent: StoredFunnelEvent = {
    ...payload,
    event: step,
    funnel_step: step,
    funnel_step_index: FUNNEL_STEPS.indexOf(step),
    session_id,
    timestamp: new Date(now).toISOString(),
    milliseconds_since_previous_step: Math.max(0, now - previousTimestamp),
    milliseconds_since_first_step: Math.max(0, now - firstTimestamp),
  };

  const nextEvents = [...events, nextEvent].slice(-120);
  safeSessionSet(FUNNEL_EVENTS_KEY, JSON.stringify(nextEvents));

  const userKey = payload.user_id ? String(payload.user_id) : session_id;
  safeSessionSet(
    USER_FUNNEL_KEY,
    JSON.stringify({
      user_key: userKey,
      session_id,
      current_step: step,
      completed_steps: Array.from(new Set(nextEvents.map((event) => event.funnel_step))),
      user_intent: payload.user_intent || payload.clicked_feature || '',
      updated_at: nextEvent.timestamp,
    }),
  );

  return nextEvent;
}

export function buildFunnelReport(events: StoredFunnelEvent[] = getStoredFunnelEvents()) {
  const sessionsByStep = FUNNEL_STEPS.reduce<Record<FunnelStep, Set<string>>>((acc, step) => {
    acc[step] = new Set<string>();
    return acc;
  }, {} as Record<FunnelStep, Set<string>>);
  const timeByStep = FUNNEL_STEPS.reduce<Record<FunnelStep, number[]>>((acc, step) => {
    acc[step] = [];
    return acc;
  }, {} as Record<FunnelStep, number[]>);

  events.forEach((event) => {
    if (!FUNNEL_STEPS.includes(event.funnel_step)) return;
    sessionsByStep[event.funnel_step].add(event.session_id);
    timeByStep[event.funnel_step].push(event.milliseconds_since_previous_step / 1000);
  });

  const firstStepSessions = Math.max(1, sessionsByStep.landing_view.size);
  const steps = FUNNEL_STEPS.map((step, index) => {
    const currentSessions = sessionsByStep[step].size;
    const previousSessions = index === 0 ? currentSessions : sessionsByStep[FUNNEL_STEPS[index - 1]].size;
    const averageSeconds = timeByStep[step].length
      ? timeByStep[step].reduce((sum, value) => sum + value, 0) / timeByStep[step].length
      : 0;

    return {
      step,
      sessions: currentSessions,
      drop_off_rate: previousSessions ? Number(Math.max(0, 1 - currentSessions / previousSessions).toFixed(4)) : 0,
      conversion_rate: previousSessions ? Number((currentSessions / previousSessions).toFixed(4)) : 0,
      cumulative_conversion_rate: Number((currentSessions / firstStepSessions).toFixed(4)),
      average_time_spent_seconds: Number(averageSeconds.toFixed(2)),
    };
  });

  const biggestDropOff = steps
    .slice(1)
    .reduce((max, current) => (current.drop_off_rate > max.drop_off_rate ? current : max), steps[1] || steps[0]);

  return {
    generated_at: new Date().toISOString(),
    session_count: new Set(events.map((event) => event.session_id)).size,
    event_count: events.length,
    biggest_drop_off_step: biggestDropOff?.step || null,
    steps,
  };
}
