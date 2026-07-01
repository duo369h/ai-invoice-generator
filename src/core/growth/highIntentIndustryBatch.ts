export type HighIntentIndustryCategory =
  | 'Creative'
  | 'Marketing'
  | 'Technology'
  | 'Business'
  | 'FinanceLegal';

export type HighIntentIndustry = {
  label: string;
  slug: string;
  category: HighIntentIndustryCategory;
  pageFocus: 'invoice' | 'quote' | 'proposal' | 'client-workflow';
  seoPotential: 1 | 2 | 3 | 4 | 5;
  conversionPotential: 1 | 2 | 3 | 4 | 5;
  competitionLevel: 'Low' | 'Medium' | 'High';
  monetizationStrength: 1 | 2 | 3 | 4 | 5;
};

export type ValidationIndustryPage = {
  industry: string;
  slug: string;
  hero: {
    headline: string;
    subheadline: string;
    primaryCta: string;
    secondaryCta: string;
  };
  problemContext: string[];
  corviozSolution: string[];
  templatePreview: {
    title: string;
    fields: string[];
  };
  benefits: string[];
  faq: Array<{
    question: string;
    answer: string;
  }>;
  finalCta: string;
};

export const HIGH_INTENT_INDUSTRY_BATCH: HighIntentIndustry[] = [
  {
    label: 'Photographer',
    slug: 'photographer',
    category: 'Creative',
    pageFocus: 'quote',
    seoPotential: 5,
    conversionPotential: 5,
    competitionLevel: 'High',
    monetizationStrength: 5,
  },
  {
    label: 'Wedding Photographer',
    slug: 'wedding-photographer',
    category: 'Creative',
    pageFocus: 'quote',
    seoPotential: 5,
    conversionPotential: 5,
    competitionLevel: 'High',
    monetizationStrength: 5,
  },
  {
    label: 'Videographer',
    slug: 'videographer',
    category: 'Creative',
    pageFocus: 'quote',
    seoPotential: 4,
    conversionPotential: 5,
    competitionLevel: 'Medium',
    monetizationStrength: 5,
  },
  {
    label: 'Graphic Designer',
    slug: 'graphic-designer',
    category: 'Creative',
    pageFocus: 'proposal',
    seoPotential: 5,
    conversionPotential: 4,
    competitionLevel: 'High',
    monetizationStrength: 4,
  },
  {
    label: 'Brand Designer',
    slug: 'brand-designer',
    category: 'Creative',
    pageFocus: 'proposal',
    seoPotential: 4,
    conversionPotential: 4,
    competitionLevel: 'Medium',
    monetizationStrength: 5,
  },
  {
    label: 'Web Designer',
    slug: 'web-designer',
    category: 'Creative',
    pageFocus: 'proposal',
    seoPotential: 5,
    conversionPotential: 5,
    competitionLevel: 'High',
    monetizationStrength: 5,
  },
  {
    label: 'UI/UX Designer',
    slug: 'ui-ux-designer',
    category: 'Creative',
    pageFocus: 'proposal',
    seoPotential: 4,
    conversionPotential: 4,
    competitionLevel: 'Medium',
    monetizationStrength: 5,
  },
  {
    label: 'Marketing Consultant',
    slug: 'marketing-consultant',
    category: 'Marketing',
    pageFocus: 'proposal',
    seoPotential: 5,
    conversionPotential: 5,
    competitionLevel: 'High',
    monetizationStrength: 5,
  },
  {
    label: 'SEO Consultant',
    slug: 'seo-consultant',
    category: 'Marketing',
    pageFocus: 'proposal',
    seoPotential: 5,
    conversionPotential: 5,
    competitionLevel: 'High',
    monetizationStrength: 5,
  },
  {
    label: 'Copywriter',
    slug: 'copywriter',
    category: 'Marketing',
    pageFocus: 'quote',
    seoPotential: 4,
    conversionPotential: 4,
    competitionLevel: 'Medium',
    monetizationStrength: 4,
  },
  {
    label: 'Social Media Manager',
    slug: 'social-media-manager',
    category: 'Marketing',
    pageFocus: 'client-workflow',
    seoPotential: 4,
    conversionPotential: 4,
    competitionLevel: 'Medium',
    monetizationStrength: 4,
  },
  {
    label: 'Ads Specialist',
    slug: 'ads-specialist',
    category: 'Marketing',
    pageFocus: 'proposal',
    seoPotential: 4,
    conversionPotential: 5,
    competitionLevel: 'Medium',
    monetizationStrength: 5,
  },
  {
    label: 'Freelance Developer',
    slug: 'freelance-developer',
    category: 'Technology',
    pageFocus: 'proposal',
    seoPotential: 5,
    conversionPotential: 5,
    competitionLevel: 'High',
    monetizationStrength: 5,
  },
  {
    label: 'Shopify Expert',
    slug: 'shopify-expert',
    category: 'Technology',
    pageFocus: 'proposal',
    seoPotential: 5,
    conversionPotential: 5,
    competitionLevel: 'High',
    monetizationStrength: 5,
  },
  {
    label: 'WordPress Developer',
    slug: 'wordpress-developer',
    category: 'Technology',
    pageFocus: 'proposal',
    seoPotential: 5,
    conversionPotential: 4,
    competitionLevel: 'High',
    monetizationStrength: 4,
  },
  {
    label: 'Full Stack Developer',
    slug: 'full-stack-developer',
    category: 'Technology',
    pageFocus: 'proposal',
    seoPotential: 4,
    conversionPotential: 5,
    competitionLevel: 'Medium',
    monetizationStrength: 5,
  },
  {
    label: 'Business Consultant',
    slug: 'business-consultant',
    category: 'Business',
    pageFocus: 'proposal',
    seoPotential: 5,
    conversionPotential: 5,
    competitionLevel: 'High',
    monetizationStrength: 5,
  },
  {
    label: 'Startup Consultant',
    slug: 'startup-consultant',
    category: 'Business',
    pageFocus: 'proposal',
    seoPotential: 4,
    conversionPotential: 5,
    competitionLevel: 'Medium',
    monetizationStrength: 5,
  },
  {
    label: 'Project Manager',
    slug: 'project-manager',
    category: 'Business',
    pageFocus: 'client-workflow',
    seoPotential: 4,
    conversionPotential: 4,
    competitionLevel: 'Medium',
    monetizationStrength: 4,
  },
  {
    label: 'Virtual Assistant',
    slug: 'virtual-assistant',
    category: 'Business',
    pageFocus: 'invoice',
    seoPotential: 5,
    conversionPotential: 4,
    competitionLevel: 'High',
    monetizationStrength: 4,
  },
  {
    label: 'Accountant',
    slug: 'accountant',
    category: 'FinanceLegal',
    pageFocus: 'invoice',
    seoPotential: 4,
    conversionPotential: 5,
    competitionLevel: 'High',
    monetizationStrength: 5,
  },
  {
    label: 'Bookkeeper',
    slug: 'bookkeeper',
    category: 'FinanceLegal',
    pageFocus: 'invoice',
    seoPotential: 5,
    conversionPotential: 5,
    competitionLevel: 'High',
    monetizationStrength: 5,
  },
  {
    label: 'Lawyer',
    slug: 'freelance-lawyer',
    category: 'FinanceLegal',
    pageFocus: 'proposal',
    seoPotential: 4,
    conversionPotential: 5,
    competitionLevel: 'High',
    monetizationStrength: 5,
  },
  {
    label: 'Real Estate Agent',
    slug: 'real-estate-agent',
    category: 'FinanceLegal',
    pageFocus: 'invoice',
    seoPotential: 4,
    conversionPotential: 4,
    competitionLevel: 'High',
    monetizationStrength: 5,
  },
];

export const INDUSTRY_PAGE_TEMPLATE_SPEC = [
  {
    section: 'Hero',
    rule: 'Lead with the business outcome, not software features. Connect the headline to winning work or getting paid.',
  },
  {
    section: 'Problem Context',
    rule: 'Name the industry-specific friction: late payment, messy scope, weak quote, unclear invoice, or scattered client records.',
  },
  {
    section: 'Corvioz Solution',
    rule: 'Explain the Quote -> Invoice -> Payment workflow and how it removes handoff friction.',
  },
  {
    section: 'Template Preview',
    rule: 'Show a structured example with realistic project fields. Placeholder visuals are acceptable in validation mode.',
  },
  {
    section: 'Benefits',
    rule: 'Describe faster payment, clearer client decisions, stronger professionalism, and fewer follow-up gaps.',
  },
  {
    section: 'FAQ',
    rule: 'Use at least five industry-specific questions tied to purchase intent and workflow trust.',
  },
  {
    section: 'CTA',
    rule: 'Use Create Quote, Start Free, or Get Paid Faster depending on page intent.',
  },
] as const;

export const VALIDATION_INDUSTRY_PAGES: ValidationIndustryPage[] = [
  {
    industry: 'Photographer',
    slug: 'photographer',
    hero: {
      headline: 'Send photography quotes that turn shoots into paid invoices.',
      subheadline:
        'Corvioz helps photographers package session details, usage rights, deposits, and final balances into one client-ready flow.',
      primaryCta: 'Create Quote',
      secondaryCta: 'Preview Invoice',
    },
    problemContext: [
      'Photography clients often ask for a quote, delay approval, then need a clean invoice after the shoot.',
      'Session packages, editing scope, licensing, travel, and deposits can become messy when they live in separate documents.',
      'Late payment happens more often when the client never sees a clear path from booking to final balance.',
    ],
    corviozSolution: [
      'Start with a quote that explains package scope, usage rights, deliverables, deposit, and timeline.',
      'Convert the accepted quote into an invoice with the same project details and payment terms.',
      'Keep the client record, quote, invoice, and export history connected in one workspace.',
    ],
    templatePreview: {
      title: 'Photography Quote Preview',
      fields: [
        'Client name and shoot date',
        'Session package and location',
        'Editing and retouching scope',
        'Image usage or licensing terms',
        'Deposit due today',
        'Final balance due after delivery',
      ],
    },
    benefits: [
      'Look more professional before the client books.',
      'Reduce back-and-forth about what the shoot includes.',
      'Make deposits and final balances easier to collect.',
      'Keep future repeat bookings attached to the same client record.',
    ],
    faq: [
      {
        question: 'Can photographers use Corvioz for deposits?',
        answer:
          'Yes. The quote can show the deposit, final balance, payment timing, and what the client receives after payment.',
      },
      {
        question: 'Can I include image usage rights?',
        answer:
          'Yes. The page structure should include usage rights or licensing fields because this is a common photography purchase concern.',
      },
      {
        question: 'Is this only for wedding photographers?',
        answer:
          'No. The same workflow works for portrait, product, event, commercial, and real estate photography.',
      },
      {
        question: 'Can a quote become an invoice?',
        answer:
          'Yes. The conversion story should emphasize quote approval first, then invoice creation after the shoot is booked or delivered.',
      },
      {
        question: 'Why not use a generic invoice template?',
        answer:
          'Photography invoices often need shoot details, editing scope, licensing, and deposits. A generic template usually misses those details.',
      },
    ],
    finalCta: 'Create Quote',
  },
  {
    industry: 'Marketing Consultant',
    slug: 'marketing-consultant',
    hero: {
      headline: 'Turn marketing strategy calls into approved paid projects.',
      subheadline:
        'Corvioz helps marketing consultants package scope, monthly retainers, campaign milestones, and invoices without scattered docs.',
      primaryCta: 'Start Free',
      secondaryCta: 'Preview Proposal',
    },
    problemContext: [
      'Marketing work is hard to buy when the client cannot see scope, timeline, deliverables, and expected cadence.',
      'Retainers and campaign fees create payment friction when quotes, proposals, and invoices are disconnected.',
      'Clients hesitate when reporting, strategy, execution, and ad spend are not separated clearly.',
    ],
    corviozSolution: [
      'Create a proposal-style quote that separates strategy, execution, reporting, and optional campaign support.',
      'Turn the accepted scope into a recurring or milestone invoice workflow.',
      'Use the dashboard to keep client records, quotes, invoices, and follow-up actions connected.',
    ],
    templatePreview: {
      title: 'Marketing Consultant Proposal Preview',
      fields: [
        'Client growth objective',
        'Strategy and execution scope',
        'Monthly retainer or project fee',
        'Reporting cadence',
        'Optional campaign add-ons',
        'Invoice schedule',
      ],
    },
    benefits: [
      'Help clients understand what they are buying before they approve.',
      'Separate your service fee from ad spend or external costs.',
      'Make retainers easier to explain and renew.',
      'Reduce scope drift after the first strategy call.',
    ],
    faq: [
      {
        question: 'Can I use Corvioz for marketing retainers?',
        answer:
          'Yes. The validation page should show monthly scope, reporting cadence, payment timing, and renewal expectations.',
      },
      {
        question: 'Can I separate ad spend from my fee?',
        answer:
          'Yes. Marketing pages should clearly separate service fees from pass-through budget or client-managed ad accounts.',
      },
      {
        question: 'Does this work for SEO and paid ads?',
        answer:
          'Yes. The same quote-to-invoice structure can support SEO, paid media, content, email, and consulting packages.',
      },
      {
        question: 'Can I present milestones?',
        answer:
          'Yes. Marketing consultants can define kickoff, audit, strategy, campaign buildout, reporting, and optimization milestones.',
      },
      {
        question: 'Why is this better than sending a plain PDF?',
        answer:
          'A plain PDF can explain scope, but Corvioz connects scope to invoices, client records, payment timing, and follow-up.',
      },
    ],
    finalCta: 'Start Free',
  },
  {
    industry: 'Freelance Developer',
    slug: 'freelance-developer',
    hero: {
      headline: 'Scope development work clearly, then invoice without rebuilding the project record.',
      subheadline:
        'Corvioz helps freelance developers turn features, milestones, maintenance windows, and deployment support into a paid workflow.',
      primaryCta: 'Create Quote',
      secondaryCta: 'Preview Invoice',
    },
    problemContext: [
      'Development projects often change scope after the first call, which makes payment timing and delivery expectations unclear.',
      'Clients may approve features verbally but delay payment when milestones and handoff terms are not documented.',
      'Bug-fix windows, deployment support, and maintenance terms are easy to forget in generic quotes.',
    ],
    corviozSolution: [
      'Create a quote that defines feature scope, milestones, technical assumptions, and acceptance criteria.',
      'Convert approved milestones into invoices without retyping the project details.',
      'Keep the client, quote, invoice, and project payment state visible in one dashboard.',
    ],
    templatePreview: {
      title: 'Freelance Developer Quote Preview',
      fields: [
        'Feature scope',
        'Milestones and delivery dates',
        'Technical assumptions',
        'Deployment support',
        'Bug-fix window',
        'Milestone invoice schedule',
      ],
    },
    benefits: [
      'Reduce unpaid scope creep before it starts.',
      'Make milestone payments easier for clients to approve.',
      'Connect project delivery and payment timing.',
      'Look more professional than sending a loose estimate in email.',
    ],
    faq: [
      {
        question: 'Can developers use Corvioz for milestone billing?',
        answer:
          'Yes. The validation page should show milestone names, dates, amounts, and when each invoice should be sent.',
      },
      {
        question: 'Can I include a bug-fix window?',
        answer:
          'Yes. Developer pages should include support windows, exclusions, and maintenance terms because they affect client expectations.',
      },
      {
        question: 'Does this work for fixed-price projects?',
        answer:
          'Yes. Corvioz can position the quote around fixed scope, milestone payment, and delivery acceptance.',
      },
      {
        question: 'Can I use this for retainers?',
        answer:
          'Yes. Developer retainers can be framed around monthly support hours, response expectations, and invoice cadence.',
      },
      {
        question: 'Why not just use project management software?',
        answer:
          'Project management tools track tasks. Corvioz should own the revenue workflow from quote to invoice to payment follow-up.',
      },
    ],
    finalCta: 'Create Quote',
  },
];

export const CONVERSION_FRAMEWORK = {
  hero: [
    'Use one outcome-based headline that names the industry and payment outcome.',
    'Keep the subheadline focused on Quote -> Invoice -> Payment, not broad feature lists.',
    'Put one primary CTA above the fold and one supporting preview CTA when useful.',
  ],
  ctaPlacement: [
    'Hero primary CTA.',
    'After problem context when the pain is clear.',
    'After template preview when the user has seen the output.',
    'Final CTA after FAQ.',
  ],
  trustInjection: [
    'Show data ownership near template preview for professional services.',
    'Reference Paddle only when payment trust is relevant.',
    'Use industry-specific example fields instead of generic trust badges.',
  ],
  pricingAnchor: [
    'Place pricing link after the solution or benefits section, not before the user sees value.',
    'Anchor price against saved admin time, faster approval, and fewer unpaid revisions.',
  ],
  invoiceExample: [
    'Position invoice examples after quote/proposal value is understood.',
    'Use deposits, milestones, final balance, and payment terms as concrete proof.',
  ],
} as const;

export const INTERNAL_LINKING_STRATEGY = [
  {
    source: '/industry/[industry]',
    targets: [
      '/invoice-template/[industry]',
      '/quote-template/[industry]',
      '/pricing-guide/[industry]',
      '/proposal-template/[industry]',
    ],
  },
  {
    source: '/invoice-template/[industry]',
    targets: [
      '/quote-template/[industry]',
      '/pricing-guide/[industry]',
      '/resources/invoice-vs-quote',
      '/pricing',
    ],
  },
  {
    source: '/quote-template/[industry]',
    targets: [
      '/invoice-template/[industry]',
      '/proposal-template/[industry]',
      '/pricing-guide/[industry]',
      '/dashboard?tool=quote',
    ],
  },
  {
    source: '/pricing-guide/[industry]',
    targets: [
      '/quote-template/[industry]',
      '/invoice-template/[industry]',
      '/resources/payment-terms',
      '/pricing',
    ],
  },
] as const;

export const PHASE2_BATCH_NOTE =
  'The user-facing request says 20 industries, but the locked list contains 24 named industries. This definition preserves the full locked set and does not add any extra industries.';
