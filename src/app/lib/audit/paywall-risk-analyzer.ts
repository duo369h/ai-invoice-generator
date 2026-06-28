export type PaywallRiskInput = {
  paywall_trigger_count?: number;
  session_count?: number;
  hard_block_count?: number;
  first_value_block_count?: number;
  high_intent_block_count?: number;
  average_paywalls_per_session?: number;
  first_invoice_blocked?: boolean;
  signup_blocked?: boolean;
};

export type PaywallRiskResult = {
  aggression_score: number;
  safe: boolean;
  recommendation: string;
};

function toNumber(value: unknown, fallback = 0) {
  const next = Number(value ?? fallback);
  return Number.isFinite(next) ? next : fallback;
}

function clamp(value: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, value));
}

function rate(count: number, total: number) {
  return total > 0 ? count / total : 0;
}

export function analyzePaywallRisk(input: PaywallRiskInput = {}): PaywallRiskResult {
  const sessions = Math.max(1, toNumber(input.session_count, 1));
  const triggerRate = rate(Math.max(0, toNumber(input.paywall_trigger_count, 0)), sessions);
  const hardBlockRate = rate(Math.max(0, toNumber(input.hard_block_count, 0)), sessions);
  const firstValueBlockRate = rate(Math.max(0, toNumber(input.first_value_block_count, 0)), sessions);
  const highIntentBlockRate = rate(Math.max(0, toNumber(input.high_intent_block_count, 0)), sessions);
  const paywallsPerSession = Math.max(0, toNumber(input.average_paywalls_per_session, triggerRate));

  let score = 0;
  score += triggerRate * 30;
  score += hardBlockRate * 30;
  score += firstValueBlockRate * 25;
  score += highIntentBlockRate * 20;
  score += Math.max(0, paywallsPerSession - 1) * 15;
  if (input.first_invoice_blocked) score += 40;
  if (input.signup_blocked) score += 50;

  const aggressionScore = Math.round(clamp(score));

  if (input.signup_blocked || input.first_invoice_blocked || aggressionScore >= 75) {
    return {
      aggression_score: aggressionScore,
      safe: false,
      recommendation: 'No-go: disable hard paywalls in signup and first-value flows, then rerun the audit.',
    };
  }

  if (aggressionScore >= 45) {
    return {
      aggression_score: aggressionScore,
      safe: false,
      recommendation: 'Reduce paywall frequency, convert early blocks to soft upsells, and cap prompts per session.',
    };
  }

  return {
    aggression_score: aggressionScore,
    safe: true,
    recommendation: 'Paywall pressure is within the audit safety envelope.',
  };
}
