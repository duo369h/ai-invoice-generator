export const complianceRights = {
  gdpr: {
    name: 'GDPR readiness',
    rights: [
      'Access personal data associated with the account.',
      'Correct inaccurate account, invoice, quote, or client data.',
      'Request deletion of account data where retention is not legally required.',
      'Object to or decline non-essential analytics tracking where available.',
      'Request a structured export of account and workspace data.',
    ],
  },
  ccpa: {
    name: 'CCPA readiness',
    rights: [
      'Know what categories of personal data are collected and why.',
      'Request access to personal data associated with the account.',
      'Request deletion of personal data subject to legal exceptions.',
      'Opt out of sale or sharing of personal data. Corvioz does not sell personal data.',
      'Use the service without discrimination for exercising privacy rights.',
    ],
  },
  requestWorkflow: [
    'User contacts support from the account email or authenticated dashboard.',
    'Corvioz verifies identity before exporting or deleting account data.',
    'Corvioz prepares account, invoice, quote, client, billing, and usage records where available.',
    'Deletion requests are completed unless records must be retained for security, fraud prevention, tax, billing, or legal reasons.',
  ],
} as const;
