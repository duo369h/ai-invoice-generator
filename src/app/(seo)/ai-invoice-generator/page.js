import React from 'react';
import SeoPageLayout from '../../components/SeoPageLayout';

export const metadata = {
  title: 'AI Invoice Generator — Create Invoices Instantly with AI',
  description: 'Use the InvoiceAI generator to turn unstructured text into professional billing documents. Automatically extract line items, calculate totals, and download clean PDFs in seconds.',
  keywords: ['AI invoice generator', 'text to invoice', 'intelligent invoicing', 'auto invoice maker', 'smart bill generator'],
};

export default function AiInvoiceGeneratorPage() {
  const faqItems = [
    {
      question: 'How does the AI invoice generator work?',
      answer: 'Our tool can use AI parsing, with a local fallback parser when an API key is not configured, to turn unstructured billing notes into fields like client name, email, currency, line items, and quantities. It then formats those details into a clean A4 PDF invoice.'
    },
    {
      question: 'Do I need to sign up to use the AI generator?',
      answer: 'No signup or registration is required for the basic generator. Account saving and advanced branding are planned for the Pro version.'
    },
    {
      question: 'Is my data secure and private?',
      answer: 'The basic generator is designed for lightweight invoice creation. Avoid entering highly sensitive financial information during the public test phase, and review exported invoices before sending them to clients.'
    },
    {
      question: 'Which languages and currencies are supported?',
      answer: 'Our AI supports bilingual invoices in English and Chinese, and can understand unstructured text written in either language. It supports major global currencies including USD ($), EUR (€), GBP (£), CNY (¥), and JPY (¥).'
    },
    {
      question: 'Can I upload a custom logo?',
      answer: 'Yes! Business details, client details, and custom logo uploads are supported. You can upload your corporate logo in PNG, JPG, or SVG formats to brand your PDFs before exporting.'
    },
    {
      question: 'Is there a limit on free generations?',
      answer: 'The public test version includes a limited free tier. Pro features such as larger usage limits, account saving, and advanced branding are planned.'
    }
  ];

  const contentHtml = (
    <div>
      <h2 style={{ fontSize: '1.75rem', fontWeight: 800, margin: '30px 0 15px 0' }}>The Future of Freelancer Invoicing: Zero Manual Input</h2>
      <p style={{ marginBottom: '15px' }}>
        For freelancers and small business owners, administrative work is a major productivity killer. Tracking billable hours, formatting tables, and manually inputting client details in traditional word processors is time-consuming and prone to human error.
      </p>
      <p style={{ marginBottom: '15px' }}>
        The **InvoiceAI Generator** solves this by letting you describe your project or sales in plain English or Chinese. By simply typing or pasting your notes—such as: *&quot;Bill Acme Corp for 3 custom websites at $450 each. Tax is 8%.&quot;*—our advanced language models convert the raw details into a pristine, structured invoice in under three seconds.
      </p>
      
      <h2 style={{ fontSize: '1.75rem', fontWeight: 800, margin: '30px 0 15px 0' }}>Key Benefits of AI-Powered Invoicing</h2>
      <ul style={{ paddingLeft: '20px', marginBottom: '25px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <li><strong>Speed:</strong> Reduce the time spent creating invoices by up to 90%. Just paste the client email thread or project brief and watch the fields auto-fill.</li>
        <li><strong>Accuracy:</strong> Our parser accurately identifies quantities, rates, client names, and currencies, eliminating calculation mistakes.</li>
        <li><strong>Professional Presentation:</strong> Download standard-compliant A4 PDF documents with custom branding, itemized tables, taxes, discounts, and payment notes.</li>
        <li><strong>Cross-Border Billing:</strong> Seamlessly handle international invoicing with multi-currency support and automatic currency symbols formatting.</li>
      </ul>

      <h2 style={{ fontSize: '1.75rem', fontWeight: 800, margin: '30px 0 15px 0' }}>How to Use the AI Parser</h2>
      <ol style={{ paddingLeft: '20px', marginBottom: '25px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <li>Go to the <strong>Dashboard</strong>.</li>
        <li>Type or paste your raw billing instructions in the AI Autofill box (e.g., *&quot;Draft a receipt to Bruce Wayne for $1000 worth of night vision upgrades. Payment received via bank transfer.&quot;*).</li>
        <li>Click <strong>Parse & Auto-fill</strong>. The fields, tables, and currencies will instantly populate in the form and live preview.</li>
        <li>Review, upload your logo, add any extra client addresses, and click <strong>Download PDF</strong>.</li>
      </ol>
    </div>
  );

  return (
    <SeoPageLayout
      title="AI Invoice Generator"
      subtitle="Instantly turn plain text and project descriptions into professional billing invoices with AI."
      ctaText="Generate Invoice with AI"
      contentHtml={contentHtml}
      faqItems={faqItems}
      lang="en"
    />
  );
}
