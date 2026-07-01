/**
 * Corvioz Revenue Signal Engine — Main Engine
 * Sprint C Phase 2.8
 *
 * Converts unified analytics events into deterministic revenue-intent signals:
 * event -> funnel stage -> revenue weight -> decision score
 *
 * PURELY ADVISORY & DETERMINISTIC:
 * This layer does NOT modify UI, pricing, or paywalls. It emits advisory signals.
 */

import { getEventRevenueWeight, getStageMultiplier } from './revenueWeightMap';
import { getIndustryWeightMultiplier } from './industryRevenueWeight';
import { clampRevenueScore, executeSafely, isValidSignalPayload } from './revenueSignalGuardrails';
import { aggregateSessionSignal, type AggregatedRevenueSignal } from './revenueSignalAggregator';

export type RevenueSignalResult = {
  /** The normalized event name */
  event: string;
  /** The canonical funnel stage (e.g. LANDING, PRICING, CHECKOUT) */
  stage: string;
  /** Base weight assigned to the event */
  baseWeight: number;
  /** Multiplier based on funnel stage progression */
  stageMultiplier: number;
  /** Multiplier based on industry/monetization profile */
  industryMultiplier: number;
  /** The composite deterministic score for this individual action [0, 100] */
  weightedEventScore: number;
  /** Cumulative aggregated state across the session window */
  aggregatedSignal: AggregatedRevenueSignal;
  /** Unix timestamp in milliseconds */
  timestamp: number;
};

export type SignalListener = (signal: RevenueSignalResult) => void;
const listeners = new Set<SignalListener>();

/**
 * Register a passive listener for revenue intent signals.
 */
export function subscribeToRevenueSignals(listener: SignalListener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/**
 * Processes any normalized event payload into a deterministic revenue signal.
 * Safe against exceptions and non-blocking.
 */
export function processEventForRevenueSignal(inputPayload: any): RevenueSignalResult | null {
  return executeSafely(() => {
    if (!isValidSignalPayload(inputPayload)) {
      return null;
    }

    const eventName = String(inputPayload.event);
    const stage = String(inputPayload.stage || inputPayload.metadata?.funnel_stage || 'LANDING');
    const sessionId = String(inputPayload.sessionId || inputPayload.metadata?.session_id || 'anonymous_session');
    const userId = inputPayload.userId ? String(inputPayload.userId) : undefined;
    const industry = inputPayload.metadata?.industry || inputPayload.metadata?.category || undefined;

    // 1. Look up deterministic weights & multipliers
    const baseWeight = getEventRevenueWeight(eventName);
    const stageMultiplier = getStageMultiplier(stage);
    const industryMultiplier = getIndustryWeightMultiplier(industry);

    // 2. Compute weighted event score
    const rawWeightedScore = baseWeight * stageMultiplier * industryMultiplier;
    const weightedEventScore = clampRevenueScore(rawWeightedScore);

    // 3. Aggregate into session intent window
    const aggregatedSignal = aggregateSessionSignal(sessionId, weightedEventScore, stage, userId);

    const result: RevenueSignalResult = {
      event: eventName,
      stage,
      baseWeight,
      stageMultiplier,
      industryMultiplier,
      weightedEventScore,
      aggregatedSignal,
      timestamp: inputPayload.timestamp || Date.now(),
    };

    // 4. Notify passive subscribers (non-blocking)
    for (const listener of listeners) {
      executeSafely(() => listener(result), undefined);
    }

    return result;
  }, null);
}
