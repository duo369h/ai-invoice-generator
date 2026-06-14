import React from 'react';
import SeoPageLayout from '../../components/SeoPageLayout';

export const metadata = {
  title: 'Invoice vs Quote vs Receipt — Master Client Transactions',
  description: 'Understand the legal and operational differences between Quotes, Invoices, and Receipts in freelance commercial transactions.',
  keywords: ['invoice vs quote vs receipt', 'what is a quote', 'when to send invoice', 'receipt of payment', 'freelance billing guide'],
};

export default function InvoiceVsQuoteGuide() {
  const faqItems = [
    {
      question: 'Is a Quote legally binding?',
      answer: 'A Quote is a proposed price offer. It becomes binding only when the client signs or explicitly accepts it, forming an agreement, which is then formally documented in a contract.'
    },
    {
      question: 'Can I send a Receipt before getting paid?',
      answer: 'No. A Receipt is a proof of payment. It should only be issued after the funds have cleared in your bank account or payment processor.'
    },
    {
      question: 'When does a Quote turn into an Invoice?',
      answer: 'As soon as the client approves the scope and cost in the Quote and work commences or reaches a predefined milestone, you convert the Quote details into a formal Invoice requesting payment.'
    }
  ];

  const contentHtml = (
    <div>
      <p style={{ marginBottom: '20px' }}>
        For independent contractors, keeping your financial paperwork clean is critical. Quotes, Invoices, and Receipts represent three distinct phases in the client acquisition and project delivery lifecycle. Using them incorrectly can confuse clients and delay accounts receivable.
      </p>

      <h3 style={{ fontSize: '1.4rem', fontWeight: 700, margin: '24px 0 12px 0', color: 'var(--text-main)' }}>1. The Quote (The Proposal Stage)</h3>
      <p style={{ marginBottom: '16px' }}>
        A <strong>Quote</strong> is sent at the very beginning of a client inquiry. It acts as an official estimate of costs and deliverables.
      </p>
      <ul style={{ paddingLeft: '20px', marginBottom: '24px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <li><strong>When to send:</strong> Right after discussing initial project requirements.</li>
        <li><strong>What it contains:</strong> Scope options, estimated hours, pricing, and validity dates (e.g. &quot;Valid for 30 days&quot;).</li>
      </ul>

      <h3 style={{ fontSize: '1.4rem', fontWeight: 700, margin: '24px 0 12px 0', color: 'var(--text-main)' }}>2. The Invoice (The Billing Stage)</h3>
      <p style={{ marginBottom: '16px' }}>
        An <strong>Invoice</strong> is an official request for payment. It states that the work has been done (or a milestone reached) and that the client now legally owes you the specified amount.
      </p>
      <ul style={{ paddingLeft: '20px', marginBottom: '24px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <li><strong>When to send:</strong> At project kickoff (for deposits), at agreed milestones, or upon project completion.</li>
        <li><strong>What it contains:</strong> Invoice number, payment due dates, itemized work, payment methods, and bank links.</li>
      </ul>

      <h3 style={{ fontSize: '1.4rem', fontWeight: 700, margin: '24px 0 12px 0', color: 'var(--text-main)' }}>3. The Receipt (The Settlement Stage)</h3>
      <p style={{ marginBottom: '16px' }}>
        A <strong>Receipt</strong> is a confirmation of transaction settlement. It proves that the client has paid the invoice in full.
      </p>
      <ul style={{ paddingLeft: '20px', marginBottom: '24px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <li><strong>When to send:</strong> Immediately after payment clears.</li>
        <li><strong>What it contains:</strong> Invoice references, total paid amount, date of payment, and payment method details.</li>
      </ul>
    </div>
  );

  return (
    <SeoPageLayout
      title="Invoice vs Quote vs Receipt"
      subtitle="A clear breakdown of transaction documents: proposal quotes, payment requests, and proof-of-payment receipts."
      ctaText="Explore Control Center"
      contentHtml={contentHtml}
      faqItems={faqItems}
    />
  );
}
