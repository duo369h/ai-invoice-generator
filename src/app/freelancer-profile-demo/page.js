import SeoEntryLandingPage from '../components/SeoEntryLandingPage';

const page = {
  path: '/freelancer-profile-demo',
  analyticsSlug: 'freelancer_profile_demo',
  schemaType: 'ProfilePage',
  seoTitle: 'Photographer Public Profile Demo',
  description: 'See a photographer Public Profile demo with services, proof, pricing context, availability, and a quote request flow built for photography businesses.',
  h1: 'Photographer Public Profile Demo',
  intro: 'See how a Corvioz public profile can present your services, proof, starting price, availability, and quote request path in one client-ready page before you create your own.',
  previewTitle: 'Profile demo highlights',
  previewItems: [
    'Public profile with services, bio, portfolio, and proof',
    'Quote request path for incoming project inquiries',
    'Pricing context, availability, response time, and location',
    'A connected workflow from profile lead to quote and client document',
  ],
  primaryCta: { label: 'Start Free', href: '/dashboard?action=create-profile' },
  secondaryCta: { label: 'View Demo Profile', href: '/profile/demo' },
  whyTitle: 'A public profile should do more than list your bio',
  whyBody: 'Freelancers need a profile that helps clients understand services, trust signals, availability, and the next step. Corvioz keeps the profile connected to lead capture, quotes, client documents, and client portals.',
  featureCards: [
    { title: 'Service packaging', body: 'Show what you offer with clear service names, descriptions, starting prices, and project context.' },
    { title: 'Client trust signals', body: 'Present testimonials, portfolio examples, location, response time, and availability without a custom website build.' },
    { title: 'Lead-to-client workflow', body: 'Turn profile inquiries into structured client records, quotes, client documents, and organized follow-up.' },
  ],
  workflowTitle: 'How freelancers use the profile demo',
  workflowSteps: [
    { title: 'Review the demo profile', body: 'See how a public Corvioz profile organizes services, proof, pricing context, and quote requests.' },
    { title: 'Create your own profile', body: 'Start free and add your own services, bio, portfolio examples, and client-facing details.' },
    { title: 'Use it as your entry point', body: 'Share the profile with prospects and keep incoming requests connected to quotes and client documents.' },
  ],
  faq: [
    {
      question: 'What is included in the Corvioz photographer Public Profile demo?',
      answer: 'The demo shows a Public Profile with a photographer bio, services, proof, portfolio context, starting price, availability, and a quote request path.',
    },
    {
      question: 'Can I create my own Public Profile in Corvioz?',
      answer: 'Yes. Start free to create a public profile and connect it to the quote, client document, and client portal workflow.',
    },
    {
      question: 'Is the profile demo the same as a marketplace listing?',
      answer: 'No. The profile is a client-facing business page for your own workflow. Corvioz focuses on helping freelancers organize quotes, invoices, client documents, and client records.',
    },
  ],
  finalCtaTitle: 'Create your Public Profile in Corvioz',
  finalCtaBody: 'Use the demo as a reference, then create a profile that connects new leads to quotes, client documents, and client records.',
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
