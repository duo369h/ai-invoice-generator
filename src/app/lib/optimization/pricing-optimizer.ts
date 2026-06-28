export type PricingOptimizationInput = {
  current_price?: number;
  conversion_rate?: number;
  drop_off_rate?: number;
  candidate_prices?: number[];
  arpu?: number;
};

export type PricingOptimizationResult = {
  optimal_price: number;
  pricing_strategy: string;
};

function toNumber(value: unknown, fallback = 0) {
  const next = Number(value ?? fallback);
  return Number.isFinite(next) ? next : fallback;
}

function normalizeRate(value: unknown) {
  const next = toNumber(value, 0);
  return next > 1 ? next / 100 : next;
}

function scorePrice(price: number, conversionRate: number, dropOffRate: number, arpu: number) {
  const priceLift = price / Math.max(1, arpu || price);
  const demandPenalty = Math.max(0, price - 19) * 0.012;
  const frictionPenalty = dropOffRate * 0.42;
  return price * Math.max(0.01, conversionRate + priceLift * 0.04 - demandPenalty - frictionPenalty);
}

export function optimizePricing(input: PricingOptimizationInput = {}): PricingOptimizationResult {
  const currentPrice = Math.max(1, toNumber(input.current_price, 19));
  const conversionRate = normalizeRate(input.conversion_rate);
  const dropOffRate = normalizeRate(input.drop_off_rate);
  const arpu = Math.max(0, toNumber(input.arpu, currentPrice));
  const candidatePrices = (input.candidate_prices && input.candidate_prices.length > 0 ? input.candidate_prices : [9, 19, 29])
    .map((price) => Math.max(1, Math.round(toNumber(price, currentPrice))))
    .sort((a, b) => a - b);

  if (conversionRate >= 0.18 && dropOffRate < 0.28) {
    const higherPrice = candidatePrices.find((price) => price > currentPrice) || candidatePrices[candidatePrices.length - 1];
    return {
      optimal_price: higherPrice,
      pricing_strategy: 'Increase price test: conversion is healthy and funnel friction is controlled.',
    };
  }

  if (dropOffRate >= 0.35) {
    const lowerPrice = candidatePrices.filter((price) => price <= currentPrice).slice(-1)[0] || candidatePrices[0];
    return {
      optimal_price: lowerPrice,
      pricing_strategy: 'Decrease friction: keep price accessible and test fewer upgrade interruptions.',
    };
  }

  const best = candidatePrices
    .map((price) => ({ price, score: scorePrice(price, conversionRate || 0.12, dropOffRate, arpu) }))
    .sort((a, b) => b.score - a.score)[0];

  return {
    optimal_price: best?.price || currentPrice,
    pricing_strategy: 'Run deterministic tier combination test across $9, $19, and $29 anchors.',
  };
}
