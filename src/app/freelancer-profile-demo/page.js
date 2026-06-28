import SeoEntryLandingPage from '../components/SeoEntryLandingPage';

const page = {
  path: '/freelancer-profile-demo',
  analyticsSlug: 'freelancer_profile_demo',
  schemaType: 'ProfilePage',
  seoTitle: 'Freelancer Profile Demo',
  description: 'See a freelancer profile demo with services, proof, pricing context, availability, and quote request flow built for the Corvioz freelancer workflow.',
  h1: 'Freelancer Profile Demo',
  intro: 'See how a Corvioz public profile can present your services, proof, starting price, availability, and quote request path in one client-ready page before you create your own.',
  previewTitle: 'Profile demo highlights',
  previewItems: [
    'Public profile with services, bio, portfolio, and proof',
    'Quote request path for incoming project inquiries',
    'Pricing context, availability, response time, and location',
    'A connected workflow from profile lead to quote and invoice',
  ],
  primaryCta: { label: 'Start Free', href: '/dashboard?action=create-profile' },
  secondaryCta: { label: 'View Demo Profile', href: '/profile/demo' },
  whyTitle: 'A public profile should do more than list your bio',
  whyBody: 'Freelancers need a profile that helps clients understand services, trust signals, availability, and the next step. Corvioz keeps the profile connected to lead capture, quotes, invoices, and client portals.',
  featureCards: [
    { title: 'Service packaging', body: 'Show what you offer with clear service names, descriptions, starting prices, and project context.' },
    { title: 'Client trust signals', body: 'Present testimonials, portfolio examples, location, response time, and availability without a custom website build.' },
    { title: 'Lead-to-billing flow', body: 'Turn profile inquiries into structured client records, quotes, invoices, and payment follow-up.' },
  ],
  workflowTitle: 'How freelancers use the profile demo',
  workflowSteps: [
    { title: 'Review the demo profile', body: 'See how a public Corvioz profile organizes services, proof, pricing context, and quote requests.' },
    { title: 'Create your own profile', body: 'Start free and add your own services, bio, portfolio examples, and client-facing details.' },
    { title: 'Use it as your entry point', body: 'Share the profile with prospects and keep incoming requests connected to quotes and invoices.' },
  ],
  faq: [
    {
      question: 'What is included in the Corvioz freelancer profile demo?',
      answer: 'The demo shows a public profile with a freelancer bio, services, proof, portfolio context, starting price, availability, and a quote request path.',
    },
    {
      question: 'Can I create my own freelancer profile in Corvioz?',
      answer: 'Yes. Start free to create a public profile and connect it to the quote, invoice, and client portal workflow.',
    },
    {
      question: 'Is the profile demo the same as a marketplace listing?',
      answer: 'No. The profile is a client-facing business page for your own workflow. Corvioz focuses on helping freelancers win clients, quote work, invoice, and get paid faster.',
    },
  ],
  finalCtaTitle: 'Create your freelancer profile in Corvioz',
  finalCtaBody: 'Use the demo as a reference, then create a profile that connects new leads to quotes, invoices, and client records.',
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

export default function FreelancerProfileDemoPage() {
  return <SeoEntryLandingPage page={page} />;
}
