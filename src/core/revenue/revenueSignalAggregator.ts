/**
 * Corvioz Revenue Signal Engine — Session Aggregator
 * Sprint C Phase 2.8
 *
 * Aggregates normalized event weights over an active session window
 * to compute composite revenue intent and readiness state.
 */

import { clampRevenueScore } from './revenueSignalGuardrails';

export type ReadinessLevel = 'cold' | 'warming' | 'high_intent' | 'checkout_ready';

export type AggregatedRevenueSignal = {
  sessionId: string;
  userId?: string;
  cumulativeScore: number;
  lastScore: number;
  eventCount: number;
  dominantStage: string;
  readinessLevel: ReadinessLevel;
  updatedAt: number;
};

// In-memory LRU session buffer (max 500 active sessions in runtime memory)
const SESSION_BUFFER = new Map<string, {
  userId?: string;
  totalScore: number;
  lastScore: number;
  eventCount: number;
  stageCounts: Record<string, number>;
  updatedAt: number;
}>();

const MAX_BUFFER_SIZE = 500;

function pruneBufferIfNeeded(): void {
  if (SESSION_BUFFER.size <= MAX_BUFFER_SIZE) return;
  const oldestKey = SESSION_BUFFER.keys().next().value;
  if (oldestKey) {
    SESSION_BUFFER.delete(oldestKey);
  }
}

/**
 * Determines readiness classification based on deterministic score thresholds.
 */
export function determineReadiness(score: number): ReadinessLevel {
  if (score >= 80) return 'checkout_ready';
  if (score >= 55) return 'high_intent';
  if (score >= 25) return 'warming';
  return 'cold';
}

/**
 * Aggregates a single event score into the active session window.
 */
export function aggregateSessionSignal(
  sessionId: string,
  eventScore: number,
  stage: string,
  userId?: string
): AggregatedRevenueSignal {
  pruneBufferIfNeeded();

  const key = sessionId || 'anonymous_session';
  const existing = SESSION_BUFFER.get(key) ?? {
    userId,
    totalScore: 0,
    lastScore: 0,
    eventCount: 0,
    stageCounts: {},
    updatedAt: Date.now(),
  };

  // Update cumulative metrics (decaying previous total slightly to reflect recent action weight)
  const newTotal = existing.totalScore * 0.85 + eventScore;
  const clampedTotal = clampRevenueScore(newTotal);

  existing.totalScore = clampedTotal;
  existing.lastScore = eventScore;
  existing.eventCount += 1;
  if (userId) existing.userId = userId;
  existing.updatedAt = Date.now();

  const currentStageCount = existing.stageCounts[stage] || 0;
  existing.stageCounts[stage] = currentStageCount + eventScore;

  SESSION_BUFFER.set(key, existing);

  // Find dominant stage
  let dominantStage = stage || 'LANDING';
  let maxStageScore = -1;
  for (const [stg, sc] of Object.entries(existing.stageCounts)) {
    if (sc > maxStageScore) {
      maxStageScore = sc;
      dominantStage = stg;
    }
  }

  return {
    sessionId: key,
    userId: existing.userId,
    cumulativeScore: clampedTotal,
    lastScore: eventScore,
    eventCount: existing.eventCount,
    dominantStage,
    readinessLevel: determineReadiness(clampedTotal),
    updatedAt: existing.updatedAt,
  };
}

/**
 * Retrieves the current aggregated signal state for a session.
 */
export function getSessionSignal(sessionId: string): AggregatedRevenueSignal | null {
  const existing = SESSION_BUFFER.get(sessionId);
  if (!existing) return null;

  let dominantStage = 'LANDING';
  let maxStageScore = -1;
  for (const [stg, sc] of Object.entries(existing.stageCounts)) {
    if (sc > maxStageScore) {
      maxStageScore = sc;
      dominantStage = stg;
    }
  }

  return {
    sessionId,
    userId: existing.userId,
    cumulativeScore: clampRevenueScore(existing.totalScore),
    lastScore: existing.lastScore,
    eventCount: existing.eventCount,
    dominantStage,
    readinessLevel: determineReadiness(existing.totalScore),
    updatedAt: existing.updatedAt,
  };
}
