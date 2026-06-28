export type UIMutationEventType =
  | "mutation_applied"
  | "cta_shifted"
  | "layout_reordered"
  | "section_hidden";

export interface UIMutationEvent {
  type: UIMutationEventType;
  payload?: Record<string, any>;
  timestamp?: string;
}

const mutationLog: UIMutationEvent[] = [];

export function logMutation(event: UIMutationEvent): UIMutationEvent {
  const normalizedEvent = {
    ...event,
    timestamp: event.timestamp || new Date().toISOString(),
  };

  mutationLog.push(normalizedEvent);
  return normalizedEvent;
}

export function getMutationLog(): UIMutationEvent[] {
  return [...mutationLog];
}

export function clearMutationLog(): void {
  mutationLog.length = 0;
}
