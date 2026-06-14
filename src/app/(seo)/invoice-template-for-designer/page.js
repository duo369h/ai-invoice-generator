import React from 'react';
import SeoPageLayout from '../../components/SeoPageLayout';

export const metadata = {
  title: 'Designer Invoice Template & Figma Visual Handoff Billing Guide',
  description: 'Download visual designer invoice templates. Learn how to structures creative billing, asset licensing terms, and design revision fees.',
  keywords: ['designer invoice template', 'graphic design billing', 'UI UX freelance invoice', 'design figma asset licensing', 'creative design payment terms'],
};

export default function DesignerInvoicePage() {
  const faqItems = [
    {
      question: 'How should designers structures payment terms for revisions?',
      answer: 'Specify in the initial quote proposal that 2 or 3 rounds of design reviews are included. Any additional revision rounds should be invoiced at a flat fee (e.g. $150 per revision round) or billed hourly.'
    },
    {
      question: 'Should designers invoice for source files (Figma, Adobe illustrator)?',
      answer: 'Yes. Source file ownership is a premium asset transfer. Include a clear itemized line on the invoice if the client is purchasing full licensing rights and native Figma source files.'
    },
    {
      question: 'What is the standard upfront deposit percentage for creative design?',
      answer: 'The standard deposit for independent designers is 50% upfront before design concepts begin, and 50% upon final layout approval before source file delivery.'
    }
  ];

  const contentHtml = (
    <div>
      <p style={{ marginBottom: '20px' }}>
        For graphic artists, brand strategists, and UI/UX designers, invoices represent the transition from creative concepts into high-value commercial assets. Professional billing structures protect your intellectual property and guarantee payment.
      </p>

      <h3 style={{ fontSize: '1.4rem', fontWeight: 700, margin: '24px 0 12px 0', color: 'var(--text-main)' }}>1. Visual Designer Invoice Architecture</h3>
      <p style={{ marginBottom: '16px' }}>
        A professional design invoice should separate research, visual assets drafting, revision feedback rounds, and final asset preparation. This limits disputes over project scopes and edits.
      </p>
      <ul style={{ paddingLeft: '20px', marginBottom: '24px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <li><strong>Creative Deliverables Details:</strong> Itemize design components like high-fidelity layouts, logo system kits, or wireframes.</li>
        <li><strong>Figma Workspace Transfers:</strong> Link invoice clearances to the release of editable Figma design boards.</li>
      </ul>

      <h3 style={{ fontSize: '1.4rem', fontWeight: 700, margin: '24px 0 12px 0', color: 'var(--text-main)' }}>2. Essential Intellectual Property Clauses</h3>
      <p style={{ marginBottom: '16px' }}>
        Protect your visual creations. State clearly on your invoice that usage licenses are only transferred to the client upon full payment of the invoice.
      </p>
      <ul style={{ paddingLeft: '20px', marginBottom: '24px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <li><strong>Usage License Release:</strong> Release files and commercial usage rights only when bank wire or card transactions clear.</li>
        <li><strong>Cancellation Kill Fees:</strong> Protect your time by charging a &quot;kill fee&quot; (e.g. keeping the 50% deposit) if the project is cancelled mid-sprint.</li>
      </ul>
    </div>
  );

  return (
    <SeoPageLayout
      title="Designer Invoice Template"
      subtitle="Creative designer billing standards, visual layout payment structures, and intellectual property handoff frameworks."
      ctaText="Create Designer Card"
      contentHtml={contentHtml}
      faqItems={faqItems}
    />
  );
}
