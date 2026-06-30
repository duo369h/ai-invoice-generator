export type GrowthLandingPageKey =
  | 'freelance-invoice'
  | 'client-quote'
  | 'client-management'
  | 'quote-generator';

export type GrowthLandingPageSpec = {
  key: GrowthLandingPageKey;
  path: string;
  headline: string;
  subheadline: string;
  primaryCta: string;
  secondaryCta: string;
  intent: 'invoice' | 'quote' | 'client';
};

export const GROWTH_LANDING_PAGES: GrowthLandingPageSpec[] = [
  {
    key: 'freelance-invoice',
    path: '/invoice-for-freelancers',
    headline: 'Create a client-ready invoice without rebuilding the workflow.',
    subheadline: 'Turn approved work into a clean invoice, then track what still needs payment.',
    primaryCta: 'Create my first invoice',
    secondaryCta: 'Preview invoice output',
    intent: 'invoice',
  },
  {
    key: 'client-quote',
    path: '/landing/client-quote',
    headline: 'Send the quote before the client momentum fades.',
    subheadline: 'Create a polished quote, confirm scope, and move approval into invoice follow-up.',
    primaryCta: 'Create my first quote',
    secondaryCta: 'See quote preview',
    intent: 'quote',
  },
  {
    key: 'client-management',
    path: '/client-management',
    headline: 'Keep clients, quotes, invoices, and follow-up in one revenue workspace.',
    subheadline: 'Use Corvioz to see the next client action instead of searching through scattered documents.',
    primaryCta: 'Organize my client workflow',
    secondaryCta: 'Preview client record',
    intent: 'client',
  },
  {
    key: 'quote-generator',
    path: '/quote-generator',
    headline: 'Generate a quote that can become an invoice.',
    subheadline: 'Start with a quote preview, then keep the workflow moving when the client approves.',
    primaryCta: 'Open quote generator',
    secondaryCta: 'See workflow',
    intent: 'quote',
  },
];

export function getGrowthLandingPage(key: string): GrowthLandingPageSpec {
  return GROWTH_LANDING_PAGES.find((page) => page.key === key) ?? GROWTH_LANDING_PAGES[1];
}
