export type ConversionEventName =
  | 'VIEW_INVOICE_TEMPLATE'
  | 'VIEW_QUOTE_TEMPLATE'
  | 'VIEW_PROPOSAL_TEMPLATE'
  | 'CLICK_CREATE_QUOTE'
  | 'CLICK_CREATE_INVOICE'
  | 'CLICK_SIGNUP'
  | 'START_ONBOARDING'
  | 'COMPLETE_ONBOARDING'
  | 'VIEW_PRICING'
  | 'SELECT_PLAN'
  | 'START_CHECKOUT';

export type ConversionFunnelStage =
  | 'landing'
  | 'template_view'
  | 'cta_click'
  | 'signup'
  | 'onboarding'
  | 'plan_selection'
  | 'checkout';

export type IndustryIntentLevel = 'high_intent' | 'medium_intent' | 'exploration_intent';

export type ConversionIndustryTag = {
  industry_id: string;
  industry_category: string;
  intent_level: IndustryIntentLevel;
};

export type ConversionEventDefinition = {
  name: ConversionEventName;
  stage: ConversionFunnelStage;
  description: string;
  requiredProperties: readonly string[];
  revenueSignalWeight: number;
};

export type ConversionEventPayload = {
  event: ConversionEventName;
  stage: ConversionFunnelStage;
  industry?: ConversionIndustryTag;
  page_path?: string;
  template_type?: 'invoice' | 'quote' | 'proposal';
  cta_label?: string;
  plan_id?: string;
  session_id?: string;
  user_id?: string;
  occurred_at?: string;
};

export const CONVERSION_EVENT_DEFINITIONS: Record<ConversionEventName, ConversionEventDefinition> = {
  VIEW_INVOICE_TEMPLATE: {
    name: 'VIEW_INVOICE_TEMPLATE',
    stage: 'template_view',
    description: 'Visitor viewed an industry invoice template page.',
    requiredProperties: ['industry_id', 'industry_category', 'intent_level', 'page_path'],
    revenueSignalWeight: 12,
  },
  VIEW_QUOTE_TEMPLATE: {
    name: 'VIEW_QUOTE_TEMPLATE',
    stage: 'template_view',
    description: 'Visitor viewed an industry quote template page.',
    requiredProperties: ['industry_id', 'industry_category', 'intent_level', 'page_path'],
    revenueSignalWeight: 16,
  },
  VIEW_PROPOSAL_TEMPLATE: {
    name: 'VIEW_PROPOSAL_TEMPLATE',
    stage: 'template_view',
    description: 'Visitor viewed an industry proposal template page.',
    requiredProperties: ['industry_id', 'industry_category', 'intent_level', 'page_path'],
    revenueSignalWeight: 18,
  },
  CLICK_CREATE_QUOTE: {
    name: 'CLICK_CREATE_QUOTE',
    stage: 'cta_click',
    description: 'Visitor clicked a quote creation CTA.',
    requiredProperties: ['industry_id', 'cta_label', 'page_path'],
    revenueSignalWeight: 26,
  },
  CLICK_CREATE_INVOICE: {
    name: 'CLICK_CREATE_INVOICE',
    stage: 'cta_click',
    description: 'Visitor clicked an invoice creation CTA.',
    requiredProperties: ['industry_id', 'cta_label', 'page_path'],
    revenueSignalWeight: 24,
  },
  CLICK_SIGNUP: {
    name: 'CLICK_SIGNUP',
    stage: 'signup',
    description: 'Visitor clicked a sign-up CTA from a growth or template surface.',
    requiredProperties: ['page_path', 'cta_label'],
    revenueSignalWeight: 30,
  },
  START_ONBOARDING: {
    name: 'START_ONBOARDING',
    stage: 'onboarding',
    description: 'User started onboarding after a growth entry point.',
    requiredProperties: ['session_id'],
    revenueSignalWeight: 38,
  },
  COMPLETE_ONBOARDING: {
    name: 'COMPLETE_ONBOARDING',
    stage: 'onboarding',
    description: 'User completed onboarding and reached first-use readiness.',
    requiredProperties: ['session_id'],
    revenueSignalWeight: 52,
  },
  VIEW_PRICING: {
    name: 'VIEW_PRICING',
    stage: 'plan_selection',
    description: 'Visitor or user viewed pricing after a growth entry point.',
    requiredProperties: ['page_path'],
    revenueSignalWeight: 42,
  },
  SELECT_PLAN: {
    name: 'SELECT_PLAN',
    stage: 'plan_selection',
    description: 'User selected a pricing plan.',
    requiredProperties: ['plan_id'],
    revenueSignalWeight: 64,
  },
  START_CHECKOUT: {
    name: 'START_CHECKOUT',
    stage: 'checkout',
    description: 'User started checkout after selecting a plan.',
    requiredProperties: ['plan_id'],
    revenueSignalWeight: 80,
  },
};

export const CONVERSION_FUNNEL_STAGES: Array<{
  stage: ConversionFunnelStage;
  label: string;
  dropOffMeaning: string;
}> = [
  {
    stage: 'landing',
    label: 'Landing',
    dropOffMeaning: 'The page did not create enough relevance or trust to continue.',
  },
  {
    stage: 'template_view',
    label: 'Template View',
    dropOffMeaning: 'The visitor saw intent-matched content but did not inspect a revenue artifact deeply enough.',
  },
  {
    stage: 'cta_click',
    label: 'CTA Click',
    dropOffMeaning: 'The page created interest but the next action may not match readiness.',
  },
  {
    stage: 'signup',
    label: 'Signup',
    dropOffMeaning: 'Account creation created friction before the visitor reached enough value.',
  },
  {
    stage: 'onboarding',
    label: 'Onboarding',
    dropOffMeaning: 'The first-use path did not get the user to an invoice or quote fast enough.',
  },
  {
    stage: 'plan_selection',
    label: 'Plan Selection',
    dropOffMeaning: 'Pricing did not map clearly to the user outcome or usage level.',
  },
  {
    stage: 'checkout',
    label: 'Checkout',
    dropOffMeaning: 'Payment trust, timing, or value perception blocked revenue capture.',
  },
];

export function getConversionEventDefinition(event: ConversionEventName): ConversionEventDefinition {
  return CONVERSION_EVENT_DEFINITIONS[event];
}

export function buildConversionEventPayload(
  event: ConversionEventName,
  payload: Omit<ConversionEventPayload, 'event' | 'stage'> = {},
): ConversionEventPayload {
  const definition = getConversionEventDefinition(event);

  return {
    ...payload,
    event,
    stage: definition.stage,
    occurred_at: payload.occurred_at ?? new Date().toISOString(),
  };
}

export function getIntentLevel(score: number): IndustryIntentLevel {
  if (score >= 75) return 'high_intent';
  if (score >= 45) return 'medium_intent';
  return 'exploration_intent';
}
