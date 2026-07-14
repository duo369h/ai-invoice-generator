import SeoEntryLandingPage from '../components/SeoEntryLandingPage';

const page = {
  path: '/photographer-invoice-template',
  analyticsSlug: 'photographer_invoice_template',
  schemaType: 'CollectionPage',
  seoTitle: 'Photographer Invoice Template | Corvioz',
  description:
    'A professional photography invoice template covering deliverables, deposits & balances — plus a way to track payment status after the quote is approved.',
  h1: 'The Photographer Invoice Template That Tracks What\'s Been Paid',
  intro:
    'Once a quote is approved, the invoice is what actually gets you paid. It needs to reflect the agreed price, apply the deposit already collected, and show the client exactly what\'s left to pay and by when. This is the structure professional photographers use — and the workflow that keeps it connected to the quote it came from, instead of starting from a blank document.',
  previewTitle: 'A professional photography invoice covers:',
  previewItems: [
    'Client and job reference — tying the invoice back to the approved quote',
    'Itemized deliverables — what was shot and delivered, matching what was quoted',
    'Amount already paid — the deposit, clearly subtracted',
    'Balance due — the remaining amount, stated plainly',
    'Payment terms — due date and accepted payment methods'
  ],
  primaryCta: { label: 'Start invoicing for free', href: '/dashboard?tool=invoice' },
  secondaryCta: { label: 'Explore Photographer Workflow', href: '/for-photographers' },
  whyTitle: 'Common Invoice Problems',
  whyBody:
    'Photographers invoicing manually run into a recurring set of issues. These are tracking problems, not pricing problems — and they tend to show up most once a photographer has more than a handful of jobs running at once.',
  featureCards: [
    {
      title: 'Invoice doesn\'t match the quote',
      body: 'Different numbers confuse the client. An invoice that doesn\'t reference the original quote forces the client to re-check what they agreed to — which is where payment delays usually start.',
    },
    {
      title: 'Deposit not reflected',
      body: 'If the deposit isn\'t clearly subtracted, the client thinks they\'re being asked to pay twice.',
    },
    {
      title: 'No clear due date',
      body: 'Without a specific, enforced due date, payment gets deprioritized by the client.',
    },
    {
      title: 'No record of what\'s outstanding',
      body: 'It becomes hard to know who still owes what, across multiple jobs running concurrently.',
    }
  ],
  workflowTitle: 'Quote → Invoice → Payment Workflow',
  workflowSteps: [
    {
      title: 'Quote approved',
      body: 'Start from the estimate the client already agreed to. Because the invoice is built from the approved quote, the numbers stay consistent.',
    },
    {
      title: 'Invoice created',
      body: 'Deliverables and pricing are carried over automatically, and the deposit is applied — nothing to re-type and nothing to reconcile by hand.',
    },
    {
      title: 'Payment tracked',
      body: 'Balance, due date, and payment status are visible in one place, so you can see what\'s outstanding without checking multiple documents.',
    },
  ],
  faq: [
    {
      question: 'What\'s the difference between a photography quote and an invoice?',
      answer:
        'A quote is the estimate a client approves before the job. An invoice is issued after approval to request payment, and reflects any deposit already collected.',
    },
    {
      question: 'What should a photography invoice include?',
      answer:
        'Client and job details, an itemized list of deliverables matching the quote, the deposit applied, the remaining balance, and a clear due date.',
    },
    {
      question: 'How do I show a deposit on an invoice?',
      answer:
        'List the deposit as a line item subtracted from the total, so the balance due is the only number the client needs to act on.',
    },
    {
      question: 'Can an invoice be created directly from an approved quote?',
      answer:
        'With Corvioz, yes — the invoice carries over the deliverables and pricing from the quote, so nothing needs to be re-entered.',
    },
    {
      question: 'How do I keep track of unpaid invoices across multiple clients?',
      answer:
        'Corvioz shows payment status per invoice, so you can see at a glance which jobs are paid, partially paid, or still outstanding.',
    },
  ],
  finalCtaTitle: 'Keep your invoices consistent with the quotes clients already approved.',
  finalCtaBody:
    'Carry deliverables, pricing, and deposits straight through — and see what\'s outstanding without digging through separate documents.',
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

export default function PhotographerInvoiceTemplatePage() {
  return <SeoEntryLandingPage page={page} />;
}
