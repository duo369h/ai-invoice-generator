export interface DataMapEntry {
  category: string;
  storedData: string[];
  storageLocation: string;
  purpose: string;
  access: string;
  retention: string;
}

export const dataHandlingMap: DataMapEntry[] = [
  {
    category: 'Account identity',
    storedData: ['email address', 'user id', 'session metadata', 'plan metadata'],
    storageLocation: 'Supabase authentication and application database where configured.',
    purpose: 'Authenticate users, restore sessions, attach records to the correct account, and manage entitlement state.',
    access: 'User, authenticated app routes, and authorized operational administrators.',
    retention: 'Retained while the account is active and as required for security, legal, or billing records.',
  },
  {
    category: 'Invoices and quotes',
    storedData: ['document number', 'client details', 'line items', 'rates', 'tax fields', 'notes', 'payment terms', 'PDF export status'],
    storageLocation: 'Supabase application database and browser local storage for drafts where applicable.',
    purpose: 'Create, edit, export, and share client-ready photographer documents.',
    access: 'Account owner, authorized portal recipients when links are shared, and limited support access if needed. The user owns these documents and exported files.',
    retention: 'Retained until deleted by the user or removed through a verified support request, subject to legal retention needs.',
  },
  {
    category: 'Client records',
    storedData: ['client name', 'client email', 'company name', 'portal token metadata', 'comments and status fields'],
    storageLocation: 'Supabase application database where configured.',
    purpose: 'Support client portals, relationship tracking, quote approvals, invoice delivery, and follow-up workflows.',
    access: 'Account owner, invited client portal recipients, and authorized support workflows. The user owns these client records.',
    retention: 'Retained while the account record remains active unless deletion is requested.',
  },
  {
    category: 'Usage analytics',
    storedData: ['landing view', 'pricing view', 'CTA click', 'signup start', 'first invoice or quote', 'export attempt', 'feature usage'],
    storageLocation: 'Product analytics database and configured analytics providers.',
    purpose: 'Measure activation, reliability, conversion, feature usage, and launch readiness.',
    access: 'Authorized product, analytics, and operations workflows.',
    retention: 'Retained as event records or aggregated analytics; non-essential tracking can be declined where available.',
  },
  {
    category: 'Payments and billing',
    storedData: ['checkout plan selection', 'billing event metadata', 'subscription status', 'payment provider identifiers'],
    storageLocation: 'Paddle where configured and application entitlement records.',
    purpose: 'Process checkout, maintain paid-plan access, and support billing questions.',
    access: 'Payment provider, account owner, authorized billing operations, and server-side entitlement checks.',
    retention: 'Retained according to payment, tax, accounting, fraud-prevention, and legal requirements.',
  },
];
