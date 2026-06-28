import { runAutonomousOptimizationLoop } from '../optimization/autonomous-loop';
import { runSelfEvolvingRevenueEngine, type EvolutionObservation, type SelfEvolvingOutput } from './self-evolving-engine';

export type RevenueEvolutionLoopInput = EvolutionObservation & {
  cycles?: number;
  safe_mode?: boolean;
};

export type RevenueEvolutionCycle = SelfEvolvingOutput & {
  cycle: number;
  rollback_available: boolean;
};

export type RevenueEvolutionLoopResult = {
  cycles: RevenueEvolutionCycle[];
  final_recommendation: string;
  rollback_log: string[];
};

function boundedCycles(value: unknown) {
  const next = Number(value || 3);
  if (!Number.isFinite(next)) return 3;
  return Math.max(1, Math.min(10, Math.floor(next)));
}

function enforceSafeMode(output: SelfEvolvingOutput, safeMode: boolean): SelfEvolvingOutput {
  if (!safeMode) return output;
  return {
    ...output,
    applied_changes: output.applied_changes.filter((change) => {
      const lower = change.toLowerCase();
      return !lower.includes('destructive') && !lower.includes('full funnel redesign') && !lower.includes('price jump > 30%');
    }),
  };
}

export function runRevenueEvolutionLoop(input: RevenueEvolutionLoopInput = {}): RevenueEvolutionLoopResult {
  const cycles = boundedCycles(input.cycles);
  const safeMode = input.safe_mode !== false;
  const loopBaseline = runAutonomousOptimizationLoop({ ...input, iterations: cycles });
  const results: RevenueEvolutionCycle[] = [];
  const rollbackLog: string[] = [];

  for (let cycle = 0; cycle < cycles; cycle += 1) {
    const cycleInput: EvolutionObservation = {
      ...input,
      simulation_results: {
        recommended_strategy: loopBaseline.final_strategy,
        projected_mrr: loopBaseline.cycles[cycle]?.measured_impact.projected_mrr,
        conversion_rate: loopBaseline.cycles[cycle]?.measured_impact.conversion_rate,
        bottlenecks: loopBaseline.cycles[cycle]?.analysis.optimized_funnel || [],
      },
    };
    const output = enforceSafeMode(runSelfEvolvingRevenueEngine(cycleInput), safeMode);
    const rollbackItems = output.applied_changes.map((change) => `cycle_${cycle + 1}:rollback:${change}`);
    rollbackLog.push(...rollbackItems);
    results.push({
      ...output,
      cycle: cycle + 1,
      rollback_available: rollbackItems.length > 0,
    });
  }

  return {
    cycles: results,
    final_recommendation: loopBaseline.final_strategy,
    rollback_log: rollbackLog,
  };
}
