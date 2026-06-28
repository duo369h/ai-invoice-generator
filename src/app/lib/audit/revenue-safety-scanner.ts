import { validateFunnelIntegrity, type FunnelIntegrityInput } from './funnel-integrity-validator';
import { analyzePaywallRisk, type PaywallRiskInput } from './paywall-risk-analyzer';
import { detectAuditRevenueDrift, type AuditRevenueDriftInput } from './revenue-drift-detector';
import { createRollbackPlan } from './rollback-controller';
import { detectMisclassification, type MisclassificationSample } from '../validation/misclassification-detector';

export type AuditRiskLevel = 'low' | 'medium' | 'high' | 'critical';

export type RevenueSafetyScannerInput = PaywallRiskInput & FunnelIntegrityInput & AuditRevenueDriftInput & {
  pricing_change_percent?: number;
  pricing_change_count?: number;
  misclassification_samples?: MisclassificationSample[];
};

export type RevenueSafetyScannerResult = {
  risk_level: AuditRiskLevel;
  issues: string[];
  blocked_actions: string[];
};

function toNumber(value: unknown, fallback = 0) {
  const next = Number(value ?? fallback);
  return Number.isFinite(next) ? next : fallback;
}

function maxRisk(current: AuditRiskLevel, next: AuditRiskLevel): AuditRiskLevel {
  const order: Record<AuditRiskLevel, number> = {
    low: 0,
    medium: 1,
    high: 2,
    critical: 3,
  };
  return order[next] > order[current] ? next : current;
}

export function scanRevenueSystemSafety(input: RevenueSafetyScannerInput = {}): RevenueSafetyScannerResult {
  const issues: string[] = [];
  const blockedActions: string[] = [];
  let riskLevel: AuditRiskLevel = 'low';

  const paywallRisk = analyzePaywallRisk(input);
  if (!paywallRisk.safe) {
    riskLevel = maxRisk(riskLevel, paywallRisk.aggression_score >= 75 ? 'critical' : 'high');
    issues.push(`Paywall aggression score ${paywallRisk.aggression_score}: ${paywallRisk.recommendation}`);
    blockedActions.push('enable_v6_autonomous_paywall_apply');
  }

  const pricingChangePercent = Math.abs(toNumber(input.pricing_change_percent, 0));
  const pricingChangeCount = Math.max(0, toNumber(input.pricing_change_count, 0));
  if (pricingChangePercent > 30) {
    riskLevel = maxRisk(riskLevel, 'critical');
    issues.push('Pricing volatility exceeds the 30% safe-mode cap.');
    blockedActions.push('apply_dynamic_pricing_changes');
  } else if (pricingChangePercent > 15 || pricingChangeCount >= 3) {
    riskLevel = maxRisk(riskLevel, 'medium');
    issues.push('Pricing volatility requires shadow-mode testing before automatic apply.');
  }

  const funnel = validateFunnelIntegrity(input);
  if (!funnel.stable) {
    riskLevel = maxRisk(riskLevel, funnel.stability_score < 65 ? 'high' : 'medium');
    issues.push(...funnel.broken_redirects.map((item) => `Broken redirect: ${item}`));
    issues.push(...funnel.blocked_flows.map((item) => `Blocked funnel flow: ${item}`));
    issues.push(...funnel.unintended_paywalls.map((item) => `Unintended paywall: ${item}`));
    blockedActions.push('enable_v6_funnel_auto_apply');
  }

  const misclassification = detectMisclassification({
    samples: input.misclassification_samples || [],
  });
  if (misclassification.false_positive_rate >= 0.35 || misclassification.false_negative_rate >= 0.35) {
    riskLevel = maxRisk(riskLevel, 'high');
    issues.push(...misclassification.warning);
    blockedActions.push('enable_v6_user_classification_auto_apply');
  } else if (misclassification.false_positive_rate > 0 || misclassification.false_negative_rate > 0) {
    riskLevel = maxRisk(riskLevel, 'medium');
    issues.push(...misclassification.warning);
  }

  const drift = detectAuditRevenueDrift(input);
  if (drift.drift_detected) {
    riskLevel = maxRisk(riskLevel, drift.inflation_risk >= 60 || drift.funnel_damage_risk >= 60 ? 'critical' : 'medium');
    issues.push(drift.recommendation);
    blockedActions.push('trust_simulated_revenue_for_autonomous_apply');
  }

  const rollback = createRollbackPlan({ dry_run: true });
  if (!rollback.ready) {
    riskLevel = maxRisk(riskLevel, 'critical');
    issues.push('Rollback controller is not ready for paywall, pricing, and funnel recovery.');
    blockedActions.push('enable_v6_autonomous_apply');
  }

  return {
    risk_level: riskLevel,
    issues: Array.from(new Set(issues)),
    blocked_actions: Array.from(new Set(blockedActions)),
  };
}
