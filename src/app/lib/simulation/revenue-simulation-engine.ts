import {
  SHADOW_MODE,
  evaluateRevenueAction,
  setShadowMode,
  type RevenueControlPlaneAction,
} from '../revenue/control-plane/decision-engine';
import { validateRevenueDecision } from '../revenue/validate-decision';
import {
  validateDecisionConsistency,
  type DecisionConsistencyResult,
  type PricingInfluence,
} from '../revenue/validation/validateDecisionConsistency';
import { buildDiffReport, type DecisionDiffReport } from '../revenue/validation/buildDiffReport';
import { evaluateV98Readiness, type V98ReadinessResult } from '../revenue/validation/v98ReadinessGate';

export type UserScenario = {
  id: string;
  intent_level: 'low' | 'medium' | 'high';
  behavior_pattern: 'explorer' | 'buyer' | 'freeloader';
  actions: string[];
  session_length: number;
};

export type RevenueSimulationStep = {
  step: string;
  action: string;
  intent_score: number;
  decision_action: RevenueControlPlaneAction;
  risk_level: 'low' | 'medium' | 'high';
  is_blocked: boolean;
  revenue_triggered: boolean;
  pricing_trigger_attribution: PricingInfluence;
  export_triggered: boolean;
  consistency: DecisionConsistencyResult;
};

export type RevenueSimulationJourney = {
  scenario_id: string;
  intent_level: UserScenario['intent_level'];
  behavior_pattern: UserScenario['behavior_pattern'];
  steps: RevenueSimulationStep[];
  converted: boolean;
  drop_off_step: string | null;
};

export type RevenueSimulationResult = {
  total_users: number;
  conversion_rate: number;
  paywall_trigger_rate: number;
  false_block_rate: number;
  revenue_events: number;
  funnel_drop_off_map: Record<string, number>;
  decision_consistency_rate: number;
  consistency_report: DecisionDiffReport;
  v98_readiness: V98ReadinessResult;
  journeys: RevenueSimulationJourney[];
};

type ScenarioState = {
  invoice_count: number;
  quote_count: number;
  export_count: number;
  pricing_views: number;
  usage_count: number;
};

const REVENUE_ACTIONS = new Set<RevenueControlPlaneAction>(['block', 'upsell', 'soft_paywall', 'redirect']);
const PROTECTED_ACTIONS = new Set(['signup_start', 'signup_complete', 'invoice_create', 'create_invoice', 'quote_create', 'create_quote']);

export const DEFAULT_REVENUE_SIMULATION_SCENARIOS: UserScenario[] = [
  {
    id: 'baseline_low_intent_explorer',
    intent_level: 'low',
    behavior_pattern: 'explorer',
    actions: ['landing_view', 'pricing_view', 'signup_start'],
    session_length: 180,
  },
  {
    id: 'baseline_medium_intent_freelancer',
    intent_level: 'medium',
    behavior_pattern: 'explorer',
    actions: ['landing_view', 'signup_start', 'signup_complete', 'quote_create', 'invoice_create'],
    session_length: 520,
  },
  {
    id: 'baseline_high_intent_buyer',
    intent_level: 'high',
    behavior_pattern: 'buyer',
    actions: ['landing_view', 'pricing_view', 'signup_start', 'signup_complete', 'invoice_create', 'export_pdf', 'checkout_start'],
    session_length: 960,
  },
  {
    id: 'baseline_repeated_pricing_viewer',
    intent_level: 'medium',
    behavior_pattern: 'buyer',
    actions: ['landing_view', 'pricing_view', 'pricing_view', 'pricing_view', 'pricing_view', 'signup_start'],
    session_length: 740,
  },
  {
    id: 'baseline_free_user_spam_exporter',
    intent_level: 'high',
    behavior_pattern: 'freeloader',
    actions: ['landing_view', 'signup_start', 'signup_complete', 'invoice_create', 'export_pdf', 'export_pdf', 'export_pdf'],
    session_length: 640,
  },
];

function round(value: number, precision = 4) {
  const factor = 10 ** precision;
  return Math.round(value * factor) / factor;
}

function normalizeAction(action: string) {
  return String(action || '').trim().toLowerCase().replace(/[\s-]+/g, '_');
}

function baseIntentScore(intentLevel: UserScenario['intent_level']) {
  if (intentLevel === 'high') return 78;
  if (intentLevel === 'medium') return 48;
  return 18;
}

function intentLiftForAction(action: string) {
  const normalized = normalizeAction(action);
  if (normalized === 'signup_start') return 10;
  if (normalized === 'signup_complete') return 20;
  if (normalized === 'pricing_view') return 15;
  if (normalized === 'invoice_create' || normalized === 'create_invoice') return 25;
  if (normalized === 'quote_create' || normalized === 'create_quote') return 20;
  if (normalized === 'export_pdf') return 18;
  if (normalized === 'checkout_start') return 25;
  return 0;
}

function computeIntentScore(scenario: UserScenario, action: string, index: number) {
  const behaviorLift = scenario.behavior_pattern === 'buyer' ? 8 : scenario.behavior_pattern === 'freeloader' ? 3 : 0;
  const progressionLift = Math.min(12, index * 3);
  return Math.max(0, Math.min(100, baseIntentScore(scenario.intent_level) + behaviorLift + progressionLift + intentLiftForAction(action)));
}

function funnelStepForAction(action: string, state: ScenarioState) {
  const normalized = normalizeAction(action);
  if (normalized === 'signup_start' || normalized === 'signup_complete') return 'signup';
  if ((normalized === 'invoice_create' || normalized === 'create_invoice') && state.invoice_count === 0) return 'first_invoice';
  if ((normalized === 'quote_create' || normalized === 'create_quote') && state.quote_count === 0) return 'first_quote';
  if (normalized === 'invoice_create' || normalized === 'create_invoice') return 'invoice';
  if (normalized === 'quote_create' || normalized === 'create_quote') return 'quote';
  if (normalized === 'pricing_view') return 'pricing';
  return normalized;
}

function updateStateAfterAction(action: string, state: ScenarioState) {
  const normalized = normalizeAction(action);
  if (normalized === 'invoice_create' || normalized === 'create_invoice') {
    state.invoice_count += 1;
    state.usage_count += 1;
  } else if (normalized === 'quote_create' || normalized === 'create_quote') {
    state.quote_count += 1;
    state.usage_count += 1;
  } else if (normalized === 'export_pdf') {
    state.export_count += 1;
    state.usage_count += 1;
  } else if (normalized === 'pricing_view') {
    state.pricing_views += 1;
  }
}

function isRevenueTriggered(action: RevenueControlPlaneAction, shadowAction?: RevenueControlPlaneAction) {
  return REVENUE_ACTIONS.has(action) || Boolean(shadowAction && REVENUE_ACTIONS.has(shadowAction));
}

function isFalseBlock(step: RevenueSimulationStep) {
  if (!step.is_blocked) return false;
  return PROTECTED_ACTIONS.has(normalizeAction(step.action)) || step.step === 'signup' || step.step === 'first_invoice' || step.step === 'first_quote';
}

function didScenarioConvert(scenario: UserScenario, steps: RevenueSimulationStep[]) {
  if (scenario.behavior_pattern === 'freeloader') return false;
  const hasCheckoutIntent = scenario.actions.some((action) => normalizeAction(action) === 'checkout_start');
  const hasRevenuePrompt = steps.some((step) => step.revenue_triggered);
  const finalIntent = Math.max(...steps.map((step) => step.intent_score), 0);

  if (hasCheckoutIntent && finalIntent >= 70) return true;
  if (scenario.behavior_pattern === 'buyer' && hasRevenuePrompt && finalIntent >= 65) return true;
  return false;
}

function simulateScenario(scenario: UserScenario): RevenueSimulationJourney {
  const state: ScenarioState = {
    invoice_count: 0,
    quote_count: 0,
    export_count: 0,
    pricing_views: 0,
    usage_count: 0,
  };

  const steps = scenario.actions.map((action, index) => {
    const normalizedAction = normalizeAction(action);
    const funnelStep = funnelStepForAction(normalizedAction, state);
    const intentScore = computeIntentScore(scenario, normalizedAction, index);
    const rawDecision = evaluateRevenueAction({
      user_id: scenario.id,
      event: normalizedAction,
      intent_score: intentScore,
      funnel_step: funnelStep,
      session_count: state.pricing_views + (normalizedAction === 'pricing_view' ? 1 : 0),
      pricing_viewed: state.pricing_views > 0 || normalizedAction === 'pricing_view',
      invoice_count: state.invoice_count,
      quote_count: state.quote_count,
      export_count: state.export_count,
      usage_count: state.usage_count,
    });
    const responseDecision = validateRevenueDecision({
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
    const consistency = validateDecisionConsistency(
      {
        step: funnelStep,
        action: responseDecision.action,
        intent_score: intentScore,
        pricing_trigger_attribution: responseDecision.pricing_trigger_attribution,
        export_triggered: normalizedAction === 'export_pdf' && responseDecision.action === 'soft_paywall',
      },
      {
        step: funnelStep,
        action: rawDecision.action,
        intent_score: rawDecision.intent_score,
        pricing_trigger_attribution: rawDecision.pricing_trigger_attribution,
        export_triggered: normalizedAction === 'export_pdf' && rawDecision.action === 'soft_paywall',
        reason_chain: rawDecision.reason_chain,
      },
    );
    const pricingAttribution = {
      triggered: Boolean(responseDecision.pricing_trigger_attribution?.triggered),
      trigger: responseDecision.pricing_trigger_attribution?.trigger ?? 'none',
      pricing_viewed: Boolean(responseDecision.pricing_trigger_attribution?.pricing_viewed),
      pricing_view_count: responseDecision.pricing_trigger_attribution?.pricing_view_count ?? 0,
      pricing_change: responseDecision.pricing_trigger_attribution?.pricing_change ?? 0,
    };
    const exportTriggered = normalizedAction === 'export_pdf' && isRevenueTriggered(responseDecision.action, rawDecision.shadow_action);
    const step: RevenueSimulationStep = {
      step: funnelStep,
      action: normalizedAction,
      intent_score: intentScore,
      decision_action: responseDecision.action,
      risk_level: responseDecision.risk_level,
      is_blocked: responseDecision.action === 'block',
      revenue_triggered: isRevenueTriggered(responseDecision.action, rawDecision.shadow_action),
      pricing_trigger_attribution: pricingAttribution,
      export_triggered: exportTriggered,
      consistency,
    };

    updateStateAfterAction(normalizedAction, state);
    return step;
  });

  const converted = didScenarioConvert(scenario, steps);
  const blockedStep = steps.find((step) => step.is_blocked);
  const dropOffStep = converted ? null : blockedStep?.step || steps.at(-1)?.step || null;

  return {
    scenario_id: scenario.id,
    intent_level: scenario.intent_level,
    behavior_pattern: scenario.behavior_pattern,
    steps,
    converted,
    drop_off_step: dropOffStep,
  };
}

function buildDropOffMap(journeys: RevenueSimulationJourney[]) {
  return journeys.reduce<Record<string, number>>((dropOffMap, journey) => {
    if (!journey.drop_off_step) return dropOffMap;
    dropOffMap[journey.drop_off_step] = (dropOffMap[journey.drop_off_step] || 0) + 1;
    return dropOffMap;
  }, {});
}

export function runRevenueSimulation(scenarios: UserScenario[] = DEFAULT_REVENUE_SIMULATION_SCENARIOS): RevenueSimulationResult {
  const previousShadowMode = SHADOW_MODE;
  setShadowMode(true);

  try {
    const safeScenarios = scenarios.length > 0 ? scenarios : DEFAULT_REVENUE_SIMULATION_SCENARIOS;
    const journeys = safeScenarios.map(simulateScenario);
    const totalUsers = journeys.length;
    const allSteps = journeys.flatMap((journey) => journey.steps);
    const convertedUsers = journeys.filter((journey) => journey.converted).length;
    const usersWithPaywall = journeys.filter((journey) => journey.steps.some((step) => step.revenue_triggered)).length;
    const falseBlocks = allSteps.filter(isFalseBlock).length;
    const blockedSteps = allSteps.filter((step) => step.is_blocked).length;
    const revenueEvents = allSteps.filter((step) => step.revenue_triggered).length;
    const comparableSteps = allSteps.map((step) => ({
      step: step.step,
      decision_action: step.decision_action,
      intent_score: step.intent_score,
      pricing_trigger_attribution: step.pricing_trigger_attribution,
      export_triggered: step.export_triggered,
    }));
    const consistencyReport = buildDiffReport(comparableSteps, comparableSteps);
    const mismatchCount = allSteps.filter((step) => !step.consistency.isValid).length + consistencyReport.mismatch_count;
    const mismatchRate = allSteps.length > 0 ? mismatchCount / allSteps.length : 0;
    const decisionConsistencyRate = round(1 - Math.min(1, mismatchRate));
    const v98Readiness = evaluateV98Readiness({
      mismatch_rate: mismatchRate,
      false_block_rate: blockedSteps > 0 ? falseBlocks / blockedSteps : 0,
      explainability_complete: allSteps.every((step) => typeof step.intent_score === 'number'),
    });

    return {
      total_users: totalUsers,
      conversion_rate: round(totalUsers > 0 ? convertedUsers / totalUsers : 0),
      paywall_trigger_rate: round(totalUsers > 0 ? usersWithPaywall / totalUsers : 0),
      false_block_rate: round(blockedSteps > 0 ? falseBlocks / blockedSteps : 0),
      revenue_events: revenueEvents,
      funnel_drop_off_map: buildDropOffMap(journeys),
      decision_consistency_rate: decisionConsistencyRate,
      consistency_report: consistencyReport,
      v98_readiness: v98Readiness,
      journeys,
    };
  } finally {
    setShadowMode(previousShadowMode);
  }
}
