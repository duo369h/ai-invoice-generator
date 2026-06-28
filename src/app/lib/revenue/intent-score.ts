'use client';

export type RevenueStage = 'cold' | 'warm' | 'hot' | 'ready_to_pay';

export type RevenueIntentEvent =
  | 'landing_view'
  | 'signup_start'
  | 'signup_complete'
  | 'dashboard_view'
  | 'pricing_view'
  | 'pricing_select_plan'
  | 'quote_create'
  | 'quote_create_start'
  | 'quote_create_complete'
  | 'first_quote_created'
  | 'invoice_create'
  | 'invoice_create_start'
  | 'invoice_create_complete'
  | 'first_invoice_created'
  | 'export_attempt'
  | 'payment_start'
  | 'payment_success';

export type IntentScoreResult = {
  intent_score: number;
  stage: RevenueStage;
};

const INTENT_SCORE_KEY = 'corvioz_revenue_intent_score';

export const INTENT_SCORE_WEIGHTS: Record<RevenueIntentEvent, number> = {
  landing_view: 1,
  signup_start: 10,
  signup_complete: 20,
  dashboard_view: 8,
  pricing_view: 15,
  pricing_select_plan: 25,
  quote_create: 20,
  quote_create_start: 20,
  quote_create_complete: 30,
  first_quote_created: 30,
  invoice_create: 25,
  invoice_create_start: 25,
  invoice_create_complete: 40,
  first_invoice_created: 40,
  export_attempt: 35,
  payment_start: 45,
  payment_success: 60,
};

function canUseStorage() {
  return typeof window !== 'undefined' && Boolean(window.sessionStorage);
}

function getStoredScore() {
  if (!canUseStorage()) return 0;
  const raw = window.sessionStorage.getItem(INTENT_SCORE_KEY);
  const parsed = Number(raw || 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function setStoredScore(score: number) {
  try {
    if (canUseStorage()) window.sessionStorage.setItem(INTENT_SCORE_KEY, String(score));
  } catch (_) {
    // Revenue scoring is best-effort and must never block product usage.
  }
}

export function getIntentStage(intent_score: number): RevenueStage {
  if (intent_score > 60) return 'ready_to_pay';
  if (intent_score >= 40) return 'hot';
  if (intent_score >= 15) return 'warm';
  return 'cold';
}

export function getIntentScore(): IntentScoreResult {
  const intent_score = getStoredScore();
  return {
    intent_score,
    stage: getIntentStage(intent_score),
  };
}

export function updateIntentScore(eventName: string): IntentScoreResult {
  const eventKey = normalizeRevenueIntentEvent(eventName);
  if (!eventKey) return getIntentScore();

  const intent_score = getStoredScore() + INTENT_SCORE_WEIGHTS[eventKey];
  setStoredScore(intent_score);

  return {
    intent_score,
    stage: getIntentStage(intent_score),
  };
}

export function normalizeRevenueIntentEvent(eventName: string): RevenueIntentEvent | null {
  const aliases: Record<string, RevenueIntentEvent> = {
    quote_created: 'quote_create_complete',
    quote_generated: 'quote_create_complete',
    first_quote_created: 'quote_create_complete',
    invoice_created: 'invoice_create_complete',
    invoice_generated: 'invoice_create_complete',
    first_invoice_created: 'invoice_create_complete',
    checkout_start: 'payment_start',
    checkout_started: 'payment_start',
    checkout_completed: 'payment_success',
    payment_completed: 'payment_success',
  };

  const normalized = aliases[eventName] || eventName;
  return normalized in INTENT_SCORE_WEIGHTS ? (normalized as RevenueIntentEvent) : null;
}

export function resetIntentScore() {
  setStoredScore(0);
  return getIntentScore();
}
