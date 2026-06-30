export type GrowthFunnelStage =
  | 'visit'
  | 'landing_view'
  | 'pricing_view'
  | 'signup_start'
  | 'onboarding_start'
  | 'first_action'
  | 'activation'
  | 'conversion';

export type GrowthFunnelEvent =
  | 'cta_click'
  | 'pricing_selection'
  | 'onboarding_completion'
  | 'first_invoice_created'
  | 'first_quote_created'
  | 'export_triggered';

export type GrowthFunnelStep = {
  stage: GrowthFunnelStage;
  label: string;
  successSignal: string;
  nextStage?: GrowthFunnelStage;
};

export const GROWTH_FUNNEL_STEPS: GrowthFunnelStep[] = [
  {
    stage: 'visit',
    label: 'Acquisition visit',
    successSignal: 'User lands from SEO, direct, referral, or paid traffic.',
    nextStage: 'landing_view',
  },
  {
    stage: 'landing_view',
    label: 'Landing value understood',
    successSignal: 'User sees quote-to-invoice value proposition.',
    nextStage: 'pricing_view',
  },
  {
    stage: 'pricing_view',
    label: 'Plan intent evaluated',
    successSignal: 'User compares Free, Starter, Pro, or Studio messaging.',
    nextStage: 'signup_start',
  },
  {
    stage: 'signup_start',
    label: 'Signup intent started',
    successSignal: 'User starts magic link, Google auth, or preview-saving flow.',
    nextStage: 'onboarding_start',
  },
  {
    stage: 'onboarding_start',
    label: 'Workspace setup started',
    successSignal: 'User reaches dashboard or first action surface.',
    nextStage: 'first_action',
  },
  {
    stage: 'first_action',
    label: 'First invoice or quote created',
    successSignal: 'User creates a revenue-facing document.',
    nextStage: 'activation',
  },
  {
    stage: 'activation',
    label: 'First value achieved',
    successSignal: 'User previews, sends, exports, or shares the first document.',
    nextStage: 'conversion',
  },
  {
    stage: 'conversion',
    label: 'Paid conversion signal',
    successSignal: 'User selects a paid plan, checkout, or clean export path.',
  },
];

export const GROWTH_EVENT_TO_STAGE: Record<GrowthFunnelEvent, GrowthFunnelStage> = {
  cta_click: 'landing_view',
  pricing_selection: 'pricing_view',
  onboarding_completion: 'onboarding_start',
  first_invoice_created: 'first_action',
  first_quote_created: 'first_action',
  export_triggered: 'activation',
};

export function getNextFunnelStage(stage: GrowthFunnelStage): GrowthFunnelStage | null {
  return GROWTH_FUNNEL_STEPS.find((step) => step.stage === stage)?.nextStage ?? null;
}

export interface FunnelTransition {
  from: GrowthFunnelStage;
  to: GrowthFunnelStage;
  durationSeconds: number;
  hesitation: boolean;
  timestamp: string;
}

export function detectDropoff(timestamps: Record<string, number>): GrowthFunnelStage[] {
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
  
  const dropoffs: GrowthFunnelStage[] = [];
  for (let i = 0; i < stagesOrder.length; i++) {
    const stage = stagesOrder[i];
    if (!timestamps[stage]) {
      dropoffs.push(stage);
    }
  }
  return dropoffs;
}

export function getStepTransitionTiming(
  from: GrowthFunnelStage,
  to: GrowthFunnelStage,
  timestamps: Record<string, number>
): number | null {
  const fromTime = timestamps[from];
  const toTime = timestamps[to];
  if (!fromTime || !toTime) return null;
  return Math.round((toTime - fromTime) / 1000);
}

export function isHesitationPoint(durationSeconds: number): boolean {
  return durationSeconds > 45; // User takes more than 45 seconds to transition
}
