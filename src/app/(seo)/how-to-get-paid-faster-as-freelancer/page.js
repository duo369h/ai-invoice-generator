import React from 'react';
import SeoPageLayout from '../../components/SeoPageLayout';

export const metadata = {
  title: 'How to Get Paid Faster as a Freelancer — Accelerated Cash Flow Tips',
  description: 'Boost your freelance cash flow. Discover how payment link integration, automatic deposits, and structured reminders help freelancers clear balances faster.',
  keywords: ['get paid faster freelancer', 'freelancer cash flow', 'payment reminder email', 'online invoice payment', 'freelance billing tips'],
};

export default function GetPaidFasterGuide() {
  const faqItems = [
    {
      question: 'Should I charge an upfront deposit?',
      answer: 'Yes. Charging a 25% to 50% upfront deposit before starting work is standard practice. It validates the client’s budget and secures cash flow to cover your initial timeline.'
    },
    {
      question: 'What do I do if a client ignores my payment reminder?',
      answer: 'Follow up systematically at 7 days, 14 days, and 30 days overdue. If they remain unresponsive, pause all active work and reach out directly by phone before initiating legal action.'
    },
    {
      question: 'Does offering online checkouts speed up payments?',
      answer: 'Absolutely. Statistics show that invoices featuring online checkouts (such as Stripe or credit card processing links) are settled up to 3 times faster than traditional bank wires.'
    }
  ];

  const contentHtml = (
    <div>
      <p style={{ marginBottom: '20px' }}>
        Waiting on client payments is one of the most stressful parts of running a freelance business. However, by establishing systematic billing habits and reducing transaction friction, you can dramatically accelerate your incoming cash flow.
      </p>

      <h3 style={{ fontSize: '1.4rem', fontWeight: 700, margin: '24px 0 12px 0', color: 'var(--text-main)' }}>1. Secure an Upfront Project Deposit</h3>
      <p style={{ marginBottom: '16px' }}>
        Never start development, design, or writing without a signed agreement and a cleared deposit. For new clients, require a 50% upfront payment. This reduces outstanding balances and ensures client skin in the game.
      </p>

      <h3 style={{ fontSize: '1.4rem', fontWeight: 700, margin: '24px 0 12px 0', color: 'var(--text-main)' }}>2. Embed Direct Payment Links</h3>
      <p style={{ marginBottom: '16px' }}>
        Make it dummy-proof for clients to pay you. Traditional ACH or cross-border wire transfers require logging into portals and manual input, causing delays. An invoice that lets clients click and pay via Stripe Apple Pay or LemonSqueezy is cleared almost instantly.
      </p>

      <h3 style={{ fontSize: '1.4rem', fontWeight: 700, margin: '24px 0 12px 0', color: 'var(--text-main)' }}>3. Set Up a Automated Follow-Up Schedule</h3>
      <p style={{ marginBottom: '20px' }}>
        Write clear, polite reminder templates beforehand. When an invoice goes past its Net 30 or Net 15 limits:
      </p>
      <ul style={{ paddingLeft: '20px', marginBottom: '24px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <li><strong>7 Days Overdue:</strong> A friendly email checking in to confirm receipt of the invoice.</li>
        <li><strong>14 Days Overdue:</strong> A more formal notice requesting payment status details.</li>
        <li><strong>30 Days Overdue:</strong> Final notification highlighting that services or site access will be paused.</li>
      </ul>
    </div>
  );

  return (
    <SeoPageLayout
      title="How to Get Paid Faster as a Freelancer"
      subtitle="Reduce outstanding balances, integrate credit card checkouts, and master the follow-up cadence."
      ctaText="Upgrade Invoicing"
      contentHtml={contentHtml}
      faqItems={faqItems}
    />
  );
}
