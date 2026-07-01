import { GROWTH_EVENT_TO_STAGE, type GrowthFunnelEvent, type GrowthFunnelStage } from './funnelDefinition';
import { assignGrowthVariant, type GrowthExperimentKey, type GrowthExperimentAssignment } from './abTesting';

export type GrowthTrackingPayload = {
  event: GrowthFunnelEvent;
  stage: GrowthFunnelStage;
  source?: string;
  cta?: string;
  plan?: string;
  documentType?: 'invoice' | 'quote' | 'proposal';
  variant?: string;
  timestamp: string;
  metadata: Record<string, unknown>;
};

import { sendEvent } from '../analytics/eventRouter';

export function createGrowthEvent(
  event: GrowthFunnelEvent,
  metadata: Record<string, unknown> = {}
): GrowthTrackingPayload {
  const stage = GROWTH_EVENT_TO_STAGE[event] || 'visit';
  const source = typeof metadata.source === 'string' ? metadata.source : undefined;
  const cta = typeof metadata.cta === 'string' ? metadata.cta : undefined;
  const plan = typeof metadata.plan === 'string' ? metadata.plan : undefined;
  const variant = typeof metadata.variant === 'string' ? metadata.variant : undefined;
  const documentType =
    metadata.documentType === 'invoice' || metadata.documentType === 'quote' || metadata.documentType === 'proposal'
      ? metadata.documentType
      : undefined;

  return {
    event,
    stage,
    source,
    cta,
    plan,
    documentType,
    variant,
    timestamp: new Date().toISOString(),
    metadata,
  };
}

export function trackGrowthEvent(
  event: GrowthFunnelEvent,
  metadata: Record<string, unknown> = {}
): GrowthTrackingPayload {
  const payload = createGrowthEvent(event, metadata);
  sendEvent(event, metadata);
  return payload;
}

export function recordFunnelStep(stage: GrowthFunnelStage, metadata: Record<string, unknown> = {}) {
  // Map funnel stage to event name and send
  const stageToEventMap: Record<string, string> = {
    'landing_view': 'LANDING_VIEW',
    'pricing_view': 'PRICING_VIEW',
    'signup_start': 'SIGNUP_STARTED',
    'onboarding_start': 'DASHBOARD_ENTERED',
    'first_action': 'FIRST_ACTION_TAKEN',
    'conversion': 'SIGNUP_COMPLETED',
  };
  const eventName = stageToEventMap[stage] || 'CTA_CLICK';
  sendEvent(eventName, metadata);
}

export function recordRevenueSignal(signalType: string, metadata: Record<string, unknown> = {}) {
  sendEvent(signalType, metadata);
}

export function getOrAssignABVariant(experiment: GrowthExperimentKey): GrowthExperimentAssignment {
  if (typeof window === 'undefined') {
    return { experiment, variant: 'control', bucket: 0 };
  }
  try {
    let anonId = window.localStorage.getItem('corvioz_anon_id');
    if (!anonId) {
      anonId = 'anon_' + Math.random().toString(36).substring(2, 15);
      window.localStorage.setItem('corvioz_anon_id', anonId);
    }
    const userId = window.localStorage.getItem('corvioz_user_id') || window.localStorage.getItem('corvioz_identity') || anonId;
    
    const stored = window.localStorage.getItem('corvioz_ab_assignments');
    const assignments = stored ? JSON.parse(stored) : {};
    if (assignments[experiment]) {
      return assignments[experiment];
    }
    
    const assignment = assignGrowthVariant(userId, experiment);
    assignments[experiment] = assignment;
    window.localStorage.setItem('corvioz_ab_assignments', JSON.stringify(assignments));
    
    return assignment;
  } catch (e) {
    console.error('[AB_TEST_ERROR] Assignment failed:', e);
    return { experiment, variant: 'control', bucket: 0 };
  }
}

