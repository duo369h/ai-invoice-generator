export type CanonicalGA4FunnelEvent =
  | 'landing_view'
  | 'signup_start'
  | 'signup_complete'
  | 'dashboard_view'
  | 'invoice_create'
  | 'quote_create'
  | 'export_attempt'
  | 'pricing_view'
  | 'pricing_select_plan'
  | 'payment_start'
  | 'payment_success';

export type GA4DecisionAction = 'allow' | 'block' | 'upsell' | 'soft_paywall' | 'redirect';

export type GA4EventPayload = {
  event_name: CanonicalGA4FunnelEvent;
  user_id: string;
  intent_score: number;
  funnel_step: string;
  action: GA4DecisionAction;
  metadata: Record<string, unknown>;
};

export type FunnelIntegrityResult = {
  status: 'READY' | 'PARTIAL' | 'NOT READY';
  total_events_tracked: number;
  missing_event_coverage: CanonicalGA4FunnelEvent[];
  duplicate_naming: string[];
  control_plane_ga4_sync: boolean;
  warnings: string[];
};

export const CANONICAL_GA4_FUNNEL_EVENTS: CanonicalGA4FunnelEvent[] = [
  'landing_view',
  'signup_start',
  'signup_complete',
  'dashboard_view',
  'invoice_create',
  'quote_create',
  'export_attempt',
  'pricing_view',
  'pricing_select_plan',
  'payment_start',
  'payment_success',
];

const CANONICAL_EVENT_SET = new Set<string>(CANONICAL_GA4_FUNNEL_EVENTS);

const GA4_EVENT_ALIASES: Record<string, CanonicalGA4FunnelEvent> = {
  signup_click: 'signup_start',
  signup_started: 'signup_start',
  signup_completed: 'signup_complete',
  create_invoice: 'invoice_create',
  invoice_create_start: 'invoice_create',
  invoice_created: 'invoice_create',
  first_invoice_created: 'invoice_create',
  create_quote: 'quote_create',
  quote_create_start: 'quote_create',
  quote_created: 'quote_create',
  first_quote_created: 'quote_create',
  export_pdf: 'export_attempt',
  pdf_export: 'export_attempt',
  export_invoice: 'export_attempt',
  export_pdf_attempt: 'export_attempt',
  quote_export: 'export_attempt',
  pricing_click: 'pricing_view',
  pricing_click_intent: 'pricing_view',
  pricing_cta_click: 'pricing_select_plan',
  pricing_cta: 'pricing_select_plan',
  upgrade_cta: 'pricing_select_plan',
  checkout_start: 'payment_start',
  checkout_started: 'payment_start',
  checkout_loaded: 'payment_start',
  checkout_completed: 'payment_success',
  payment_completed: 'payment_success',
};

const debugEvents: GA4EventPayload[] = [];
const sentEventKeys = new Map<string, number>();
const DEDUPE_WINDOW_MS = 1500;

function toNumber(value: unknown, fallback = 0) {
  const next = Number(value ?? fallback);
  return Number.isFinite(next) ? next : fallback;
}

function isGA4DebugEnabled() {
  return process.env.GA4_DEBUG === 'true' || process.env.NEXT_PUBLIC_GA4_DEBUG === 'true';
}

function normalizeKey(value: unknown) {
  return String(value || '').trim().toLowerCase().replace(/[\s-]+/g, '_');
}

export function normalizeGA4EventName(eventName: unknown): CanonicalGA4FunnelEvent | null {
  const normalized = normalizeKey(eventName);
  if (CANONICAL_EVENT_SET.has(normalized)) return normalized as CanonicalGA4FunnelEvent;
  return GA4_EVENT_ALIASES[normalized] ?? null;
}

export function isCanonicalGA4FunnelEvent(eventName: unknown) {
  return Boolean(normalizeGA4EventName(eventName));
}

export function getCanonicalGA4FunnelEvents() {
  return [...CANONICAL_GA4_FUNNEL_EVENTS];
}

export function buildControlPlaneGA4Payload(input: {
  event?: unknown;
  user_id?: unknown;
  intent_score?: unknown;
  funnel_step?: unknown;
  action?: unknown;
  decision_id?: unknown;
  risk_level?: unknown;
  reason?: unknown;
  session_id?: unknown;
  metadata?: Record<string, unknown>;
}): GA4EventPayload | null {
  const eventName = normalizeGA4EventName(input.event);
  if (!eventName) return null;

  const intentScore = Math.max(0, Math.min(100, toNumber(input.intent_score, 0)));
  const action = normalizeKey(input.action || 'allow') as GA4DecisionAction;
  const safeAction: GA4DecisionAction = ['allow', 'block', 'upsell', 'soft_paywall', 'redirect'].includes(action)
    ? action
    : 'allow';

  return {
    event_name: eventName,
    user_id: String(input.user_id || 'anonymous'),
    intent_score: intentScore,
    funnel_step: String(input.funnel_step || eventName),
    action: safeAction,
    metadata: {
      decision_id: input.decision_id ? String(input.decision_id) : undefined,
      risk_level: input.risk_level ? String(input.risk_level) : undefined,
      reason: input.reason ? String(input.reason) : undefined,
      session_id: input.session_id ? String(input.session_id) : undefined,
      ga4_source: 'revenue_control_plane',
      ...input.metadata,
    },
  };
}

function shouldSkipDuplicate(eventName: string, payload: GA4EventPayload) {
  const eventId = String(payload.metadata?.decision_id || payload.metadata?.event_id || '');
  const dedupeKey = [
    eventName,
    payload.user_id,
    payload.funnel_step,
    payload.action,
    eventId,
    payload.metadata?.source || '',
    payload.metadata?.document_type || '',
    payload.metadata?.plan || '',
  ].join(':');
  const now = Date.now();
  const lastSentAt = sentEventKeys.get(dedupeKey) || 0;

  if (lastSentAt && now - lastSentAt < DEDUPE_WINDOW_MS) return true;
  sentEventKeys.set(dedupeKey, now);

  if (sentEventKeys.size > 250) {
    const cutoff = now - 60_000;
    for (const [key, ts] of sentEventKeys.entries()) {
      if (ts < cutoff) sentEventKeys.delete(key);
    }
  }

  return false;
}

function trackGA4EventClient(eventName: CanonicalGA4FunnelEvent, payload: GA4EventPayload) {
  const win = window as typeof window & {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  };
  const gaPayload = {
    transport_type: 'beacon',
    user_id: payload.user_id,
    intent_score: payload.intent_score,
    funnel_step: payload.funnel_step,
    action: payload.action,
    event_id: payload.metadata?.decision_id,
    ...payload.metadata,
  };

  if (typeof win.gtag === 'function') {
    win.gtag('event', eventName, gaPayload);
    return;
  }

  if (!Array.isArray(win.dataLayer)) {
    win.dataLayer = [];
  }
  win.dataLayer.push(['event', eventName, gaPayload]);
}

async function trackGA4EventServer(eventName: CanonicalGA4FunnelEvent, payload: GA4EventPayload) {
  const measurementId = process.env.GA4_MEASUREMENT_ID || process.env.NEXT_PUBLIC_GA4_MEASUREMENT_ID;
  const apiSecret = process.env.GA4_API_SECRET;
  if (!measurementId || !apiSecret || typeof fetch !== 'function') return;

  const clientId = String(payload.metadata?.session_id || payload.user_id || `server-${Date.now()}`);
  const params = {
    user_id: payload.user_id,
    intent_score: payload.intent_score,
    funnel_step: payload.funnel_step,
    action: payload.action,
    ...payload.metadata,
  };

  await fetch(`https://www.google-analytics.com/mp/collect?measurement_id=${measurementId}&api_secret=${apiSecret}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: clientId,
      user_id: payload.user_id !== 'anonymous' ? payload.user_id : undefined,
      events: [{ name: eventName, params }],
    }),
  });
}

export function trackGA4Event(eventName: unknown, payload: Partial<GA4EventPayload> & Record<string, unknown>) {
  const canonicalName = normalizeGA4EventName(eventName);
  if (!canonicalName) {
    if (isGA4DebugEnabled()) {
      console.warn('[GA4 DEBUG] Missing canonical event mapping', { eventName, payload });
    }
    return;
  }

  const normalizedPayload: GA4EventPayload = {
    event_name: canonicalName,
    user_id: String(payload.user_id || 'anonymous'),
    intent_score: Math.max(0, Math.min(100, toNumber(payload.intent_score, 0))),
    funnel_step: String(payload.funnel_step || canonicalName),
    action: (['allow', 'block', 'upsell', 'soft_paywall', 'redirect'].includes(String(payload.action))
      ? payload.action
      : 'allow') as GA4DecisionAction,
    metadata: {
      ...(payload.metadata && typeof payload.metadata === 'object' ? payload.metadata : {}),
    },
  };

  if (shouldSkipDuplicate(canonicalName, normalizedPayload)) return;

  if (isGA4DebugEnabled()) {
    debugEvents.push(normalizedPayload);
    if (debugEvents.length > 100) debugEvents.shift();
    console.info('[GA4 DEBUG] Funnel event mapped', {
      event_name: canonicalName,
      decision: normalizedPayload.action,
      payload: normalizedPayload,
    });
  }

  Promise.resolve()
    .then(() => {
      if (typeof window !== 'undefined') {
        trackGA4EventClient(canonicalName, normalizedPayload);
        return undefined;
      }
      return trackGA4EventServer(canonicalName, normalizedPayload);
    })
    .catch(() => {
      // GA4 failures must never block UI or revenue decisions.
    });
}

export function validateFunnelIntegrity(input: {
  emitted_events?: unknown[];
  control_plane_mapped_events?: unknown[];
  decision_events?: unknown[];
} = {}): FunnelIntegrityResult {
  const emittedCanonical = new Set(
    (input.emitted_events ?? []).map(normalizeGA4EventName).filter(Boolean) as CanonicalGA4FunnelEvent[],
  );
  const decisionCanonical = new Set(
    (input.decision_events ?? []).map(normalizeGA4EventName).filter(Boolean) as CanonicalGA4FunnelEvent[],
  );
  const controlPlaneCanonical = new Set(
    (input.control_plane_mapped_events ?? []).map(normalizeGA4EventName).filter(Boolean) as CanonicalGA4FunnelEvent[],
  );
  const observed = new Set([...emittedCanonical, ...decisionCanonical, ...controlPlaneCanonical]);
  const missing = CANONICAL_GA4_FUNNEL_EVENTS.filter((eventName) => !observed.has(eventName));
  const rawEvents = [
    ...(input.emitted_events ?? []),
    ...(input.decision_events ?? []),
    ...(input.control_plane_mapped_events ?? []),
  ].map((eventName) => normalizeKey(eventName));
  const duplicateNaming = rawEvents.filter((eventName) => eventName && !CANONICAL_EVENT_SET.has(eventName) && Boolean(GA4_EVENT_ALIASES[eventName]));
  const controlPlaneSync = (input.decision_events ?? []).every((eventName) => Boolean(normalizeGA4EventName(eventName)));
  const warnings = [
    ...(missing.length > 0 ? [`Missing GA4 funnel coverage: ${missing.join(', ')}`] : []),
    ...(duplicateNaming.length > 0 ? [`Non-canonical aliases observed: ${Array.from(new Set(duplicateNaming)).join(', ')}`] : []),
    ...(!controlPlaneSync ? ['Control-plane decision event without canonical GA4 mapping'] : []),
  ];

  return {
    status: missing.length === 0 && duplicateNaming.length === 0 && controlPlaneSync
      ? 'READY'
      : controlPlaneSync && missing.length <= 2
      ? 'PARTIAL'
      : 'NOT READY',
    total_events_tracked: observed.size,
    missing_event_coverage: missing,
    duplicate_naming: Array.from(new Set(duplicateNaming)),
    control_plane_ga4_sync: controlPlaneSync,
    warnings,
  };
}
