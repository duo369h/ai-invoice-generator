import { optimizeRevenueStrategy, type RevenueOptimizerInput, type RevenueOptimizerResult } from '../optimization/revenue-optimizer';
import { runRevenueSimulation } from '../simulation/simulation-runner';
import { generateExperimentSet, type RevenueExperiment } from './experiment-generator';
import { learnFromRevenueFeedback, type RevenueFeedbackLearningResult } from './feedback-learning';
import { healFunnel, type FunnelHealingResult } from './self-healing-funnel';

export type EvolutionObservation = RevenueOptimizerInput & {
  actual_revenue?: number;
  expected_revenue?: number;
  broken_paths?: string[];
};

export type EvolutionDecision = {
  safe_to_apply: boolean;
  selected_changes: string[];
  rollback_plan: string[];
};

export type SelfEvolvingOutput = {
  detected_opportunities: string[];
  applied_changes: string[];
  expected_revenue_delta: number;
};

export type SelfEvolvingEngineState = {
  observation?: EvolutionObservation;
  analysis?: RevenueOptimizerResult;
  experiments?: RevenueExperiment[];
  learning?: RevenueFeedbackLearningResult;
  healing?: FunnelHealingResult;
  decision?: EvolutionDecision;
};

function toNumber(value: unknown, fallback = 0) {
  const next = Number(value ?? fallback);
  return Number.isFinite(next) ? next : fallback;
}

function parsePriceJump(change: string, currentPrice: number) {
  const match = change.match(/\$(\d+)/);
  if (!match) return 0;
  const nextPrice = toNumber(match[1], currentPrice);
  return currentPrice > 0 ? (nextPrice - currentPrice) / currentPrice : 0;
}

export class SelfEvolvingRevenueEngine {
  private state: SelfEvolvingEngineState = {};

  observe(input: EvolutionObservation = {}) {
    this.state.observation = input;
    return input;
  }

  analyze() {
    const observation = this.state.observation || {};
    const simulation = runRevenueSimulation({ users: 120, seed: 7319 });
    const analysis = optimizeRevenueStrategy({
      ...observation,
      simulation_results: observation.simulation_results || simulation,
    });
    const opportunities = [
      ...analysis.optimized_funnel.map((step) => `funnel:${step}`),
      ...analysis.pricing_adjustments.map((adjustment) => `pricing:${adjustment}`),
      `paywall:${analysis.paywall_strategy}`,
    ];

    this.state.analysis = analysis;
    this.state.experiments = generateExperimentSet(opportunities);
    this.state.healing = healFunnel({
      drop_off_by_step: observation.funnel_data?.drop_off_by_step,
      broken_paths: observation.broken_paths,
      apply_fix: false,
    });
    this.state.learning = learnFromRevenueFeedback({
      expected_revenue: observation.expected_revenue ?? simulation.projected_mrr,
      actual_revenue: observation.actual_revenue,
    });

    return this.state;
  }

  simulate() {
    const baseline = runRevenueSimulation({ users: 120, seed: 7319 });
    const improved = runRevenueSimulation({ users: 120, seed: 7320 });
    const expectedDelta = Math.max(0, improved.projected_mrr - baseline.projected_mrr);
    return {
      baseline,
      improved,
      expected_revenue_delta: Math.round(expectedDelta * 100) / 100,
    };
  }

  decide() {
    const analysis = this.state.analysis || optimizeRevenueStrategy({});
    const currentPrice = toNumber(this.state.observation?.pricing_data?.current_price, 19);
    const safeChanges = analysis.recommended_actions.filter((change) => {
      const lower = change.toLowerCase();
      if (lower.includes('full funnel redesign') || lower.includes('delete') || lower.includes('destructive')) return false;
      return parsePriceJump(change, currentPrice) <= 0.3;
    });

    const decision: EvolutionDecision = {
      safe_to_apply: safeChanges.length > 0,
      selected_changes: safeChanges.slice(0, 4),
      rollback_plan: safeChanges.slice(0, 4).map((change) => `rollback:${change}`),
    };
    this.state.decision = decision;
    return decision;
  }

  apply() {
    const decision = this.state.decision || this.decide();
    if (!decision.safe_to_apply) return [];
    return decision.selected_changes.map((change) => `safe_mode_applied:${change}`);
  }

  run(input: EvolutionObservation = {}): SelfEvolvingOutput {
    this.observe(input);
    const state = this.analyze();
    const simulation = this.simulate();
    const decision = this.decide();
    const applied = this.apply();
    const opportunities = [
      ...(state.analysis?.optimized_funnel || []).map((step) => `Improve ${step}`),
      ...(state.healing?.detected_issues || []),
      ...(state.experiments || []).map((experiment) => experiment.experiment_id),
    ];

    return {
      detected_opportunities: Array.from(new Set(opportunities)),
      applied_changes: decision.safe_to_apply ? applied : [],
      expected_revenue_delta: simulation.expected_revenue_delta,
    };
  }
}

export function createSelfEvolvingRevenueEngine() {
  return new SelfEvolvingRevenueEngine();
}

export function runSelfEvolvingRevenueEngine(input: EvolutionObservation = {}): SelfEvolvingOutput {
  return createSelfEvolvingRevenueEngine().run(input);
}
