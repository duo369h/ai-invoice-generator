import React from 'react';
import Link from 'next/link';
import SeoPageLayout from '../../components/SeoPageLayout';

// Mock profiles generator to supply high-fidelity directories for SEO pages
function getMockFreelancers(type, value) {
  const allMocks = [
    {
      name: "Sarah Jenkins",
      role: "designer",
      title: "Brand Designer & Illustrator",
      city: "Toronto",
      state: "ON",
      rate: "$120/hr",
      tags: ["Branding", "Vector Design", "Figma", "Logo Design"],
      initials: "SJ",
      username: "sarahdesign"
    },
    {
      name: "Alex Morgan",
      role: "developer",
      title: "Senior Next.js Developer",
      city: "New York",
      state: "NY",
      rate: "$4,500 flat",
      tags: ["React", "Next.js", "Node.js", "TailwindCSS"],
      initials: "AM",
      username: "demo"
    },
    {
      name: "Alex Rivera",
      role: "developer",
      title: "Full-Stack Web Engineer",
      city: "Los Angeles",
      state: "CA",
      rate: "$150/hr",
      tags: ["Node.js", "PostgreSQL", "Express", "GraphQL"],
      initials: "AR",
      username: "alexdev"
    },
    {
      name: "Marcus Vance",
      role: "consultant",
      title: "SaaS Growth Strategy Consultant",
      city: "Vancouver",
      state: "BC",
      rate: "$200/hr",
      tags: ["Growth Marketing", "Analytics", "SaaS Strategy", "SEO"],
      initials: "MV",
      username: "marcusgrow"
    },
    {
      name: "Emily Watson",
      role: "designer",
      title: "Product & UI/UX Designer",
      city: "New York",
      state: "NY",
      rate: "$130/hr",
      tags: ["UI/UX", "Figma", "Design Systems", "Prototyping"],
      initials: "EW",
      username: "emilyux"
    },
    {
      name: "David K.",
      role: "developer",
      title: "Webflow & Framer Expert",
      city: "Toronto",
      state: "ON",
      rate: "$3,000 flat",
      tags: ["Webflow", "Framer", "CSS Grid", "Animations"],
      initials: "DK",
      username: "davidk"
    }
  ];

  if (type === 'city') {
    // Filter by city or return a matching generated set
    return allMocks.map(f => ({
      ...f,
      city: value,
      state: value === 'Toronto' ? 'ON' : (value === 'Vancouver' ? 'BC' : (value === 'New York' ? 'NY' : 'CA'))
    }));
  }

  if (type === 'industry') {
    // Filter by role or return a matching set
    const filtered = allMocks.filter(f => f.role === value.toLowerCase().slice(0, -1));
    return filtered.length > 0 ? filtered : allMocks;
  }

  return allMocks;
}

function parseSlug(slug) {
  const words = slug.split('-');
  const capitalize = (str) => str.replace(/\b\w/g, c => c.toUpperCase());

  // 1. City Page Detect
  if (slug.startsWith('freelancers-in-')) {
    const cityWords = words.slice(2);
    const city = capitalize(cityWords.join(' '));
    return {
      type: 'city',
      city,
      title: `Top Freelancers in ${city}`,
      displayName: `top freelancers in ${city}`,
      roleName: 'Freelancer',
      role: 'freelancer'
    };
  }

  // 2. Industry Page Detect
  if (slug.startsWith('best-freelance-')) {
    const rolePlural = words.slice(2).join(' ');
    const roleName = capitalize(rolePlural);
    let roleSingular = rolePlural;
    if (roleSingular.endsWith('s') && !roleSingular.endsWith('ss')) {
      roleSingular = roleSingular.slice(0, -1);
    }
    return {
      type: 'industry',
      role: roleSingular,
      roleName: capitalize(roleSingular),
      title: `Best Freelance ${roleName}`,
      displayName: `best freelance ${rolePlural}`,
    };
  }

  // 3. Document or Guide Detect
  let type = 'invoice';
  if (slug.includes('proposal') || slug.includes('quote')) {
    type = 'proposal';
  } else if (slug.includes('contract')) {
    type = 'contract';
  } else if (slug.includes('guide') || slug.includes('price') || slug.includes('how-to') || slug.includes('best-') || slug.includes('software')) {
    type = 'guide';
  }

  let role = 'freelancer';
  if (slug.includes('for-')) {
    const forIndex = words.indexOf('for');
    if (forIndex !== -1 && forIndex < words.length - 1) {
      role = words.slice(forIndex + 1).join(' ');
      if (role.endsWith('s') && !role.endsWith('ss')) {
        role = role.slice(0, -1);
      }
    }
  } else if (slug.startsWith('how-to-price-') && slug.endsWith('-projects')) {
    role = words.slice(3, -1).join(' ');
  } else if (slug.startsWith('how-to-get-freelance-') && slug.endsWith('-clients')) {
    role = words.slice(4, -1).join(' ');
  } else if (slug.startsWith('best-') && slug.endsWith('-crm')) {
    role = words.slice(1, -1).join(' ');
  } else {
    const foundRole = words.find(w => [
      'developer', 'designer', 'consultant', 'marketer', 'copywriter', 'photographer', 
      'videographer', 'writer', 'illustrator', 'architect', 'coach', 'recruiter',
      'lawyer', 'bookkeeper', 'ui-designer', 'webflow-designer', 'framer-designer'
    ].includes(w));
    if (foundRole) {
      role = foundRole;
    }
  }

  const roleName = capitalize(role.replace(/-/g, ' '));
  
  let docTypeName = 'Invoice Template';
  if (type === 'proposal') docTypeName = 'Proposal Template';
  if (type === 'contract') docTypeName = 'Contract Agreement';
  if (type === 'guide') {
    if (slug.includes('price')) docTypeName = 'Project Pricing Guide';
    else if (slug.includes('get-')) docTypeName = 'Client Acquisition Guide';
    else if (slug.includes('software')) docTypeName = 'Invoicing Software Review';
    else if (slug.includes('crm')) docTypeName = 'CRM Software Recommendation';
    else docTypeName = 'Freelancer Success Guide';
  }

  const title = `${roleName} ${docTypeName}`;
  return {
    type,
    role,
    roleName,
    docTypeName,
    title,
    displayName: `${roleName} ${docTypeName.toLowerCase()}`
  };
}

export async function generateMetadata({ params }) {
  const unwrappedParams = await params;
  const slug = unwrappedParams.slug;
  const info = parseSlug(slug);
  return {
    title: `${info.title} | Freelancer Business OS`,
    description: `Professional and verified independent service listings for ${info.displayName}. Track rates, credentials, and portfolios in the US and Canada.`,
    keywords: [slug.replace(/-/g, ' '), `${info.roleName} directory`, `${info.roleName} billing`, `${info.roleName} proposal`],
  };
}

export default async function DynamicSeoPage({ params }) {
  const unwrappedParams = await params;
  const slug = unwrappedParams.slug;
  const info = parseSlug(slug);
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://freelancerbusinessos.com';

  const faqItems = [
    {
      question: `How does Freelancer Business OS verify independent professionals?`,
      answer: `Our platform indexes profiles with verified contact details, active booking portfolios, and client recommendations. We prioritize profiles showing robust milestone-based checkout histories.`
    },
    {
      question: `How should a ${info.roleName} structure invoice payment schedules?`,
      answer: `We recommend billing in 3 distinct stages: 30% upfront deposit to initiate, 40% upon prototype/midway sign-off, and 30% upon final handoff, linking file releases directly to payment clearances.`
    },
    {
      question: `Can I contact these professionals directly without platform fees?`,
      answer: `Yes. Freelancer Business OS supports open business practices. You can book projects directly using their shared payment checkout links. We charge zero platform transaction cuts.`
    }
  ];

  // 1. Inject Dynamic ItemList/Directory Schema if city or industry page
  let schemaBlock = null;
  if (info.type === 'city' || info.type === 'industry') {
    const listData = getMockFreelancers(info.type, info.type === 'city' ? info.city : info.roleName);
    const directorySchema = {
      "@context": "https://schema.org",
      "@type": "ItemList",
      "name": info.title,
      "description": `Browse and hire the best freelance professionals in ${info.type === 'city' ? info.city : info.roleName} directory.`,
      "itemListElement": listData.map((item, idx) => ({
        "@type": "ListItem",
        "position": idx + 1,
        "item": {
          "@type": "Person",
          "name": item.name,
          "jobTitle": item.title,
          "workLocation": {
            "@type": "Place",
            "address": {
              "@type": "PostalAddress",
              "addressLocality": item.city,
              "addressRegion": item.state,
              "addressCountry": "North America"
            }
          },
          "url": `${baseUrl}/card/${item.username}`
        }
      }))
    };
    schemaBlock = (
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(directorySchema) }}
      />
    );
  }

  // 2. Render content based on slug subtype
  let pageContent = null;

  if (info.type === 'city' || info.type === 'industry') {
    const listData = getMockFreelancers(info.type, info.type === 'city' ? info.city : info.roleName);
    pageContent = (
      <div>
        {schemaBlock}
        <p style={{ marginBottom: '32px', fontSize: '1.1rem', color: 'var(--text-muted)' }}>
          Showing the top rated, verified freelance professionals matching <strong>{info.displayName}</strong>. Select a specialist to inspect portfolios, review standard rates, and submit inquiry briefs directly.
        </p>

        {/* Directory Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px', marginBottom: '48px' }}>
          {listData.map((f, i) => (
            <div key={i} className="card" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', padding: '24px', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <div style={{ width: '44px', height: '44px', borderRadius: '50%', background: 'var(--primary-glow)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '1rem', border: '1px solid var(--border)' }}>
                  {f.initials}
                </div>
                <div>
                  <h4 style={{ fontSize: '1rem', fontWeight: 800, margin: 0, color: 'var(--text-main)' }}>{f.name}</h4>
                  <span style={{ fontSize: '0.75rem', color: 'var(--accent)', fontWeight: 600 }}>{f.title}</span>
                </div>
              </div>

              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                📍 {f.city}, {f.state} • 💵 {f.rate}
              </div>

              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {f.tags.map((tag, j) => (
                  <span key={j} className="badge" style={{ fontSize: '0.65rem', padding: '2px 6px' }}>{tag}</span>
                ))}
              </div>

              <Link href={`/card/${f.username}`} className="btn btn-secondary btn-sm" style={{ width: '100%', textAlign: 'center', justifyContent: 'center', fontWeight: 600 }}>
                View Full Profile
              </Link>
            </div>
          ))}
        </div>

        <div style={{ padding: '32px', background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: '12px' }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '12px' }}>How to Book a Top Freelancer</h3>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', lineHeight: '1.6', margin: 0 }}>
            Submit your project details via the &ldquo;Request Quote&rdquo; portal on the freelancer&apos;s profile. Our platform lets you compile exact milestones, verify deliverable files, and complete payments via Stripe with zero platform commission overhead.
          </p>
        </div>
      </div>
    );
  } else {
    // Standard template guide content
    let contentHtml = (
      <div>
        <p style={{ marginBottom: '20px', fontSize: '1.1rem', lineHeight: '1.8' }}>
          For self-employed and contract-based <strong>{info.roleName}s</strong>, establishing a professional business workflow starts with crystal-clear documentation. Using structured proposals and payment templates eliminates scope creep, aligns client expectations, and ensures you get paid for your work on time.
        </p>

        <h3 style={{ fontSize: '1.4rem', fontWeight: 700, margin: '28px 0 12px 0', color: 'var(--text-main)' }}>
          1. Essential Line Items for a {info.roleName} {info.docTypeName}
        </h3>
        <p style={{ marginBottom: '16px' }}>
          When crafting a professional template, do not lump services into a single bulk fee. Break down visual layouts, engineering deliverables, strategy sprints, or editorial feedback rounds into itemized rows:
        </p>
        <ul style={{ paddingLeft: '20px', marginBottom: '24px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <li><strong>Itemized Scope:</strong> Detail tasks, revision caps, and support durations.</li>
          <li><strong>Quantity & Unit Rates:</strong> Explicitly state hours, sprint sizes, or flat milestones rates.</li>
          <li><strong>Copyrights & File release:</strong> Connect final delivery files release to total invoice clearance.</li>
        </ul>

        <h3 style={{ fontSize: '1.4rem', fontWeight: 700, margin: '28px 0 12px 0', color: 'var(--text-main)' }}>
          2. High-Converting Pricing Frameworks
        </h3>
        <p style={{ marginBottom: '16px' }}>
          Successful {info.roleName}s avoid standard billing traps by mapping quotes and invoices directly to tangible milestones:
        </p>
        <ul style={{ paddingLeft: '20px', marginBottom: '24px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <li><strong>Deposit Billing:</strong> Charge 30-50% upfront to commit resources and initiate scheduling.</li>
          <li><strong>Value-Based Pricing:</strong> Rate deliverables on client business impact rather than linear hourly labor logs.</li>
          <li><strong>Retainer Models:</strong> Lock in monthly recurring cycles for continuous support and priority booking.</li>
        </ul>
      </div>
    );

    if (slug.includes('price')) {
      contentHtml = (
        <div>
          <p style={{ marginBottom: '20px', fontSize: '1.1rem', lineHeight: '1.8' }}>
            Pricing freelance projects as a <strong>{info.roleName}</strong> requires shifting from hourly rates to value-based pricing. This article details how to price, structure, and request quotes for independent deliverables in the North American market.
          </p>

          <h3 style={{ fontSize: '1.4rem', fontWeight: 700, margin: '28px 0 12px 0', color: 'var(--text-main)' }}>
            1. Why Hourly Rates Limit Your Freelance Growth
          </h3>
          <p style={{ marginBottom: '16px' }}>
            Hourly billing creates conflicting incentives: the faster and more experienced you get, the less you get paid for a project. Value-based pricing ties your compensation directly to the project&apos;s output and ROI.
          </p>

          <h3 style={{ fontSize: '1.4rem', fontWeight: 700, margin: '28px 0 12px 0', color: 'var(--text-main)' }}>
            2. The 3-Tier Proposal Pricing Strategy
          </h3>
          <p style={{ marginBottom: '16px' }}>
            Provide clients with choices. Offer three distinct project scope options:
          </p>
          <ul style={{ paddingLeft: '20px', marginBottom: '24px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <li><strong>Option 1 (Essential):</strong> The core deliverables to hit basic requirements.</li>
            <li><strong>Option 2 (Recommended):</strong> The core scope plus optimized strategy, revision rounds, and faster turnaround.</li>
            <li><strong>Option 3 (Premium):</strong> Full-service package with extended support, strategy workshops, and priority consulting.</li>
          </ul>
        </div>
      );
    } else if (slug.includes('get-')) {
      contentHtml = (
        <div>
          <p style={{ marginBottom: '20px', fontSize: '1.1rem', lineHeight: '1.8' }}>
            Discover how to scale your independent career. This client acquisition guide for freelance <strong>{info.roleName}s</strong> outlines the outreach and passive discovery loops that convert cold leads into recurring high-value accounts.
          </p>

          <h3 style={{ fontSize: '1.4rem', fontWeight: 700, margin: '28px 0 12px 0', color: 'var(--text-main)' }}>
            1. Build an Organic Growth Engine via Directories
          </h3>
          <p style={{ marginBottom: '16px' }}>
            Directories index your availability. When local businesses search for active {info.roleName}s, structured profiles with verified badges and portfolio cards capture immediate trust.
          </p>

          <h3 style={{ fontSize: '1.4rem', fontWeight: 700, margin: '28px 0 12px 0', color: 'var(--text-main)' }}>
            2. Value-First Outbound Proposals
          </h3>
          <p style={{ marginBottom: '16px' }}>
            When bidding on projects, avoid standard pitches. Audit the prospect&apos;s active brand, identify points of friction, and draft a high-fidelity proposal outlining exactly how you will solve their problem.
          </p>
        </div>
      );
    } else if (slug.includes('crm') || slug.includes('software')) {
      contentHtml = (
        <div>
          <p style={{ marginBottom: '20px', fontSize: '1.1rem', lineHeight: '1.8' }}>
            Operating a professional freelance business requires automated software. We review the best tools and CRM frameworks custom-tailored for independent <strong>{info.roleName}</strong> requirements.
          </p>

          <h3 style={{ fontSize: '1.4rem', fontWeight: 700, margin: '28px 0 12px 0', color: 'var(--text-main)' }}>
            1. Key Software Requirements for a {info.roleName} CRM
          </h3>
          <p style={{ marginBottom: '16px' }}>
            Freelancers don&apos;t need heavy corporate CRM platforms. An optimal operating system should let you view active opportunities in a Kanban pipeline, log reminders, track proposal accepts, and send milestone invoices.
          </p>

          <h3 style={{ fontSize: '1.4rem', fontWeight: 700, margin: '28px 0 12px 0', color: 'var(--text-main)' }}>
            2. Top Recommendations: Freelancer Business OS
          </h3>
          <p style={{ marginBottom: '16px' }}>
            Platforms like **Freelancer Business OS** combine lead capture cards, CRM boards, automated proposal scope generators, and direct payment checkouts into a single cohesive hub.
          </p>
        </div>
      );
    }

    const targetRole = info.role ? info.role.toLowerCase() : 'freelancer';
    const roleName = info.roleName;

    const relatedLinks = [
      {
        title: `Hire Verified ${roleName}s`,
        url: `/freelancers?role=${targetRole}`,
        desc: `Browse and book certified professional ${targetRole}s matching your scope.`
      },
      {
        title: `${roleName} Invoicing Template`,
        url: `/invoice-template-for-${targetRole}`,
        desc: `Get paid faster with industry-standard milestone checkouts.`
      },
      {
        title: `How to Price ${roleName} Projects`,
        url: `/how-to-price-${targetRole}-projects`,
        desc: `A comprehensive value-based rates and packaging roadmap.`
      },
      {
        title: `Best CRM Tools for ${roleName}s`,
        url: `/best-${targetRole}-crm`,
        desc: `Organize client pipelines and inbound scope requests.`
      }
    ];

    const crossLinkingMenu = (
      <div style={{ marginTop: '48px', borderTop: '1px solid var(--border)', paddingTop: '36px', textAlign: 'left' }}>
        <h4 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '20px', color: 'var(--text-main)' }}>Related Templates & Success Resources</h4>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
          {relatedLinks.map((link, idx) => (
            <a 
              key={idx} 
              href={link.url}
              style={{ 
                display: 'block', 
                padding: '20px', 
                backgroundColor: 'var(--btn-secondary-bg)', 
                border: '1px solid var(--border)', 
                borderRadius: '8px', 
                textDecoration: 'none',
                transition: 'var(--transition)'
              }}
              className="hover-card"
            >
              <strong style={{ display: 'block', color: 'var(--accent)', fontSize: '0.95rem', marginBottom: '6px' }}>
                {link.title}
              </strong>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: '1.4', display: 'block' }}>
                {link.desc}
              </span>
            </a>
          ))}
        </div>
      </div>
    );

    pageContent = (
      <div>
        {contentHtml}
        {crossLinkingMenu}
      </div>
    );
  }

  return (
    <SeoPageLayout
      title={info.title}
      subtitle={`Premium ${info.docTypeName ? info.docTypeName.toLowerCase() : 'service listings'} and professional business strategy for independent freelancers.`}
      ctaText={info.type === 'city' || info.type === 'industry' ? 'Hire a Freelancer' : `Create ${info.roleName} Profile`}
      contentHtml={pageContent}
      faqItems={faqItems}
    />
  );
}
