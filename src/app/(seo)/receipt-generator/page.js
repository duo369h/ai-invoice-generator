import React from 'react';
import SeoPageLayout from '../../components/SeoPageLayout';

export const metadata = {
  title: 'Receipt Generator — Create Digital Receipts Online',
  description: 'Generate clean, professional digital receipts online. Ideal for proof of purchase, retail sales, consulting payments, or rent receipts. Export to PDF instantly.',
  keywords: ['receipt generator', 'digital receipt maker', 'proof of purchase creator', 'free online receipt tool', 'sales receipt template'],
};

export default function ReceiptGeneratorPage() {
  const faqItems = [
    {
      question: 'What is the difference between an invoice and a receipt?',
      answer: 'An invoice is a payment request sent to a client BEFORE payment is made, detailing the services rendered and total balance. A receipt is issued AFTER payment is received, serving as proof of transaction for accounting and tax purposes.'
    },
    {
      question: 'Can I generate both invoices and receipts with this tool?',
      answer: 'Yes! The InvoiceAI dashboard features a document toggle in the top-right corner. You can click &quot;Invoice&quot; or &quot;Receipt&quot; to change the document type and style instantly.'
    },
    {
      question: 'Can I use this for rent payments or retail sales?',
      answer: 'Absolutely. It is fully customizable for retail, e-commerce, consulting services, rent receipts, or donation proof-of-purchase records. Simply edit the item descriptions, quantities, and rates accordingly.'
    },
    {
      question: 'How do I download the generated receipt?',
      answer: 'Once you fill in the business and client details, click the &quot;Download PDF&quot; button to compile a clean, printer-ready A4 receipt. You can also print directly to any hardware printer.'
    },
    {
      question: 'Does it support tax and discount calculations?',
      answer: 'Yes. You can specify a discount rate and tax percentage. The subtotal, discount reduction, tax amount, and grand totals are calculated automatically and presented clearly.'
    },
    {
      question: 'Can I save receipts in my account?',
      answer: 'Yes! Free tier users can save up to 5 documents. By saving your receipts, you can keep track of historical transactions, review total revenues, and export them whenever needed.'
    }
  ];

  const contentHtml = (
    <div>
      <h2 style={{ fontSize: '1.75rem', fontWeight: 800, margin: '30px 0 15px 0' }}>Instant Digital Receipts for Your Customers</h2>
      <p style={{ marginBottom: '15px' }}>
        For small businesses, service providers, and freelancers, providing a clean receipt immediately after receiving payment is essential. Receipts serve as tax-compliant proof of transaction, enabling your clients to expense your services and keep their accounting records up-to-date.
      </p>
      <p style={{ marginBottom: '15px' }}>
        The **Receipt Generator** by InvoiceAI lets you create professional receipts in seconds. You can either type the receipt details into our AI autofill box (e.g. *&quot;Create a receipt for $500 paid by John Doe today for consulting work&quot;*) or use our simple form to insert business details, taxes, discounts, and logo branding.
      </p>
      
      <h2 style={{ fontSize: '1.75rem', fontWeight: 800, margin: '30px 0 15px 0' }}>Key Features of InvoiceAI Receipts</h2>
      <ul style={{ paddingLeft: '20px', marginBottom: '25px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <li><strong>Frictionless Creation:</strong> Create a digital receipt instantly. No registration or signup required.</li>
        <li><strong>Dual Document Engine:</strong> Easily toggle between generating invoices and receipts with one click, sharing the same data inputs.</li>
        <li><strong>Multi-Currency Compatibility:</strong> Support international customers by billing in USD, EUR, GBP, CNY, or JPY.</li>
        <li><strong>Pristine PDF Compilation:</strong> Download A4 print-ready receipts with logo placements, detailed items lists, and subtotal breakdowns.</li>
      </ul>

      <h2 style={{ fontSize: '1.75rem', fontWeight: 800, margin: '30px 0 15px 0' }}>When should you issue a receipt?</h2>
      <p style={{ marginBottom: '15px' }}>
        Receipts should be sent immediately under the following circumstances:
      </p>
      <ul style={{ paddingLeft: '20px', marginBottom: '25px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <li>Upon receiving a bank transfer, PayPal, or card payment for an outstanding invoice.</li>
        <li>For direct retail sales or service sales where payment is conducted on the spot.</li>
        <li>To provide proof of donation for non-profit entities.</li>
        <li>As rent receipts, confirming monthly lease payments from tenants.</li>
      </ul>
    </div>
  );

  return (
    <SeoPageLayout
      title="Receipt Generator"
      subtitle="Instantly generate professional digital receipts online as proof of payment. Export clean PDFs."
      ctaText="Generate Receipt Now"
      contentHtml={contentHtml}
      faqItems={faqItems}
      lang="en"
    />
  );
}
