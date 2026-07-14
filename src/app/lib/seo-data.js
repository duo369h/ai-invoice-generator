const industries = [
  {
    slug: 'consultant',
    singular: 'consultant',
    plural: 'consultants',
    label: 'Consultant',
    audience: 'strategy, operations, growth, finance, and business consultants',
    deliverables: ['advisory hours', 'research deliverables', 'workshop sessions', 'retainer period', 'expense reimbursement'],
    invoiceExampleFields: ['Retainer period', 'Advisory hours', 'Workshop sessions', 'Research deliverables', 'Approved expenses', 'Invoice terms'],
    quoteExampleFields: ['Business goal', 'Scope of advisory work', 'Timeline', 'Retainer or fixed fee', 'Success milestones', 'Optional add-ons'],
  },
  {
    slug: 'graphic-designer',
    singular: 'graphic designer',
    plural: 'graphic designers',
    label: 'Graphic Designer',
    audience: 'brand, print, packaging, and marketing designers',
    deliverables: ['design concepts', 'revision rounds', 'final file formats', 'brand asset handoff', 'usage rights'],
    invoiceExampleFields: ['Project name', 'Design concepts', 'Revision rounds', 'Final files', 'Usage rights', 'Balance due'],
    quoteExampleFields: ['Design scope', 'Concept count', 'Revision limit', 'File handoff', 'Brand usage', 'Project fee'],
  },
  {
    slug: 'web-designer',
    singular: 'web designer',
    plural: 'web designers',
    label: 'Web Designer',
    audience: 'freelance web designers, Webflow designers, and landing page specialists',
    deliverables: ['page count', 'wireframes', 'responsive design', 'CMS setup', 'launch support'],
    invoiceExampleFields: ['Page package', 'Design phase', 'Responsive QA', 'CMS setup', 'Launch support', 'Milestone invoice'],
    quoteExampleFields: ['Website goals', 'Page count', 'Design system needs', 'CMS requirements', 'Timeline', 'Milestone pricing'],
  },
  {
    slug: 'developer',
    singular: 'developer',
    plural: 'developers',
    label: 'Developer',
    audience: 'software developers, automation builders, and technical freelancers',
    deliverables: ['feature milestones', 'repository access', 'bug-fix window', 'deployment support', 'maintenance terms'],
    invoiceExampleFields: ['Sprint or milestone', 'Feature scope', 'Engineering hours', 'Deployment support', 'Maintenance terms', 'Invoice schedule'],
    quoteExampleFields: ['Technical scope', 'Milestones', 'Stack requirements', 'QA window', 'Deployment plan', 'Estimated fee'],
  },
  {
    slug: 'marketer',
    singular: 'marketer',
    plural: 'marketers',
    label: 'Marketer',
    audience: 'growth marketers, performance media specialists, SEO freelancers, and campaign strategists',
    deliverables: ['campaign setup', 'ad creative coordination', 'reporting cadence', 'testing budget', 'strategy deliverables'],
    invoiceExampleFields: ['Campaign period', 'Channel scope', 'Strategy deliverables', 'Reporting cadence', 'Management fee', 'Approved expenses'],
    quoteExampleFields: ['Growth goal', 'Channel mix', 'Campaign timeline', 'Reporting plan', 'Management fee', 'Optional testing budget'],
  },
  {
    slug: 'copywriter',
    singular: 'copywriter',
    plural: 'copywriters',
    label: 'Copywriter',
    audience: 'website, email, sales page, and content copywriters',
    deliverables: ['word count or page count', 'research time', 'revision rounds', 'tone guidelines', 'delivery format'],
    invoiceExampleFields: ['Copy asset', 'Word count or page count', 'Research time', 'Revision rounds', 'Delivery format', 'Final invoice'],
    quoteExampleFields: ['Copy goal', 'Asset type', 'Word count', 'Revision limit', 'Research needs', 'Project price'],
  },
  {
    slug: 'coach',
    singular: 'coach',
    plural: 'coaches',
    label: 'Coach',
    audience: 'business, executive, career, wellness, and creator coaches',
    deliverables: ['session package', 'program duration', 'support channel', 'resource materials', 'renewal terms'],
    invoiceExampleFields: ['Coaching package', 'Session count', 'Program dates', 'Support channel', 'Materials included', 'Renewal terms'],
    quoteExampleFields: ['Client goal', 'Program length', 'Session cadence', 'Support level', 'Materials included', 'Package fee'],
  },
  {
    slug: 'virtual-assistant',
    singular: 'virtual assistant',
    plural: 'virtual assistants',
    label: 'Virtual Assistant',
    audience: 'administrative, operations, inbox, scheduling, and ecommerce assistants',
    deliverables: ['monthly hours', 'task categories', 'response expectations', 'tool access', 'overage rate'],
    invoiceExampleFields: ['Service period', 'Hours used', 'Task category', 'Tool access costs', 'Overage rate', 'Next renewal date'],
    quoteExampleFields: ['Support needs', 'Monthly hours', 'Task categories', 'Response time', 'Tool requirements', 'Monthly retainer'],
  },
  {
    slug: 'contractor',
    singular: 'contractor',
    plural: 'contractors',
    label: 'Contractor',
    audience: 'independent trades, home service, repair, and field service contractors',
    deliverables: ['labor line items', 'materials', 'site visit details', 'change orders', 'deposit and balance'],
    invoiceExampleFields: ['Job address', 'Labor line items', 'Materials', 'Change orders', 'Deposit noted', 'Final amount'],
    quoteExampleFields: ['Job address', 'Scope of work', 'Materials estimate', 'Labor estimate', 'Timeline', 'Deposit required'],
  },
];

export const templateIndustries = industries;

export const templateIndustrySlugs = industries.map((industry) => industry.slug);

export function getTemplateIndustry(slug) {
  return industries.find((industry) => industry.slug === slug);
}

export const seoGrowthRoutes = {
  tools: {
    invoice: '/invoice-generator',
    quote: '/quote-generator',
  },
  templates: {
    invoice: (industry) => `/invoice-template/${industry}`,
    quote: (industry) => `/quote-template/${industry}`,
  },
  profile: (username) => username ? `/profile/${username}` : '/freelancers',
  blog: (slug = 'how-to-price-web-design-projects') => `/blog/${slug}`,
};

export const coreMoneyPages = {
  '/invoice-generator': {
    slug: 'invoice-generator',
    productType: 'invoice',
    title: 'Invoices for Photographers',
    seoTitle: 'Invoices for Photographers in the US & Canada',
    description: 'Create professional photographer invoice documents with client details, line items, taxes, client document links, PDF export, and payment status tracking in Corvioz.',
    h1: 'Invoices for Photographers',
    intro: 'Create a clean, client-ready invoice document without a heavy document setup. Corvioz helps photographers in the US and Canada turn completed shoots into professional invoices with clear line items, payment terms, and PDF export.',
    primaryCta: 'Create Invoice',
    primaryHref: '/dashboard?tool=invoice',
    secondaryCta: 'Create Quote First',
    secondaryHref: '/quote-generator',
    useCases: ['Send invoice documents for project milestones', 'Track pending, completed, and overdue invoice documents', 'Attach client document links and export branded PDFs'],
    faq: [
      {
        question: 'Can I create a photographer invoice without signing up?',
        answer: 'You can review the invoice workflow, then create an account when you want saved history, profile data, and client-ready records.',
      },
      {
        question: 'Does this invoice generator support US and Canadian photographers?',
        answer: 'Yes. Corvioz is designed around common US and Canadian photography businesses, including client details, tax fields, PDF export, and invoice notes.',
      },
      {
        question: 'Can I add my own client document link?',
        answer: 'Yes. You can include your own document instructions or client document link so clients know how to review the invoice document.',
      },
    ],
  },
  '/quote-generator': {
    slug: 'quote-generator',
    productType: 'quote',
    title: 'Quote Generator for Photographers',
    seoTitle: 'Quote Generator for Photographers | Create Client Quotes',
    description: 'Create professional photography quotes with shoot details, deposits, optional services, pricing, usage rights, and client approval.',
    h1: 'Quote Generator for Photographers',
    intro: 'Create a polished quote before the shoot begins. Corvioz helps photographers define shoot details, deposits, pricing, optional add-ons, and usage rights so clients can understand the offer and approve with confidence.',
    primaryCta: 'Create Quote',
    primaryHref: '/dashboard?tool=quote',
    secondaryCta: 'Create Invoice After Approval',
    secondaryHref: '/invoice-generator',
    useCases: ['Send clear project estimates before kickoff', 'Break work into milestones and optional add-ons', 'Convert approved quotes into invoices'],
    faq: [
      {
        question: 'Is a quote the same as an invoice?',
        answer: 'No. A quote estimates the scope and price before work starts. An invoice document records completed or delivered work for client review.',
      },
      {
        question: 'Can I convert a quote into an invoice?',
        answer: 'Yes. Corvioz is built around a quote-to-invoice workflow so approved estimates can become billable invoices.',
      },
      {
        question: 'Who should use a photographer quote generator?',
        answer: 'Any photographer who sells shoots, packages, add-ons, or staged services can use a quote generator to make pricing and usage rights clear.',
      },
    ],
  },
};

export const coreMoneyPagePaths = Object.keys(coreMoneyPages);

export function getCoreMoneyPage(pathname) {
  return coreMoneyPages[pathname];
}

const programmaticAudiences = [
  ['freelancer', 'Photographer', 'independent photographers and photography businesses'],
  ['contractor', 'Contractor', 'independent contractors and field service providers'],
  ['designer', 'Designer', 'brand, graphic, product, and web designers'],
  ['developer', 'Developer', 'software developers and technical consultants'],
  ['consultant', 'Consultant', 'business, strategy, and operations consultants'],
  ['agency', 'Agency', 'small agencies and client service studios'],
  ['photographer', 'Photographer', 'portrait, event, product, and commercial photographers'],
  ['marketer', 'Marketer', 'growth, SEO, content, and paid media marketers'],
  ['copywriter', 'Copywriter', 'website, email, and sales page copywriters'],
  ['coach', 'Coach', 'business, career, wellness, and executive coaches'],
  ['virtual-assistant', 'Virtual Assistant', 'administrative and operations assistants'],
  ['web-designer', 'Web Designer', 'freelance web designers and landing page specialists'],
  ['graphic-designer', 'Graphic Designer', 'brand, print, and marketing designers'],
  ['seo-specialist', 'SEO Specialist', 'SEO consultants and search marketing freelancers'],
  ['social-media-manager', 'Social Media Manager', 'social media freelancers and campaign managers'],
  ['content-writer', 'Content Writer', 'blog, newsletter, and editorial writers'],
  ['bookkeeper', 'Bookkeeper', 'freelance bookkeepers and accounting support providers'],
  ['videographer', 'Videographer', 'event, brand, and commercial video freelancers'],
  ['translator', 'Translator', 'freelance translators and localization specialists'],
  ['editor', 'Editor', 'copy editors, video editors, and content editors'],
  ['illustrator', 'Illustrator', 'freelance illustrators and visual artists'],
  ['architect', 'Architect', 'independent architects and design consultants'],
  ['product-manager', 'Product Manager', 'fractional product managers and consultants'],
  ['recruiter', 'Recruiter', 'freelance recruiters and hiring consultants'],
];

const programmaticCountries = [
  ['us', 'US', 'freelancers managing client documents in the United States'],
  ['usa', 'USA', 'US-based freelancers and small service businesses'],
  ['united-states', 'United States', 'independent professionals in the United States'],
  ['canada', 'Canada', 'freelancers and contractors managing Canadian client documents'],
  ['uk', 'UK', 'freelancers working with clients in the United Kingdom'],
  ['australia', 'Australia', 'Australian freelancers and service businesses'],
  ['new-zealand', 'New Zealand', 'New Zealand freelancers and consultants'],
  ['ireland', 'Ireland', 'Irish freelancers and independent consultants'],
  ['singapore', 'Singapore', 'Singapore-based freelancers and agencies'],
  ['india', 'India', 'Indian freelancers and service providers working with clients'],
];

const programmaticUseCases = [
  ['client-documents', 'Client Documents', 'freelancers who need a clear client document workflow'],
  ['project-estimate', 'Project Estimate', 'project-based service providers preparing estimates'],
  ['milestone-invoice', 'Milestone Invoice', 'freelancers organizing project milestone documents'],
  ['retainer', 'Retainer', 'consultants and agencies selling monthly retainers'],
  ['hourly-work', 'Hourly Work', 'service providers documenting tracked hourly work'],
  ['fixed-price-project', 'Fixed Price Project', 'freelancers selling fixed-scope projects'],
  ['deposit-record', 'Deposit Record', 'professionals recording deposits before work starts'],
  ['rush-project', 'Rush Project', 'freelancers pricing urgent or expedited work'],
  ['creative-services', 'Creative Services', 'design, photography, and content professionals'],
  ['consulting-services', 'Consulting Services', 'business and technical consultants'],
  ['web-design-project', 'Web Design Project', 'web designers quoting and documenting website work'],
  ['software-project', 'Software Project', 'developers quoting and documenting software projects'],
  ['marketing-campaign', 'Marketing Campaign', 'marketers documenting campaign work and retainers'],
  ['photo-shoot', 'Photo Shoot', 'photographers documenting sessions and deliverables'],
  ['content-package', 'Content Package', 'writers and creators selling content packages'],
  ['maintenance-work', 'Maintenance Work', 'freelancers documenting support and maintenance'],
  ['subscription-service', 'Subscription Service', 'providers selling recurring services'],
  ['document-records', 'Document Records', 'freelancers keeping cleaner client records'],
];

function titleCase(slug) {
  return slug
    .split('-')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function buildProgrammaticEntries(source, category) {
  return source.map(([slug, label, audience]) => ({
    slug,
    category,
    label,
    audience,
  }));
}

export const programmaticSeoSegments = [
  ...buildProgrammaticEntries(programmaticAudiences, 'type'),
  ...buildProgrammaticEntries(programmaticCountries, 'country'),
  ...buildProgrammaticEntries(programmaticUseCases, 'use-case'),
];

export const programmaticSeoSlugs = programmaticSeoSegments.map((entry) => entry.slug);

export const programmaticSeoPaths = coreMoneyPagePaths.flatMap((basePath) =>
  programmaticSeoSlugs.map((slug) => `${basePath}/${slug}`)
);

export const matrixSeoTypes = [
  {
    slug: 'freelancer',
    label: 'Photographer',
    audience: 'independent freelancers and solo service providers',
    client: 'a growing local business',
    project: 'multi-service client engagement',
    deliverables: ['Discovery call and scope review', 'Core service delivery', 'Client handoff and revisions'],
    challenge: 'keeping the agreement clear when the client asks for several small tasks in the same engagement',
  },
  {
    slug: 'designer',
    label: 'Designer',
    audience: 'brand, graphic, product, and web designers',
    client: 'a boutique ecommerce brand',
    project: 'visual identity and launch asset package',
    deliverables: ['Creative direction', 'Logo and brand assets', 'Final export files and usage notes'],
    challenge: 'separating concept work, revisions, file preparation, and licensing so the client understands the total',
  },
  {
    slug: 'developer',
    label: 'Developer',
    audience: 'software developers and technical consultants',
    client: 'a SaaS founder',
    project: 'feature build and deployment support',
    deliverables: ['Technical planning', 'Implementation sprint', 'QA fixes and deployment notes'],
    challenge: 'documenting milestones, support windows, and engineering scope without turning the invoice into a long email',
  },
  {
    slug: 'consultant',
    label: 'Consultant',
    audience: 'business, strategy, and operations consultants',
    client: 'an operations team',
    project: 'process audit and advisory engagement',
    deliverables: ['Stakeholder interviews', 'Findings report', 'Implementation workshop'],
    challenge: 'showing advisory value when the work includes meetings, analysis, and recommendations instead of tangible files',
  },
  {
    slug: 'photographer',
    label: 'Photographer',
    audience: 'portrait, event, product, and commercial photographers',
    client: 'a marketing team',
    project: 'commercial photo session and edited gallery',
    deliverables: ['Shoot planning', 'Production day coverage', 'Edited gallery and usage license'],
    challenge: 'making shoot fees, editing, rush delivery, and usage rights visible before the client reviews the document',
  },
  {
    slug: 'writer',
    label: 'Writer',
    audience: 'copywriters, content writers, and editorial freelancers',
    client: 'a B2B marketing manager',
    project: 'content package for a campaign',
    deliverables: ['Messaging outline', 'Draft copy', 'Revision round and final polish'],
    challenge: 'documenting research, drafts, revision limits, and final delivery without hiding the strategy work',
  },
  {
    slug: 'agency',
    label: 'Agency',
    audience: 'small agencies and client service studios',
    client: 'a funded startup',
    project: 'campaign package across strategy, creative, and delivery',
    deliverables: ['Account planning', 'Creative production', 'Reporting and optimization'],
    challenge: 'combining multiple service lines into one client-ready document while keeping each cost understandable',
  },
  {
    slug: 'contractor',
    label: 'Contractor',
    audience: 'independent contractors and field service providers',
    client: 'a property manager',
    project: 'site work and materials-based service job',
    deliverables: ['Site visit', 'Labor block', 'Materials and completion notes'],
    challenge: 'showing labor, materials, deposits, and change-order notes clearly enough to prevent client review disputes',
  },
];

export const matrixSeoCountries = [
  {
    slug: 'us',
    label: 'US',
    audience: 'clients in the United States',
    currency: 'USD',
    symbol: '$',
    taxLabel: 'sales tax',
    taxRate: 0.075,
    paymentTerms: 'Net 15',
    paymentMethod: 'client document instructions',
    localDetail: 'US clients often expect a clear W-9-ready business name, document terms, and sales-tax treatment when applicable.',
  },
  {
    slug: 'canada',
    label: 'Canada',
    audience: 'clients in Canada',
    currency: 'CAD',
    symbol: 'C$',
    taxLabel: 'GST/HST',
    taxRate: 0.13,
    paymentTerms: 'Net 14',
    paymentMethod: 'client document instructions',
    localDetail: 'Canadian clients usually look for GST/HST clarity, province-aware notes, and a document that separates services from tax.',
  },
  {
    slug: 'ca',
    label: 'Canada',
    audience: 'clients in Canada',
    currency: 'CAD',
    symbol: 'C$',
    taxLabel: 'GST/HST',
    taxRate: 0.13,
    paymentTerms: 'Net 14',
    paymentMethod: 'client document instructions',
    localDetail: 'Canadian clients usually look for GST/HST clarity, province-aware notes, and a document that separates services from tax.',
  },
  {
    slug: 'uk',
    label: 'UK',
    audience: 'clients in the United Kingdom',
    currency: 'GBP',
    symbol: '£',
    taxLabel: 'VAT',
    taxRate: 0.2,
    paymentTerms: 'Net 14',
    paymentMethod: 'client document instructions',
    localDetail: 'UK clients commonly expect VAT treatment, company details, and review instructions to be visible on the document.',
  },
  {
    slug: 'australia',
    label: 'Australia',
    audience: 'clients in Australia',
    currency: 'AUD',
    symbol: 'A$',
    taxLabel: 'GST',
    taxRate: 0.1,
    paymentTerms: 'Net 7',
    paymentMethod: 'client document instructions',
    localDetail: 'Australian clients often expect GST clarity, ABN-style business details, and short review windows for project work.',
  },
  {
    slug: 'germany',
    label: 'Germany',
    audience: 'clients in Germany',
    currency: 'EUR',
    symbol: '€',
    taxLabel: 'VAT',
    taxRate: 0.19,
    paymentTerms: 'Net 14',
    paymentMethod: 'client document instructions',
    localDetail: 'German clients tend to expect precise line items, VAT notes, invoice numbering, and formal document instructions.',
  },
  {
    slug: 'singapore',
    label: 'Singapore',
    audience: 'clients in Singapore',
    currency: 'SGD',
    symbol: 'S$',
    taxLabel: 'GST',
    taxRate: 0.09,
    paymentTerms: 'Net 7',
    paymentMethod: 'client document instructions',
    localDetail: 'Singapore clients often value concise document terms, GST visibility where applicable, and clear digital review instructions.',
  },
];

export const matrixSeoUseCases = [
  {
    slug: 'basic',
    label: 'Basic',
    context: 'simple client document work',
    billingModel: 'straightforward service delivery',
    timing: 'after the work is completed',
    pricingNote: 'simple fixed service lines',
    risk: 'unclear totals or missing document instructions',
  },
  {
    slug: 'hourly',
    label: 'Hourly',
    context: 'hourly work and tracked time',
    billingModel: 'time-based document structure',
    timing: 'at the end of a tracked work period',
    pricingNote: 'hours, rates, and approved time blocks',
    risk: 'clients questioning time spent if notes are too vague',
  },
  {
    slug: 'project',
    label: 'Project',
    context: 'fixed-scope project work',
    billingModel: 'fixed project document structure',
    timing: 'around project milestones or final delivery',
    pricingNote: 'deliverables, milestones, and agreed totals',
    risk: 'scope changes blending into the original project price',
  },
  {
    slug: 'retainer',
    label: 'Retainer',
    context: 'monthly retainer services',
    billingModel: 'recurring monthly service coverage',
    timing: 'at the beginning or end of each retainer period',
    pricingNote: 'covered services, renewal dates, and overage terms',
    risk: 'clients forgetting what is included in the monthly fee',
  },
  {
    slug: 'contract',
    label: 'Contract',
    context: 'contract-based service work',
    billingModel: 'contract milestone document structure',
    timing: 'when a contract phase is approved',
    pricingNote: 'contract references, phase names, and acceptance dates',
    risk: 'review delays when the invoice document does not match the signed agreement',
  },
  {
    slug: 'branding',
    label: 'Branding',
    context: 'branding and creative service packages',
    billingModel: 'creative package pricing',
    timing: 'after concept approval or final asset delivery',
    pricingNote: 'concepts, revisions, usage rights, and final files',
    risk: 'revision rounds and licensing terms becoming ambiguous',
  },
];

export const matrixSeoParams = matrixSeoTypes.flatMap((type) =>
  matrixSeoCountries.flatMap((country) =>
    matrixSeoUseCases.map((useCase) => ({
      type: type.slug,
      country: country.slug,
      'use-case': useCase.slug,
    }))
  )
);

export const matrixSeoPaths = coreMoneyPagePaths.flatMap((basePath) =>
  matrixSeoParams.map((params) => `${basePath}/${params.type}/${params.country}/${params['use-case']}`)
);

export const matrixCountryParams = matrixSeoTypes.flatMap((type) =>
  matrixSeoCountries.map((country) => ({
    type: type.slug,
    country: country.slug,
  }))
);

export const matrixCountryPaths = coreMoneyPagePaths.flatMap((basePath) =>
  matrixCountryParams.map((params) => `${basePath}/${params.type}/${params.country}`)
);

function getMatrixEntry(collection, slug) {
  const normalizedSlug = String(slug || '').toLowerCase().trim();
  return collection.find((entry) => entry.slug === normalizedSlug) || {
    slug: normalizedSlug,
    label: titleCase(normalizedSlug),
    audience: normalizedSlug,
    context: titleCase(normalizedSlug).toLowerCase(),
    client: 'a client',
    project: `${titleCase(normalizedSlug).toLowerCase()} work`,
    deliverables: ['Service delivery', 'Client review', 'Final handoff'],
    challenge: 'keeping scope, pricing, and document terms clear',
    currency: 'USD',
    symbol: '$',
    taxLabel: 'tax',
    taxRate: 0,
    paymentTerms: 'Net 14',
    paymentMethod: 'client document instructions',
    localDetail: 'Clients expect clear business details, line items, totals, and document instructions.',
    billingModel: `${titleCase(normalizedSlug).toLowerCase()} document workflow`,
    timing: 'when the client is ready to review the document',
    pricingNote: 'clear line items and totals',
    risk: 'unclear scope or document terms',
  };
}

function roundMoney(value) {
  return Math.round(value * 100) / 100;
}

function formatMoney(symbol, value) {
  return `${symbol}${roundMoney(value).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function buildMatrixExample({ isInvoice, productNoun, type, country, useCase }) {
  const baseAmount = {
    freelancer: 900,
    designer: 1600,
    developer: 2400,
    consultant: 2100,
    photographer: 1400,
    writer: 850,
    agency: 4200,
    contractor: 1800,
  }[type.slug] || 1200;

  const multiplier = {
    basic: 0.8,
    hourly: 0.95,
    project: 1.25,
    retainer: 1.4,
    contract: 1.15,
    branding: 1.55,
  }[useCase.slug] || 1;

  const firstAmount = roundMoney(baseAmount * multiplier);
  const secondAmount = roundMoney(firstAmount * 0.45);
  const thirdAmount = roundMoney(firstAmount * 0.18);
  const subtotal = roundMoney(firstAmount + secondAmount + thirdAmount);
  const tax = roundMoney(subtotal * (country.taxRate || 0));
  const total = roundMoney(subtotal + tax);

  const lineItems = isInvoice
    ? [
        {
          description: `${type.label} ${useCase.label.toLowerCase()} ${type.project}`,
          detail: type.deliverables[0],
          qty: 1,
          rate: firstAmount,
          amount: firstAmount,
        },
        {
          description: `${useCase.label} delivery and client revisions`,
          detail: type.deliverables[1],
          qty: 1,
          rate: secondAmount,
          amount: secondAmount,
        },
        {
          description: `Final handoff, records, and ${country.label} document setup`,
          detail: type.deliverables[2],
          qty: 1,
          rate: thirdAmount,
          amount: thirdAmount,
        },
      ]
    : [
        {
          description: `${type.label} ${useCase.label.toLowerCase()} discovery and scope`,
          detail: type.deliverables[0],
          qty: 1,
          rate: firstAmount,
          amount: firstAmount,
        },
        {
          description: `Recommended ${useCase.billingModel} delivery option`,
          detail: type.deliverables[1],
          qty: 1,
          rate: secondAmount,
          amount: secondAmount,
        },
        {
          description: `Optional handoff and ${country.label} client support`,
          detail: type.deliverables[2],
          qty: 1,
          rate: thirdAmount,
          amount: thirdAmount,
        },
      ];

  return {
    label: `${type.label} ${useCase.label} ${isInvoice ? 'Invoice' : 'Quote'} Example`,
    documentNumber: `${isInvoice ? 'INV' : 'QTE'}-${country.slug.toUpperCase()}-${type.slug.slice(0, 3).toUpperCase()}-${useCase.slug.slice(0, 3).toUpperCase()}-1027`,
    issueDate: 'June 18, 2026',
    dueDate: isInvoice ? country.paymentTerms : 'Valid for 14 days',
    from: `Corvioz ${type.label} Studio`,
    to: type.client,
    currency: country.currency,
    symbol: country.symbol,
    taxLabel: country.taxLabel,
    paymentMethod: country.paymentMethod,
    note: isInvoice
      ? `Document instructions: ${country.paymentMethod}. This ${productNoun} covers ${useCase.context} for ${type.project} in ${country.label}.`
      : `This quote is prepared for ${useCase.context}; final scope can be converted into an invoice after approval.`,
    lineItems,
    subtotal,
    tax,
    total,
    subtotalFormatted: formatMoney(country.symbol, subtotal),
    taxFormatted: formatMoney(country.symbol, tax),
    totalFormatted: formatMoney(country.symbol, total),
  };
}

function buildMatrixFaq({ isInvoice, productNoun, productPlural, type, country, useCase }) {
  const typeLower = type.label.toLowerCase();
  const useCaseLower = useCase.label.toLowerCase();

  return [
    {
      question: `What makes this ${typeLower} ${productNoun} page specific to ${country.label}?`,
      answer: `It uses ${country.currency} examples, ${country.taxLabel} language, ${country.paymentTerms} terms, and document notes that fit ${country.audience}.`,
    },
    {
      question: `How should ${typeLower}s describe ${useCaseLower} work?`,
      answer: `Describe the document model as ${useCase.billingModel}, list the deliverables separately, and explain the timing: ${useCase.timing}.`,
    },
    {
      question: `What should the example ${productNoun} include?`,
      answer: `It should include client details, document number, issue date, line items, ${country.taxLabel}, total, document instructions, and a note about ${useCase.context}.`,
    },
    {
      question: isInvoice ? 'Should I send a quote before this invoice?' : 'Can this quote become an invoice later?',
      answer: isInvoice
        ? `For ${useCase.context}, a quote helps the client approve scope before the matching invoice document is prepared.`
        : `Yes. A clear quote can become a matching invoice after the client approves the ${useCaseLower} scope.`,
    },
    {
      question: `How does Corvioz keep document review clear for ${typeLower}s?`,
      answer: `Corvioz keeps the ${productNoun}, client profile, pricing details, and related ${productPlural} connected so clients see a professional path from scope to document review.`,
    },
  ];
}

export function buildMatrixSeoPage(productType, params = {}) {
  const type = getMatrixEntry(matrixSeoTypes, params.type);
  const country = getMatrixEntry(matrixSeoCountries, params.country);
  const useCase = getMatrixEntry(matrixSeoUseCases, params['use-case'] || params.useCase);
  if (!type.slug || !country.slug || !useCase.slug) return null;

  const isInvoice = productType === 'invoice';
  const productLabel = isInvoice ? 'Invoice' : 'Quote';
  const productNoun = isInvoice ? 'invoice' : 'quote';
  const productPlural = isInvoice ? 'invoices' : 'quotes';
  const basePath = isInvoice ? '/invoice-generator' : '/quote-generator';
  const otherBasePath = isInvoice ? '/quote-generator' : '/invoice-generator';
  const canonicalPath = `${basePath}/${type.slug}/${country.slug}/${useCase.slug}`;
  const oppositePath = `${otherBasePath}/${type.slug}/${country.slug}/${useCase.slug}`;
  const typeLower = type.label.toLowerCase();
  const countryLower = country.label.toLowerCase();
  const useCaseLower = useCase.label.toLowerCase();
  const mainAction = isInvoice ? 'prepare an invoice document' : 'get client approval';
  const exampleTitle = isInvoice ? 'Example invoice' : 'Example quote';
  const example = buildMatrixExample({ isInvoice, productNoun, type, country, useCase });
  const scenario = `${type.label} in ${country.label}: ${type.client} needs ${useCase.context} for ${type.project}. The main risk is ${type.challenge}, especially when ${useCase.risk}. ${country.localDetail}`;
  const seoParagraphs = [
    `This free ${typeLower} ${productNoun} generator is built for ${type.audience} who work with ${country.audience} and need a practical way to handle ${useCase.context}. A strong ${productNoun} page should explain the client, the scope, the pricing model, the timing, and the next step in plain language. Corvioz turns that structure into a clean workflow so you can add business details, client information, deliverables, rates, totals, notes, and document or approval terms in one place.`,
    `The real-world scenario for this page is specific: ${scenario} For ${useCaseLower} work, clarity matters because clients need to understand what is included, when the work happens, how pricing is calculated, and what they should do after receiving the document. A ${typeLower} serving ${country.audience} can use the page to separate ${type.deliverables.join(', ').toLowerCase()}, so the client does not treat every activity as one vague fee.`,
    `The example ${productNoun} below uses ${country.currency}, ${country.taxLabel}, ${country.paymentTerms} terms, and ${country.paymentMethod}. It includes a document number, issue date, due or validity date, specific line items, and totals. That matters for Google and for clients because the page is not just a thin landing page; it demonstrates how the document could look in a real engagement. The line items reflect ${useCase.pricingNote}, while the note explains how the client should respond.`,
    `For ${typeLower}s, the most important detail is not only the final price but the reason behind each line item. This page names the service context, the client type, the regional document expectation, and the review risk that often creates friction. In this case, the risk is ${useCase.risk}. By making that risk visible, the ${productNoun} can prevent follow-up questions before they slow down document review or approval. The ${country.label} context also changes the document: ${country.localDetail}`,
    `The structure is also different from a generic invoice template because it adapts to ${type.project}. A ${typeLower} can show why ${type.deliverables[0].toLowerCase()} is separate from ${type.deliverables[1].toLowerCase()}, and why ${type.deliverables[2].toLowerCase()} deserves its own line. That gives the client a more useful record and gives the provider a clearer archive for future follow-up, renewals, or repeat work. If the engagement changes, the same matrix page can guide a matching quote or invoice without rewriting the whole document style.`,
    `Use this page to prepare client-ready ${productPlural}, keep your records consistent, and ${mainAction} with less back-and-forth. It links to the parent ${typeLower} generator page, the main ${productNoun} hub, the matching ${isInvoice ? 'quote' : 'invoice'} page, pricing, and a public profile example. Those internal links give search engines clearer context about the relationship between role, country, use case, invoice pages, and quote pages while helping visitors move into the actual Corvioz workflow.`,
  ];

  return {
    productType,
    type,
    country,
    useCase,
    basePath,
    canonicalPath,
    parentPath: `${basePath}/${type.slug}`,
    oppositePath,
    title: `Free ${type.label} ${productLabel} Generator for ${useCase.label} Work`,
    description: `${productLabel} generator for ${typeLower} in ${countryLower}, structured for ${useCaseLower} document workflows.`,
    h1: `Free ${type.label} ${productLabel} Generator in ${country.label}`,
    intro: `Create a ${useCaseLower} ${productNoun} for ${typeLower} work in ${country.label} without starting from a blank document.`,
    seoBody: seoParagraphs.join(' '),
    seoParagraphs,
    scenario,
    example,
    sections: {
      who: [
        `${type.label}s serving ${country.audience}`,
        `Teams and solo operators managing ${useCase.context}`,
        `Freelancers who need consistent ${productPlural} for client work`,
      ],
      how: [
        `Choose the ${typeLower} ${productNoun} flow for ${country.label}.`,
        `Add client details, scope, ${useCase.context}, line items, rates, taxes, and notes.`,
        `Review the ${productNoun}, export it, and share it with the client from Corvioz.`,
      ],
      example: isInvoice
        ? [
            `${example.lineItems[0].description}: ${formatMoney(country.symbol, example.lineItems[0].amount)}`,
            `${example.lineItems[1].description}: ${formatMoney(country.symbol, example.lineItems[1].amount)}`,
            `${example.taxLabel}: ${example.taxFormatted}`,
            `Total due: ${example.totalFormatted}`,
          ]
        : [
            `${example.lineItems[0].description}: ${formatMoney(country.symbol, example.lineItems[0].amount)}`,
            `${example.lineItems[1].description}: ${formatMoney(country.symbol, example.lineItems[1].amount)}`,
            `${example.taxLabel}: ${example.taxFormatted}`,
            `Estimated total: ${example.totalFormatted}`,
          ],
    },
    internalLinks: [
      { href: '/', label: 'Corvioz Home' },
      { href: `${basePath}/${type.slug}`, label: `${type.label} ${productLabel} Generator` },
      { href: basePath, label: `${productLabel} Generator` },
      { href: oppositePath, label: isInvoice ? 'Matching Quote Page' : 'Matching Invoice Page' },
      { href: '/quote-generator', label: 'Quotes' },
      { href: '/invoice-generator', label: 'Invoices' },
      { href: '/card/demo', label: 'Public Profile Example' },
      { href: '/pricing', label: 'Pricing' },
    ],
    breadcrumbs: [
      { name: 'Home', item: '/' },
      { name: `${productLabel} Generator`, item: basePath },
      { name: type.label, item: `${basePath}/${type.slug}` },
      { name: country.label, item: `${basePath}/${type.slug}/${country.slug}` },
      { name: useCase.label, item: canonicalPath },
    ],
    faq: buildMatrixFaq({ isInvoice, productNoun, productPlural, type, country, useCase }),
    exampleTitle,
  };
}

export function buildMatrixCountryPage(productType, params = {}) {
  const type = getMatrixEntry(matrixSeoTypes, params.type);
  const country = getMatrixEntry(matrixSeoCountries, params.country);
  if (!type.slug || !country.slug) return null;

  const isInvoice = productType === 'invoice';
  const productLabel = isInvoice ? 'Invoice' : 'Quote';
  const productNoun = isInvoice ? 'invoice' : 'quote';
  const basePath = isInvoice ? '/invoice-generator' : '/quote-generator';
  const otherBasePath = isInvoice ? '/quote-generator' : '/invoice-generator';
  const canonicalPath = `${basePath}/${type.slug}/${country.slug}`;
  const typeLower = type.label.toLowerCase();
  const countryLower = country.label.toLowerCase();
  const useCaseLinks = matrixSeoUseCases.map((useCase) => ({
    href: `${canonicalPath}/${useCase.slug}`,
    label: `${useCase.label} ${productLabel} Generator`,
    description: `${useCase.context} for ${typeLower}s serving ${country.audience}.`,
  }));

  return {
    productType,
    type,
    country,
    basePath,
    canonicalPath,
    title: `Free ${type.label} ${productLabel} Generator in ${country.label}`,
    description: `Create ${productNoun}s for ${typeLower}s in ${countryLower}. Explore basic, hourly, project, retainer, contract, and branding ${productNoun} workflows.`,
    h1: `Free ${type.label} ${productLabel} Generator in ${country.label}`,
    intro: `Choose a ${country.label} ${productNoun} workflow for ${typeLower} client work, then open the use-case page that best matches the engagement.`,
    body: `${type.label}s working with ${country.audience} often need more than a generic ${productNoun} form. ${country.localDetail} This hub connects the main ${productNoun} generator to specific document scenarios such as hourly work, fixed projects, retainers, contracts, and branding packages. Use it as the country-level entry point before choosing a detailed use-case page with a full example, FAQ, and matching ${isInvoice ? 'quote' : 'invoice'} workflow.`,
    useCaseLinks,
    internalLinks: [
      { href: '/', label: 'Corvioz Home' },
      { href: basePath, label: `${productLabel} Generator Hub` },
      { href: `${basePath}/${type.slug}`, label: `${type.label} ${productLabel} Generator` },
      { href: `${otherBasePath}/${type.slug}/${country.slug}`, label: `Matching ${isInvoice ? 'Quote' : 'Invoice'} Country Hub` },
      { href: '/pricing', label: 'Pricing' },
    ],
    breadcrumbs: [
      { name: 'Home', item: '/' },
      { name: `${productLabel} Generator`, item: basePath },
      { name: type.label, item: `${basePath}/${type.slug}` },
      { name: country.label, item: canonicalPath },
    ],
  };
}

export function getProgrammaticSeoSegment(slug) {
  const normalizedSlug = String(slug || '').toLowerCase().trim();
  return programmaticSeoSegments.find((entry) => entry.slug === normalizedSlug) || null;
}

export function buildProgrammaticSeoPage(productType, slug) {
  const normalizedSlug = String(slug || '').toLowerCase().trim();
  if (!normalizedSlug) return null;

  const segment = getProgrammaticSeoSegment(normalizedSlug) || {
    slug: normalizedSlug,
    category: 'type',
    label: titleCase(normalizedSlug),
    audience: `${titleCase(normalizedSlug).toLowerCase()} freelancers and service businesses`,
  };

  const isInvoice = productType === 'invoice';
  const productLabel = isInvoice ? 'Invoice' : 'Quote';
  const productNoun = isInvoice ? 'invoice' : 'quote';
  const productPlural = isInvoice ? 'invoices' : 'quotes';
  const basePath = isInvoice ? '/invoice-generator' : '/quote-generator';
  const otherPath = isInvoice ? '/quote-generator' : '/invoice-generator';
  const typeLabel = segment.label || titleCase(normalizedSlug);
  const audience = segment.audience;
  const actionVerb = isInvoice ? 'prepare invoice documents' : 'estimate projects';
  const outcome = isInvoice ? 'keep client records clear' : 'support approval before work begins';

  return {
    productType,
    slug: segment.slug,
    category: segment.category,
    basePath,
    canonicalPath: `${basePath}/${segment.slug}`,
    title: `Free ${typeLabel} ${productLabel} Generator`,
    description: `Generate professional ${productPlural} for ${typeLabel.toLowerCase()}. Free online ${productNoun} generator for freelancers and businesses.`,
    h1: `Free ${productLabel} Generator for ${typeLabel}`,
    intro: `Use this free ${typeLabel.toLowerCase()} ${productNoun} generator to create clear, client-ready ${productPlural} online.`,
    seoBody: `A ${typeLabel.toLowerCase()} ${productNoun} should make the next step easy for both you and your client. Corvioz gives ${audience} a focused way to add client details, describe the scope of work, list services or deliverables, set prices, include terms, and prepare a professional document without building a template from scratch. Instead of mixing client notes, project scope, and document details across emails or spreadsheets, this page gives you a simple structure for the document clients expect to receive. Use it when you need to ${actionVerb}, explain pricing, keep records cleaner, and ${outcome}. The workflow is intentionally lightweight: start with the generator, add your business and client information, enter line items or project milestones, review the totals and notes, then export or share the document from Corvioz. It is built for freelancers, consultants, contractors, agencies, and small service businesses that need professional documents without complex accounting software. A dedicated page for each business type also helps clients understand that the document fits their service context, not a generic form. That extra context supports long-tail search intent while still giving visitors a useful, crawlable page with practical next steps. You can use this page as a search-friendly starting point, then move into the main Corvioz tool to create a finished document with consistent formatting, clearer totals, and a cleaner handoff for the client.`,
    sections: {
      what: `This is a focused ${productNoun} generator for ${audience}. It gives you a practical structure for client details, service descriptions, totals, invoice terms, and next steps.`,
      how: [
        `Choose the ${productNoun} workflow that matches your client project.`,
        'Add your client details, service scope, line items, rates, quantities, and notes.',
        `Review the total, export a PDF, and share the ${productNoun} or client portal link when ready.`,
      ],
      example: isInvoice
        ? [
            `${typeLabel} service package`,
            'Project milestone or service period',
            'Line items with quantity, rate, subtotal, tax, and balance due',
            'Invoice notes, due date, and optional client document link',
          ]
        : [
            `${typeLabel} project scope`,
            'Milestones, deliverables, timeline, and optional add-ons',
            'Package pricing, deposit terms, and approval notes',
            'A clear next step to approve the estimate before work begins',
          ],
      who: [
        audience,
        'solo freelancers who want professional client documents',
        'small service businesses that need a simple quote-to-invoice workflow',
      ],
    },
    internalLinks: [
      { href: '/invoice-generator', label: 'Invoices' },
      { href: '/quote-generator', label: 'Quotes' },
      { href: '/card/demo', label: 'Public Profile Example' },
      { href: '/pricing', label: 'Pricing' },
      { href: otherPath, label: isInvoice ? 'Create Quote First' : 'Create Invoice After Approval' },
    ],
    faq: [
      {
        question: `Is this ${typeLabel.toLowerCase()} ${productNoun} generator free?`,
        answer: `Yes. You can use Corvioz to structure professional ${productPlural}, then create an account when you want saved records, PDF exports, public profiles, and client portal workflows.`,
      },
      {
        question: `What should a ${typeLabel.toLowerCase()} ${productNoun} include?`,
        answer: `Include client details, your business information, itemized scope, pricing, dates, invoice terms, notes, and any project-specific details the client needs to review or approve.`,
      },
      {
        question: isInvoice ? 'Can I turn a quote into an invoice?' : 'Can I turn this quote into an invoice later?',
        answer: 'Yes. Corvioz is built around a connected quote-to-invoice workflow so approved scope and pricing can become a client-ready invoice document.',
      },
    ],
  };
}

export function buildTemplatePageData(type, industry) {
  const isInvoice = type === 'invoice';
  const documentName = isInvoice ? 'Invoice Template' : 'Quote Template';
  const action = isInvoice ? 'Create Invoice' : 'Create Quote';
  const generatorPath = isInvoice ? seoGrowthRoutes.tools.invoice : seoGrowthRoutes.tools.quote;
  const fields = isInvoice ? industry.invoiceExampleFields : industry.quoteExampleFields;
  const fieldContext = isInvoice ? 'invoice document' : 'estimate';
  const titlePrefix = `${industry.label} ${documentName}`;

  return {
    type,
    slug: industry.slug,
    seoTitle: `${titlePrefix} for Freelancers`,
    description: `Use this ${industry.singular} ${documentName.toLowerCase()} to structure ${isInvoice ? 'client invoice documents' : 'client estimates'} with clear scope, fields, FAQs, and a fast path to create a ${isInvoice ? 'professional invoice document' : 'client quote'}.`,
    h1: `${industry.label} ${documentName}`,
    intro: `A ${industry.singular} ${documentName.toLowerCase()} should make the ${fieldContext} easy for a client to understand. Use this page as a practical starting structure, then create the final document in Corvioz.`,
    audience: industry.audience,
    fields,
    deliverables: industry.deliverables,
    ctaText: action,
    ctaHref: generatorPath,
    relatedGeneratorPath: generatorPath,
    internalLinks: [
      {
        title: isInvoice ? 'Create a matching quote first' : 'Turn this quote into an invoice',
        href: isInvoice ? seoGrowthRoutes.templates.quote(industry.slug) : seoGrowthRoutes.templates.invoice(industry.slug),
      },
      {
        title: 'See a photographer Public Profile example',
        href: seoGrowthRoutes.profile(),
      },
      {
        title: 'Read the photography pricing guide',
        href: seoGrowthRoutes.blog('how-to-price-web-design-projects'),
      },
    ],
    faq: [
      {
        question: `What should a ${industry.singular} ${documentName.toLowerCase()} include?`,
        answer: `It should include client details, your business details, itemized scope, pricing, dates, invoice terms, and any ${industry.singular}-specific details such as ${industry.deliverables.slice(0, 3).join(', ')}.`,
      },
      {
        question: `Can I customize this ${documentName.toLowerCase()} in Corvioz?`,
        answer: `Yes. Use the template fields as a starting point, then adjust descriptions, quantities, rates, taxes, notes, and invoice terms before sending.`,
      },
      {
        question: isInvoice ? 'Should I send a quote before an invoice?' : 'Can this quote become an invoice later?',
        answer: isInvoice
          ? 'For new projects, send a quote first so the client approves scope and pricing. After approval or delivery, convert the agreed work into an invoice.'
          : 'Yes. Once the client approves the quote, you can use the same scope and pricing to create a matching invoice.',
      },
    ],
  };
}

export function inferIndustryFromProfile(profile = {}) {
  let rawServices = [];
  if (Array.isArray(profile.services)) {
    rawServices = profile.services;
  } else if (typeof profile.services === 'string') {
    try {
      rawServices = JSON.parse(profile.services || '[]');
    } catch {
      rawServices = [];
    }
  }
  let rawTags = [];
  if (Array.isArray(profile.tags)) {
    rawTags = profile.tags;
  } else if (typeof profile.tags === 'string') {
    try {
      rawTags = JSON.parse(profile.tags || '[]');
    } catch {
      rawTags = [];
    }
  }
  const haystack = [
    profile.industry,
    profile.category,
    profile.title,
    profile.bio,
    ...rawTags,
    ...rawServices.flatMap((service) => [service.name, service.description]),
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  const aliases = {
    photographer: ['photo', 'photographer', 'photography', 'portrait', 'wedding'],
    consultant: ['consult', 'advisor', 'strategy', 'operations'],
    'graphic-designer': ['graphic', 'brand', 'logo', 'illustration', 'illustrator'],
    'web-designer': ['web design', 'webflow', 'framer', 'landing page', 'ui/ux', 'ux'],
    developer: ['developer', 'engineer', 'react', 'next.js', 'node', 'frontend', 'backend', 'api'],
    marketer: ['marketing', 'marketer', 'growth', 'seo', 'paid media', 'campaign'],
    copywriter: ['copywriter', 'copy', 'writer', 'email', 'content'],
    coach: ['coach', 'coaching', 'mentor'],
    'virtual-assistant': ['virtual assistant', 'admin', 'inbox', 'scheduling'],
    contractor: ['contractor', 'construction', 'repair', 'field service', 'labor'],
  };

  const matchedSlug = Object.entries(aliases).find(([, words]) =>
    words.some((word) => haystack.includes(word))
  )?.[0];

  return getTemplateIndustry(matchedSlug) || getTemplateIndustry('consultant');
}

export function buildProfileSeoData(profile = {}) {
  const industry = inferIndustryFromProfile(profile);
  const name = profile.name || profile.username || 'Independent Photographer';
  const title = profile.title || `${industry.label} photographer`;
  let services = [];
  if (Array.isArray(profile.services)) {
    services = profile.services;
  } else if (typeof profile.services === 'string') {
    try {
      services = JSON.parse(profile.services || '[]');
    } catch {
      services = [];
    }
  }
  const serviceNames = services.map((service) => service.name).filter(Boolean).slice(0, 3);
  const description = `${name} is a ${title} on Corvioz. View ${industry.singular} services${serviceNames.length ? ` like ${serviceNames.join(', ')}` : ''}, starting rates, portfolio work, and request a project quote.`;

  return {
    industry,
    title: `${name} - ${title} | Corvioz Public Profile`,
    description,
    serviceNames,
  };
}

export function isPublicIndexableProfile(profile = {}) {
  if (!profile) return false;
  if (profile.is_public === false || profile.public === false) return false;
  if (profile.visibility === 'private' || profile.status === 'private') return false;
  if (profile.published === false || profile.draft === true) return false;

  let services = [];
  if (Array.isArray(profile.services)) {
    services = profile.services;
  } else if (typeof profile.services === 'string') {
    try {
      services = JSON.parse(profile.services || '[]');
    } catch {
      services = [];
    }
  }

  let tags = [];
  if (Array.isArray(profile.tags)) {
    tags = profile.tags;
  } else if (typeof profile.tags === 'string') {
    try {
      tags = JSON.parse(profile.tags || '[]');
    } catch {
      tags = [];
    }
  }
  const hasIdentity = Boolean(profile.username && profile.name && profile.title);
  const hasUsefulBio = Boolean(profile.bio && String(profile.bio).trim().length >= 40);
  const hasContact = Boolean(profile.contact_email);
  const hasService = services.some((service) => service?.name);
  return hasIdentity && hasUsefulBio && hasContact && hasService && tags.length > 0;
}

export function buildProfileFaqItems(profile = {}) {
  const profileSeo = buildProfileSeoData(profile);
  const name = profile.name || profile.username || 'this photographer';
  return [
    {
      question: `What services does ${name} offer?`,
      answer: profileSeo.serviceNames.length
        ? `${name} offers ${profileSeo.serviceNames.join(', ')} for clients looking for ${profileSeo.industry.singular} support.`
        : `${name} offers ${profileSeo.industry.singular} services through Corvioz.`,
    },
    {
      question: `How can I request a quote from ${name}?`,
      answer: `Use the Request Quote button on this Corvioz profile to send project details, timeline, and budget context directly to ${name}.`,
    },
    {
      question: `What industry is this profile listed under?`,
      answer: `${name} is listed under ${profileSeo.industry.label}, with related quote and invoice template resources linked from the profile.`,
    },
  ];
}

export const v1SeoRoadmap = [
  'V1: invoice generator, quote generator, selected invoice templates, selected quote templates, public profile SEO basics',
  'V2: quote pages and deeper service landing pages',
  'V3: contract, tax, and advanced compliance content',
];
