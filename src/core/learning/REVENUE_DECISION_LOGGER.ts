/**
 * Corvioz — Revenue Decision Logger v3.1
 *
 * Records strategy choices made by users at the decision card UI level.
 */

export type DecisionEvent = {
  userId: string;
  clientType: "new" | "repeat" | "enterprise";
  projectType: string;
  optionsShown: {
    high: number;
    recommended: number;
    fast: number;
  };
  selectedOption: "HIGH" | "RECOMMENDED" | "FAST";
  timestamp: number;
};

const localLogs: DecisionEvent[] = [];

/**
 * Logs a strategy selection event.
 */
export function logDecision(event: DecisionEvent): void {
  // Prevent duplication
  if (!localLogs.some((l) => l.timestamp === event.timestamp && l.userId === event.userId)) {
    localLogs.push(event);
  }
}

/**
 * Retrieves history for a user.
 */
export function getUserHistory(userId: string): DecisionEvent[] {
  return localLogs.filter((l) => l.userId === userId);
}

/**
 * Clear memory records.
 */
export function clearLogs(): void {
  localLogs.length = 0;
}
