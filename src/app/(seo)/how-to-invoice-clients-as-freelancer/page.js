import React from 'react';
import SeoPageLayout from '../../components/SeoPageLayout';

export const metadata = {
  title: 'How to Invoice Clients as a Freelancer — Professional Billing Guide',
  description: 'Learn step-by-step how to invoice clients professionally as a freelancer. Explore essential elements, clear payment terms, and invoicing frameworks.',
  keywords: ['how to invoice clients', 'freelancer invoice guide', 'freelance billing', 'payment terms for freelancers', 'billing clients'],
};

export default function HowToInvoiceGuide() {
  const faqItems = [
    {
      question: 'What details must be on a freelance invoice?',
      answer: 'Every professional invoice needs your name and contact info, client information, a unique invoice number, issue date, due date, itemized list of deliverables with pricing, total sum, and clear payment instructions.'
    },
    {
      question: 'When should I send the invoice to my client?',
      answer: 'For small projects, send it immediately upon project completion. For ongoing or long-term contracts, agree to invoice bi-weekly, monthly, or at pre-defined project milestones.'
    },
    {
      question: 'What are Net 30 payment terms?',
      answer: 'Net 30 terms mean the client has exactly 30 days from the invoice date to settle the payment. Choose shorter terms like Net 15 or "Due on Receipt" to improve cash flow.'
    }
  ];

  const contentHtml = (
    <div>
      <p style={{ marginBottom: '20px' }}>
        Invoicing is more than just demanding payments; it is a critical touchpoint in your client relationship. A clean, professional billing process establishes trust, displays operational clarity, and ensures you get paid on time.
      </p>

      <h3 style={{ fontSize: '1.4rem', fontWeight: 700, margin: '24px 0 12px 0', color: 'var(--text-main)' }}>1. Structuring Your Freelance Invoice</h3>
      <p style={{ marginBottom: '16px' }}>
        To avoid client disputes and accounts payable delay, guarantee your invoice contains these crucial fields:
      </p>
      <ul style={{ paddingLeft: '20px', marginBottom: '24px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <li><strong>Contact Header:</strong> Your legal name, business entity (if any), email address, phone number, and physical address.</li>
        <li><strong>Client Details:</strong> The name of the client representative or company, alongside their billing address and AP email.</li>
        <li><strong>Invoice Number:</strong> A unique chronological code (e.g., INV-001) to track billing history.</li>
        <li><strong>Key Dates:</strong> The exact date of issuance and the due date calculated from payment terms.</li>
        <li><strong>Itemized Line Items:</strong> Detailed rows detailing quantities, hourly rates or flat fees, and clear descriptions of services rendered.</li>
      </ul>

      <h3 style={{ fontSize: '1.4rem', fontWeight: 700, margin: '24px 0 12px 0', color: 'var(--text-main)' }}>2. Choosing the Right Payment Terms</h3>
      <p style={{ marginBottom: '20px' }}>
        Common terms include <strong>Due on Receipt</strong> (payment is due immediately), <strong>Net 15</strong> (due in 15 days), and <strong>Net 30</strong> (due in 30 days). For freelancers, Net 15 or Due on Receipt are recommended to maintain steady cash flow and fund operational overheads.
      </p>

      <h3 style={{ fontSize: '1.4rem', fontWeight: 700, margin: '24px 0 12px 0', color: 'var(--text-main)' }}>3. Payment Methods</h3>
      <p style={{ marginBottom: '20px' }}>
        Provide direct links to facilitate immediate credit card checkouts. Incorporating online checkout URLs (like Stripe or LemonSqueezy payment links) directly on your invoices reduces friction and lets clients clear balances in seconds.
      </p>
    </div>
  );

  return (
    <SeoPageLayout
      title="How to Invoice Clients as a Freelancer"
      subtitle="A step-by-step guide to professional billing structures, setting optimal payment terms, and getting paid faster."
      ctaText="Create Free Invoice"
      contentHtml={contentHtml}
      faqItems={faqItems}
    />
  );
}
