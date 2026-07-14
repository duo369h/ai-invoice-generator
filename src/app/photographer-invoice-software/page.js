import SeoEntryLandingPage from '../components/SeoEntryLandingPage';

const page = {
  path: '/photographer-invoice-software',
  analyticsSlug: 'photographer_invoice_software',
  schemaType: 'SoftwareApplication',
  seoTitle: 'Photographer Invoice Software',
  description:
    'Photographer invoice software for quotes, deposits, invoices, and payment tracking — one workflow, not a stack of separate tools.',
  h1: 'Invoice Software Built Around How Photographers Actually Get Paid',
  intro:
    'Stop Managing Quotes, Deposits, and Invoices in Different Places. Most photographers piece together their billing from a quote template, a separate invoice tool, a spreadsheet for deposits, and an inbox full of "did they pay yet?" Corvioz replaces that patchwork with one workflow: quote, deposit, invoice, and final payment, tied to the same client record from inquiry to delivery.',
  previewTitle: 'Corvioz vs. Invoice Template',
  previewItems: [
    'Quote and invoice numbers carried over automatically',
    'Deposit recorded against the job, reflected on the final invoice',
    'Client history kept in one client record',
    'Multiple active jobs visible together, by status',
    'International clients built into the same workflow',
  ],
  primaryCta: { label: 'Start invoicing for free', href: '/dashboard?tool=invoice' },
  secondaryCta: { label: 'Explore Photographer Workflow', href: '/for-photographers' },
  whyTitle: 'Running a photography business on scattered tools eventually breaks down.',
  whyBody:
    "A quote gets approved in one place, and the invoice gets built somewhere else. Deposits get tracked in a spreadsheet, invoices don't reflect them, and clients get confused about what they still owe. Client history is split across email threads, and it becomes harder to see who's paid and who's overdue. None of this is a pricing problem. It's a workflow problem — and it gets worse as the business grows.",
  featureCards: [
    {
      title: 'Deposit & Balance Tracking',
      body: "Deposits are recorded against the job the moment they're collected, and clearly reflected when the final invoice is created — so the balance due is always accurate, and clients are never shown a number that doesn't match what they've already paid.",
    },
    {
      title: 'Quote to Invoice Workflow',
      body: "An approved quote carries its scope, deliverables, and pricing directly into the invoice. There's no re-entering line items and no risk of the invoice quietly drifting from what the client actually agreed to.",
    },
    {
      title: 'Client Payment Organization',
      body: 'Every client\'s quotes, deposits, invoices, and payment status live under one record — so a photographer can see the full history of a job, or the status of every active client, without digging through separate files or tools.',
    },
    {
      title: 'International Clients',
      body: 'Corvioz is built to grow with photographers who take on clients across regions — with a workflow designed to keep quotes, invoices, and payment records consistent as that side of the business expands.',
    },
  ],
  workflowTitle: 'The Complete Quote to Final Payment Workflow',
  workflowSteps: [
    {
      title: 'Inquiry & Quote',
      body: 'Scope, deliverables, and pricing sent for approval.',
    },
    {
      title: 'Deposit',
      body: 'Collected and recorded against the job.',
    },
    {
      title: 'Shoot & Delivery',
      body: 'Every stage is tied to the same client and job record.',
    },
    {
      title: 'Final Payment',
      body: 'The final invoice reflects the deposit already paid, and the balance is tracked to close. Nothing has to be rebuilt from scratch as the job moves forward.',
    },
  ],
  faq: [
    {
      question: 'Is Corvioz an invoice template or invoicing software?',
      answer:
        'Corvioz is software. It manages the full workflow — quote, deposit, invoice, and payment tracking — connected to a client record, not a document you fill in on your own.',
    },
    {
      question: 'Can Corvioz track deposits separately from the final payment?',
      answer:
        'Yes. Deposits are recorded against the job and reflected on the final invoice, so the remaining balance is always accurate.',
    },
    {
      question: 'Does an approved quote automatically become an invoice?',
      answer:
        'Yes — the invoice is generated from the approved quote, carrying over deliverables and pricing so nothing needs to be re-entered.',
    },
    {
      question: 'Will Corvioz collect payments automatically on my behalf?',
      answer:
        "No. Corvioz organizes your quotes, invoices, deposits, and payment status in one workflow — it doesn't process or collect payments on your behalf. You record payments as they come in, and Corvioz keeps the balance and status accurate across every job.",
    },
  ],
  finalCtaTitle: 'Run your billing as one workflow, not four separate tools.',
  finalCtaBody:
    'Quotes, deposits, invoices, and payment status — organized under one client record, from inquiry to final payment.',
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

export default function PhotographerInvoiceSoftwarePage() {
  return <SeoEntryLandingPage page={page} />;
}
