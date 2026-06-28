/**
 * STRATEGY_EVOLUTION_MEMORY.ts — v3.6 Strategy Lifecycle Memory
 *
 * Tracks the performance lifecycle of each strategy over time to compute
 * dynamic lifecycle metrics: momentum (growth), decay (degradation), and peak efficiency.
 *
 * ❌ PROHIBITED: AI, Math.random()
 * ✅ ALLOWED: Sliding statistics, delta derivatives, peak value tracking
 */

export interface StrategyMemoryRecord {
  strategy_used: string;
  outcome: "WON" | "LOST" | "PENDING" | "REVISED";
  timestamp: number;
}

export interface StrategyLifecycleMetrics {
  strategy: string;
  momentum: number;           // Win rate velocity (recent 10 wins delta vs older deals)
  decay: number;              // Decay rate (negative momentum score)
  peakWinRate: number;        // Historically highest win rate achieved in any 10-deal rolling window
  lifecycleStage: "EMERGING" | "STABLE" | "DECLINING" | "UNKNOWN";
}

export interface EvolutionMemoryOutput {
  lifecycleMap: Record<string, StrategyLifecycleMetrics>;
  computedAt: number;
}

/**
 * calculateStrategyLifecycle — computes decay, momentum, and peak win rates.
 */
export function calculateStrategyLifecycle(records: StrategyMemoryRecord[]): EvolutionMemoryOutput {
  const resolved = records
    .filter((r) => r.outcome === "WON" || r.outcome === "LOST")
    .sort((a, b) => a.timestamp - b.timestamp); // Chronological order (oldest first)

  const strategies = ["MAX_REVENUE", "BALANCED", "FAST_DEAL"];
  const lifecycleMap: Record<string, StrategyLifecycleMetrics> = {};

  for (const strategy of strategies) {
    const stratRecords = resolved.filter((r) => r.strategy_used === strategy);

    if (stratRecords.length < 10) {
      lifecycleMap[strategy] = {
        strategy,
        momentum: 0,
        decay: 0,
        peakWinRate: 0,
        lifecycleStage: "UNKNOWN",
      };
      continue;
    }

    // 1️⃣ Calculate Peak Win Rate (historically highest in any 10-deal rolling window)
    let peakWinRate = 0;
    for (let i = 0; i <= stratRecords.length - 10; i++) {
      const window = stratRecords.slice(i, i + 10);
      const wins = window.filter((r) => r.outcome === "WON").length;
      const winRate = wins / 10;
      if (winRate > peakWinRate) peakWinRate = winRate;
    }

    // 2️⃣ Calculate Momentum & Decay (velocity: last 5 deals vs the rest before it)
    const recent = stratRecords.slice(-5);
    const older = stratRecords.slice(0, -5);

    const recentWinRate = recent.filter((r) => r.outcome === "WON").length / recent.length;
    const olderWinRate = older.length > 0
      ? older.filter((r) => r.outcome === "WON").length / older.length
      : recentWinRate;

    const momentum = parseFloat((recentWinRate - olderWinRate).toFixed(3));
    const decay = momentum < 0 ? parseFloat(Math.abs(momentum).toFixed(3)) : 0;

    // 3️⃣ Determine Lifecycle Stage
    let lifecycleStage: StrategyLifecycleMetrics["lifecycleStage"] = "STABLE";
    if (momentum >= 0.15) {
      lifecycleStage = "EMERGING";
    } else if (momentum <= -0.15) {
      lifecycleStage = "DECLINING";
    }

    lifecycleMap[strategy] = {
      strategy,
      momentum,
      decay,
      peakWinRate: parseFloat(peakWinRate.toFixed(3)),
      lifecycleStage,
    };
  }

  return {
    lifecycleMap,
    computedAt: Date.now(),
  };
}
