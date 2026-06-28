import {
  SHADOW_MODE,
  evaluateRevenueAction,
  setShadowMode,
  type RevenueControlPlaneAction,
} from './control-plane/decision-engine';
import { validateRevenueDecision } from './validate-decision';
import { generateSyntheticUserSessions, type SimulatedUserSession } from '../simulation/user-behavior-simulator';
import { runRevenueSimulation as runSimulationRunner } from '../simulation/simulation-runner';
import { runRevenueReplay, type RevenueReplayTrajectory } from '../replay/revenue-replay-engine';

export type RevenueDryRunOptions = {
  users?: number;
  seed?: number;
};

export type RevenueDryRunResult = {
  simulation_users: number;
  conversion_rate: number;
  drop_off_rate_per_step: Record<string, number>;
  revenue_per_user: number;
  paywall_trigger_rate: number;
  false_block_rate: number;
  block_rate: number;
  monetization_optimization: {
    best_revenue_step: string;
    worst_drop_off_step: string;
    highest_paywall_trigger: string;
    weakest_conversion_step: string;
  };
  pricing_strategy: {
    optimal_free_limit: string;
    optimal_monthly_price: string;
    expected_conversion_rate: string;
    expected_revenue_per_user: string;
  };
  paywall_safety: {
    system_status: 'READY_FOR_LAUNCH' | 'NOT_READY_FOR_LAUNCH';
    block_rate: number;
    false_block_rate: number;
    critical_funnel_blocking: boolean;
  };
  launch_readiness: {
    launch_ready: boolean;
    risk_level: 'low' | 'medium' | 'high';
    recommendation: 'go' | 'tune' | 'block_launch';
  };
  replay_gate: {
    drift_rate: number;
    v97_6_ready: boolean;
    block_progression_to_v98: boolean;
  };
  baseline_conversion_rate: number;
};

type DryRunState = {
  invoice_count: number;
  quote_count: number;
  export_count: number;
  pricing_views: number;
  usage_count: number;
  critical_blocked: boolean;
  converted: boolean;
};

type DryRunStep = {
  user_id: string;
  step: string;
  event: string;
  action: RevenueControlPlaneAction;
  risk_level: 'low' | 'medium' | 'high';
  revenue_triggered: boolean;
  false_block: boolean;
  pricing_trigger: string;
  converted_after_step: boolean;
};

const FUNNEL_ORDER = [
  'landing_view',
  'signup',
  'dashboard_view',
  'invoice_create',
  'quote_create',
  'export_pdf',
  'pricing_view',
  'upgrade_trigger',
  'payment',
];

const REVENUE_ACTIONS = new Set<RevenueControlPlaneAction>(['block', 'upsell', 'soft_paywall', 'redirect']);

function round(value: number, precision = 4) {
  const factor = 10 ** precision;
  return Math.round(value * factor) / factor;
}

function normalizeEvent(event: string) {
  if (event === 'invoice_create') return 'create_invoice';
  if (event === 'quote_create') return 'create_quote';
  return event;
}

function funnelStepForEvent(event: string, state: DryRunState) {
  if (event === 'signup_start' || event === 'signup_complete' || event === 'signup') return 'signup';
  if (event === 'create_invoice' && state.invoice_count === 0) return 'first_invoice';
  if (event === 'create_quote' && state.quote_count === 0) return 'first_quote';
  if (event === 'create_invoice') return 'invoice_create';
  if (event === 'create_quote') return 'quote_create';
  return event;
}

function intentScoreForSession(session: SimulatedUserSession, event: string, state: DryRunState) {
  const base = session.user_type === 'high_intent' ? 72 : session.user_type === 'medium_intent' ? 45 : 18;
  const eventLift: Record<string, number> = {
    landing_view: 1,
    signup_start: 10,
    signup_complete: 20,
    dashboard_view: 12,
    create_invoice: 25,
    create_quote: 20,
    export_pdf: 30,
    pricing_view: 18,
    upgrade_trigger: 25,
    payment: 40,
  };
  const usageLift = Math.min(12, state.usage_count * 3);
  const pricingLift = Math.min(10, state.pricing_views * 2);
  return Math.max(0, Math.min(100, base + (eventLift[event] ?? 0) + usageLift + pricingLift));
}

function expandFunnelActions(session: SimulatedUserSession) {
  const actions = new Set(session.actions);
  const expanded = ['landing_view'];

  if (actions.has('signup_start') || actions.has('signup_complete')) expanded.push('signup_start');
  if (actions.has('signup_complete')) expanded.push('signup_complete', 'dashboard_view');
  if (actions.has('invoice_create')) expanded.push('invoice_create');
  if (actions.has('quote_create')) expanded.push('quote_create');
  if (actions.has('export_pdf')) expanded.push('export_pdf');
  if (actions.has('pricing_view')) expanded.push('pricing_view');

  return expanded;
}

function updateState(event: string, state: DryRunState) {
  if (event === 'create_invoice') {
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
  }
}

function evaluateStep(userId: string, session: SimulatedUserSession, event: string, state: DryRunState) {
  const normalizedEvent = normalizeEvent(event);
  const funnelStep = funnelStepForEvent(normalizedEvent, state);
  const intentScore = intentScoreForSession(session, normalizedEvent, state);
  const rawDecision = evaluateRevenueAction({
    user_id: userId,
    event: normalizedEvent,
    intent_score: intentScore,
    funnel_step: funnelStep,
    session_count: state.pricing_views + (normalizedEvent === 'pricing_view' ? 1 : 0),
    pricing_viewed: state.pricing_views > 0 || normalizedEvent === 'pricing_view',
    invoice_count: state.invoice_count,
    quote_count: state.quote_count,
    export_count: state.export_count,
    usage_count: state.usage_count,
  });
  const decision = validateRevenueDecision({
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
  const falseBlock = decision.action === 'block' && (funnelStep === 'signup' || funnelStep === 'first_invoice' || funnelStep === 'first_quote');

  return {
    step: funnelStep,
    event: normalizedEvent,
    decision,
    revenue_triggered: REVENUE_ACTIONS.has(decision.action),
    false_block: falseBlock,
  };
}

function deterministicThreshold(index: number, offset = 0) {
  return ((index * 37 + 17 + offset) % 100) / 100;
}

function computeDropOffRates(stepCounts: Record<string, number>) {
  const rates: Record<string, number> = {};
  for (let index = 0; index < FUNNEL_ORDER.length - 1; index += 1) {
    const current = FUNNEL_ORDER[index];
    const next = FUNNEL_ORDER[index + 1];
    const currentCount = stepCounts[current] || 0;
    const nextCount = stepCounts[next] || 0;
    rates[current] = round(currentCount > 0 ? Math.max(0, currentCount - nextCount) / currentCount : 0);
  }
  rates.payment = 0;
  return rates;
}

function topKey(record: Record<string, number>, fallback: string) {
  return Object.entries(record).sort((a, b) => b[1] - a[1])[0]?.[0] || fallback;
}

function cohortStability(values: number[]) {
  if (values.length === 0) return true;
  const average = values.reduce((sum, value) => sum + value, 0) / values.length;
  if (average === 0) return false;
  const maxDeviation = Math.max(...values.map((value) => Math.abs(value - average) / average));
  return maxDeviation <= 0.25;
}

function simulatePricingGrid(sessions: SimulatedUserSession[]) {
  const freeLimits = [1, 2, 3];
  const prices = [19, 29, 49];

  return freeLimits.flatMap((freeLimit) =>
    prices.map((price) => {
      let conversions = 0;
      let revenue = 0;

      sessions.forEach((session, index) => {
        const usageActions = session.actions.filter((action) => action === 'invoice_create' || action === 'quote_create').length;
        const exportPressure = session.actions.includes('export_pdf') ? 0.08 : 0;
        const limitPressure = usageActions >= freeLimit ? 0.1 : -0.02;
        const pricePenalty = price === 49 ? 0.11 : price === 29 ? 0.045 : 0;
        const conversionProbability = Math.max(0, Math.min(0.88, session.conversion_probability + exportPressure + limitPressure - pricePenalty));

        if (deterministicThreshold(index, freeLimit + price) < conversionProbability) {
          conversions += 1;
          revenue += price;
        }
      });

      return {
        free_limit: freeLimit,
        price,
        conversion_rate: sessions.length > 0 ? conversions / sessions.length : 0,
        revenue_per_user: sessions.length > 0 ? revenue / sessions.length : 0,
      };
    }),
  ).sort((a, b) => b.revenue_per_user - a.revenue_per_user || b.conversion_rate - a.conversion_rate)[0];
}

function buildReplayTrajectories(sessions: SimulatedUserSession[]): RevenueReplayTrajectory[] {
  return sessions.slice(0, 120).map((session, index) => ({
    user_id: `dry_run_replay_${index}`,
    sessions: [
      {
        session_id: `dry_run_replay_${index}_s1`,
        events: expandFunnelActions(session).map((event, eventIndex) => ({
          event,
          timestamp: index * 100 + eventIndex,
        })),
      },
    ],
  }));
}

export function runRevenueDryRun(options: RevenueDryRunOptions = {}): RevenueDryRunResult {
  const users = Math.max(1000, Math.floor(options.users || 1000));
  const sessions = generateSyntheticUserSessions({ users, seed: options.seed ?? 9756 });
  const previousShadowMode = SHADOW_MODE;
  setShadowMode(false);

  try {
    const stepCounts: Record<string, number> = {};
    const revenueByStep: Record<string, number> = {};
    const paywallByTrigger: Record<string, number> = {};
    const conversionByStep: Record<string, number> = {};
    const cohortRevenue = [0, 0, 0, 0, 0];
    const steps: DryRunStep[] = [];
    let revenue = 0;
    let conversions = 0;
    let paywallTriggeredUsers = 0;

    sessions.forEach((session, index) => {
      const userId = `dry_run_user_${index}`;
      const state: DryRunState = {
        invoice_count: 0,
        quote_count: 0,
        export_count: 0,
        pricing_views: 0,
        usage_count: 0,
        critical_blocked: false,
        converted: false,
      };
      const actions = expandFunnelActions(session);
      let userHadPaywall = false;
      let lastRevenueStep = 'pricing_view';

      actions.forEach((event) => {
        const result = evaluateStep(userId, session, event, state);
        const displayStep = result.step === 'first_invoice' ? 'invoice_create' : result.step === 'first_quote' ? 'quote_create' : result.step;
        stepCounts[displayStep] = (stepCounts[displayStep] || 0) + 1;

        if (result.revenue_triggered) {
          userHadPaywall = true;
          lastRevenueStep = displayStep;
          stepCounts.upgrade_trigger = (stepCounts.upgrade_trigger || 0) + 1;
          const attributionTrigger = result.decision.pricing_trigger_attribution?.trigger;
          const paywallTrigger = attributionTrigger && attributionTrigger !== 'none'
            ? attributionTrigger
            : result.event === 'export_pdf'
            ? 'export_pdf'
            : result.decision.action;
          paywallByTrigger[paywallTrigger] = (paywallByTrigger[paywallTrigger] || 0) + 1;
        }

        if (result.false_block) state.critical_blocked = true;

        steps.push({
          user_id: userId,
          step: displayStep,
          event: result.event,
          action: result.decision.action,
          risk_level: result.decision.risk_level,
          revenue_triggered: result.revenue_triggered,
          false_block: result.false_block,
          pricing_trigger: result.decision.pricing_trigger_attribution?.trigger || 'none',
          converted_after_step: false,
        });

        updateState(result.event, state);
      });

      if (userHadPaywall) paywallTriggeredUsers += 1;

      const paymentProbability = Math.max(
        0,
        Math.min(0.92, session.conversion_probability + (userHadPaywall ? 0.045 : 0) - (state.critical_blocked ? 0.25 : 0)),
      );

      if (deterministicThreshold(index, 29) < paymentProbability) {
        conversions += 1;
        state.converted = true;
        stepCounts.payment = (stepCounts.payment || 0) + 1;
        conversionByStep[lastRevenueStep] = (conversionByStep[lastRevenueStep] || 0) + 1;
        revenueByStep[lastRevenueStep] = (revenueByStep[lastRevenueStep] || 0) + 29;
        revenue += 29;
        cohortRevenue[index % cohortRevenue.length] += 29;
      }
    });

    const dropOffRates = computeDropOffRates(stepCounts);
    const blockRate = steps.length > 0 ? steps.filter((step) => step.action === 'block').length / steps.length : 0;
    const falseBlockRate = steps.length > 0 ? steps.filter((step) => step.false_block).length / steps.length : 0;
    const conversionRate = sessions.length > 0 ? conversions / sessions.length : 0;
    const revenuePerUser = sessions.length > 0 ? revenue / sessions.length : 0;
    const pricingBest = simulatePricingGrid(sessions);
    const criticalFunnelBlocking = steps.some((step) => step.false_block && ['signup', 'invoice_create', 'quote_create'].includes(step.step));
    const paywallSafetyStatus = blockRate < 0.25 && falseBlockRate < 0.08 && !criticalFunnelBlocking ? 'READY_FOR_LAUNCH' : 'NOT_READY_FOR_LAUNCH';
    const baseline = runSimulationRunner({ users, seed: options.seed ?? 9756 });
    const replay = runRevenueReplay(buildReplayTrajectories(sessions));
    const controlledDropOff = Math.max(...Object.values(dropOffRates)) < 0.75;
    const stableRpu = cohortStability(cohortRevenue.map((value) => value / (sessions.length / cohortRevenue.length)));
    const launchReady = (
      conversionRate > baseline.conversion_rate
      && falseBlockRate < 0.08
      && stableRpu
      && controlledDropOff
      && paywallSafetyStatus === 'READY_FOR_LAUNCH'
      && replay.v97_6_ready
    );
    const riskLevel = launchReady ? 'low' : falseBlockRate >= 0.08 || blockRate >= 0.25 || criticalFunnelBlocking ? 'high' : 'medium';

    return {
      simulation_users: users,
      conversion_rate: round(conversionRate),
      drop_off_rate_per_step: dropOffRates,
      revenue_per_user: round(revenuePerUser, 2),
      paywall_trigger_rate: round(sessions.length > 0 ? paywallTriggeredUsers / sessions.length : 0),
      false_block_rate: round(falseBlockRate),
      block_rate: round(blockRate),
      monetization_optimization: {
        best_revenue_step: topKey(revenueByStep, 'export_pdf'),
        worst_drop_off_step: topKey(dropOffRates, 'signup'),
        highest_paywall_trigger: topKey(paywallByTrigger, 'export_pdf'),
        weakest_conversion_step: topKey(
          Object.fromEntries(FUNNEL_ORDER.map((step) => [step, 1 - (conversionByStep[step] || 0) / Math.max(1, stepCounts[step] || 0)])),
          'signup',
        ),
      },
      pricing_strategy: {
        optimal_free_limit: `${pricingBest?.free_limit ?? 2} invoices/quotes before stronger upgrade prompt`,
        optimal_monthly_price: `$${pricingBest?.price ?? 29}`,
        expected_conversion_rate: `${round(pricingBest?.conversion_rate ?? 0, 4)}`,
        expected_revenue_per_user: `$${round(pricingBest?.revenue_per_user ?? 0, 2)}`,
      },
      paywall_safety: {
        system_status: paywallSafetyStatus,
        block_rate: round(blockRate),
        false_block_rate: round(falseBlockRate),
        critical_funnel_blocking: criticalFunnelBlocking,
      },
      launch_readiness: {
        launch_ready: launchReady,
        risk_level: riskLevel,
        recommendation: launchReady ? 'go' : riskLevel === 'high' ? 'block_launch' : 'tune',
      },
      replay_gate: {
        drift_rate: replay.drift_detection.drift_rate,
        v97_6_ready: replay.v97_6_ready,
        block_progression_to_v98: replay.block_progression_to_v98,
      },
      baseline_conversion_rate: baseline.conversion_rate,
    };
  } finally {
    setShadowMode(previousShadowMode);
  }
}
