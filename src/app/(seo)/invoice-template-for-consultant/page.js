import React from 'react';
import SeoPageLayout from '../../components/SeoPageLayout';

export const metadata = {
  title: 'Consultant Invoice Template & Monthly Retainer Billing Guide',
  description: 'Download professional consultant invoice templates. Learn how to invoice consulting retainers, advisory hours, and value-based milestones.',
  keywords: ['consultant invoice template', 'consulting billing system', 'advisory retainer invoice', 'value based consulting rates', 'consulting payment terms'],
};

export default function ConsultantInvoicePage() {
  const faqItems = [
    {
      question: 'How do consulting retainers work and how are they invoiced?',
      answer: 'Consulting retainers are billed upfront on a recurring monthly cycle (e.g. charging $3,000 on the 1st of every month for 10 hours of advisory availability). Invoice for retainers at the start of the billing period rather than at the end.'
    },
    {
      question: 'Should consultants bill travel and project expenses on the main invoice?',
      answer: 'Yes. It is best to include project expenses (flights, hotel lodging, software licenses purchased for the client) as separate line items on the main monthly invoice, attaching receipt scans as appendix files.'
    },
    {
      question: 'How do you structure value-based pricing for consultants?',
      answer: 'Value-based pricing estimates the business outcome of the consultation. For example, if your advice saves a company $100,000 in operational costs, you invoice a flat $15,000 strategy fee rather than billing hourly rates.'
    }
  ];

  const contentHtml = (
    <div>
      <p style={{ marginBottom: '20px' }}>
        For professional consultants, advisors, and corporate strategists, invoices are the final milestone of high-value advisory operations. Clear structures and terms reflect professional prestige and protect retainer agreements.
      </p>

      <h3 style={{ fontSize: '1.4rem', fontWeight: 700, margin: '24px 0 12px 0', color: 'var(--text-main)' }}>1. Structuring Consulting Retainers</h3>
      <p style={{ marginBottom: '16px' }}>
        Invoicing for retainers requires clear statements of advisor availability. Ensure you outline what is included (e.g. strategy audits, weekly sync calls) and the parameters of rollover hours.
      </p>
      <ul style={{ paddingLeft: '20px', marginBottom: '24px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <li><strong>Advisory Hours Outlines:</strong> Clearly write how many hours are allocated and define standard turnaround expectations.</li>
        <li><strong>Upfront Retainer Billing:</strong> Always require retainer fees to settle before reserving calendars or issuing initial roadmaps.</li>
      </ul>

      <h3 style={{ fontSize: '1.4rem', fontWeight: 700, margin: '24px 0 12px 0', color: 'var(--text-main)' }}>2. Best Billing Practices for Consultants</h3>
      <p style={{ marginBottom: '16px' }}>
        Corporate clients process digital cards and ACH transactions differently. Make sure your payment instructions support both online payment links and automated direct wires.
      </p>
      <ul style={{ paddingLeft: '20px', marginBottom: '24px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <li><strong>Milestone Signoffs:</strong> Establish mutual approval gates so billing claims are not disputed during accounting reviews.</li>
        <li><strong>Hourly Rollover Cap:</strong> Mute disputes by capping how many unused advisor hours can transfer to next month’s sprint.</li>
      </ul>
    </div>
  );

  return (
    <SeoPageLayout
      title="Consultant Invoice Template"
      subtitle="Corporate consultant billing systems, value-based retainer quote setups, and strategic client payment structures."
      ctaText="Create Consultant Card"
      contentHtml={contentHtml}
      faqItems={faqItems}
    />
  );
}
