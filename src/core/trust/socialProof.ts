export type SocialProofSignal = {
  label: string;
  detail: string;
};

export function getSocialProofSignals(): SocialProofSignal[] {
  return [
    {
      label: 'Freelance designer pattern',
      detail: 'Starts with a scoped quote, converts approval into an invoice, then tracks the unpaid milestone.',
    },
    {
      label: 'Developer consultant pattern',
      detail: 'Uses client records to keep proposal, invoice, and follow-up status in one place.',
    },
    {
      label: 'Recent activity signal',
      detail: 'A sample quote moved from approved to invoice-ready in the preview workflow.',
    },
  ];
}
