import { RevenueContext } from './context-engine';

/**
 * RDCL v3.2.2 — Scoring Model (PASSIVE HELPER ONLY)
 *
 * RULE: This module CANNOT produce actions, decisions, or business logic.
 * It emits normalized score data consumed exclusively by RDCL.
 * Action mapping has been removed. RDCL is the sole decision authority.
 */

export interface ScoreOutput {
  /** Normalized composite pressure score: 0.0 (none) → 1.0 (maximum) */
  score: number;
  /** Passive signal descriptors forwarded to RDCL context */
  signals: string[];
  /** Confidence in the scoring based on data completeness (0.0–1.0) */
  confidence: number;
}

export function scoreContext(context: RevenueContext): ScoreOutput {
  const signals: string[] = [];

  // Usage pressure signal
  let usagePressure = 0.2;
  if (context.usageLevel === 'high') {
    usagePressure = 0.9;
    signals.push('usage_pressure_signal');
  } else if (context.usageLevel === 'medium') {
    usagePressure = 0.5;
    signals.push('usage_signal');
  }

  // Conversion intent signal
  const conversionBoost = context.conversionLikelihood > 0.6 ? 0.3 : 0.0;
  if (context.conversionLikelihood > 0.4) {
    signals.push('conversion_signal');
  }

  // Churn risk signal
  const churnPenalty = context.churnRiskSignal * 0.4;
  if (context.churnRiskSignal > 0.5) {
    signals.push('churn_risk_signal');
  }

  // Feature exposure decay (diminishing returns on nudges)
  const exposureDecay = Math.max(0.1, 1.0 - (context.featureExposure.length * 0.2));

  // Composite score — normalized, no action mapping
  const raw = context.conversionLikelihood + usagePressure + exposureDecay + conversionBoost - churnPenalty;
  const score = Math.max(0.0, Math.min(1.0, raw / 2.5)); // normalize to 0–1 range

  // Confidence: higher when more events exist to derive signals
  const confidence = Math.min(1.0, context.sessionIntensity / 10);

  return { score, signals, confidence };
}
