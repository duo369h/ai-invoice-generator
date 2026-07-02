export type GrowthExperimentKey = 'hero_message' | 'primary_cta' | 'pricing_copy';
export type GrowthVariant = 'control' | 'preview_first' | 'invoice_first';

export type GrowthExperimentAssignment = {
  experiment: GrowthExperimentKey;
  variant: GrowthVariant;
  bucket: number;
};

const EXPERIMENT_VARIANTS: Record<GrowthExperimentKey, GrowthVariant[]> = {
  hero_message: ['control', 'preview_first', 'invoice_first'],
  primary_cta: ['control', 'preview_first', 'invoice_first'],
  pricing_copy: ['control', 'preview_first', 'invoice_first'],
};

function hashString(input: string): number {
  let hash = 0;
  for (let index = 0; index < input.length; index += 1) {
    hash = (hash * 31 + input.charCodeAt(index)) >>> 0;
  }
  return hash;
}

export function assignGrowthVariant(
  userKey: string,
  experiment: GrowthExperimentKey
): GrowthExperimentAssignment {
  const variants = EXPERIMENT_VARIANTS[experiment];
  const bucket = hashString(`${experiment}:${userKey || 'anonymous'}`) % 100;
  const variant = variants[bucket % variants.length];

  return {
    experiment,
    variant,
    bucket,
  };
}

export function getVariantCopy(experiment: GrowthExperimentKey, variant: GrowthVariant): string {
  if (experiment === 'hero_message') {
    if (variant === 'preview_first') return 'Preview the quote before signup.';
    if (variant === 'invoice_first') return 'Create the first invoice path now.';
    return 'Quote clients. Invoice work. Track payment.';
  }
  if (experiment === 'primary_cta') {
    if (variant === 'preview_first') return 'Preview my first quote';
    if (variant === 'invoice_first') return 'Create my first invoice';
    return 'Create your first client quote';
  }
  if (variant === 'preview_first') return 'Preview first, upgrade when delivery matters.';
  if (variant === 'invoice_first') return 'Starter is the shortest path to a structured client document.';
  return 'Choose based on how you organize client work.';
}
