import SeoEntryLandingPage from '../components/SeoEntryLandingPage';

const page = {
  path: '/photographer-quote-template',
  analyticsSlug: 'photographer_quote_template',
  schemaType: 'CollectionPage',
  seoTitle: 'Photographer Quote Template — Quote Shoots, Packages & Deposits',
  description:
    'Use a photographer quote template to present shoot scope, packages, usage rights, deposit terms, and delivery timeline — then convert it into an invoice in Corvioz.',
  h1: 'Photographer Quote Template',
  intro:
    'Present a professional photography quote before the shoot begins. Scope the session, price your packages, define usage rights, and set deposit terms — then convert the approved quote into a deposit invoice without retyping a word.',
  previewTitle: 'What this quote template covers',
  previewItems: [
    'Session type, shoot date, location, and duration',
    'Package options, add-ons, and optional line items',
    'Licensing and usage rights terms',
    'Deposit amount, delivery timeline, and payment terms',
    'A connected path from approved quote to deposit invoice',
  ],
  primaryCta: { label: 'Create Quote Free', href: '/dashboard?tool=quote' },
  secondaryCta: { label: 'Explore Photographer Workflow', href: '/for-photographers' },
  whyTitle: 'A photography quote sets the shoot up to run smoothly',
  whyBody:
    'A strong quote prevents scope confusion before a single frame is taken. When clients see a clear breakdown of the session fee, editing package, usage license, and deposit requirement upfront, approval is faster and revisions are fewer. Corvioz keeps the approved quote linked to your client record so the invoice reflects exactly what was agreed.',
  featureCards: [
    {
      title: 'Photography-specific scope',
      body: 'Line items built for how photographers actually work — session fees, editing packages, travel, add-ons, and usage rights as separate, visible costs.',
    },
    {
      title: 'Deposit and final balance',
      body: 'Collect a deposit to hold the date, then trigger the final invoice on delivery — all tracked in one client record without rewriting the same project details.',
    },
    {
      title: 'Quote to invoice in one step',
      body: 'Once the client approves, convert the quote into a matching invoice. No re-entering shoot details, no separate document to rebuild.',
    },
  ],
  workflowTitle: 'How photographers use this quote template',
  workflowSteps: [
    {
      title: 'Structure the shoot scope',
      body: "Start from the client's inquiry. Add session type, date, duration, package pricing, optional add-ons, and usage rights as clear, separate line items.",
    },
    {
      title: 'Set deposit and payment terms',
      body: 'Define the deposit amount required to hold the date, the delivery timeline, and when the final balance is due. Add this directly to the quote.',
    },
    {
      title: 'Send and collect approval',
      body: 'Share the quote with the client for review. Once approved, Corvioz keeps the scope and pricing connected to the client record.',
    },
    {
      title: 'Convert to invoice',
      body: "After the shoot, convert the approved quote into a final invoice. The line items, usage terms, and client details carry over — you just record the payment.",
    },
  ],
  faq: [
    {
      question: 'What should a photographer quote template include?',
      answer:
        'A photography quote should cover the session type, shoot date and location, package details, add-ons priced separately, licensing and usage rights, the deposit amount required to confirm the booking, a delivery timeline, and the final balance due date.',
    },
    {
      question: 'How is a photography quote different from an invoice?',
      answer:
        "A quote is a pre-shoot document the client approves before work begins. It locks in the scope, pricing, and terms. An invoice is the billing document sent after delivery — or in two stages if you're collecting a deposit first.",
    },
    {
      question: 'Can I collect a deposit using this quote?',
      answer:
        'Yes. Include the deposit amount and terms directly in the quote. Once approved, Corvioz lets you issue a deposit invoice immediately and track the remaining balance for the final payment.',
    },
    {
      question: 'Should usage rights be listed in the quote or the contract?',
      answer:
        "Both, ideally. Listing usage rights as a line item in the quote makes the client aware of the cost before they approve. Your contract formalizes the legal terms. Corvioz's quote template supports both: visible line items now and editable agreement terms later.",
    },
    {
      question: 'Can I convert a quote into an invoice in Corvioz?',
      answer:
        'Yes. When a quote is approved in Corvioz, you can convert it into a matching invoice directly. The line items, pricing, and client details carry over so you never retype the same shoot information.',
    },
  ],
  finalCtaTitle: 'Send your next photography quote in minutes',
  finalCtaBody:
    'Build a professional quote with session scope, packages, usage rights, and deposit terms — then convert it to an invoice on delivery.',
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

export default function PhotographerQuoteTemplatePage() {
  return <SeoEntryLandingPage page={page} />;
}
