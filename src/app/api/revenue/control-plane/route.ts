import { NextResponse } from 'next/server';
import { requireInternalAdmin } from '../../../lib/internal-admin';
import {
  SHADOW_MODE,
  paywallEngineEnabled,
  pricingChangesRolledBack,
  funnelRulesReset,
  setShadowMode,
  setPaywallEngine,
  setPricingRollback,
  setFunnelRulesReset,
  resetControlEngine,
  evaluateRevenueAction,
  getRevenueDecisionLog,
  getFunnelEventLog,
  recordRevenueDecision,
  type PaywallTriggerMap,
  type RevenuePsychologySignal,
} from '../../../lib/revenue/control-plane/decision-engine';
import { validateRevenueDecision, type RevenueDecisionSchema } from '../../../lib/revenue/validate-decision';
import {
  buildControlPlaneGA4Payload,
  trackGA4Event,
  validateFunnelIntegrity,
  getCanonicalGA4FunnelEvents,
  type GA4EventPayload,
} from '../../../lib/analytics/ga4-event-bridge';
import { evaluateV98Readiness } from '../../../lib/revenue/validation/v98ReadinessGate';
import {
  DEFAULT_REVENUE_REPLAY_TRAJECTORIES,
  runRevenueReplay,
  type RevenueReplayEvent,
  type RevenueReplayTrajectory,
} from '../../../lib/replay/revenue-replay-engine';
import { runRevenueSimulation, type RevenueSimulationResult } from '../../../lib/simulation/revenue-simulation-engine';
import { runRevenueDryRun } from '../../../lib/revenue/final-dry-run';

const RATE_LIMIT_MS = 800;
const decisionRateLimit = new Map<string, number>();
let safeDecisionCounter = 0;
let criticalLogCounter = 0;
const emittedGA4Events: string[] = [];

function normalizeEventKey(value: unknown) {
  return String(value || 'unknown_event').trim().toLowerCase().replace(/[\s-]+/g, '_');
}

function toNumber(value: unknown, fallback = 0) {
  const next = Number(value ?? fallback);
  return Number.isFinite(next) ? next : fallback;
}

function strictDecisionResponse(decision: RevenueDecisionSchema) {
  const ga4Event = decision.ga4_event ?? buildControlPlaneGA4Payload({
    event: decision.ga4_event?.event_name ?? decision.funnel_stage,
    user_id: 'anonymous',
    intent_score: decision.intent_score,
    funnel_step: decision.funnel_stage,
    action: decision.action,
    decision_id: decision.decision_id,
    risk_level: decision.risk_level,
    reason: decision.reason,
  });
  const pricingAttribution = decision.pricing_trigger_attribution ?? {
    triggered: false,
    trigger: 'none',
    pricing_viewed: false,
    pricing_view_count: 0,
    pricing_change: 0,
  };
  const factors = [
    ...(decision.explanation?.factors ?? []),
    ...(pricingAttribution.triggered ? [`Pricing trigger: ${pricingAttribution.trigger}`] : []),
  ].filter(Boolean).slice(0, 5);

  return {
    decision_id: decision.decision_id,
    action: decision.action,
    shadow_action: decision.shadow_action,
    backend_action: decision.action,
    ui_action: decision.action,
    reason: decision.reason,
    reason_chain: decision.reason_chain ?? [decision.reason],
    risk_level: decision.risk_level,
    intent_score: decision.intent_score,
    intent_contribution_score: decision.intent_contribution_score ?? decision.intent_score,
    pricing_trigger_attribution: pricingAttribution,
    explanation: {
      summary: decision.explanation?.summary ?? decision.reason,
      factors: factors.length > 0 ? factors : [decision.reason],
      intent_score: decision.intent_score,
    },
    revenue_signal_score: decision.revenue_signal_score ?? decision.intent_score,
    funnel_stage: decision.funnel_stage ?? 'unknown',
    upgrade_recommendation: decision.upgrade_recommendation ?? 'none',
    ...(decision.upgrade_target ? { upgrade_target: decision.upgrade_target } : {}),
    guest_mode_user: Boolean(decision.guest_mode_user),
    activated_user: Boolean(decision.activated_user),
    ...(decision.first_value_timestamp ? { first_value_timestamp: decision.first_value_timestamp } : {}),
    pricing_intent_score: decision.pricing_intent_score ?? decision.intent_score,
    trust_guardrail: decision.trust_guardrail,
    psychology: decision.psychology,
    paywall_trigger_map: decision.paywall_trigger_map,
    ga4_event: ga4Event,
    ga4_sync_status: ga4Event ? 'synced' : 'unmapped',
    ga4_delivery: 'server',
    shadow_mode: SHADOW_MODE,
  };
}

function logCritical(message: string) {
  criticalLogCounter += 1;
  recordRevenueDecision({
    decision_id: `critical_${Date.now()}_${String(criticalLogCounter).padStart(6, '0')}`,
    user_id: 'system',
    event: 'paywall_aggression_guard',
    action: 'block',
    risk_level: 'high',
    intent_score: 0,
    reason_chain: ['paywall_aggression_guard', message],
    intent_contribution_score: 0,
    pricing_trigger_attribution: {
      triggered: false,
      trigger: 'paywall_aggression_guard',
      pricing_viewed: false,
      pricing_view_count: 0,
      pricing_change: 0,
    },
    explanation: {
      summary: message,
      factors: ['Block rate exceeded 25% safety threshold'],
      intent_score: 0,
    },
    timestamp: Date.now(),
    simulated: true,
    reason: message,
  });
  console.error(`[revenue-control-plane] ${message}`);
}

function calculateBlockRate() {
  const decisions = getRevenueDecisionLog().filter((entry) => entry.event !== 'paywall_aggression_guard');
  if (decisions.length === 0) return 0;
  const blockCount = decisions.filter((entry) => entry.action === 'block').length;
  return blockCount / decisions.length;
}

function createSafeDecision(userId: string, event: string, intentScore: number, reason: string): RevenueDecisionSchema {
  safeDecisionCounter += 1;
  const decisionId = `safe_${Date.now()}_${String(safeDecisionCounter).padStart(6, '0')}`;
  return {
    decision_id: decisionId,
    action: 'allow',
    reason,
    reason_chain: [reason, 'rate_limit_guard:safe_allow'],
    risk_level: 'low',
    intent_score: Math.max(0, Math.min(100, toNumber(intentScore, 0))),
    intent_contribution_score: Math.max(0, Math.min(100, toNumber(intentScore, 0))),
    pricing_trigger_attribution: {
      triggered: false,
      trigger: 'rate_limit_guard',
      pricing_viewed: event === 'pricing_view',
      pricing_view_count: 0,
      pricing_change: 0,
    },
    explanation: {
      summary: 'Duplicate revenue decision safely allowed',
      factors: ['Multiple rapid control-plane calls detected', 'Action allowed to avoid production interference'],
      intent_score: Math.max(0, Math.min(100, toNumber(intentScore, 0))),
    },
    revenue_signal_score: 0,
    funnel_stage: 'rate_limit_guard',
    upgrade_recommendation: 'none',
    guest_mode_user: false,
    activated_user: false,
    pricing_intent_score: 0,
    trust_guardrail: {
      value_first: true,
      protected_value_action: false,
      prompt_allowed: true,
      prompt_policy: 'rate_limit_guard:safe_allow',
      educational_message: 'Duplicate checks are allowed silently to avoid disrupting the user.',
      free_included: ['Create your first invoice', 'Create your first quote'],
      paid_required: ['Export PDF', 'Send invoices', 'Save work permanently'],
    },
    psychology: {
      enabled: false,
      trigger: 'none',
      paywall_reason: 'No monetization prompt',
      why_am_i_seeing_this: 'Duplicate checks are allowed silently to avoid disrupting the user.',
      what_unlocks_after_upgrade: ['Professional Invoice Delivery', 'Send invoices and quotes to clients', 'Save work permanently'],
      friction_mode: 'none',
    },
    paywall_trigger_map: {
      high_intent_upgrade_cta: false,
      value_paywall_overlay: false,
      high_intent_upgrade_hint: false,
      invoice_usage_upgrade_suggestion: false,
    },
    ga4_event: buildControlPlaneGA4Payload({
      event,
      user_id: userId,
      intent_score: intentScore,
      funnel_step: 'rate_limit_guard',
      action: 'allow',
      decision_id: decisionId,
      risk_level: 'low',
      reason,
    }),
  };
}

function logSchemaDecision(
  decision: RevenueDecisionSchema,
  userId: string,
  event: string,
  simulated = SHADOW_MODE,
  shadowAction?: RevenueDecisionSchema['action'],
) {
  recordRevenueDecision({
    decision_id: decision.decision_id,
    user_id: userId,
    event,
    action: decision.action,
    shadow_action: shadowAction,
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
    ga4_event: decision.ga4_event,
    psychology: decision.psychology as RevenuePsychologySignal | undefined,
    paywall_trigger_map: decision.paywall_trigger_map as PaywallTriggerMap | undefined,
    timestamp: Date.now(),
    simulated,
    reason: decision.reason,
  });
}

function validateAndLogDecision(rawDecision, userId: string, event: string) {
  const validated = validateRevenueDecision({
    decision_id: rawDecision?.decision_id,
    action: rawDecision?.action,
    shadow_action: rawDecision?.shadow_action,
    reason: rawDecision?.reason,
    reason_chain: rawDecision?.reason_chain,
    risk_level: rawDecision?.risk_level,
    intent_score: rawDecision?.intent_score,
    intent_contribution_score: rawDecision?.intent_contribution_score,
    pricing_trigger_attribution: rawDecision?.pricing_trigger_attribution,
    explanation: rawDecision?.explanation,
    revenue_signal_score: rawDecision?.revenue_signal_score,
    funnel_stage: rawDecision?.funnel_stage,
    upgrade_recommendation: rawDecision?.upgrade_recommendation,
    upgrade_target: rawDecision?.upgrade_target,
    guest_mode_user: rawDecision?.guest_mode_user,
    activated_user: rawDecision?.activated_user,
    first_value_timestamp: rawDecision?.first_value_timestamp,
    pricing_intent_score: rawDecision?.pricing_intent_score,
    trust_guardrail: rawDecision?.trust_guardrail,
    psychology: rawDecision?.psychology,
    paywall_trigger_map: rawDecision?.paywall_trigger_map,
    ga4_event: rawDecision?.ga4_event,
  });
  const shadowAction = rawDecision?.shadow_action && rawDecision?.simulated
    ? rawDecision.shadow_action
    : undefined;
  logSchemaDecision(validated, userId, event, Boolean(rawDecision?.simulated || SHADOW_MODE), shadowAction);
  return validated;
}

function emitDecisionGA4(decision: RevenueDecisionSchema, fallbackEvent: string, userId: string, sessionId = ''): GA4EventPayload | null {
  const payload = decision.ga4_event ?? buildControlPlaneGA4Payload({
    event: fallbackEvent,
    user_id: userId,
    intent_score: decision.intent_score,
    funnel_step: decision.funnel_stage,
    action: decision.action,
    decision_id: decision.decision_id,
    risk_level: decision.risk_level,
    reason: decision.reason,
    session_id: sessionId,
    metadata: {
      source: 'control_plane_api',
      shadow_mode: SHADOW_MODE,
      shadow_action: decision.shadow_action,
      revenue_signal_score: decision.revenue_signal_score,
      pricing_intent_score: decision.pricing_intent_score,
    },
  });

  if (!payload) {
    if (process.env.GA4_DEBUG === 'true') {
      console.warn('[GA4 DEBUG] Control-plane decision has no GA4 mapping', {
        decision_id: decision.decision_id,
        event: fallbackEvent,
      });
    }
    return null;
  }

  emittedGA4Events.push(payload.event_name);
  if (emittedGA4Events.length > 250) emittedGA4Events.shift();
  trackGA4Event(payload.event_name, payload);
  return payload;
}

function getControlPlaneState() {
  // Determine global Risk Level
  let riskLevel = 'MEDIUM';
  if (SHADOW_MODE) {
    riskLevel = 'LOW';
  } else {
    if (paywallEngineEnabled && !pricingChangesRolledBack) {
      riskLevel = 'HIGH';
    } else if (!paywallEngineEnabled && pricingChangesRolledBack && funnelRulesReset) {
      riskLevel = 'LOW';
    } else {
      riskLevel = 'MEDIUM';
    }
  }

  // Determine Component Risks (green = safe, yellow = warning, red = danger)
  // Paywall Risk
  let paywallRisk = 'danger';
  if (!paywallEngineEnabled) paywallRisk = 'safe';
  else if (SHADOW_MODE) paywallRisk = 'warning';

  // Pricing Risk
  let pricingRisk = 'danger';
  if (pricingChangesRolledBack) pricingRisk = 'safe';
  else if (SHADOW_MODE) pricingRisk = 'warning';

  // Funnel Break Risk
  let funnelRisk = 'warning';
  if (funnelRulesReset) funnelRisk = 'safe';

  // Misclassification Risk
  let misclassificationRisk = 'warning';
  if (SHADOW_MODE) misclassificationRisk = 'safe';

  const rawDecisions = getRevenueDecisionLog();
  const funnelIntegrity = validateFunnelIntegrity({
    emitted_events: emittedGA4Events,
    control_plane_mapped_events: getCanonicalGA4FunnelEvents(),
    decision_events: rawDecisions.map((entry) => entry.ga4_event?.event_name).filter(Boolean),
  });
  const blockRate = calculateBlockRate();
  const systemStatus = blockRate > 0.25 ? 'NOT_READY_FOR_V98' : 'ACTIVE';
  const hasRecentAggressionCritical = rawDecisions.some((entry) => entry.event === 'paywall_aggression_guard');
  if (blockRate > 0.25 && !hasRecentAggressionCritical) {
    logCritical('Paywall aggression exceeded threshold');
  }
  const processedDecisions = rawDecisions.map((entry) => {
    const ts = typeof entry.timestamp === 'number'
      ? new Date(entry.timestamp).toTimeString().split(' ')[0]
      : String(entry.timestamp ?? '');
    return {
      id: entry.decision_id,
      decision_id: entry.decision_id,
      action: entry.event || 'Action Checked',
      intent_score: entry.intent_score ?? 80,
      decision: entry.action,
      backend_action: entry.action,
      ui_action: entry.action,
      shadow_action: entry.shadow_action,
      risk_level: entry.risk_level,
      reason_chain: entry.reason_chain ?? [],
      intent_contribution_score: entry.intent_contribution_score ?? entry.intent_score ?? 0,
      pricing_trigger_attribution: entry.pricing_trigger_attribution ?? {
        triggered: false,
        trigger: 'none',
        pricing_viewed: false,
        pricing_view_count: 0,
        pricing_change: 0,
      },
      explanation: entry.explanation ?? {
        summary: entry.reason ?? 'Revenue decision evaluated',
        factors: entry.reason_chain?.slice(0, 5) ?? [entry.reason ?? 'Decision evaluated'],
        intent_score: entry.intent_score ?? 0,
      },
      revenue_signal_score: entry.revenue_signal_score ?? entry.intent_score ?? 0,
      funnel_stage: entry.funnel_stage ?? 'unknown',
      upgrade_recommendation: entry.upgrade_recommendation ?? 'none',
      upgrade_target: entry.upgrade_target,
      guest_mode_user: Boolean(entry.guest_mode_user),
      activated_user: Boolean(entry.activated_user),
      first_value_timestamp: entry.first_value_timestamp,
      pricing_intent_score: entry.pricing_intent_score ?? entry.intent_score ?? 0,
      trust_guardrail: entry.trust_guardrail,
      psychology: entry.psychology,
      paywall_trigger_map: entry.paywall_trigger_map,
      ga4_event: entry.ga4_event,
      simulated: entry.simulated,
      reason: entry.reason ?? '',
      timestamp: ts,
    };
  });
  const explainabilityComplete = rawDecisions.length === 0 || rawDecisions.every((entry) => {
    const explanation = entry.explanation;
    return Boolean(explanation?.summary && Array.isArray(explanation.factors) && explanation.factors.length > 0);
  });
  const falseBlockRate = rawDecisions.length > 0
    ? rawDecisions.filter((entry) => entry.action === 'block' && ['signup', 'create_invoice', 'create_quote'].includes(entry.event)).length / rawDecisions.length
    : 0;
  const v98Readiness = evaluateV98Readiness({
    mismatch_rate: 0,
    false_block_rate: falseBlockRate,
    explainability_complete: explainabilityComplete,
  });


  return {
    success: true,
    system_status: systemStatus,
    shadow_mode: SHADOW_MODE,
    risk_level: riskLevel,
    block_rate: blockRate,
    paywall_aggression_guard: {
      threshold: 0.25,
      block_rate: blockRate,
      status: systemStatus,
    },
    v98_readiness: {
      ...v98Readiness,
      v98_ready: v98Readiness.v98_ready && systemStatus === 'ACTIVE',
    },
    risks: {
      paywall: paywallRisk,
      pricing: pricingRisk,
      funnel: funnelRisk,
      misclassification: misclassificationRisk
    },
    state: {
      shadowMode: SHADOW_MODE,
      paywallEngineEnabled,
      pricingChangesRolledBack,
      funnelRulesReset
    },
    funnel_event_log: getFunnelEventLog(),
    ga4_funnel_integrity: funnelIntegrity,
    decisions: processedDecisions
  };
}

export async function GET(request: Request) {
  try {
    const gate = await requireInternalAdmin(request);
    if (gate.response) return gate.response;
    const state = getControlPlaneState();
    return NextResponse.json(state);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

// Normalize human-readable or camelCase simulate_action strings to snake_case events
function resolveSimulateEvent(act: string): string {
  const normalized = act.toLowerCase().replace(/[^a-z_]/g, '_');
  const aliases: Record<string, string> = {
    'create_invoice': 'create_invoice',
    'create invoice': 'create_invoice',
    'export_pdf': 'export_pdf',
    'export pdf': 'export_pdf',
    'upgrade_cta': 'checkout_start',
    'upgrade cta': 'checkout_start',
    'pricing_click': 'pricing_view',
    'pricing click': 'pricing_view',
    'pricing_cta': 'pricing_view',
    'pricing cta': 'pricing_view',
    'create_quote': 'create_quote',
    'create quote': 'create_quote',
    'send_invoice': 'send_invoice',
    'send invoice': 'send_invoice',
    'client_portal': 'client_portal',
    'client portal': 'client_portal',
    'repeat_dashboard_without_payment': 'pricing_view',
  };
  return aliases[normalized] ?? normalized;
}

export async function POST(request: Request) {
  try {
    const gate = await requireInternalAdmin(request);
    if (gate.response) return gate.response;
    const body = await request.json().catch(() => ({}));

    // Context signals sent by useRevenueDecision hook
    const ctx = (body.context ?? {}) as Record<string, unknown>;
    const ctxIntentScore = Number(ctx.intent_score ?? 0);
    const ctxInvoiceCount = Number(ctx.invoices_count ?? 0);
    const ctxQuoteCount = Number(ctx.quotes_count ?? 0);
    const ctxExportCount = Number(ctx.export_attempts ?? 0);
    const ctxPricingViewCount = Number(ctx.pricing_view_count ?? 0);
    const ctxSessionTime = Number(ctx.session_time ?? 0);
    const ctxIsFirstAction = Boolean(ctx.is_first_action ?? false);
    const ctxPromptCount = Number(ctx.monetization_prompt_count ?? ctx.prompt_count ?? 0);
    const ctxHasSeenPrompt = Boolean(ctx.has_seen_monetization_prompt ?? ctx.has_seen_prompt ?? false);

    const isControlCommand = Boolean(
      body.simulate_action
      || body.action === 'run_replay'
      || body.action === 'run_final_dry_run'
      || body.replay_events
      || body.user_trajectory
      || body.action === 'toggle_shadow_mode'
      || body.action === 'toggle_paywall'
      || body.action === 'rollback_pricing'
      || body.action === 'reset_funnel'
      || body.action === 'reset_all'
    );

    // 0. Production replay harness: no DB writes, no external calls, no user blocking.
    if (body.action === 'run_final_dry_run') {
      const dryRunResult = runRevenueDryRun({
        users: Math.max(1000, Math.floor(toNumber(body.users, 1000))),
        seed: Math.floor(toNumber(body.seed, 9756)),
      });

      return NextResponse.json({
        success: true,
        system_status: dryRunResult.paywall_safety.system_status,
        dry_run_result: dryRunResult,
      });
    }

    if (body.action === 'run_replay' || body.replay_events || body.user_trajectory) {
      const replayInput = Array.isArray(body.user_trajectory)
        ? body.user_trajectory as RevenueReplayTrajectory[]
        : Array.isArray(body.replay_events)
        ? body.replay_events as RevenueReplayEvent[]
        : DEFAULT_REVENUE_REPLAY_TRAJECTORIES;
      const simulationResult = body.simulation_result
        ? body.simulation_result as RevenueSimulationResult
        : runRevenueSimulation();
      const replayResult = runRevenueReplay(replayInput, simulationResult);
      const state = getControlPlaneState();

      return NextResponse.json({
        success: true,
        system_status: replayResult.v97_6_ready ? state.system_status : 'NOT_READY_FOR_V98',
        shadow_mode: SHADOW_MODE,
        replay_result: replayResult,
        simulation_result: {
          conversion_rate: simulationResult.conversion_rate,
          paywall_trigger_rate: simulationResult.paywall_trigger_rate,
          false_block_rate: simulationResult.false_block_rate,
          revenue_events: simulationResult.revenue_events,
          decision_consistency_rate: simulationResult.decision_consistency_rate,
        },
        v97_6_gate: {
          v97_6_ready: replayResult.v97_6_ready,
          block_progression_to_v98: replayResult.block_progression_to_v98,
          rule: 'drift_rate < 3% && false_block_rate < 5% && simulation_stable === true',
        },
        control_plane_state: state,
      });
    }

    // 1. Handle simulated / hook-triggered actions
    if (body.simulate_action) {
      const resolvedEvent = resolveSimulateEvent(String(body.simulate_action));
      const userId = String(body.user_id ?? 'ui_hook');

      // Determine funnel_step: first-time actions get protected funnel steps
      const funnelStep = ctxIsFirstAction
        ? resolvedEvent === 'create_invoice'
          ? 'first_invoice'
          : resolvedEvent === 'create_quote'
          ? 'first_quote'
          : ''
        : resolvedEvent === 'create_invoice'
        ? 'invoice'
        : '';

      const simulatedDecision = evaluateRevenueAction({
        event: resolvedEvent,
        funnel_step: funnelStep,
        intent_score: ctxIntentScore || 80,
        session_count: ctxPricingViewCount,
        pricing_viewed: ctxPricingViewCount > 0,
        invoice_count: ctxInvoiceCount,
        quote_count: ctxQuoteCount,
        export_count: ctxExportCount,
        usage_count: Math.max(ctxInvoiceCount, ctxQuoteCount, ctxExportCount),
        session_id: String(ctx.session_id ?? body.session_id ?? ''),
        monetization_prompt_count: toNumber(ctx.monetization_prompt_count ?? ctx.prompt_count ?? body.monetization_prompt_count ?? body.prompt_count, 0),
        has_seen_monetization_prompt: Boolean(ctx.has_seen_monetization_prompt ?? ctx.has_seen_prompt ?? body.has_seen_monetization_prompt ?? body.has_seen_prompt ?? false),
        explicit_retry: Boolean(ctx.explicit_retry ?? body.explicit_retry ?? body.retry_action ?? false),
        retry_action: Boolean(ctx.retry_action ?? body.retry_action ?? false),
        user_plan: String(ctx.user_plan ?? ctx.plan ?? body.user_plan ?? body.plan ?? 'free'),
        is_authenticated: Boolean(ctx.is_authenticated ?? body.is_authenticated ?? userId !== 'ui_hook'),
        guest_mode_user: Boolean(ctx.guest_mode_user ?? body.guest_mode_user ?? userId === 'ui_hook'),
        activated_user: Boolean(ctx.activated_user ?? ctxInvoiceCount > 0),
        first_value_timestamp: toNumber(ctx.first_value_timestamp ?? body.first_value_timestamp, 0),
        no_payment: Boolean(ctx.no_payment ?? body.no_payment ?? true),
        has_payment: Boolean(ctx.has_payment ?? body.has_payment ?? false),
        user_id: userId,
      });
      const validatedSimulatedDecision = validateAndLogDecision(simulatedDecision, userId, resolvedEvent);
      emitDecisionGA4(validatedSimulatedDecision, resolvedEvent, userId, String(ctx.session_id ?? body.session_id ?? ''));
    }

    // 2. Handle rollback / override control commands
    if (body.action === 'toggle_shadow_mode') {
      setShadowMode(!SHADOW_MODE);
    } else if (body.action === 'toggle_paywall') {
      setPaywallEngine(!paywallEngineEnabled);
    } else if (body.action === 'rollback_pricing') {
      setPricingRollback(!pricingChangesRolledBack);
    } else if (body.action === 'reset_funnel') {
      setFunnelRulesReset(!funnelRulesReset);
    } else if (body.action === 'reset_all') {
      resetControlEngine();
    }

    // 3. Direct evaluation (non-dashboard, non-simulate_action calls)
    if (!isControlCommand) {
      const userId = String(body.user_id || 'anonymous');
      const event = normalizeEventKey(body.event || body.action_type || body.action);
      const intentScore = Math.max(0, Math.min(100, toNumber(body.intent_score ?? ctxIntentScore, 0)));
      const userPlan = String(body.user_plan ?? body.plan ?? body.user?.plan ?? ctx.user_plan ?? ctx.plan ?? 'free');
      const isAuthenticated = Boolean(body.is_authenticated ?? ctx.is_authenticated ?? (userId !== 'anonymous' && userId !== 'guest'));
      const guestModeUser = Boolean(body.guest_mode_user ?? ctx.guest_mode_user ?? !isAuthenticated);
      const monetizationPromptCount = toNumber(body.monetization_prompt_count ?? body.prompt_count ?? ctxPromptCount, 0);
      const hasSeenPrompt = Boolean(body.has_seen_monetization_prompt ?? body.has_seen_prompt ?? ctxHasSeenPrompt);
      const explicitRetry = Boolean(body.explicit_retry ?? body.retry_action ?? ctx.explicit_retry ?? ctx.retry_action ?? false);
      const inferredFunnelStep = ctxIsFirstAction
        ? event === 'create_invoice'
          ? 'first_invoice'
          : event === 'create_quote'
          ? 'first_quote'
          : String(body.funnel_step ?? ctx.funnel_step ?? '')
        : String(body.funnel_step ?? ctx.funnel_step ?? '');
      const rateKey = `${userId}:${event}`;
      const now = Date.now();
      const previousAt = decisionRateLimit.get(rateKey) || 0;

      if (now - previousAt < RATE_LIMIT_MS) {
        const safeDecision = createSafeDecision(userId, event, intentScore, 'rate_limited_safe_allow');
        logSchemaDecision(safeDecision, userId, event);
        const ga4Event = emitDecisionGA4(safeDecision, event, userId, String(body.session_id ?? ctx.session_id ?? ''));
        return NextResponse.json(strictDecisionResponse(safeDecision));
      }

      decisionRateLimit.set(rateKey, now);

      const decision = evaluateRevenueAction({
        user_id: userId,
        event,
        intent_score: intentScore,
        funnel_step: inferredFunnelStep,
        session_count: body.session_count ?? ctxPricingViewCount,
        pricing_viewed: body.pricing_viewed ?? ctxPricingViewCount > 0,
        pricing_change: body.pricing_change,
        invoice_count: body.invoice_count ?? ctxInvoiceCount,
        quote_count: body.quote_count ?? ctxQuoteCount,
        export_count: body.export_count ?? ctxExportCount,
        usage_count: body.usage_count ?? Math.max(ctxInvoiceCount, ctxQuoteCount, ctxExportCount),
        session_id: String(body.session_id ?? ctx.session_id ?? ''),
        monetization_prompt_count: monetizationPromptCount,
        has_seen_monetization_prompt: hasSeenPrompt,
        explicit_retry: explicitRetry,
        retry_action: explicitRetry,
        user_plan: userPlan,
        plan: userPlan,
        is_authenticated: isAuthenticated,
        guest_mode_user: guestModeUser,
        activated_user: Boolean(body.activated_user ?? ctx.activated_user ?? (toNumber(body.invoice_count ?? ctxInvoiceCount, 0) > 0)),
        first_value_timestamp: toNumber(body.first_value_timestamp ?? ctx.first_value_timestamp, 0),
        no_payment: Boolean(body.no_payment ?? ctx.no_payment ?? userPlan === 'free'),
        has_payment: Boolean(body.has_payment ?? ctx.has_payment ?? userPlan !== 'free'),
      });
      const validatedDecision = validateAndLogDecision(decision, userId, event);
      const ga4Event = emitDecisionGA4(validatedDecision, event, userId, String(body.session_id ?? ctx.session_id ?? ''));

      return NextResponse.json({
        ...strictDecisionResponse({
          ...validatedDecision,
          ga4_event: ga4Event ?? validatedDecision.ga4_event,
        }),
      });
    }

    // 4. Return full control-plane state snapshot (for simulate_action + control commands)
    const state = getControlPlaneState();
    return NextResponse.json(state);
  } catch (error) {
    console.error('Control plane API POST failed:', error);
    return NextResponse.json(
      { error: 'Failed to process control plane request' },
      { status: 500 }
    );
  }
}
