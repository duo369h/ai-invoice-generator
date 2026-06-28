export type AuditRevenueDriftInput = {
  simulated_revenue?: number;
  expected_real_revenue?: number;
  simulated_conversion_rate?: number;
  expected_real_conversion_rate?: number;
  baseline_conversion_rate?: number;
  optimized_conversion_rate?: number;
  baseline_drop_off_rate?: number;
  optimized_drop_off_rate?: number;
};

export type AuditRevenueDriftResult = {
  drift_detected: boolean;
  inflation_risk: number;
  funnel_damage_risk: number;
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

function clamp(value: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, value));
}

function relativeInflation(simulated: number, expected: number) {
  if (simulated <= 0) return 0;
  return Math.max(0, (simulated - expected) / simulated);
}

export function detectAuditRevenueDrift(input: AuditRevenueDriftInput = {}): AuditRevenueDriftResult {
  const simulatedRevenue = Math.max(0, toNumber(input.simulated_revenue, 0));
  const expectedRevenue = Math.max(0, toNumber(input.expected_real_revenue, simulatedRevenue));
  const simulatedConversion = normalizeRate(input.simulated_conversion_rate);
  const expectedConversion = normalizeRate(input.expected_real_conversion_rate || input.simulated_conversion_rate);
  const baselineConversion = normalizeRate(input.baseline_conversion_rate);
  const optimizedConversion = normalizeRate(input.optimized_conversion_rate || input.baseline_conversion_rate);
  const baselineDropOff = normalizeRate(input.baseline_drop_off_rate);
  const optimizedDropOff = normalizeRate(input.optimized_drop_off_rate || input.baseline_drop_off_rate);

  const revenueInflation = relativeInflation(simulatedRevenue, expectedRevenue);
  const conversionInflation = Math.max(0, simulatedConversion - expectedConversion);
  const conversionDamage = Math.max(0, baselineConversion - optimizedConversion);
  const dropOffDamage = Math.max(0, optimizedDropOff - baselineDropOff);
  const inflationRisk = Math.round(clamp((revenueInflation * 75) + (conversionInflation * 160)));
  const funnelDamageRisk = Math.round(clamp((conversionDamage * 180) + (dropOffDamage * 140)));
  const driftDetected = inflationRisk >= 25 || funnelDamageRisk >= 25;

  if (inflationRisk >= 60 || funnelDamageRisk >= 60) {
    return {
      drift_detected: true,
      inflation_risk: inflationRisk,
      funnel_damage_risk: funnelDamageRisk,
      recommendation: 'No-go: simulation is likely overstating revenue or damaging conversion. Keep v6 autonomous apply disabled.',
    };
  }

  if (driftDetected) {
    return {
      drift_detected: true,
      inflation_risk: inflationRisk,
      funnel_damage_risk: funnelDamageRisk,
      recommendation: 'Proceed only in shadow mode with rollback-ready paywall and pricing rules.',
    };
  }

  return {
    drift_detected: false,
    inflation_risk: inflationRisk,
    funnel_damage_risk: funnelDamageRisk,
    recommendation: 'Revenue simulation and expected behavior are aligned within audit tolerance.',
  };
}
