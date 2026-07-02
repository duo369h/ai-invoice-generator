export type ConversionPressureSignal = {
  label: string;
  detail: string;
};

export function getConversionPressureSignals(): ConversionPressureSignal[] {
  return [
    {
      label: 'Fast first output',
      detail: 'Start with a client-ready quote preview before setup work expands.',
    },
    {
      label: 'Sample activity',
      detail: 'A freelancer-style quote just moved from approved scope to invoice-ready in the preview flow.',
    },
    {
      label: 'Decision shortcut',
      detail: 'Use Free to preview. Choose Starter when the invoice needs to go to a real client.',
    },
  ];
}

export function getPlanPressureHint(planId: string): string {
  if (planId === 'free') return 'Best for seeing the workflow before signup.';
  if (planId === 'starter') return 'Default paid path for sending the first real invoice.';
  if (planId === 'pro') return 'Choose when repeat clients and follow-up become the job.';
  if (planId === 'studio') return 'Keep this for later, when operations need white-label scale.';
  return 'Choose the shortest path to the next client action.';
}

export function getOnboardingPressureCopy(identity: string | null): string {
  if (identity === 'starter') return 'Your first invoice workspace is one sign-in away.';
  if (identity === 'pro') return 'Keep the preview, client pipeline, and document follow-up together.';
  if (identity === 'studio') return 'Save the studio preview before you prepare operations.';
  return 'Preview the output first, then sign in to keep it.';
}
