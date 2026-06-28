import { runRevenueSimulation, type RevenueSimulationRunnerOptions } from '../simulation/simulation-runner';
import { optimizeRevenueStrategy, type RevenueOptimizerInput, type RevenueOptimizerResult } from './revenue-optimizer';

export type AutonomousLoopInput = RevenueOptimizerInput & {
  iterations?: number;
  simulation_options?: RevenueSimulationRunnerOptions;
};

export type AutonomousLoopCycle = {
  iteration: number;
  analysis: RevenueOptimizerResult;
  measured_impact: {
    projected_mrr: number;
    conversion_rate: number;
  };
  applied_changes: string[];
};

export type AutonomousLoopResult = {
  final_strategy: string;
  cycles: AutonomousLoopCycle[];
};

function boundedIterations(value: unknown) {
  const next = Number(value || 3);
  if (!Number.isFinite(next)) return 3;
  return Math.max(1, Math.min(12, Math.floor(next)));
}

export function runAutonomousOptimizationLoop(input: AutonomousLoopInput = {}): AutonomousLoopResult {
  const iterations = boundedIterations(input.iterations);
  const cycles: AutonomousLoopCycle[] = [];
  let currentInput: RevenueOptimizerInput = { ...input };

  for (let index = 0; index < iterations; index += 1) {
    const simulation = runRevenueSimulation({
      ...(input.simulation_options || {}),
      seed: (input.simulation_options?.seed || 7319) + index,
    });
    const analysis = optimizeRevenueStrategy({
      ...currentInput,
      simulation_results: simulation,
      conversion_data: {
        ...(currentInput.conversion_data || {}),
        conversion_rate: currentInput.conversion_data?.conversion_rate ?? simulation.conversion_rate,
      },
    });

    cycles.push({
      iteration: index + 1,
      analysis,
      measured_impact: {
        projected_mrr: simulation.projected_mrr,
        conversion_rate: simulation.conversion_rate,
      },
      applied_changes: analysis.recommended_actions.slice(0, 3),
    });

    currentInput = {
      ...currentInput,
      simulation_results: simulation,
      funnel_data: {
        ...(currentInput.funnel_data || {}),
        drop_off_by_step: Object.fromEntries(simulation.bottlenecks.map((step) => [step, 0.32])),
      },
    };
  }

  const finalCycle = cycles[cycles.length - 1];
  return {
    final_strategy: finalCycle?.analysis.paywall_strategy || 'medium: invoice_create_count_2, quote_export, pricing_view_3_times',
    cycles,
  };
}
