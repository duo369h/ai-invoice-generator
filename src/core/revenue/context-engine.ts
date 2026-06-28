/**
 * RDCL v3.2.2 — Context Engine (STATEFUL BUT SAFE)
 *
 * Computes a real-time, recomputable revenue context snapshot from raw events.
 * - No persistent state inference
 * - No hidden memory logic
 * - Every call with the same events returns the same output (deterministic)
 *
 * Output consumed exclusively by RDCL. This module CANNOT produce actions.
 */

export interface RevenueContext {
  /** Plan tier derived from payment history */
  user_tier: 'free' | 'pro' | 'enterprise';
  /** Usage pressure level derived from total event volume */
  usage_level: 'low' | 'medium' | 'high';
  /** Per-feature usage counters for RDCL signal weighting */
  feature_usage: Record<string, number>;

  // ── Legacy fields kept for backwards compatibility with scoring-model ──
  /** @deprecated use user_tier */
  planTier: 'free' | 'pro' | 'enterprise';
  /** @deprecated use usage_level */
  usageLevel: 'low' | 'medium' | 'high';
  featureExposure: string[];
  sessionIntensity: number;
  conversionLikelihood: number;
  churnRiskSignal: number;
}

export function buildRevenueContext(userEvents: any[]): RevenueContext {
  if (!Array.isArray(userEvents) || userEvents.length === 0) {
    const empty: RevenueContext = {
      user_tier: 'free',
      usage_level: 'low',
      feature_usage: {},
      planTier: 'free',
      usageLevel: 'low',
      featureExposure: [],
      sessionIntensity: 0,
      conversionLikelihood: 0.1,
      churnRiskSignal: 0.15,
    };
    return empty;
  }

  const eventTypes = userEvents.map(e => e.event_type || e.type || e);

  // ── Feature usage counters (kept: required for RDCL accuracy) ──────────
  const feature_usage: Record<string, number> = {
    invoice_paid:     eventTypes.filter(t => t === 'invoice_paid').length,
    quote_created:    eventTypes.filter(t => t === 'quote_created').length,
    client_created:   eventTypes.filter(t => t === 'client_created').length,
    invoice_created:  eventTypes.filter(t => t === 'invoice_created').length,
    invoice_sent:     eventTypes.filter(t => t === 'invoice_sent').length,
  };

  // ── User tier: derived purely from paid invoice count ────────────────────
  let user_tier: 'free' | 'pro' | 'enterprise' = 'free';
  if (feature_usage.invoice_paid >= 5) user_tier = 'enterprise';
  else if (feature_usage.invoice_paid > 0) user_tier = 'pro';

  // ── Usage level: derived from total event volume ──────────────────────────
  const totalEvents = userEvents.length;
  let usage_level: 'low' | 'medium' | 'high' = 'low';
  if (totalEvents > 15) usage_level = 'high';
  else if (totalEvents > 5) usage_level = 'medium';

  // ── Session stats (kept: required for scoring-model confidence) ──────────
  const sessionIntensity = totalEvents;

  // ── Feature exposure nudge list (kept: required for scoring decay) ────────
  const featureExposure: string[] = [];
  if (feature_usage.invoice_created > 0) featureExposure.push('invoice_creation_nudge');
  if (feature_usage.quote_created > 0) featureExposure.push('quote_creation_nudge');
  if (feature_usage.client_created > 0) featureExposure.push('client_limit_warning');

  // ── Conversion likelihood (kept: required for scoring-model) ─────────────
  let conversionLikelihood = 0.1;
  conversionLikelihood += Math.min(0.4, (feature_usage.invoice_sent * 0.1) + (feature_usage.quote_created * 0.1));
  conversionLikelihood += Math.min(0.5, feature_usage.client_created * 0.15);
  conversionLikelihood = Math.max(0.0, Math.min(1.0, conversionLikelihood));

  // ── Churn risk signal (kept: required for scoring-model penalty) ──────────
  let churnRiskSignal = 0.15;
  if (feature_usage.invoice_created === 0 && feature_usage.quote_created === 0) {
    churnRiskSignal = 0.75;
  } else if (feature_usage.invoice_created < 2) {
    churnRiskSignal = 0.45;
  }

  return {
    user_tier,
    usage_level,
    feature_usage,
    // Legacy aliases
    planTier: user_tier,
    usageLevel: usage_level,
    featureExposure,
    sessionIntensity,
    conversionLikelihood,
    churnRiskSignal,
  };
}

