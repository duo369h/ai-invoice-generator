export type ExperimentType = 'cta' | 'pricing' | 'paywall_timing' | 'onboarding_flow';

export type RevenueExperiment = {
  experiment_id: string;
  variant_a: string;
  variant_b: string;
  success_metric: string;
};

export type ExperimentGeneratorInput = {
  opportunity?: string;
  type?: ExperimentType;
  seed?: number;
};

const VARIANTS: Record<ExperimentType, { a: string; b: string; metric: string }[]> = {
  cta: [
    { a: 'Start Free', b: 'Create Your First Invoice', metric: 'signup_complete_rate' },
    { a: 'Upgrade to Pro', b: 'Remove Watermark with Pro', metric: 'pricing_select_plan_rate' },
  ],
  pricing: [
    { a: '$9 Pro monthly', b: '$19 Pro monthly with annual anchor', metric: 'checkout_started_rate' },
    { a: '$19 standard tier', b: '$29 premium tier with Pro-first ordering', metric: 'payment_completed_rate' },
  ],
  paywall_timing: [
    { a: 'Paywall after first export', b: 'Paywall at second invoice attempt', metric: 'upgrade_click_rate' },
    { a: 'Soft upsell on first value', b: 'Hard paywall on high-intent export', metric: 'revenue_per_user' },
  ],
  onboarding_flow: [
    { a: 'Dashboard checklist first', b: 'Direct invoice builder first', metric: 'first_value_created_rate' },
    { a: 'Quote-first onboarding', b: 'Invoice-first onboarding', metric: 'activation_rate' },
  ],
};

function hashString(value: string) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return Math.abs(hash >>> 0);
}

function inferType(opportunity = ''): ExperimentType {
  const lower = opportunity.toLowerCase();
  if (lower.includes('price') || lower.includes('$') || lower.includes('tier')) return 'pricing';
  if (lower.includes('paywall') || lower.includes('export') || lower.includes('upgrade')) return 'paywall_timing';
  if (lower.includes('onboarding') || lower.includes('signup') || lower.includes('first value')) return 'onboarding_flow';
  return 'cta';
}

export function generateRevenueExperiment(input: ExperimentGeneratorInput = {}): RevenueExperiment {
  const type = input.type || inferType(input.opportunity);
  const options = VARIANTS[type];
  const seed = Number.isFinite(Number(input.seed)) ? Number(input.seed) : hashString(`${type}:${input.opportunity || 'default'}`);
  const selected = options[Math.abs(Math.floor(seed)) % options.length];
  const suffix = hashString(`${type}:${selected.a}:${selected.b}:${seed}`).toString(36).slice(0, 8);

  return {
    experiment_id: `corvioz_${type}_${suffix}`,
    variant_a: selected.a,
    variant_b: selected.b,
    success_metric: selected.metric,
  };
}

export function generateExperimentSet(opportunities: string[] = [], seed = 7319): RevenueExperiment[] {
  const source = opportunities.length > 0 ? opportunities : ['cta baseline', 'pricing tier test', 'paywall timing', 'onboarding flow'];
  return source.map((opportunity, index) => generateRevenueExperiment({ opportunity, seed: seed + index }));
}
