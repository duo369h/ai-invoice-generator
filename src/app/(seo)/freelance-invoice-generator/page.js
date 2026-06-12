import React from 'react';
import SeoPageLayout from '../../components/SeoPageLayout';

export const metadata = {
  title: 'Freelance Invoice Generator — Professional Invoices for Freelancers',
  description: 'Create professional invoices tailored for freelancers, independent contractors, and solo creators. Support multiple currencies, discounts, custom logos, and local compliance.',
  keywords: ['freelance invoice generator', 'contractor invoice template', 'consulting bill maker', 'independent contractor invoice', 'freelancer billing software'],
};

export default function FreelanceInvoiceGeneratorPage() {
  const faqItems = [
    {
      question: 'What makes an invoice suitable for freelancers?',
      answer: 'Freelancers need flexibility. A freelance-ready invoice tool must support both project-based flat rates and hourly rates, allow clear breakdowns of deliverables, handle multiple currencies, support logo branding, and include dedicated notes to list bank details, SWIFT codes, or online payment addresses.'
    },
    {
      question: 'What details should a freelance invoice include?',
      answer: 'It must contain: 1. Your business name and contact info. 2. Your client\'s details. 3. A unique invoice number. 4. Invoice date and clear due date. 5. An itemized list of services rendered. 6. Total amount due and currency. 7. Detailed payment terms (e.g. bank transfer instructions).'
    },
    {
      question: 'Can I bill my international clients?',
      answer: 'Absolutely. InvoiceAI supports major international billing currencies like USD ($), EUR (€), GBP (£), CNY (¥), and JPY (¥). You can set custom tax and discount rates depending on international trade requirements.'
    },
    {
      question: 'Does this support hourly and flat-rate billing?',
      answer: 'Yes. For hourly work, you can set the quantity as the number of hours worked and the rate as your hourly rate. For project-based billing, you can set the quantity to 1 and the price to the flat rate agreed upon.'
    },
    {
      question: 'How do I add payment instructions?',
      answer: 'You can use the &quot;Notes / Payment Terms Details&quot; textarea at the bottom of the form to specify bank account numbers, SWIFT/BIC codes, PayPal links, or Wise email details. These instructions will print directly at the bottom of your PDF.'
    },
    {
      question: 'Can I track unpaid invoices?',
      answer: 'The current dashboard supports basic saved-document handling in the test version. Full account-based invoice history is planned with Supabase login and database sync.'
    }
  ];

  const contentHtml = (
    <div>
      <h2 style={{ fontSize: '1.75rem', fontWeight: 800, margin: '30px 0 15px 0' }}>Professional Billing for Solo Business Owners</h2>
      <p style={{ marginBottom: '15px' }}>
        As a freelancer, contractor, or creative specialist, your invoice is more than just a payment request—it is a reflection of your professional brand. A poorly formatted invoice, missing dates, or unclear payment instructions can lead to payment delays and affect your client relationships.
      </p>
      <p style={{ marginBottom: '15px' }}>
        The **Freelance Invoice Generator** by InvoiceAI is designed around the unique workflow of independent contractors. It provides the perfect balance of flexibility, simplicity, and professional visual quality.
      </p>
      
      <h2 style={{ fontSize: '1.75rem', fontWeight: 800, margin: '30px 0 15px 0' }}>Why Freelancers Choose InvoiceAI</h2>
      <ul style={{ paddingLeft: '20px', marginBottom: '25px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <li><strong>Bilingual AI Parsing:</strong> Got a project brief? Just copy-paste it into our AI and watch it generate an invoice automatically, understanding both English and Chinese billing text.</li>
        <li><strong>Professional Design:</strong> High-impact monospace template that looks clean, modern, and prints perfectly on A4 paper format.</li>
        <li><strong>Brand Ownership:</strong> Upload your business logo to represent your agency or personal brand.</li>
        <li><strong>Easy Payment Collection:</strong> Clear payment term selectors (Net 15, Net 30, Due on Receipt) and bank notes ensure your clients know exactly how and when to pay.</li>
      </ul>

      <h2 style={{ fontSize: '1.75rem', fontWeight: 800, margin: '30px 0 15px 0' }}>Guidelines for Getting Paid Faster</h2>
      <p style={{ marginBottom: '15px' }}>
        To speed up client payments, we recommend following these invoicing best practices:
      </p>
      <ul style={{ paddingLeft: '20px', marginBottom: '25px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <li><strong>Invoice Promptly:</strong> Send your invoice immediately after completing a milestone or at the end of the billing period.</li>
        <li><strong>Be Specific:</strong> Itemize line items clearly so clients understand exactly what work they are paying for.</li>
        <li><strong>Set Clear Terms:</strong> Specify exact due dates. Avoid vague terms like &quot;payment upon receipt&quot; if your contract specifies Net 30.</li>
        <li><strong>Provide Direct Instructions:</strong> State your exact routing, bank numbers, or online payment emails clearly in the invoice notes.</li>
      </ul>
    </div>
  );

  return (
    <SeoPageLayout
      title="Freelance Invoice Generator"
      subtitle="The ultimate invoicing tool built specifically for freelancers, independent contractors, and solo creators."
      ctaText="Create Freelancer Invoice"
      contentHtml={contentHtml}
      faqItems={faqItems}
      lang="en"
    />
  );
}
