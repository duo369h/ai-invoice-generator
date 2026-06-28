/**
 * Corvioz — UI Feedback Loop Engine (v6.9.0 Log-Only Edition)
 *
 * ❌ Completely isolated from directly editing the UI graph.
 * ✔ Only logs events to update signal weights via the Bridge.
 */

export interface FeedbackEvent {
  type: string;
  elementId?: string;
  value?: any;
  timestamp?: number;
}

const eventLog: FeedbackEvent[] = [];

export function logOnly(event: FeedbackEvent): void {
  eventLog.push({
    ...event,
    timestamp: event.timestamp || Date.now(),
  });
}

export function logEvent(type: string, elementId?: string, value?: any): void {
  logOnly({ type, elementId, value });
}

export function getFeedbackLog(): FeedbackEvent[] {
  return [...eventLog];
}

export function clearFeedbackLog(): void {
  eventLog.length = 0;
}

export const UI_FEEDBACK_LOOP = {
  logEvent(type: string, elementId?: string, value?: any): void {
    logOnly({
      type,
      elementId,
      value,
    });
  },

  clearLog(): void {
    clearFeedbackLog();
  },
};
