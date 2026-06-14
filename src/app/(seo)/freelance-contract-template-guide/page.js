import React from 'react';
import SeoPageLayout from '../../components/SeoPageLayout';

export const metadata = {
  title: 'Freelance Contract Template Guide — Protect Your Payments',
  description: 'Understand the critical clauses every freelance contract template must contain. Protect intellectual property, establish payment terms, and prevent scope creep.',
  keywords: ['freelance contract template', 'freelancer service agreement', 'scope creep contract', 'payment security guide', 'legal contract freelancer'],
};

export default function ContractTemplateGuide() {
  const faqItems = [
    {
      question: 'Why do I need a contract if I already have an invoice?',
      answer: 'An invoice is a billing record, while a contract is a legally binding agreement that defines the scope, copyright transfers, milestones, and dispute resolution parameters.'
    },
    {
      question: 'How do I handle late payments in a contract?',
      answer: 'Include a "Late Payment Penalty" clause specifying a flat interest rate or fee (e.g. 1.5% per month) on balances outstanding past the payment terms.'
    },
    {
      question: 'What is scope creep and how do I prevent it?',
      answer: 'Scope creep is when a client requests extra work outside the initial agreement. Prevent this by outlining specific deliverables and stating that changes require a new quote.'
    }
  ];

  const contentHtml = (
    <div>
      <p style={{ marginBottom: '20px' }}>
        A solid legal contract is the ultimate armor for any freelance business. Before starting design or writing code, having both parties sign a freelance agreement safeguards your time, intellectual property, and payment guarantees.
      </p>

      <h3 style={{ fontSize: '1.4rem', fontWeight: 700, margin: '24px 0 12px 0', color: 'var(--text-main)' }}>1. Key Clauses to Include</h3>
      <p style={{ marginBottom: '16px' }}>
        Ensure your freelance contract templates cover these five legal cornerstones:
      </p>
      <ul style={{ paddingLeft: '20px', marginBottom: '24px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <li><strong>Statement of Work (SOW):</strong> The exact list of deliverables. If it is not listed, it requires an extra quote.</li>
        <li><strong>Pricing and Milestones:</strong> Specify payment schedules, upfront deposit percentages, and terms of installment payments.</li>
        <li><strong>IP & Copyright Transfer:</strong> Explicitly state that ownership of the work transfers to the client ONLY after the final invoice is paid in full.</li>
        <li><strong>Termination Clauses:</strong> What happens if the project is canceled mid-way? Outline &quot;kill fee&quot; conditions to compensate for your time.</li>
        <li><strong>Limitation of Liability:</strong> Protects your personal assets against massive corporate lawsuits.</li>
      </ul>

      <h3 style={{ fontSize: '1.4rem', fontWeight: 700, margin: '24px 0 12px 0', color: 'var(--text-main)' }}>2. Integrating Quotes, Contracts, and Invoices</h3>
      <p style={{ marginBottom: '20px' }}>
        In a professional commercial lifecycle, the flow is: {"Quote proposal → Signed Contract → Work Deliverables → Invoice billing"}. Using a platform that links your Quotes directly to Invoices keeps all references consistent and audit-ready.
      </p>
    </div>
  );

  return (
    <SeoPageLayout
      title="Freelance Contract Template Guide"
      subtitle="How to draft binding service contracts, outline deliverables, defend against scope creep, and enforce late payment clauses."
      ctaText="Generate Proposal Quote"
      contentHtml={contentHtml}
      faqItems={faqItems}
    />
  );
}
