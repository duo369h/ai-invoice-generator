import SeoEntryLandingPage from '../components/SeoEntryLandingPage';

const page = {
  path: '/quote-template',
  analyticsSlug: 'quote_template',
  schemaType: 'CollectionPage',
  seoTitle: 'Free Quote Template for Freelancers',
  description: 'Use a photographer quote template to present a shoot, pricing, timeline, deliverables, usage rights, and a fast path to create quotes in Corvioz.',
  h1: 'Free Quote Template for Freelancers',
  intro: 'Turn a client request into a clear quote structure with scope, deliverables, pricing, timeline, assumptions, and next steps. Then create the final quote in Corvioz and keep it ready for invoice conversion.',
  previewTitle: 'Quote template fields',
  previewItems: [
    'Project summary and client request context',
    'Deliverables, pricing, timeline, and assumptions',
    'Revision limits, validity window, and next steps',
    'A connected path from quote approval to invoice creation',
  ],
  primaryCta: { label: 'Start Free', href: '/dashboard?action=create-profile' },
  secondaryCta: { label: 'Create Quote', href: '/quote-generator' },
  whyTitle: 'A strong quote reduces approval friction',
  whyBody: 'A quote is where freelancers set expectations before work begins. Corvioz helps you move from client inquiry to structured quote, then from approved quote to invoice without losing project context.',
  featureCards: [
    { title: 'Scope clarity', body: 'Explain what is included, what is excluded, and how pricing maps to deliverables.' },
    { title: 'Approval-ready pricing', body: 'Give clients a clean view of fixed fees, hourly estimates, milestones, and payment timing.' },
    { title: 'Invoice conversion path', body: 'Keep accepted quote details available when it is time to create the payment request.' },
  ],
  workflowTitle: 'How freelancers use this quote template',
  workflowSteps: [
    { title: 'Capture the client request', body: 'Start from the project message and identify services, deliverables, timeline, and constraints.' },
    { title: 'Create the quote in Corvioz', body: 'Use Corvioz to structure pricing and keep the quote tied to the client record.' },
    { title: 'Convert approved work into billing', body: 'After approval, use the same scope and pricing context to create an invoice.' },
  ],
  faq: [
    {
      question: 'What should a photographer quote template include?',
      answer: 'It should include client context, project scope, deliverables, pricing, timeline, assumptions, revision limits, validity period, and next steps for approval.',
    },
    {
      question: 'Can I create a quote from this template in Corvioz?',
      answer: 'Yes. Use this structure as the planning layer, then start free and create a saved quote connected to your client workflow.',
    },
    {
      question: 'Can a quote become an invoice later?',
      answer: 'Yes. Corvioz is built around a connected quote-to-invoice workflow so approved scope and pricing can become a client-ready invoice.',
    },
  ],
  finalCtaTitle: 'Create a client-ready quote in Corvioz',
  finalCtaBody: 'Start with the quote template, then keep your profile, client request, quote, and invoice path connected.',
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

export default function QuoteTemplateEntryPage() {
  return <SeoEntryLandingPage page={page} />;
}
