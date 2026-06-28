/*
INTELLIGENCE LAYER
This module MUST NOT be used in runtime execution.
Allowed usage:
- offline analysis
- batch processing
- admin tooling
Forbidden:
- UI
- API runtime
- analytics pipeline
*/

import { enforceLayerBoundary } from '../../src/core/architecture/guard';

// Enforce offline intelligence boundary check at module load time
enforceLayerBoundary('intelligence', process.env.CORVIOZ_CALLER || 'runtime');

export interface OfflineRevenueData {
  userId: string;
  totalLtv: number;
  paymentCount: number;
  plan: 'free' | 'pro' | 'studio' | 'agency';
  lastPaymentAt: string;
}

/**
 * Offline Revenue Model Analyzer
 * Consumed strictly in batch processing pipelines / admin scripts.
 * MUST NOT be imported or executed in any frontend or UI runtime paths.
 */
export class RevenueModelOffline {
  /**
   * Calculate User Lifetime Value (LTV) cohort aggregates offline
   */
  public static calculateLtvDistribution(users: OfflineRevenueData[]): {
    averageLtv: number;
    totalMrr: number;
    distribution: Record<string, number>;
  } {
    if (users.length === 0) {
      return { averageLtv: 0, totalMrr: 0, distribution: {} };
    }

    const totalLtv = users.reduce((acc, user) => acc + user.totalLtv, 0);
    const averageLtv = totalLtv / users.length;

    const distribution: Record<string, number> = {};
    let totalMrr = 0;

    users.forEach((user) => {
      distribution[user.plan] = (distribution[user.plan] || 0) + 1;
      if (user.plan === 'pro') totalMrr += 19;
      if (user.plan === 'studio' || user.plan === 'agency') totalMrr += 49;
    });

    return {
      averageLtv: Number(averageLtv.toFixed(2)),
      totalMrr,
      distribution,
    };
  }

  /**
   * Predict future revenue growth based on historical conversion velocity
   */
  public static forecastRevenueGrowth(
    currentMrr: number,
    conversionRate: number,
    inflowVolume: number,
    churnRate = 0.05
  ): number {
    const activeGrowth = inflowVolume * conversionRate * 19; // assume pro target
    const churnLoss = currentMrr * churnRate;
    return Math.max(0, currentMrr + activeGrowth - churnLoss);
  }
}
