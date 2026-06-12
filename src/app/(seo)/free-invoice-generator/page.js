import React from 'react';
import SeoPageLayout from '../../components/SeoPageLayout';

export const metadata = {
  title: 'Free Invoice Generator — Create & Download PDF Invoices',
  description: 'Create and export professional PDF invoices instantly. No signup, no account creation, and no credit card required. Free tool for freelancers and small businesses.',
  keywords: ['free invoice generator', 'no signup invoice maker', 'free PDF invoice creator', 'online invoice tool', 'unlimited invoice generator'],
};

export default function FreeInvoiceGeneratorPage() {
  const faqItems = [
    {
      question: 'Is this invoice generator completely free?',
      answer: 'Yes! You can use our tool to create, edit, print, and download PDF invoices completely free of charge. No subscription or hidden fees are required for standard usage.'
    },
    {
      question: 'Do I need to sign up or log in?',
      answer: 'No signup is required. We believe in providing a frictionless experience for freelancers. Simply open the dashboard, fill in your details, and download your professional PDF.'
    },
    {
      question: 'Can I customize the design of my invoice?',
      answer: 'Our free invoices come in a clean, modern, monospace design optimized for legibility and standard A4 sizes. You can customize fields, upload your logo, modify tax rates, and apply discounts to match your branding.'
    },
    {
      question: 'How do I download my invoice as a PDF?',
      answer: 'Simply fill out the form, click the &quot;Download PDF&quot; button, and a real PDF document will generate client-side and download instantly. You can also click &quot;Print Page&quot; to open the browser print dialog.'
    },
    {
      question: 'What details can I include on the invoice?',
      answer: 'You can input business info, a custom logo, invoice number, issue and due dates, payment terms, client details, line items with description, quantity, price, tax percentages, discount rates, and notes.'
    },
    {
      question: 'Is my client data safe?',
      answer: 'PDF generation happens in the browser. During the public test phase, avoid entering highly sensitive financial information and review all invoice details before sending them to clients.'
    }
  ];

  const contentHtml = (
    <div>
      <h2 style={{ fontSize: '1.75rem', fontWeight: 800, margin: '30px 0 15px 0' }}>Frictionless Invoicing: Just Fill and Export</h2>
      <p style={{ marginBottom: '15px' }}>
        When you need to send an invoice quickly to close a deal or request payment, the last thing you want is to spend 15 minutes setting up a SaaS account, validating your email, or inputting credit card details.
      </p>
      <p style={{ marginBottom: '15px' }}>
        The **Free Invoice Generator** is built to remove all friction. It provides a simple, clean, and instant way to draft billing records on any computer or mobile phone. You gain access to a professional layout immediately upon load.
      </p>
      
      <h2 style={{ fontSize: '1.75rem', fontWeight: 800, margin: '30px 0 15px 0' }}>Why Freelancers Love InvoiceAI</h2>
      <ul style={{ paddingLeft: '20px', marginBottom: '25px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <li><strong>No Paywalls:</strong> Draft, preview, and download your files. No hidden watermarks, page limits, or trial period restrictions.</li>
        <li><strong>Premium Layout:</strong> Stand out to your corporate clients with a clean layout, proper alignment, and professional itemized sections.</li>
        <li><strong>Flexible Billing:</strong> Add taxes, discounts, customizable payment terms, and detailed notes on payment instructions.</li>
        <li><strong>Local PDF Generation:</strong> PDF compiling runs completely inside your browser, meaning it loads fast and preserves full data privacy.</li>
      </ul>

      <h2 style={{ fontSize: '1.75rem', fontWeight: 800, margin: '30px 0 15px 0' }}>Features at a Glance</h2>
      <p style={{ marginBottom: '15px' }}>
        Our free tool supports all industry-standard features required for professional accounting compliance:
      </p>
      <ul style={{ paddingLeft: '20px', marginBottom: '25px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <li>Add customized business name, email, and address.</li>
        <li>Specify client name, client email, and full shipping/billing address.</li>
        <li>Upload logos to build brand consistency.</li>
        <li>Flexible payment terms (Due on Receipt, Net 15, Net 30, Net 60, or Custom).</li>
        <li>Unlimited itemized line items with automatic subtotal updates.</li>
      </ul>
    </div>
  );

  return (
    <SeoPageLayout
      title="Free Invoice Generator"
      subtitle="Create and download professional PDF invoices instantly. No signup, no account, no catch."
      ctaText="Create Free Invoice Now"
      contentHtml={contentHtml}
      faqItems={faqItems}
      lang="en"
    />
  );
}
