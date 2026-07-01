export type GrowthContentCategory =
  | 'invoice-templates'
  | 'quote-templates'
  | 'proposal-templates'
  | 'pricing-guides'
  | 'resources'
  | 'freelancer-guides'
  | 'industry-pages'
  | 'comparison-pages'
  | 'help-center';

export type GrowthIndustryGroup =
  | 'Creative'
  | 'Technology'
  | 'Marketing'
  | 'Business'
  | 'Finance'
  | 'Legal'
  | 'Real Estate'
  | 'Health'
  | 'Education'
  | 'Events'
  | 'Travel'
  | 'Ecommerce'
  | 'AI';

export type GrowthIndustry = {
  group: GrowthIndustryGroup;
  label: string;
  slug: string;
  primaryIntent: 'invoice' | 'quote' | 'proposal' | 'pricing-guide';
  priority: 1 | 2 | 3;
};

export type GrowthUrlPattern = {
  category: GrowthContentCategory;
  pattern: string;
  example: string;
  intent: string;
};

export const GROWTH_CONTENT_TREE: Record<GrowthContentCategory, {
  label: string;
  purpose: string;
  connectsTo: GrowthContentCategory[];
}> = {
  'invoice-templates': {
    label: 'Invoice Templates',
    purpose: 'Capture users who need a client-ready invoice format for their service category.',
    connectsTo: ['quote-templates', 'pricing-guides', 'industry-pages', 'help-center'],
  },
  'quote-templates': {
    label: 'Quote Templates',
    purpose: 'Capture pre-sale intent before a freelancer has won the client.',
    connectsTo: ['invoice-templates', 'proposal-templates', 'pricing-guides', 'resources'],
  },
  'proposal-templates': {
    label: 'Proposal Templates',
    purpose: 'Serve higher-consideration projects where scope, timeline, and outcomes need explanation.',
    connectsTo: ['quote-templates', 'pricing-guides', 'freelancer-guides', 'comparison-pages'],
  },
  'pricing-guides': {
    label: 'Pricing Guides',
    purpose: 'Help freelancers price services and move from uncertainty to a quote or proposal.',
    connectsTo: ['quote-templates', 'invoice-templates', 'resources', 'industry-pages'],
  },
  resources: {
    label: 'Resources',
    purpose: 'Answer evergreen workflow questions such as invoice vs quote, payment terms, and deposits.',
    connectsTo: ['invoice-templates', 'quote-templates', 'freelancer-guides', 'help-center'],
  },
  'freelancer-guides': {
    label: 'Freelancer Guides',
    purpose: 'Teach revenue workflow basics for independent professionals.',
    connectsTo: ['pricing-guides', 'resources', 'industry-pages', 'help-center'],
  },
  'industry-pages': {
    label: 'Industry Pages',
    purpose: 'Create one industry hub that routes users to templates, guides, examples, and CTA paths.',
    connectsTo: ['invoice-templates', 'quote-templates', 'proposal-templates', 'pricing-guides'],
  },
  'comparison-pages': {
    label: 'Comparison Pages',
    purpose: 'Capture alternative-aware users who compare Corvioz with adjacent freelancer tools.',
    connectsTo: ['resources', 'pricing-guides', 'help-center', 'industry-pages'],
  },
  'help-center': {
    label: 'Help Center',
    purpose: 'Provide trust, support, legal, and documentation entry points from every growth surface.',
    connectsTo: ['resources', 'freelancer-guides', 'comparison-pages', 'industry-pages'],
  },
};

const industryGroups: Record<GrowthIndustryGroup, string[]> = {
  Creative: [
    'Photography',
    'Wedding Photography',
    'Portrait Photography',
    'Commercial Photography',
    'Real Estate Photography',
    'Food Photography',
    'Product Photography',
    'Drone Photography',
    'Fashion Photography',
    'Sports Photography',
    'Pet Photography',
    'Travel Photography',
    'Videography',
    'Wedding Videography',
    'Commercial Videography',
    'Graphic Design',
    'Brand Design',
    'Logo Design',
    'UI Design',
    'UX Design',
    'Illustration',
    'Motion Design',
    'Animation',
    '3D Artist',
    'Audio Production',
    'Podcast Editing',
  ],
  Technology: [
    'Web Developer',
    'Frontend Developer',
    'Backend Developer',
    'Full Stack Developer',
    'Mobile Developer',
    'Shopify Developer',
    'WordPress Developer',
    'AI Developer',
    'DevOps',
    'Cloud Consultant',
    'Cybersecurity',
  ],
  Marketing: [
    'Marketing Consultant',
    'SEO Consultant',
    'PPC Specialist',
    'Google Ads',
    'Facebook Ads',
    'Email Marketing',
    'Content Marketing',
    'Social Media Manager',
    'Copywriter',
    'Content Writer',
    'Community Manager',
  ],
  Business: [
    'Business Consultant',
    'Startup Consultant',
    'Operations Consultant',
    'Project Manager',
    'Product Manager',
    'Virtual Assistant',
  ],
  Finance: [
    'Accountant',
    'Bookkeeper',
    'Tax Consultant',
    'Fractional CFO',
    'Financial Consultant',
  ],
  Legal: [
    'Lawyer',
    'Contract Consultant',
    'Compliance Consultant',
    'Immigration Consultant',
  ],
  'Real Estate': [
    'Realtor',
    'Property Consultant',
    'Interior Designer',
    'Home Stager',
  ],
  Health: [
    'Personal Trainer',
    'Nutrition Coach',
    'Yoga Instructor',
    'Fitness Coach',
    'Wellness Coach',
  ],
  Education: [
    'Tutor',
    'Online Teacher',
    'Course Creator',
    'Career Coach',
    'Business Coach',
    'Executive Coach',
  ],
  Events: [
    'Wedding Planner',
    'Event Planner',
    'DJ',
    'MC',
    'Speaker',
  ],
  Travel: [
    'Travel Consultant',
    'Tour Guide',
    'Travel Photographer',
  ],
  Ecommerce: [
    'Shopify Expert',
    'Amazon Consultant',
    'Etsy Consultant',
    'Ecommerce Manager',
  ],
  AI: [
    'AI Consultant',
    'AI Automation Consultant',
    'Prompt Engineer',
    'AI Workflow Consultant',
  ],
};

const priorityOneLabels = new Set([
  'Photography',
  'Wedding Photography',
  'Commercial Photography',
  'Product Photography',
  'Graphic Design',
  'Web Developer',
  'Frontend Developer',
  'Shopify Developer',
  'Marketing Consultant',
  'SEO Consultant',
  'Copywriter',
  'Business Consultant',
  'Virtual Assistant',
  'Bookkeeper',
  'AI Consultant',
  'AI Automation Consultant',
]);

const priorityTwoLabels = new Set([
  'Portrait Photography',
  'Real Estate Photography',
  'Food Photography',
  'Videography',
  'Brand Design',
  'Logo Design',
  'UI Design',
  'UX Design',
  'Backend Developer',
  'Full Stack Developer',
  'WordPress Developer',
  'PPC Specialist',
  'Google Ads',
  'Email Marketing',
  'Content Marketing',
  'Social Media Manager',
  'Content Writer',
  'Startup Consultant',
  'Operations Consultant',
  'Product Manager',
  'Accountant',
  'Tax Consultant',
  'Realtor',
  'Personal Trainer',
  'Business Coach',
  'Wedding Planner',
  'Travel Photographer',
  'Shopify Expert',
  'Prompt Engineer',
]);

function toSlug(label: string): string {
  return label
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function getPrimaryIntent(label: string): GrowthIndustry['primaryIntent'] {
  if (label.includes('Consultant') || label.includes('Developer') || label.includes('Design')) {
    return 'proposal';
  }

  if (label.includes('Photography') || label.includes('Videography') || label.includes('Planner')) {
    return 'quote';
  }

  return 'invoice';
}

function getPriority(label: string): GrowthIndustry['priority'] {
  if (priorityOneLabels.has(label)) return 1;
  if (priorityTwoLabels.has(label)) return 2;
  return 3;
}

export const GROWTH_INDUSTRY_MATRIX: GrowthIndustry[] = Object.entries(industryGroups).flatMap(
  ([group, labels]) =>
    labels.map((label) => ({
      group: group as GrowthIndustryGroup,
      label,
      slug: toSlug(label),
      primaryIntent: getPrimaryIntent(label),
      priority: getPriority(label),
    })),
);

export const TEMPLATE_PAGE_STANDARD = [
  'Hero',
  'Preview Example',
  'Best Practices',
  'Common Mistakes',
  'FAQ',
  'Related Resources',
  'CTA',
] as const;

export const GROWTH_URL_ARCHITECTURE: GrowthUrlPattern[] = [
  {
    category: 'invoice-templates',
    pattern: '/invoice-template/[industry]',
    example: '/invoice-template/photographer',
    intent: 'High-intent users who need a billable invoice format now.',
  },
  {
    category: 'quote-templates',
    pattern: '/quote-template/[industry]',
    example: '/quote-template/graphic-designer',
    intent: 'Pre-sale users who need to price and scope work before client approval.',
  },
  {
    category: 'proposal-templates',
    pattern: '/proposal-template/[industry]',
    example: '/proposal-template/marketing-consultant',
    intent: 'Higher-value project users who need a structured offer, timeline, and outcome story.',
  },
  {
    category: 'pricing-guides',
    pattern: '/pricing-guide/[industry]',
    example: '/pricing-guide/freelance-photographer',
    intent: 'Users researching what to charge before creating a quote or proposal.',
  },
  {
    category: 'resources',
    pattern: '/resources/[topic]',
    example: '/resources/invoice-vs-quote',
    intent: 'Evergreen education with internal links into quote, invoice, and pricing workflows.',
  },
  {
    category: 'comparison-pages',
    pattern: '/compare/[competitor]',
    example: '/compare/corvioz-vs-bonsai',
    intent: 'Alternative-aware users comparing freelancer revenue tools.',
  },
  {
    category: 'help-center',
    pattern: '/help',
    example: '/help',
    intent: 'Trust and support navigation for users evaluating Corvioz.',
  },
];

export const INTERNAL_LINK_RULES = [
  'Every template page links to the matching industry page, a related pricing guide, one adjacent template, one resource, and one product CTA.',
  'Every pricing guide links to at least one quote template, one invoice template, one resource, and the pricing page.',
  'Every comparison page links to trust, pricing, help center, and one money page instead of isolated sign-up pressure.',
  'Every help center article can link back to resources, but legal and trust pages should avoid aggressive conversion copy.',
  'Priority 1 pages should receive links from the landing page, pricing page, footer resources, and related template hubs when implemented.',
] as const;

export const CONTENT_STYLE_GUIDE = {
  tone: 'Plainspoken, practical, revenue-focused, and specific to freelancers.',
  voice: 'Outcome before feature. Explain how the user wins a client, sends the work, or gets paid.',
  headings: 'Use one H1, then H2 sections matching the canonical template standard. Avoid clever headings that hide search intent.',
  ctas: 'CTA copy should describe the next revenue action, such as Create Quote or Create Invoice.',
  faq: 'Answer purchase and workflow objections directly in two to four sentences.',
  examples: 'Use realistic client work examples, line items, deposits, milestones, and payment terms.',
  brandLanguage: 'Use Quote, Proposal, Invoice, Client, Client Portal, Dashboard, and Workspace consistently.',
} as const;

export const FUTURE_GROWTH_ROADMAP = [
  'Phase 2: Publish roughly 20 Priority 1 industry pages using the canonical page standard.',
  'Phase 3: Add proposal-template and pricing-guide dynamic foundations after invoice and quote pages prove quality.',
  'Phase 4: Build comparison pages only for high-intent alternatives with honest positioning and trust links.',
  'Phase 5: Add case studies and customer stories once real usage evidence exists.',
  'Phase 6: Expand resources into a maintained resource center instead of bulk low-quality articles.',
  'Phase 7: Evaluate AI-generated template drafts only with human review and canonical style constraints.',
] as const;
