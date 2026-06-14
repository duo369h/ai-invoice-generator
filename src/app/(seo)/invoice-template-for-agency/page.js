import React from 'react';
import SeoPageLayout from '../../components/SeoPageLayout';

export const metadata = {
  title: 'Agency Invoice Template & Client Milestone Billing Guide',
  description: 'Download agency invoice templates. Learn how to structures billing cycles for marketing agencies, design studios, and software boutiques.',
  keywords: ['agency invoice template', 'marketing agency billing', 'creative studio retainer invoice', 'agency contract payments', 'agency invoicing system'],
};

export default function AgencyInvoicePage() {
  const faqItems = [
    {
      question: 'How do agencies structures sprint and milestone billing?',
      answer: 'Agencies utilize milestone billing based on project phases (e.g. Phase 1 Discovery: 25%, Phase 2 MVP Launch: 50%, Phase 3 Handoff: 25%). Secure approvals in writing at each phase before issuing the corresponding milestone invoice.'
    },
    {
      question: 'What is the best way to handle agency subcontractor fees on invoices?',
      answer: 'Subcontractor fees should be bundled into your general agency service deliverables or flat rates. Do not list subcontractor rates on client-facing invoices unless you are working on an open-book time and materials model.'
    },
    {
      question: 'How do creative agencies manage retainer invoice cycles?',
      answer: 'Set up recurring invoicing cycles by adding your payment link. Invoices can be generated and sent automatically on the 1st of every month. Clear guidelines should restrict operations if a retainer charge fails.'
    }
  ];

  const contentHtml = (
    <div>
      <p style={{ marginBottom: '20px' }}>
        For marketing, design, and technical engineering agencies, billing is the core pipeline of business scale. Unified invoices representing multi-resource deliverables protect profit margins and clarify resource assignments.
      </p>

      <h3 style={{ fontSize: '1.4rem', fontWeight: 700, margin: '24px 0 12px 0', color: 'var(--text-main)' }}>1. Agency Milestone Billing Standards</h3>
      <p style={{ marginBottom: '16px' }}>
        Managing larger accounts requires structured project billing frameworks. Ensure your invoices cleanly separate labor, assets, subscriptions, and subsequent maintenance retainer fees.
      </p>
      <ul style={{ paddingLeft: '20px', marginBottom: '24px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <li><strong>Itemized Phase Deliverables:</strong> Break down agency billing by specific team sprints, design cycles, or deployment milestones.</li>
        <li><strong>Milestone Payment Handoffs:</strong> Bind payment links directly to verified milestone approvals to keep cash flow active.</li>
      </ul>

      <h3 style={{ fontSize: '1.4rem', fontWeight: 700, margin: '24px 0 12px 0', color: 'var(--text-main)' }}>2. Managing Overdue Corporate Accounts</h3>
      <p style={{ marginBottom: '16px' }}>
        Corporate finance departments often delay agency payouts due to complex review channels. Use professional billing loops that trigger automated reminder notices to avoid project blocks.
      </p>
      <ul style={{ paddingLeft: '20px', marginBottom: '24px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <li><strong>Automatic Reminders:</strong> Program invoices to alert corporate contacts 7 days and 14 days past due dates.</li>
        <li><strong>Late Payment Penalties:</strong> Maintain strict legal terms governing project pause thresholds if billing balances are outstanding.</li>
      </ul>
    </div>
  );

  return (
    <SeoPageLayout
      title="Agency Invoice Template"
      subtitle="Structured agency billing layouts, sprint payment frameworks, and automated client retainer collections systems."
      ctaText="Create Agency Card"
      contentHtml={contentHtml}
      faqItems={faqItems}
    />
  );
}
