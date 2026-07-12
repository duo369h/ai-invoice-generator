export const privacyPolicy = {
  lastUpdated: 'June 30, 2026',
  summary:
    'Corvioz collects the information needed to run photographer quote, invoice, client, Public Profile, payment, and product analytics services. You own your invoices, quotes, client records, and exported documents. We do not sell personal data.',
  sections: [
    {
      title: 'Information we collect',
      body:
        'We collect account, document, client, and usage information that users provide or generate while using Corvioz.',
      items: [
        'Email address and authentication metadata.',
        'Invoices, quotes, line items, payment terms, notes, totals, and export activity.',
        'Client names, emails, company names, portal links, and related client records.',
        'Public profile details, portfolio content, service descriptions, and contact preferences.',
        'Usage analytics such as landing views, pricing views, signup events, first invoice or quote creation, export attempts, and feature usage.',
      ],
    },
    {
      title: 'How we use data',
      body:
        'We use data to provide the product, keep accounts secure, generate documents, support client workflows, improve activation and conversion flows, and understand whether the service is working reliably.',
      items: [
        'Create, store, render, export, and share invoices, quotes, and client records.',
        'Respect user ownership of invoices, quotes, client records, and exported documents.',
        'Authenticate users and protect dashboards, portals, and account sessions.',
        'Measure product usage, diagnose funnel drop-off, and improve Corvioz without selling personal data.',
        'Process paid-plan checkout and entitlement status through payment providers where enabled.',
      ],
    },
    {
      title: 'Data ownership',
      body:
        'Users own the business records they create in Corvioz, including invoices, quotes, client records, and exported documents. Corvioz provides the account and storage layer; it does not claim ownership over user-created client work.',
      items: [
        'Invoices, quotes, client records, line items, notes, and exported PDFs remain user-owned business records.',
        'Shared client portal links expose only the records the user chooses to share.',
        'Corvioz never sells personal data or user-created business records.',
      ],
    },
    {
      title: 'Retention',
      body:
        'We retain account data while an account is active or as needed to provide the service, meet legal obligations, resolve disputes, prevent abuse, and maintain audit records.',
      items: [
        'User-created documents and client records remain available until deleted by the user or removed through a support request.',
        'Security, billing, and audit records may be retained longer where required for fraud prevention, accounting, or legal compliance.',
        'Aggregated analytics may be retained without directly identifying a user.',
      ],
    },
    {
      title: 'Security handling',
      body:
        'Corvioz uses HTTPS, authenticated access controls, provider-level database security, and limited operational access. No web service offers absolute security, so users should avoid storing unnecessary sensitive data in invoice or quote notes.',
      items: [
        'Authentication and database infrastructure are handled through Supabase where configured.',
        'Payment checkout is handled by payment providers such as Paddle where configured.',
        'Operational access should be limited to authorized administrators and support workflows.',
      ],
    },
    {
      title: 'User rights',
      body:
        'Users can request access, correction, export, or deletion of their personal data, subject to identity verification and legal retention requirements.',
      items: [
        'Request a copy of account, invoice, quote, client, and usage data associated with the account.',
        'Request correction of inaccurate account data.',
        'Request deletion of account data where retention is not legally required.',
        'Decline non-essential tracking through the consent layer where available.',
      ],
    },
  ],
} as const;

export type PrivacyPolicy = typeof privacyPolicy;
