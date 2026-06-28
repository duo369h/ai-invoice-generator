/**
 * Corvioz Learning Event Queue v3.1.1
 *
 * Request-time decision APIs may enqueue immutable learning events, but must not
 * update pricing profiles or write decision history inline.
 */

export type LearningEvent = {
  user_id: string;
  decision: {
    service_type: string;
    suggested_price: number;
    adjusted_price: number;
  };
  outcome: "PENDING" | "ACCEPTED" | "REJECTED";
};

const pendingLearningEvents: LearningEvent[] = [];

export function enqueueLearningEvent(event: LearningEvent): void {
  pendingLearningEvents.push({
    user_id: event.user_id,
    decision: {
      service_type: event.decision.service_type,
      suggested_price: event.decision.suggested_price,
      adjusted_price: event.decision.adjusted_price,
    },
    outcome: event.outcome,
  });
}

export function getQueuedLearningEvents(): LearningEvent[] {
  return [...pendingLearningEvents];
}

export function clearLearningEventQueue(): void {
  pendingLearningEvents.length = 0;
}
