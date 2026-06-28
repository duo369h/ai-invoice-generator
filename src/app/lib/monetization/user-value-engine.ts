export type UserValueSignals = {
  invoice_created_count?: number;
  quote_created_count?: number;
  export_actions?: number;
  pricing_page_visits?: number;
  session_time?: number;
  return_user_frequency?: number;
};

export type UserValueScore = {
  intent_score: number;
  value_score: number;
  conversion_probability: number;
  risk_score: number;
};

function toNumber(value: unknown, fallback = 0) {
  const next = Number(value ?? fallback);
  return Number.isFinite(next) ? next : fallback;
}

function clamp(value: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, value));
}

function round(value: number, precision = 4) {
  const factor = 10 ** precision;
  return Math.round(value * factor) / factor;
}

function normalizeSessionMinutes(sessionTime: unknown) {
  const raw = Math.max(0, toNumber(sessionTime, 0));
  return raw > 3600 ? raw / 60 : raw;
}

export function computeUserValueScore(signals: UserValueSignals = {}): UserValueScore {
  const invoiceCreatedCount = Math.max(0, toNumber(signals.invoice_created_count, 0));
  const quoteCreatedCount = Math.max(0, toNumber(signals.quote_created_count, 0));
  const exportActions = Math.max(0, toNumber(signals.export_actions, 0));
  const pricingPageVisits = Math.max(0, toNumber(signals.pricing_page_visits, 0));
  const sessionMinutes = normalizeSessionMinutes(signals.session_time);
  const returnUserFrequency = Math.max(0, toNumber(signals.return_user_frequency, 0));

  const intentScore = clamp(
    pricingPageVisits * 12 +
      exportActions * 18 +
      invoiceCreatedCount * 14 +
      quoteCreatedCount * 11 +
      Math.min(sessionMinutes, 30) * 0.8 +
      Math.min(returnUserFrequency, 10) * 4
  );

  const valueScore = clamp(
    invoiceCreatedCount * 20 +
      quoteCreatedCount * 16 +
      exportActions * 12 +
      pricingPageVisits * 8 +
      Math.min(returnUserFrequency, 10) * 6 +
      Math.min(sessionMinutes, 45) * 0.5
  );

  const riskScore = clamp(
    exportActions * 22 +
      Math.max(0, invoiceCreatedCount - 1) * 16 +
      Math.max(0, quoteCreatedCount - 1) * 12 -
      pricingPageVisits * 4 -
      returnUserFrequency * 3
  );

  const conversionProbability = round(clamp(valueScore * 0.45 + intentScore * 0.45 - riskScore * 0.15) / 100);

  return {
    intent_score: Math.round(intentScore),
    value_score: Math.round(valueScore),
    conversion_probability: conversionProbability,
    risk_score: Math.round(riskScore),
  };
}
