'use client';

export type UserGoal = 'invoice' | 'quote' | 'explore' | 'pricing' | 'profile';

export type ConversionIntent = {
  user_goal?: UserGoal;
  clicked_feature?: UserGoal;
  intended_route?: string;
  selected_plan?: string;
  source_page?: string;
  cta_clicked?: string;
  created_at?: string;
  updated_at?: string;
};

const INTENT_KEY = 'corvioz_conversion_intent';
const LEGACY_ROUTE_KEY = 'corvioz_redirect_after_auth';
const LEGACY_PLAN_KEY = 'corvioz_selected_plan';

function canUseSessionStorage() {
  return typeof window !== 'undefined' && Boolean(window.sessionStorage);
}

function safeParseIntent(value: string | null): ConversionIntent {
  if (!value) return {};
  try {
    return JSON.parse(value) || {};
  } catch (_) {
    return {};
  }
}

function routeForGoal(goal?: UserGoal) {
  if (goal === 'invoice') return '/invoices/create';
  if (goal === 'quote') return '/quotes/create';
  if (goal === 'profile') return '/dashboard?action=create-profile';
  if (goal === 'pricing') return '/pricing';
  return '/dashboard';
}



export function saveConversionIntent(intent: ConversionIntent) {
  if (!canUseSessionStorage()) return;

  const stored = safeParseIntent(window.sessionStorage.getItem(INTENT_KEY));
  const legacyRoute = window.sessionStorage.getItem(LEGACY_ROUTE_KEY);
  const legacyPlan = window.sessionStorage.getItem(LEGACY_PLAN_KEY);
  const existing = {
    ...stored,
    intended_route: stored.intended_route || legacyRoute || undefined,
    selected_plan: stored.selected_plan || legacyPlan || undefined,
  };
  const now = new Date().toISOString();
  const nextIntent = {
    ...existing,
    ...intent,
    created_at: existing.created_at || intent.created_at || now,
    updated_at: now,
  };

  window.sessionStorage.setItem(INTENT_KEY, JSON.stringify(nextIntent));

  if (nextIntent.intended_route) {
    window.sessionStorage.setItem(LEGACY_ROUTE_KEY, nextIntent.intended_route);
  }

  if (nextIntent.selected_plan) {
    window.sessionStorage.setItem(LEGACY_PLAN_KEY, nextIntent.selected_plan);
  }
}

export function captureSignupIntent(intent: {
  clicked_feature?: UserGoal;
  source_page?: string;
  cta_clicked?: string;
  selected_plan?: string;
  intended_route?: string;
}) {
  const goal = intent.clicked_feature || (intent.selected_plan ? 'pricing' : 'explore');
  saveConversionIntent({
    user_goal: goal,
    clicked_feature: intent.clicked_feature || goal,
    selected_plan: intent.selected_plan,
    source_page: intent.source_page,
    cta_clicked: intent.cta_clicked,
    intended_route: intent.intended_route || routeForGoal(goal),
  });
}

export function saveIntendedRoute(intended_route: string, source_page?: string, cta_clicked?: string) {
  let clicked_feature: UserGoal = 'explore';
  if (intended_route.includes('/invoices') || intended_route.includes('create-invoice')) clicked_feature = 'invoice';
  if (intended_route.includes('/quotes') || intended_route.includes('create-quote')) clicked_feature = 'quote';
  if (intended_route.includes('create-profile')) clicked_feature = 'profile';
  saveConversionIntent({ intended_route, source_page, cta_clicked, user_goal: clicked_feature, clicked_feature });
}

export function saveSelectedPlan(selected_plan: string, source_page?: string, cta_clicked = 'pricing_plan') {
  saveConversionIntent({
    selected_plan,
    intended_route: selected_plan === 'free' ? '/dashboard?action=create-profile' : '/pricing',
    source_page,
    cta_clicked,
    user_goal: 'pricing',
    clicked_feature: 'pricing',
  });
}

export function clearConversionIntent() {
  if (!canUseSessionStorage()) return;

  window.sessionStorage.removeItem(INTENT_KEY);
  window.sessionStorage.removeItem(LEGACY_ROUTE_KEY);
  window.sessionStorage.removeItem(LEGACY_PLAN_KEY);
}

export function resolveIntentRoute(intent: ConversionIntent = {}) {
  if (intent.selected_plan && intent.selected_plan !== 'free') {
    return `/pricing?checkout=${encodeURIComponent(intent.selected_plan)}`;
  }
  if (intent.intended_route) return intent.intended_route;
  return routeForGoal(intent.user_goal || intent.clicked_feature);
}
