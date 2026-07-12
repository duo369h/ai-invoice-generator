export type ThirdPartyProcessorKey = 'paddle' | 'supabase' | 'analytics';

export interface ThirdPartyProcessor {
  key: ThirdPartyProcessorKey;
  name: string;
  purpose: string;
  dataShared: string[];
  role: string;
  userControl: string;
}

export const thirdPartyDisclosures: ThirdPartyProcessor[] = [
  {
    key: 'paddle',
    name: 'Paddle',
    purpose: 'Payment checkout, subscription billing, receipts, tax handling, and payment-related customer support where paid checkout is enabled.',
    dataShared: ['email address', 'checkout plan selection', 'payment metadata', 'billing status'],
    role: 'Payment processor and merchant of record where configured.',
    userControl: 'Users can review payment, renewal, cancellation, and refund terms during checkout and contact support for billing questions.',
  },
  {
    key: 'supabase',
    name: 'Supabase',
    purpose: 'Authentication, database storage, session handling, portal access, and server-side product records.',
    dataShared: ['account identifiers', 'email address', 'invoices', 'quotes', 'client records', 'portal tokens', 'usage records'],
    role: 'Database, authentication, and backend infrastructure provider.',
    userControl: 'Users can manage account data in the product or request export/deletion through support.',
  },
  {
    key: 'analytics',
    name: 'Analytics providers',
    purpose: 'Product analytics, funnel diagnostics, conversion measurement, and reliability monitoring.',
    dataShared: ['page events', 'CTA events', 'pricing events', 'signup events', 'first value events', 'export attempts', 'device and browser metadata'],
    role: 'Analytics processor where configured, such as GA4, Plausible, or PostHog.',
    userControl: 'Users can decline non-essential tracking through the consent layer where available.',
  },
];
