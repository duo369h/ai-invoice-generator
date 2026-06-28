export type RevenueDriftInput = {
  simulation_revenue?: number;
  real_revenue?: number;
  simulation_conversion_rate?: number;
  real_conversion_rate?: number;
  baseline_conversion_rate?: number;
  optimized_conversion_rate?: number;
  baseline_drop_off_rate?: number;
  optimized_drop_off_rate?: number;
  paywall_change_count?: number;
};

export type RevenueDriftResult = {
  drift_detected: boolean;
  impact_level: string;
  recommendation: string;
};

function toNumber(value: unknown, fallback = 0) {
  const next = Number(value ?? fallback);
  return Number.isFinite(next) ? next : fallback;
}

function normalizeRate(value: unknown) {
  const next = toNumber(value, 0);
  return next > 1 ? next / 100 : next;
}

function relativeGap(expected: number, actual: number) {
  if (expected <= 0) return actual <= 0 ? 0 : 1;
  return (expected - actual) / expected;
}

export function detectRevenueDrift(input: RevenueDriftInput = {}): RevenueDriftResult {
  const simulatedRevenue = Math.max(0, toNumber(input.simulation_revenue, 0));
  const realRevenue = Math.max(0, toNumber(input.real_revenue, 0));
  const simulatedConversion = normalizeRate(input.simulation_conversion_rate);
  const realConversion = normalizeRate(input.real_conversion_rate);
  const baselineConversion = normalizeRate(input.baseline_conversion_rate);
  const optimizedConversion = normalizeRate(input.optimized_conversion_rate);
  const baselineDropOff = normalizeRate(input.baseline_drop_off_rate);
  const optimizedDropOff = normalizeRate(input.optimized_drop_off_rate);
  const paywallChanges = Math.max(0, toNumber(input.paywall_change_count, 0));

  const revenueGap = relativeGap(simulatedRevenue, realRevenue);
  const conversionGap = simulatedConversion > 0 ? simulatedConversion - realConversion : 0;
  const conversionDrop = baselineConversion > 0 ? baselineConversion - optimizedConversion : 0;
  const funnelDegradation = optimizedDropOff - baselineDropOff;

  if (revenueGap >= 0.35 || conversionGap >= 0.12 || conversionDrop >= 0.08 || funnelDegradation >= 0.15) {
    return {
      drift_detected: true,
      impact_level: 'critical',
      recommendation: 'Pause automated optimization, rollback recent paywall changes, and recalibrate simulation assumptions with real funnel data.',
    };
  }

  if (revenueGap >= 0.2 || conversionGap >= 0.07 || conversionDrop >= 0.04 || funnelDegradation >= 0.08) {
    return {
      drift_detected: true,
      impact_level: 'high',
      recommendation: 'Switch to conservative monetization, reduce paywall strength, and rerun validation before applying new changes.',
    };
  }

  if (revenueGap >= 0.1 || conversionGap >= 0.03 || conversionDrop >= 0.02 || funnelDegradation >= 0.04 || paywallChanges >= 4) {
    return {
      drift_detected: true,
      impact_level: 'medium',
      recommendation: 'Keep changes in safe mode, soften blocking actions, and monitor conversion recovery.',
    };
  }

  return {
    drift_detected: false,
    impact_level: 'low',
    recommendation: 'No material revenue drift detected; continue applying low-risk validated actions.',
  };
}
