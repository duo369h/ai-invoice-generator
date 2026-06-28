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

export interface CohortDefinition {
  cohortKey: string; // e.g. "2026-W24"
  userIds: string[];
}

export interface UserActivity {
  userId: string;
  timestamp: string;
  revenueGenerated: number;
}

/**
 * Offline Cohort Analyzer
 * Consumed strictly in batch processing pipelines / admin scripts.
 * MUST NOT be imported or executed in any frontend or UI runtime paths.
 */
export class CohortAnalyzerOffline {
  /**
   * Tracks week-over-week cohort activity index and monetization density
   */
  public static analyzeCohortMonetization(
    cohorts: CohortDefinition[],
    activities: UserActivity[]
  ): Record<string, { size: number; totalRevenue: number; avgRevenuePerUser: number }> {
    const results: Record<string, { size: number; totalRevenue: number; avgRevenuePerUser: number }> = {};

    cohorts.forEach((cohort) => {
      const userSet = new Set(cohort.userIds);
      let cohortRevenue = 0;

      activities.forEach((act) => {
        if (userSet.has(act.userId)) {
          cohortRevenue += act.revenueGenerated;
        }
      });

      results[cohort.cohortKey] = {
        size: cohort.userIds.length,
        totalRevenue: cohortRevenue,
        avgRevenuePerUser: cohort.userIds.length ? cohortRevenue / cohort.userIds.length : 0,
      };
    });

    return results;
  }
}
