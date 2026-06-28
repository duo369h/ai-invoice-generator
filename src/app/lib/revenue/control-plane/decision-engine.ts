import { buildControlPlaneGA4Payload, type GA4EventPayload } from '../../analytics/ga4-event-bridge';

export let SHADOW_MODE = true;
export let paywallEngineEnabled = true;
export let pricingChangesRolledBack = false;
export let funnelRulesReset = false;

export type RevenueControlPlaneAction = 'allow' | 'block' | 'upsell' | 'soft_paywall' | 'redirect';
export type RevenueControlPlaneRiskLevel = 'low' | 'medium' | 'high';

export type RevenueControlPlaneInput = {
  user_id?: string;
  event?: string;
  intent_score?: number;
  funnel_step?: string;
  session_count?: number;
  pricing_viewed?: boolean | number;
  pricing_change?: number;
  usage_count?: number;
  invoice_count?: number;
  quote_count?: number;
  export_count?: number;
  session_id?: string;
  monetization_prompt_count?: number;
  has_seen_monetization_prompt?: boolean;
  explicit_retry?: boolean;
  retry_action?: boolean;
  user_plan?: string;
  plan?: string;
  user_state?: string;
  no_payment?: boolean;
  has_payment?: boolean;
  is_authenticated?: boolean;
  guest_mode_user?: boolean;
  activated_user?: boolean;
  first_value_timestamp?: number;
};

export type RevenueControlPlaneDecision = {
  decision_id: string;
  user_id: string;
  event: string;
  action: RevenueControlPlaneAction;
  reason: string;
  reason_chain: string[];
  risk_level: RevenueControlPlaneRiskLevel;
  intent_score?: number;
  intent_contribution_score: number;
  pricing_trigger_attribution: {
    triggered: boolean;
    trigger: string;
    pricing_viewed: boolean;
    pricing_view_count: number;
    pricing_change: number;
  };
  explanation?: {
    summary: string;
    factors: string[];
    intent_score: number;
  };
  revenue_signal_score: number;
  funnel_stage: string;
  upgrade_recommendation: string;
  upgrade_target?: string;
  guest_mode_user: boolean;
  activated_user: boolean;
  first_value_timestamp?: number;
  pricing_intent_score: number;
  trust_guardrail: {
    value_first: boolean;
    protected_value_action: boolean;
    prompt_allowed: boolean;
    prompt_policy: string;
    educational_message: string;
    free_included: string[];
    paid_required: string[];
  };
  psychology: RevenuePsychologySignal;
  paywall_trigger_map: PaywallTriggerMap;
  timestamp: number;
  simulated?: boolean;
  shadow_mode?: boolean;
  shadow_action?: RevenueControlPlaneAction;
  ga4_event?: GA4EventPayload | null;
};

export type RevenueDecisionLogEntry = {
  decision_id: string;
  user_id: string;
  event: string;
  action: RevenueControlPlaneAction;
  shadow_action?: RevenueControlPlaneAction;
  risk_level: RevenueControlPlaneRiskLevel;
  intent_score?: number;
  reason_chain?: string[];
  intent_contribution_score?: number;
  pricing_trigger_attribution?: RevenueControlPlaneDecision['pricing_trigger_attribution'];
  explanation?: {
    summary: string;
    factors: string[];
    intent_score: number;
  };
  revenue_signal_score?: number;
  funnel_stage?: string;
  upgrade_recommendation?: string;
  upgrade_target?: string;
  guest_mode_user?: boolean;
  activated_user?: boolean;
  first_value_timestamp?: number;
  pricing_intent_score?: number;
  trust_guardrail?: RevenueControlPlaneDecision['trust_guardrail'];
  psychology?: RevenueControlPlaneDecision['psychology'];
  paywall_trigger_map?: RevenueControlPlaneDecision['paywall_trigger_map'];
  timestamp: number;
  simulated?: boolean;
  reason?: string;
  ga4_event?: GA4EventPayload | null;
};

export const revenue_decision_log: RevenueDecisionLogEntry[] = [];
export type FunnelEventLogEntry = {
  event: 'signup_bypass_used' | 'first_invoice_created' | 'export_block_triggered' | 'pricing_view_intent';
  user_id: string;
  decision_id: string;
  funnel_stage: string;
  timestamp: number;
  metadata: Record<string, string | number | boolean | undefined>;
};

export const funnel_event_log: FunnelEventLogEntry[] = [];
let decisionCounter = 0;

const MONETIZATION_PROMPT_ACTIONS = new Set<RevenueControlPlaneAction>(['block', 'upsell', 'soft_paywall', 'redirect']);
const PROMPT_RETRY_EVENTS = new Set(['export_pdf', 'send_invoice']);
const FREE_INCLUDED = [
  'Create your first invoice',
  'Create your first quote',
  'Preview your work before signup',
];
const PAID_REQUIRED = [
  'Export PDF without limits',
  'Send invoices to clients',
  'Save work permanently to an account',
];

export type PaywallTriggerKey =
  | 'high_intent_upgrade_cta'
  | 'value_paywall_overlay'
  | 'high_intent_upgrade_hint'
  | 'invoice_usage_upgrade_suggestion';

export type PaywallTriggerMap = Record<PaywallTriggerKey, boolean>;

export type RevenuePsychologySignal = {
  enabled: boolean;
  trigger: PaywallTriggerKey | 'none';
  paywall_reason: string;
  why_am_i_seeing_this: string;
  what_unlocks_after_upgrade: string[];
  friction_mode: 'none' | 'soft_modal' | 'delayed_cta' | 'watermark_export' | 'partial_preview';
  pricing_hint?: string;
  urgency_hint?: string;
  usage_based_suggestion?: string;
  most_users_upgrade_hint?: string;
};

function toNumber(value: unknown, fallback = 0) {
  const next = Number(value ?? fallback);
  return Number.isFinite(next) ? next : fallback;
}

function normalize(value: unknown) {
  return String(value || '').trim().toLowerCase();
}

function normalizeEvent(value: unknown) {
  const normalized = normalize(value).replace(/[\s-]+/g, '_');
  const aliases: Record<string, string> = {
    create_invoice: 'create_invoice',
    invoice_create: 'create_invoice',
    invoice_create_start: 'create_invoice',
    create_quote: 'create_quote',
    quote_create: 'create_quote',
    quote_create_start: 'create_quote',
    export_pdf: 'export_pdf',
    pdf_export: 'export_pdf',
    save_to_account: 'save_to_account',
    send_invoice: 'send_invoice',
    pricing_click: 'pricing_view',
    pricing_view: 'pricing_view',
    pricing_cta: 'pricing_view',
    upgrade_cta: 'upgrade_cta',
    checkout_start: 'checkout_start',
    payment_start: 'checkout_start',
    payment_success: 'payment_success',
    checkout_completed: 'payment_success',
    payment_completed: 'payment_success',
    dashboard_view: 'dashboard_view',
  };
  return aliases[normalized] || normalized;
}

function normalizeFunnelStep(value: unknown) {
  const normalized = normalize(value).replace(/[\s-]+/g, '_');
  const aliases: Record<string, string> = {
    signup_start: 'signup',
    signup_complete: 'signup',
    auth: 'signup',
    registration: 'signup',
    first_invoice_create: 'first_invoice',
    first_quote_create: 'first_quote',
  };
  return aliases[normalized] || normalized;
}

function createDecisionId(timestamp: number) {
  decisionCounter += 1;
  return `rev_dec_${timestamp}_${String(decisionCounter).padStart(6, '0')}`;
}

function normalizePlan(input: RevenueControlPlaneInput) {
  const plan = normalize(input.user_plan || input.plan || input.user_state || 'free');
  if (plan === 'paid' || plan === 'pro' || plan === 'agency') return 'paid';
  return 'free';
}

function isAuthenticated(input: RevenueControlPlaneInput) {
  if (typeof input.is_authenticated === 'boolean') return input.is_authenticated;
  const userId = String(input.user_id || '').trim();
  return Boolean(userId && userId !== 'anonymous' && userId !== 'guest');
}

function isGuestMode(input: RevenueControlPlaneInput) {
  if (typeof input.guest_mode_user === 'boolean') return input.guest_mode_user;
  return !isAuthenticated(input);
}

function computeFunnelStage(input: RevenueControlPlaneInput, event: string, funnelStep: string) {
  if (event === 'payment_success') return 'payment_success';
  if (event === 'export_pdf') return 'export_monetization';
  if (event === 'save_to_account' || event === 'send_invoice') return 'delayed_signup';
  if (event === 'pricing_view') return 'pricing_intent';
  if (event === 'dashboard_view') return 'dashboard';
  if (funnelStep === 'first_invoice' || event === 'create_invoice') return 'first_value';
  if (funnelStep === 'first_quote' || event === 'create_quote') return 'quote_value';
  if (funnelStep === 'signup') return 'signup';
  return funnelStep || event || 'unknown';
}

function hasPayment(input: RevenueControlPlaneInput) {
  if (typeof input.has_payment === 'boolean') return input.has_payment;
  if (typeof input.no_payment === 'boolean') return !input.no_payment;
  return normalizePlan(input) === 'paid';
}

function computePricingIntentScore(input: RevenueControlPlaneInput, event: string) {
  return 0;
}

function computeRevenueSignalScore(input: RevenueControlPlaneInput, event: string, action: RevenueControlPlaneAction) {
  return 0;
}

function buildUpgradeRecommendation(action: RevenueControlPlaneAction, event: string, userPlan: string) {
  if (event === 'payment_success') return 'none';
  if (userPlan !== 'free') return 'none';
  if (event === 'export_pdf') return 'upgrade_to_pro_for_pdf_export';
  if (event === 'send_invoice') return 'signup_or_upgrade_to_send_invoice';
  if (event === 'save_to_account') return 'signup_to_save_work';
  if (action === 'upsell' || action === 'soft_paywall') return 'review_pro_plan';
  return 'none';
}

function createPaywallTriggerMap(input: RevenueControlPlaneInput, event: string): PaywallTriggerMap {
  return {
    high_intent_upgrade_cta: false,
    value_paywall_overlay: false,
    high_intent_upgrade_hint: false,
    invoice_usage_upgrade_suggestion: false,
  };
}

function choosePsychologyTrigger(triggerMap: PaywallTriggerMap): PaywallTriggerKey | 'none' {
  return 'none';
}

function buildPsychologySignal(
  input: RevenueControlPlaneInput,
  event: string,
  action: RevenueControlPlaneAction,
  triggerMap: PaywallTriggerMap,
): RevenuePsychologySignal {
  return {
    enabled: false,
    trigger: 'none',
    paywall_reason: 'No monetization prompt',
    why_am_i_seeing_this: 'No monetization psychology trigger matched this action.',
    what_unlocks_after_upgrade: [
      'Professional Invoice Delivery',
      'Send invoices and quotes to clients',
      'Save client-ready work permanently',
    ],
    friction_mode: 'none',
  };
}

function buildUpgradeTarget(event: string, upgradeRecommendation: string) {
  if (upgradeRecommendation === 'none') return undefined;
  if (event === 'save_to_account' || event === 'send_invoice') return 'signup_page';
  return 'pricing_page';
}

function isPromptRetryAllowed(input: RevenueControlPlaneInput, event: string) {
  return Boolean(input.explicit_retry || input.retry_action) && PROMPT_RETRY_EVENTS.has(event);
}

function getSessionPromptCount(input: RevenueControlPlaneInput) {
  return Math.max(
    0,
    toNumber(input.monetization_prompt_count, 0),
    input.has_seen_monetization_prompt ? 1 : 0,
  );
}

function isProtectedValueAction(event: string, funnelStep: string, input: RevenueControlPlaneInput) {
  const invoiceCount = Math.max(0, toNumber(input.invoice_count, 0));
  const quoteCount = Math.max(0, toNumber(input.quote_count, 0));
  return event === 'payment_success'
    || funnelStep === 'signup'
    || event === 'dashboard_view'
    || funnelStep === 'first_invoice'
    || funnelStep === 'first_quote'
    || event === 'create_invoice'
    || event === 'create_quote'
    || (event === 'create_invoice' && invoiceCount === 0)
    || (event === 'create_quote' && quoteCount === 0);
}

function isPromptAllowed(input: RevenueControlPlaneInput, event: string, action: RevenueControlPlaneAction) {
  if (!MONETIZATION_PROMPT_ACTIONS.has(action)) return true;
  if (isProtectedValueAction(event, normalizeFunnelStep(input.funnel_step), input)) return true;
  if (getSessionPromptCount(input) < 1) return true;
  return isPromptRetryAllowed(input, event);
}

function educationalMessageForEvent(event: string, action: RevenueControlPlaneAction) {
  if (event === 'payment_success') {
    return 'Payment completed successfully. Monetization prompts are disabled for this terminal success state.';
  }

  if (event === 'export_pdf' && action === 'soft_paywall') {
    return 'Professional Invoice Delivery is a Pro feature. Free exports include a preview watermark.';
  }

  if (event === 'send_invoice') {
    return 'Sending invoices is part of the paid client workflow. You can finish the invoice first, then decide whether to upgrade.';
  }

  if (event === 'save_to_account') {
    return 'Saving to an account keeps your work available later. You can finish creating value before signing up.';
  }

  if (action === 'upsell') {
    return 'The Pro plan is suggested only after usage shows it may help your workflow. The prompt is educational and does not block core creation.';
  }

  return 'Corvioz should help users experience value before showing paid options.';
}

function buildTrustGuardrail(
  input: RevenueControlPlaneInput,
  event: string,
  funnelStep: string,
  action: RevenueControlPlaneAction,
) {
  const protectedValueAction = isProtectedValueAction(event, funnelStep, input);
  const promptAllowed = isPromptAllowed(input, event, action);
  return {
    value_first: true,
    protected_value_action: protectedValueAction,
    prompt_allowed: promptAllowed,
    prompt_policy: promptAllowed
      ? 'max_one_prompt_per_session_or_explicit_retry'
      : 'prompt_suppressed_after_session_limit',
    educational_message: educationalMessageForEvent(event, action),
    free_included: FREE_INCLUDED,
    paid_required: PAID_REQUIRED,
  };
}

function buildPricingTriggerAttribution(input: RevenueControlPlaneInput, event: string) {
  return {
    triggered: false,
    trigger: 'none',
    pricing_viewed: Boolean(input.pricing_viewed) || event === 'pricing_view',
    pricing_view_count: 0,
    pricing_change: 0,
  };
}

function buildReasonChain(
  input: RevenueControlPlaneInput,
  action: RevenueControlPlaneAction,
  reason: string,
  riskLevel: RevenueControlPlaneRiskLevel,
) {
  const event = normalizeEvent(input.event) || 'unknown_event';
  const funnelStep = normalizeFunnelStep(input.funnel_step) || 'unknown_step';
  const chain = [
    `event:${event}`,
    `funnel_step:${funnelStep}`,
    `intent_score:0`,
    `pricing_view_count:0`,
    `usage_count:0`,
    `user_plan:${normalizePlan(input)}`,
    `guest_mode_user:${isGuestMode(input)}`,
    `risk_level:${riskLevel}`,
    `decision:${action}`,
    reason,
  ];

  if (SHADOW_MODE && action !== 'allow') {
    chain.push(`shadow_mode:true would_${action}`);
  }

  return chain;
}

function baseDecision(
  input: RevenueControlPlaneInput,
  action: RevenueControlPlaneAction,
  reason: string,
  risk_level: RevenueControlPlaneRiskLevel,
): RevenueControlPlaneDecision {
  const timestamp = Date.now();
  const event = normalizeEvent(input.event) || 'unknown_event';
  const funnelStep = normalizeFunnelStep(input.funnel_step) || 'unknown_step';
  const userId = String(input.user_id || 'anonymous');
  const reasonChain = buildReasonChain(input, action, reason, risk_level);
  const pricingTriggerAttribution = buildPricingTriggerAttribution(input, event);
  const userPlan = normalizePlan(input);
  const guestModeUser = isGuestMode(input);
  const invoiceCount = toNumber(input.invoice_count, 0);
  const activatedUser = Boolean(input.activated_user)
    || invoiceCount > 0
    || funnelStep === 'first_invoice'
    || (event === 'create_invoice' && invoiceCount === 0);
  const firstValueTimestamp = activatedUser
    ? Math.max(0, toNumber(input.first_value_timestamp, Date.now()))
    : undefined;
  const funnelStage = computeFunnelStage(input, event, funnelStep);
  const pricingIntentScore = 0;
  const revenueSignalScore = 0;
  const upgradeRecommendation = buildUpgradeRecommendation(action, event, userPlan);
  const upgradeTarget = buildUpgradeTarget(event, upgradeRecommendation);
  const trustGuardrail = buildTrustGuardrail(input, event, funnelStep, action);
  const paywallTriggerMap = createPaywallTriggerMap(input, event);
  const psychology = buildPsychologySignal(input, event, action, paywallTriggerMap);
  const decisionBase = {
    decision_id: createDecisionId(timestamp),
    user_id: userId,
    event,
    reason,
    reason_chain: reasonChain,
    risk_level,
    intent_score: 0,
    intent_contribution_score: 0,
    pricing_trigger_attribution: pricingTriggerAttribution,
    explanation: {
      summary: trustGuardrail.educational_message,
      factors: [
        psychology.enabled ? psychology.paywall_reason : 'Value first: invoice and quote creation stay free before signup.',
        `Why am I seeing this? ${psychology.why_am_i_seeing_this}`,
        `What unlocks after upgrade? ${psychology.what_unlocks_after_upgrade.join(', ')}`,
      ],
      intent_score: 0,
    },
    revenue_signal_score: revenueSignalScore,
    funnel_stage: funnelStage,
    upgrade_recommendation: upgradeRecommendation,
    ...(upgradeTarget ? { upgrade_target: upgradeTarget } : {}),
    guest_mode_user: guestModeUser,
    activated_user: activatedUser,
    ...(firstValueTimestamp ? { first_value_timestamp: firstValueTimestamp } : {}),
    pricing_intent_score: pricingIntentScore,
    trust_guardrail: trustGuardrail,
    psychology,
    paywall_trigger_map: paywallTriggerMap,
    timestamp,
    simulated: SHADOW_MODE,
    shadow_mode: SHADOW_MODE,
  };
  const ga4Event = buildControlPlaneGA4Payload({
    event,
    user_id: userId,
    intent_score: 0,
    funnel_step: funnelStage,
    action,
    decision_id: decisionBase.decision_id,
    risk_level,
    reason,
    session_id: input.session_id,
    metadata: {
      shadow_mode: SHADOW_MODE,
      pricing_trigger: pricingTriggerAttribution.trigger,
      pricing_view_count: pricingTriggerAttribution.pricing_view_count,
      revenue_signal_score: revenueSignalScore,
      upgrade_recommendation: upgradeRecommendation,
      upgrade_target: upgradeTarget,
      guest_mode_user: guestModeUser,
      activated_user: activatedUser,
      psychology_trigger: psychology.trigger,
      friction_mode: psychology.friction_mode,
    },
  });

  if (SHADOW_MODE && action !== 'allow') {
    return {
      ...decisionBase,
      action: 'allow',
      reason: `Shadow mode: would ${action}. ${reason}`,
      reason_chain: [
        ...reasonChain,
        `api_action:allow`,
        `shadow_action:${action}`,
      ],
      shadow_action: action,
      ga4_event: ga4Event ? {
        ...ga4Event,
        action: 'allow',
        metadata: {
          ...ga4Event.metadata,
          simulated: true,
          shadow_action: action,
        },
      } : null,
    };
  }

  return {
    ...decisionBase,
    action,
    ga4_event: ga4Event,
  };
}

function allow(input: RevenueControlPlaneInput, reason = 'Revenue control plane approved action.') {
  return baseDecision(input, 'allow', reason, 'low');
}

function block(input: RevenueControlPlaneInput, reason: string) {
  return baseDecision(input, 'block', reason, 'high');
}

function softPaywall(input: RevenueControlPlaneInput, reason = 'High-intent export should receive a soft paywall.') {
  return baseDecision(input, 'soft_paywall', reason, 'medium');
}

function upsell(input: RevenueControlPlaneInput, reason = 'Repeated pricing engagement should receive an upsell.') {
  return baseDecision(input, 'upsell', reason, 'medium');
}

export function recordRevenueDecision(decision: RevenueControlPlaneDecision | RevenueDecisionLogEntry) {
  revenue_decision_log.unshift({
    decision_id: decision.decision_id,
    user_id: decision.user_id,
    event: decision.event,
    action: decision.action,
    shadow_action: 'shadow_action' in decision ? decision.shadow_action : undefined,
    risk_level: decision.risk_level,
    intent_score: decision.intent_score,
    reason_chain: decision.reason_chain,
    intent_contribution_score: decision.intent_contribution_score,
    pricing_trigger_attribution: decision.pricing_trigger_attribution,
    explanation: decision.explanation,
    revenue_signal_score: decision.revenue_signal_score,
    funnel_stage: decision.funnel_stage,
    upgrade_recommendation: decision.upgrade_recommendation,
    upgrade_target: decision.upgrade_target,
    guest_mode_user: decision.guest_mode_user,
    activated_user: decision.activated_user,
    first_value_timestamp: decision.first_value_timestamp,
    pricing_intent_score: decision.pricing_intent_score,
    trust_guardrail: decision.trust_guardrail,
    psychology: decision.psychology,
    paywall_trigger_map: decision.paywall_trigger_map,
    timestamp: decision.timestamp,
    simulated: decision.simulated,
    reason: decision.reason,
    ga4_event: decision.ga4_event,
  });
  if (revenue_decision_log.length > 100) {
    revenue_decision_log.pop();
  }
}

function recordFunnelEvent(decision: RevenueControlPlaneDecision, event: FunnelEventLogEntry['event'], metadata: FunnelEventLogEntry['metadata'] = {}) {
  funnel_event_log.unshift({
    event,
    user_id: decision.user_id,
    decision_id: decision.decision_id,
    funnel_stage: decision.funnel_stage,
    timestamp: decision.timestamp,
    metadata,
  });
  if (funnel_event_log.length > 200) {
    funnel_event_log.pop();
  }
}

function suppressRepeatedPrompt(input: RevenueControlPlaneInput, decision: RevenueControlPlaneDecision) {
  const event = normalizeEvent(input.event) || 'unknown_event';

  if (!MONETIZATION_PROMPT_ACTIONS.has(decision.shadow_action || decision.action)) {
    return decision;
  }

  if (isPromptAllowed(input, event, decision.shadow_action || decision.action)) {
    return decision;
  }

  const suppressedDecision = allow(input, `Trust guardrail: monetization prompt suppressed after one prompt this session for ${event}.`);
  return {
    ...suppressedDecision,
    trust_guardrail: {
      ...suppressedDecision.trust_guardrail,
      prompt_allowed: false,
      prompt_policy: 'prompt_suppressed_after_session_limit',
      educational_message: 'Only one monetization prompt is allowed per session unless the user explicitly retries export or send.',
    },
    explanation: {
      summary: 'Only one monetization prompt is allowed per session unless you retry export or send.',
      factors: [
        'Prompt frequency guard applied.',
        'Why am I seeing this? Monetization prompts are limited to protect usability.',
        `What unlocks after upgrade? ${PAID_REQUIRED.join(', ')}`,
      ],
      intent_score: 0,
    },
  };
}

export function evaluateRevenueAction(input: RevenueControlPlaneInput = {}): RevenueControlPlaneDecision {
  const {
    user_id,
    event,
    funnel_step,
  } = input;
  const normalizedEvent = normalizeEvent(event);
  const normalizedFunnelStep = normalizeFunnelStep(funnel_step);
  const userPlan = normalizePlan(input);
  const guestModeUser = isGuestMode(input);
  const usageCount = Math.max(
    toNumber(input.usage_count, 0),
    toNumber(input.invoice_count, 0),
    toNumber(input.quote_count, 0),
    toNumber(input.export_count, 0),
  );
  const invoiceCount = Math.max(0, toNumber(input.invoice_count, 0));
  const quoteCount = Math.max(0, toNumber(input.quote_count, 0));

  let decision: RevenueControlPlaneDecision;

  if (normalizedEvent === 'payment_success') {
    decision = allow(input, 'Payment success is a terminal success state and must never trigger monetization prompts.');
  } else if (normalizedEvent === 'dashboard_view') {
    decision = allow(input, 'Dashboard access must never be blocked.');
  } else if (normalizedFunnelStep === 'signup') {
    decision = allow(input, 'Signup funnel step must never be blocked.');
  } else if (normalizedEvent === 'create_invoice') {
    decision = allow(input, guestModeUser
      ? 'Guest mode invoice creation allowed before signup.'
      : 'Invoice creation must never be blocked.');
  } else if (normalizedEvent === 'create_quote') {
    decision = allow(input, guestModeUser
      ? 'Guest mode quote creation allowed before signup.'
      : 'Quote creation must never be blocked.');
  } else if (funnelRulesReset && normalizedFunnelStep === 'invoice') {
    decision = allow(input, 'Funnel rules reset active: baseline invoicing flow permitted.');
  } else if (normalizedEvent === 'export_pdf' && userPlan === 'free') {
    if (!paywallEngineEnabled) {
      decision = allow(input, 'Paywall engine disabled: free-tier export paywall bypassed.');
    } else {
      decision = softPaywall(input, 'export_locked_free_tier: show value paywall overlay.');
    }
  } else if ((normalizedEvent === 'save_to_account' || normalizedEvent === 'send_invoice') && guestModeUser) {
    decision = baseDecision(input, 'redirect', 'Delayed signup required after value action.', 'medium');
  } else {
    decision = allow(input, 'No revenue control-plane rule matched.');
  }

  decision = suppressRepeatedPrompt(input, decision);

  if ((normalizedEvent === 'create_invoice' || normalizedEvent === 'create_quote') && guestModeUser) {
    recordFunnelEvent(decision, 'signup_bypass_used', {
      event: normalizedEvent,
      invoice_count: invoiceCount,
      quote_count: quoteCount,
    });
  }

  if (normalizedEvent === 'create_invoice' && (invoiceCount === 0 || normalizedFunnelStep === 'first_invoice')) {
    recordFunnelEvent(decision, 'first_invoice_created', {
      activated_user: true,
      first_value_timestamp: decision.first_value_timestamp,
    });
  }

  if (normalizedEvent === 'export_pdf' && userPlan === 'free') {
    recordFunnelEvent(decision, 'export_block_triggered', {
      user_plan: userPlan,
      shadow_action: decision.shadow_action,
      action: decision.action,
      usage_count: usageCount,
    });
  }

  if (normalizedEvent === 'pricing_view') {
    const pricingContext = invoiceCount > 0
      ? 'pricing_view_after_invoice'
      : toNumber(input.export_count, 0) > 0
      ? 'pricing_view_after_export_attempt'
      : 'pricing_view_without_value';
    recordFunnelEvent(decision, 'pricing_view_intent', {
      pricing_context: pricingContext,
      pricing_intent_score: decision.pricing_intent_score,
    });
  }

  return decision;
}

export function getRevenueDecisionLog() {
  return [...revenue_decision_log];
}

export function getFunnelEventLog() {
  return [...funnel_event_log];
}

export function resetControlEngine() {
  SHADOW_MODE = true;
  paywallEngineEnabled = true;
  pricingChangesRolledBack = false;
  funnelRulesReset = false;
}

export function setShadowMode(val: boolean) {
  SHADOW_MODE = val;
}

export function setPaywallEngine(val: boolean) {
  paywallEngineEnabled = val;
}

export function setPricingRollback(val: boolean) {
  pricingChangesRolledBack = val;
}

export function setFunnelRulesReset(val: boolean) {
  funnelRulesReset = val;
}
