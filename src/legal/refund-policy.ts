export const refundPolicy = {
  lastUpdated: 'July 1, 2026',
  supportEmail: 'support@corvioz.com',
  summary:
    'Corvioz paid subscriptions are processed through Paddle where checkout is enabled. Refunds are reviewed through a clear 14-day SaaS refund window.',
  sections: [
    {
      title: 'Refund eligibility',
      body:
        'You may request a refund within 14 days of the initial paid upgrade if Corvioz does not meet your photography business needs or if a billing error occurred.',
      items: [
        'The refund window starts on the date the Paddle checkout or paid subscription is completed.',
        'Duplicate payments, accidental upgrades, failed activation, or clear billing errors are eligible for review.',
        'Refunds apply to paid Corvioz subscriptions and do not change the ownership of documents created in the product.',
      ],
    },
    {
      title: 'Refund request process',
      body:
        'Email support with enough information for us to identify the Corvioz account and Paddle transaction.',
      items: [
        'Send requests to support@corvioz.com with the subject "Corvioz Refund Request".',
        'Include your Corvioz account email, Paddle receipt or transaction reference, payment date, and the reason for the request.',
        'We aim to respond within 2 business days and will coordinate the refund through Paddle when approved.',
      ],
    },
    {
      title: 'Exclusions',
      body:
        'Some payments may not be refundable after substantial use or where legal, tax, fraud-prevention, or payment-provider restrictions apply.',
      items: [
        'Requests outside the 14-day window may be declined unless required by law.',
        'Refunds may be declined for abusive usage, fraudulent activity, or chargeback misuse.',
        'Prior billing periods, taxes, or payment-provider fees may be handled according to Paddle and applicable law.',
      ],
    },
    {
      title: 'Cancellations',
      body:
        'You can cancel future subscription renewal without requesting a refund. Cancellation stops future billing but does not automatically refund prior paid periods.',
      items: [
        'Cancellation keeps your account data available according to the Privacy Policy and Terms.',
        'Paid access may remain available until the end of the current paid period unless otherwise required.',
      ],
    },
  ],
} as const;

export type RefundPolicy = typeof refundPolicy;
