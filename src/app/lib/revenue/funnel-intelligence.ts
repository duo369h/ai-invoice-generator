export type FunnelStepMetric = {
  step: string;
  visitors?: number;
  completed?: number;
  exits?: number;
  revenue_events?: number;
  total_time_ms?: number;
};

export type FunnelStepIntelligence = {
  step: string;
  drop_off_rate: number;
  conversion_probability: number;
  average_time_spent_ms: number;
  friction_score: number;
  revenue_score: number;
};

export type FunnelIntelligenceInput = {
  steps?: FunnelStepMetric[];
};

export type FunnelIntelligenceResult = {
  weakest_step: string;
  highest_revenue_step: string;
  drop_off_hotspots: string[];
  drop_off_points: Record<string, number>;
  conversion_probability_per_step: Record<string, number>;
  time_spent_per_step: Record<string, number>;
  friction_score_per_step: Record<string, number>;
  steps: FunnelStepIntelligence[];
};

function safeNumber(value: unknown, fallback = 0) {
  const next = Number(value ?? fallback);
  return Number.isFinite(next) ? next : fallback;
}

function roundRate(value: number) {
  return Math.round(value * 10000) / 10000;
}

function computeStep(metric: FunnelStepMetric): FunnelStepIntelligence {
  const visitors = Math.max(0, safeNumber(metric.visitors, 0));
  const completed = Math.max(0, safeNumber(metric.completed, 0));
  const exits = Math.max(0, safeNumber(metric.exits, Math.max(0, visitors - completed)));
  const revenueEvents = Math.max(0, safeNumber(metric.revenue_events, 0));
  const totalTimeMs = Math.max(0, safeNumber(metric.total_time_ms, 0));

  const dropOffRate = visitors > 0 ? exits / visitors : 0;
  const conversionProbability = visitors > 0 ? completed / visitors : 0;
  const averageTimeSpentMs = visitors > 0 ? totalTimeMs / visitors : 0;
  const timeFriction = Math.min(1, averageTimeSpentMs / 120000);
  const frictionScore = Math.min(100, Math.round((dropOffRate * 70 + timeFriction * 30) * 100));
  const revenueScore = revenueEvents * conversionProbability;

  return {
    step: String(metric.step || 'unknown'),
    drop_off_rate: roundRate(dropOffRate),
    conversion_probability: roundRate(conversionProbability),
    average_time_spent_ms: Math.round(averageTimeSpentMs),
    friction_score: frictionScore,
    revenue_score: roundRate(revenueScore),
  };
}

function pickMax(steps: FunnelStepIntelligence[], field: keyof FunnelStepIntelligence) {
  return steps.reduce<FunnelStepIntelligence | null>((best, step) => {
    if (!best) return step;
    return Number(step[field]) > Number(best[field]) ? step : best;
  }, null);
}

export function analyzeFunnelIntelligence(input: FunnelIntelligenceInput = {}): FunnelIntelligenceResult {
  const steps = (input.steps || []).map(computeStep);
  const weakest = pickMax(steps, 'friction_score');
  const highestRevenue = pickMax(steps, 'revenue_score');

  const dropOffPoints: Record<string, number> = {};
  const conversionProbability: Record<string, number> = {};
  const timeSpent: Record<string, number> = {};
  const frictionScore: Record<string, number> = {};

  steps.forEach((step) => {
    dropOffPoints[step.step] = step.drop_off_rate;
    conversionProbability[step.step] = step.conversion_probability;
    timeSpent[step.step] = step.average_time_spent_ms;
    frictionScore[step.step] = step.friction_score;
  });

  return {
    weakest_step: weakest?.step || '',
    highest_revenue_step: highestRevenue?.step || '',
    drop_off_hotspots: steps
      .filter((step) => step.drop_off_rate >= 0.35 || step.friction_score >= 60)
      .sort((a, b) => b.friction_score - a.friction_score)
      .map((step) => step.step),
    drop_off_points: dropOffPoints,
    conversion_probability_per_step: conversionProbability,
    time_spent_per_step: timeSpent,
    friction_score_per_step: frictionScore,
    steps,
  };
}
