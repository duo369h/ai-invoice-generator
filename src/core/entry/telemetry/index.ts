/**
 * READ ONLY SYSTEM
 * MUST NOT affect routing, activation, or RDCL
 */

/**
 * Corvioz v1.2 — Entry Telemetry System
 *
 * Public API for the Entry Behavior Intelligence System (non-invasive observability).
 */

export { trackEntryEvent } from './entry-event-tracker';
export type { EntryEvent } from './entry-event-tracker';

export { computeEntryCorrelation } from './entry-activation-correlation';
export type { EntryCorrelationInput, EntryCorrelationOutput } from './entry-activation-correlation';

export { detectEntryFriction } from './entry-friction-detector';
export type { EntryFrictionResult } from './entry-friction-detector';

export { generateFlowMap } from './entry-flow-map';
export type { FlowNodeTransition } from './entry-flow-map';

export { computeEntryPerformance } from './entry-performance';
export type { EntryPerformance } from './entry-performance';

export { detectEntryDrift } from './entry-drift-monitor';
export type { DriftDetectionResult } from './entry-drift-monitor';

export { aggregateEntryAnalytics } from './entry-analytics';
export type { EntryAnalyticsIndicators, EntryAnalytics } from './entry-analytics';
