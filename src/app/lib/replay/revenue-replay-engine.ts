import {
  SHADOW_MODE,
  evaluateRevenueAction,
  setShadowMode,
  type RevenueControlPlaneAction,
} from '../revenue/control-plane/decision-engine';
import { validateRevenueDecision } from '../revenue/validate-decision';
import type { PricingInfluence } from '../revenue/validation/validateDecisionConsistency';
import { buildDiffReport, type DecisionDiffReport } from '../revenue/validation/buildDiffReport';
import type { RevenueSimulationResult } from '../simulation/revenue-simulation-engine';

export type ReplayEventName =
  | 'landing_view'
  | 'signup'
  | 'signup_start'
  | 'signup_complete'
  | 'pricing_view'
  | 'invoice_create'
  | 'create_invoice'
  | 'quote_create'
  | 'create_quote'
  | 'export_pdf'
  | 'pricing_change'
  | 'checkout_start'
  | string;

export type RevenueReplayEvent = {
  user_id?: string;
  session_id?: string;
  event: ReplayEventName;
  timestamp?: number;
  intent_score?: number;
  pricing_change?: number;
  session_count?: number;
  pricing_viewed?: boolean;
};

export type RevenueReplayTrajectory = {
  user_id: string;
  sessions: Array<{
    session_id: string;
    events: RevenueReplayEvent[];
  }>;
};

export type ReplayStepResult = {
  user_id: string;
  session_id: string;
  step: string;
  event: string;
  intent_score: number;
  sim_action: RevenueControlPlaneAction;
  live_action: RevenueControlPlaneAction;
  risk_level: 'low' | 'medium' | 'high';
  pricing_trigger_attribution: PricingInfluence;
  revenue_triggered: boolean;
  false_block: boolean;
};

export type ReplayDriftResult = {
  drift_rate: number;
  drift_points: Array<{
    step: string;
    sim: string;
    live: string;
  }>;
};

export type RevenueImpactValidation = {
  conversion_rate: {
    simulation: number;
    live: number;
    delta: number;
    consistent: boolean;
  };
  paywall_trigger_rate: {
    simulation: number;
    live: number;
    delta: number;
    consistent: boolean;
  };
  false_block_rate: {
    simulation: number;
    live: number;
    delta: number;
    consistent: boolean;
  };
  revenue_events: {
    simulation: number;
    live: number;
    delta: number;
    consistent: boolean;
  };
};

export type RevenueReplayResult = {
  total_users: number;
  total_sessions: number;
  total_steps: number;
  drift_detection: ReplayDriftResult;
  revenue_impact_validation: RevenueImpactValidation;
  consistency_report: DecisionDiffReport;
  simulation_stable: boolean;
  false_block_rate: number;
  v97_6_ready: boolean;
  block_progression_to_v98: boolean;
  replay_steps: ReplayStepResult[];
};

type ReplayState = {
  invoice_count: number;
  quote_count: number;
  export_count: number;
  pricing_views: number;
  usage_count: number;
  signed_up: boolean;
  converted: boolean;
};

const REVENUE_ACTIONS = new Set<RevenueControlPlaneAction>(['block', 'upsell', 'soft_paywall', 'redirect']);
const PROTECTED_STEPS = new Set(['signup', 'first_invoice', 'first_quote']);

export const DEFAULT_REVENUE_REPLAY_TRAJECTORIES: RevenueReplayTrajectory[] = [
  {
    user_id: 'replay_high_intent_buyer',
    sessions: [
      {
        session_id: 'replay_high_intent_buyer_s1',
        events: [
          { event: 'landing_view', timestamp: 1 },
          { event: 'pricing_view', timestamp: 2 },
          { event: 'signup_start', timestamp: 3 },
          { event: 'signup_complete', timestamp: 4 },
          { event: 'invoice_create', timestamp: 5 },
          { event: 'export_pdf', timestamp: 6 },
          { event: 'checkout_start', timestamp: 7 },
        ],
      },
    ],
  },
  {
    user_id: 'replay_multi_session_pricing',
    sessions: [
      {
        session_id: 'replay_multi_session_pricing_s1',
        events: [
          { event: 'landing_view', timestamp: 8 },
          { event: 'pricing_view', timestamp: 9 },
          { event: 'pricing_view', timestamp: 10 },
        ],
      },
      {
        session_id: 'replay_multi_session_pricing_s2',
        events: [
          { event: 'pricing_view', timestamp: 11 },
          { event: 'pricing_view', timestamp: 12 },
          { event: 'signup_start', timestamp: 13 },
        ],
      },
    ],
  },
  {
    user_id: 'replay_export_risk',
    sessions: [
      {
        session_id: 'replay_export_risk_s1',
        events: [
          { event: 'landing_view', timestamp: 14 },
          { event: 'signup_complete', timestamp: 15 },
          { event: 'invoice_create', timestamp: 16 },
          { event: 'export_pdf', timestamp: 17 },
          { event: 'export_pdf', timestamp: 18 },
        ],
      },
    ],
  },
];

function round(value: number, precision = 4) {
  const factor = 10 ** precision;
  return Math.round(value * factor) / factor;
}

function normalizeEvent(event: unknown) {
  const normalized = String(event || '').trim().toLowerCase().replace(/[\s-]+/g, '_');
  const aliases: Record<string, string> = {
    signup: 'signup_start',
    invoice_create: 'create_invoice',
    quote_create: 'create_quote',
  };
  return aliases[normalized] ?? normalized;
}

function baseIntentScore(event: string, state: ReplayState) {
  const eventLift: Record<string, number> = {
    landing_view: 12,
    signup_start: 30,
    signup_complete: 42,
    pricing_view: 55,
    create_quote: 58,
    create_invoice: 62,
    export_pdf: 78,
    pricing_change: 68,
    checkout_start: 86,
  };
  const usageLift = Math.min(14, state.usage_count * 4);
  const pricingLift = Math.min(12, state.pricing_views * 3);
  return Math.max(0, Math.min(100, (eventLift[event] ?? 25) + usageLift + pricingLift));
}

function funnelStepForEvent(event: string, state: ReplayState) {
  if (event === 'signup_start' || event === 'signup_complete') return 'signup';
  if (event === 'create_invoice' && state.invoice_count === 0) return 'first_invoice';
  if (event === 'create_quote' && state.quote_count === 0) return 'first_quote';
  if (event === 'create_invoice') return 'invoice';
  if (event === 'create_quote') return 'quote';
  if (event === 'pricing_view' || event === 'pricing_change') return 'pricing';
  return event;
}

function applyEventToState(event: string, state: ReplayState) {
  if (event === 'signup_start' || event === 'signup_complete') {
    state.signed_up = true;
  } else if (event === 'create_invoice') {
    state.invoice_count += 1;
    state.usage_count += 1;
  } else if (event === 'create_quote') {
    state.quote_count += 1;
    state.usage_count += 1;
  } else if (event === 'export_pdf') {
    state.export_count += 1;
    state.usage_count += 1;
  } else if (event === 'pricing_view') {
    state.pricing_views += 1;
  } else if (event === 'checkout_start') {
    state.converted = true;
  }
}

function flattenReplayInput(input: RevenueReplayEvent[] | RevenueReplayTrajectory[]) {
  if (input.length === 0) return [];
  const first = input[0] as RevenueReplayTrajectory | RevenueReplayEvent;

  if ('sessions' in first) {
    return (input as RevenueReplayTrajectory[]).flatMap((trajectory) =>
      trajectory.sessions.flatMap((session) =>
        session.events.map((event, index) => ({
          ...event,
          user_id: event.user_id ?? trajectory.user_id,
          session_id: event.session_id ?? session.session_id,
          timestamp: event.timestamp ?? index,
        })),
      ),
    );
  }

  return (input as RevenueReplayEvent[]).map((event, index) => ({
    ...event,
    user_id: event.user_id ?? 'anonymous_replay_user',
    session_id: event.session_id ?? 'replay_session',
    timestamp: event.timestamp ?? index,
  }));
}

function evaluateReplayDecision(
  event: string,
  replayEvent: RevenueReplayEvent,
  state: ReplayState,
  shadowMode: boolean,
) {
  const previousShadowMode = SHADOW_MODE;
  setShadowMode(shadowMode);

  try {
    const funnelStep = funnelStepForEvent(event, state);
    const intentScore = Math.max(0, Math.min(100, Number(replayEvent.intent_score ?? baseIntentScore(event, state)) || 0));
    const rawDecision = evaluateRevenueAction({
      user_id: replayEvent.user_id,
      event,
      intent_score: intentScore,
      funnel_step: funnelStep,
      session_count: replayEvent.session_count ?? state.pricing_views + (event === 'pricing_view' ? 1 : 0),
      pricing_viewed: replayEvent.pricing_viewed ?? (state.pricing_views > 0 || event === 'pricing_view'),
      pricing_change: replayEvent.pricing_change,
      invoice_count: state.invoice_count,
      quote_count: state.quote_count,
      export_count: state.export_count,
      usage_count: state.usage_count,
    });

    return validateRevenueDecision({
      decision_id: rawDecision.decision_id,
      action: rawDecision.action,
      reason: rawDecision.reason,
      reason_chain: rawDecision.reason_chain,
      risk_level: rawDecision.risk_level,
      intent_score: rawDecision.intent_score,
      intent_contribution_score: rawDecision.intent_contribution_score,
      pricing_trigger_attribution: rawDecision.pricing_trigger_attribution,
      explanation: rawDecision.explanation,
    });
  } finally {
    setShadowMode(previousShadowMode);
  }
}

function isRevenueTriggered(action: RevenueControlPlaneAction) {
  return REVENUE_ACTIONS.has(action);
}

function calculateConversionRate(states: ReplayState[]) {
  if (states.length === 0) return 0;
  return states.filter((state) => state.converted).length / states.length;
}

function buildRevenueImpactValidation(
  replaySteps: ReplayStepResult[],
  userStates: ReplayState[],
  simulationResult?: RevenueSimulationResult,
): RevenueImpactValidation {
  const totalUsers = Math.max(1, userStates.length);
  const usersWithPaywall = new Set(replaySteps.filter((step) => step.revenue_triggered).map((step) => step.user_id)).size;
  const liveConversionRate = calculateConversionRate(userStates);
  const livePaywallTriggerRate = usersWithPaywall / totalUsers;
  const liveFalseBlockRate = replaySteps.length > 0 ? replaySteps.filter((step) => step.false_block).length / replaySteps.length : 0;
  const liveRevenueEvents = replaySteps.filter((step) => step.revenue_triggered).length;
  const simulationConversionRate = simulationResult?.conversion_rate ?? liveConversionRate;
  const simulationPaywallTriggerRate = simulationResult?.paywall_trigger_rate ?? livePaywallTriggerRate;
  const simulationFalseBlockRate = simulationResult?.false_block_rate ?? liveFalseBlockRate;
  const simulationRevenueEvents = simulationResult?.revenue_events ?? liveRevenueEvents;

  return {
    conversion_rate: {
      simulation: round(simulationConversionRate),
      live: round(liveConversionRate),
      delta: round(Math.abs(simulationConversionRate - liveConversionRate)),
      consistent: Math.abs(simulationConversionRate - liveConversionRate) <= 0.05,
    },
    paywall_trigger_rate: {
      simulation: round(simulationPaywallTriggerRate),
      live: round(livePaywallTriggerRate),
      delta: round(Math.abs(simulationPaywallTriggerRate - livePaywallTriggerRate)),
      consistent: Math.abs(simulationPaywallTriggerRate - livePaywallTriggerRate) <= 0.05,
    },
    false_block_rate: {
      simulation: round(simulationFalseBlockRate),
      live: round(liveFalseBlockRate),
      delta: round(Math.abs(simulationFalseBlockRate - liveFalseBlockRate)),
      consistent: Math.abs(simulationFalseBlockRate - liveFalseBlockRate) <= 0.03,
    },
    revenue_events: {
      simulation: simulationRevenueEvents,
      live: liveRevenueEvents,
      delta: Math.abs(simulationRevenueEvents - liveRevenueEvents),
      consistent: Math.abs(simulationRevenueEvents - liveRevenueEvents) <= Math.max(1, Math.ceil(liveRevenueEvents * 0.1)),
    },
  };
}

export function runRevenueReplay(
  replayInput: RevenueReplayEvent[] | RevenueReplayTrajectory[],
  simulationResult?: RevenueSimulationResult,
): RevenueReplayResult {
  const safeInput = replayInput.length > 0 ? replayInput : DEFAULT_REVENUE_REPLAY_TRAJECTORIES;
  const events = flattenReplayInput(safeInput).sort((a, b) => Number(a.timestamp ?? 0) - Number(b.timestamp ?? 0));
  const states = new Map<string, ReplayState>();
  const replaySteps: ReplayStepResult[] = [];

  events.forEach((replayEvent) => {
    const event = normalizeEvent(replayEvent.event);
    const userId = String(replayEvent.user_id || 'anonymous_replay_user');
    const sessionId = String(replayEvent.session_id || 'replay_session');
    const state = states.get(userId) ?? {
      invoice_count: 0,
      quote_count: 0,
      export_count: 0,
      pricing_views: 0,
      usage_count: 0,
      signed_up: false,
      converted: false,
    };
    const step = funnelStepForEvent(event, state);
    const simulationDecision = evaluateReplayDecision(event, replayEvent, state, SHADOW_MODE);
    const liveDecision = evaluateReplayDecision(event, replayEvent, state, SHADOW_MODE);
    replaySteps.push({
      user_id: userId,
      session_id: sessionId,
      step,
      event,
      intent_score: liveDecision.intent_score,
      sim_action: simulationDecision.action,
      live_action: liveDecision.action,
      risk_level: liveDecision.risk_level,
      pricing_trigger_attribution: liveDecision.pricing_trigger_attribution,
      revenue_triggered: isRevenueTriggered(liveDecision.action),
      false_block: liveDecision.action === 'block' && PROTECTED_STEPS.has(step),
    });

    applyEventToState(event, state);
    states.set(userId, state);
  });

  const comparableSimulation = replaySteps.map((step) => ({
    step: step.step,
    action: step.sim_action,
    intent_score: step.intent_score,
    pricing_trigger_attribution: step.pricing_trigger_attribution,
    export_triggered: step.event === 'export_pdf' && step.sim_action === 'soft_paywall',
  }));
  const comparableLive = replaySteps.map((step) => ({
    step: step.step,
    action: step.live_action,
    intent_score: step.intent_score,
    pricing_trigger_attribution: step.pricing_trigger_attribution,
    export_triggered: step.event === 'export_pdf' && step.live_action === 'soft_paywall',
  }));
  const consistencyReport = buildDiffReport(comparableSimulation, comparableLive);
  const driftPoints = consistencyReport.mismatch_cases.map((mismatch) => ({
    step: mismatch.step,
    sim: mismatch.sim_action,
    live: mismatch.live_action,
  }));
  const driftRate = replaySteps.length > 0 ? driftPoints.length / replaySteps.length : 0;
  const userStates = Array.from(states.values());
  const falseBlockRate = replaySteps.length > 0 ? replaySteps.filter((step) => step.false_block).length / replaySteps.length : 0;
  const revenueImpactValidation = buildRevenueImpactValidation(replaySteps, userStates, simulationResult);
  const simulationStable = Object.values(revenueImpactValidation).every((metric) => metric.consistent);
  const v976Ready = driftRate < 0.03 && falseBlockRate < 0.05 && simulationStable;

  return {
    total_users: states.size,
    total_sessions: new Set(replaySteps.map((step) => step.session_id)).size,
    total_steps: replaySteps.length,
    drift_detection: {
      drift_rate: round(driftRate),
      drift_points: driftPoints,
    },
    revenue_impact_validation: revenueImpactValidation,
    consistency_report: consistencyReport,
    simulation_stable: simulationStable,
    false_block_rate: round(falseBlockRate),
    v97_6_ready: v976Ready,
    block_progression_to_v98: !v976Ready,
    replay_steps: replaySteps,
  };
}
