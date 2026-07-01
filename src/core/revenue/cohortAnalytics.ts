export interface CohortRevenueUser {
  userId: string;
  cohortId: string;
  createdAt?: string;
  planId?: string;
  revenueAmount?: number;
  invoiceCount?: number;
  quoteCount?: number;
  exportCount?: number;
  upgradedAtDay?: number | null;
}

export interface CohortRevenueSummary {
  cohortId: string;
  userCount: number;
  totalRevenue: number;
  averageRevenuePerUser: number;
  activationRate: number;
  conversionRate: number;
  averageUpgradeDay: number | null;
  workflowRevenueCorrelation: 'low' | 'medium' | 'high';
}

const paidPlans = new Set(['starter', 'pro', 'studio']);

function round(value: number): number {
  return Math.round(value * 100) / 100;
}

function summarizeCohort(cohortId: string, users: CohortRevenueUser[]): CohortRevenueSummary {
  const userCount = users.length;
  const totalRevenue = users.reduce((sum, user) => sum + (user.revenueAmount ?? 0), 0);
  const activatedUsers = users.filter((user) => (user.invoiceCount ?? 0) + (user.quoteCount ?? 0) > 0).length;
  const convertedUsers = users.filter((user) => paidPlans.has(String(user.planId ?? '').toLowerCase()) || (user.revenueAmount ?? 0) > 0).length;
  const upgradeDays = users
    .map((user) => user.upgradedAtDay)
    .filter((value): value is number => typeof value === 'number' && Number.isFinite(value));
  const workflowVolume = users.reduce((sum, user) => sum + (user.invoiceCount ?? 0) + (user.quoteCount ?? 0) + (user.exportCount ?? 0), 0);
  const revenuePerWorkflow = workflowVolume > 0 ? totalRevenue / workflowVolume : 0;

  return {
    cohortId,
    userCount,
    totalRevenue: round(totalRevenue),
    averageRevenuePerUser: userCount ? round(totalRevenue / userCount) : 0,
    activationRate: userCount ? round((activatedUsers / userCount) * 100) : 0,
    conversionRate: userCount ? round((convertedUsers / userCount) * 100) : 0,
    averageUpgradeDay: upgradeDays.length ? round(upgradeDays.reduce((sum, value) => sum + value, 0) / upgradeDays.length) : null,
    workflowRevenueCorrelation: revenuePerWorkflow >= 8 ? 'high' : revenuePerWorkflow >= 3 ? 'medium' : 'low',
  };
}

export function summarizeCohortRevenue(users: CohortRevenueUser[] = []): CohortRevenueSummary[] {
  const cohorts = new Map<string, CohortRevenueUser[]>();

  for (const user of users) {
    const cohortId = user.cohortId || 'unknown';
    const existing = cohorts.get(cohortId) ?? [];
    existing.push(user);
    cohorts.set(cohortId, existing);
  }

  return [...cohorts.entries()]
    .map(([cohortId, cohortUsers]) => summarizeCohort(cohortId, cohortUsers))
    .sort((a, b) => a.cohortId.localeCompare(b.cohortId));
}
