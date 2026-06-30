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

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('corvioz:growth-event', { detail: payload }));
    
    // Wire live collector step timestamps
    recordFunnelStep(payload.stage, metadata);

    // Save revenue signals for tracking conversions
    if (event === 'pricing_selection' || event === 'export_triggered') {
      recordRevenueSignal(event, metadata);
    }
  }

  return payload;
}

export function recordFunnelStep(stage: GrowthFunnelStage, metadata: Record<string, unknown> = {}) {
  if (typeof window === 'undefined') return;
  try {
    const stored = window.localStorage.getItem('corvioz_funnel_timestamps');
    const timestamps = stored ? JSON.parse(stored) : {};
    
    if (!timestamps.visit) {
      timestamps.visit = Date.now();
    }
    
    const now = Date.now();
    if (!timestamps[stage]) {
      timestamps[stage] = now;
      
      const stagesOrder: GrowthFunnelStage[] = [
        'visit',
        'landing_view',
        'pricing_view',
        'signup_start',
        'onboarding_start',
        'first_action',
        'activation',
        'conversion'
      ];
      
      const currentIdx = stagesOrder.indexOf(stage);
      if (currentIdx > 0) {
        const prevStage = stagesOrder[currentIdx - 1];
        const prevTime = timestamps[prevStage];
        if (prevTime) {
          const deltaMs = now - prevTime;
          const deltaSec = Math.round(deltaMs / 1000);
          const isHesitated = deltaSec > 45;

          const transitions = JSON.parse(window.localStorage.getItem('corvioz_funnel_transitions') || '[]');
          transitions.push({
            from: prevStage,
            to: stage,
            durationSeconds: deltaSec,
            hesitation: isHesitated,
            timestamp: new Date().toISOString()
          });
          window.localStorage.setItem('corvioz_funnel_transitions', JSON.stringify(transitions));
        }
      }
    }

    window.localStorage.setItem('corvioz_funnel_timestamps', JSON.stringify(timestamps));
    updateActivationMetrics(stage, timestamps);
  } catch (e) {
    console.error('[FUNNEL_COLLECTOR_ERROR]', e);
  }
}

function updateActivationMetrics(stage: GrowthFunnelStage, timestamps: Record<string, number>) {
  try {
    const metrics = JSON.parse(window.localStorage.getItem('corvioz_activation_metrics') || '{}');
    
    if (stage === 'first_action' && timestamps.first_action && timestamps.visit) {
      metrics.timeToFirstActionSeconds = Math.round((timestamps.first_action - timestamps.visit) / 1000);
    }
    
    let completedSteps = 0;
    if (window.localStorage.getItem('corvioz_pending_invoice')) completedSteps++;
    if (window.localStorage.getItem('corvioz_usage_stats')) completedSteps++;
    if (window.localStorage.getItem('corvioz_identity')) completedSteps++;
    
    metrics.onboardingStepsCompleted = completedSteps;
    metrics.onboardingCompletionRate = Math.round((completedSteps / 3) * 100);
    metrics.firstActionSuccess = !!timestamps.first_action;

    window.localStorage.setItem('corvioz_activation_metrics', JSON.stringify(metrics));
  } catch (e) {}
}

export function recordRevenueSignal(signalType: string, metadata: Record<string, unknown> = {}) {
  if (typeof window === 'undefined') return;
  try {
    const signals = JSON.parse(window.localStorage.getItem('corvioz_revenue_signals') || '[]');
    signals.push({
      type: signalType,
      timestamp: new Date().toISOString(),
      metadata
    });
    window.localStorage.setItem('corvioz_revenue_signals', JSON.stringify(signals));
  } catch (e) {}
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

