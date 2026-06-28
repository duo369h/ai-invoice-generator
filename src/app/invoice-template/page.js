import SeoEntryLandingPage from '../components/SeoEntryLandingPage';

const page = {
  path: '/invoice-template',
  analyticsSlug: 'invoice_template',
  schemaType: 'CollectionPage',
  seoTitle: 'Free Invoice Template for Freelancers',
  description: 'Use a freelancer invoice template with client details, itemized services, taxes, payment terms, and a fast path to create invoices in Corvioz.',
  h1: 'Free Invoice Template for Freelancers',
  intro: 'Start with a practical invoice structure for freelance work, then create the final client-ready invoice in Corvioz with saved line items, payment terms, PDF export, and client portal context.',
  previewTitle: 'Invoice template fields',
  previewItems: [
    'Client and freelancer business details',
    'Itemized services, quantities, rates, and taxes',
    'Due date, payment terms, notes, and project context',
    'A connected path from quote approval to invoice sending',
  ],
  primaryCta: { label: 'Start Free', href: '/dashboard?action=create-profile' },
  secondaryCta: { label: 'Create Invoice', href: '/invoice-generator' },
  whyTitle: 'A simple invoice template is only the starting point',
  whyBody: 'Freelancers need more than a blank invoice. Corvioz keeps the invoice tied to your public profile, quote workflow, client record, PDF export, and payment status so the document is easier to send and follow up.',
  featureCards: [
    { title: 'Clear billing details', body: 'Show exactly what the client is paying for with line items, scope notes, totals, tax, and due dates.' },
    { title: 'Quote-to-invoice flow', body: 'Use approved scope from quotes as the basis for a matching invoice instead of rewriting the same project context.' },
    { title: 'Client-ready output', body: 'Prepare invoices that can be reviewed through a portal and exported for records without changing your core workflow.' },
  ],
  workflowTitle: 'How freelancers use this invoice template',
  workflowSteps: [
    { title: 'Choose the invoice structure', body: 'Use the template fields to organize services, payment terms, taxes, notes, and due dates.' },
    { title: 'Create the invoice in Corvioz', body: 'Move into the invoice generator or dashboard to save the document and keep it connected to the client.' },
    { title: 'Send and track payment context', body: 'Share a polished invoice and keep the project, client, quote, and payment status in one workflow.' },
  ],
  faq: [
    {
      question: 'What should a freelancer invoice template include?',
      answer: 'It should include your business details, client details, invoice number, itemized services, prices, taxes, due date, payment terms, notes, and the total amount due.',
    },
    {
      question: 'Can I create an invoice from this template in Corvioz?',
      answer: 'Yes. Use the page as a structure, then start free and create a saved invoice with line items, client details, PDF-ready formatting, and portal context.',
    },
    {
      question: 'Should freelancers send a quote before an invoice?',
      answer: 'For most new projects, yes. A quote helps the client approve scope and pricing before the invoice becomes a payment request.',
    },
  ],
  finalCtaTitle: 'Create a client-ready invoice in Corvioz',
  finalCtaBody: 'Start with the template, then keep your profile, quotes, invoices, and client records connected.',
};

export const metadata = {
  title: page.seoTitle,
  description: page.description,
  alternates: { canonical: page.path },
  robots: { index: true, follow: true },
  openGraph: {
    title: page.seoTitle,
    description: page.description,
    url: page.path,
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: page.seoTitle,
    description: page.description,
  },
};

export default function InvoiceTemplateEntryPage() {
  return <SeoEntryLandingPage page={page} />;
}
