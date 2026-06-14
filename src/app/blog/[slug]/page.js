import React from 'react';
import Link from 'next/link';
import ThemeToggle from '../../components/ThemeToggle';

// Detailed mock blog database
const blogDatabase = {
  'how-to-price-web-design-projects': {
    category: 'Pricing',
    title: 'Value-Based Pricing: Shifting Away From Hourly Rates',
    subtitle: 'Hourly rates penalize your efficiency and experience. Discover the step-by-step formula to price your web projects based on client business impact.',
    date: 'June 10, 2026',
    readTime: '6 min read',
    author: 'Sarah Chen',
    authorRole: 'UI/UX Product Designer & Advisor',
    schemaDesc: 'The ultimate guide to value-based project pricing models for freelance developers, designers, and creatives.',
    content: (
      <div>
        <p style={{ fontSize: '1.1rem', lineHeight: '1.8', marginBottom: '24px' }}>
          Pricing projects by hourly labor registers is the single greatest barrier to scaling your freelance business. When billing by the hour, you create a fundamental conflict of interest with your client: the faster, more experienced, and more efficient you become, the less money you make for completing the exact same work.
        </p>

        <h3 id="toc-1" style={{ fontSize: '1.4rem', fontWeight: 800, margin: '28px 0 12px 0', color: 'var(--text-main)' }}>
          1. The Hourly Billing Trap
        </h3>
        <p style={{ marginBottom: '16px' }}>
          In traditional service agencies, employees log time blocks to track internal capacities. However, for independent contractors, billing hourly shifts focus from results to execution details. A client buying a redesigned conversion flow doesn&apos;t care if it took you 5 hours or 50 hours; they care that it increases checkout completions by 15%. Value-based pricing aligns your rewards with client outcomes.
        </p>

        <h3 id="toc-2" style={{ fontSize: '1.4rem', fontWeight: 800, margin: '28px 0 12px 0', color: 'var(--text-main)' }}>
          2. The Discovery Conversation Formula
        </h3>
        <p style={{ marginBottom: '16px' }}>
          To charge value-based flat rates, you must identify the commercial outcome of the project. During brief intakes, don&apos;t just ask about design preferences or tech stacks. Ask diagnostic business questions:
        </p>
        <ul style={{ paddingLeft: '20px', marginBottom: '24px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <li><em>&ldquo;Why are we initiating this redesign now? What is the current website failing to do?&rdquo;</em></li>
          <li><em>&ldquo;If this platform performs perfectly, what does that look like in terms of sales, user trust, or active bookings?&rdquo;</em></li>
          <li><em>&ldquo;What is the approximate cost of doing nothing and keeping the old dashboard active?&rdquo;</em></li>
        </ul>

        <h3 id="toc-3" style={{ fontSize: '1.4rem', fontWeight: 800, margin: '28px 0 12px 0', color: 'var(--text-main)' }}>
          3. Structuring a 3-Tier Option Proposal
        </h3>
        <p style={{ marginBottom: '16px' }}>
          Never send a proposal with a single price tag. A single price turns you into a yes-or-no commodity. Instead, present three choices representing different scopes:
        </p>
        <ul style={{ paddingLeft: '20px', marginBottom: '24px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <li><strong>Option 1 (Essential):</strong> The core deliverables to fix the immediate pain point. (e.g. $3,500)</li>
          <li><strong>Option 2 (Standard):</strong> The core build plus optimized responsiveness checkouts and CRM hookups. (e.g. $5,500)</li>
          <li><strong>Option 3 (Premium):</strong> Full-service redesign plus visual strategy workshops, 3 months SLA, and custom domain setup. (e.g. $9,000)</li>
        </ul>
      </div>
    ),
    toc: [
      { id: 'toc-1', name: '1. The Hourly Billing Trap' },
      { id: 'toc-2', name: '2. Discovery Conversation' },
      { id: 'toc-3', name: '3. 3-Tier Option Proposal' }
    ]
  },
  'how-to-get-freelance-clients': {
    category: 'Freelancing',
    title: 'Dynamic Client Acquisition: Building Inbound Discovery Loops',
    subtitle: 'Ditch cold emailing. Learn how indexing your availability inside directories creates a steady flow of high-intent search leads.',
    date: 'May 28, 2026',
    readTime: '8 min read',
    author: 'Alex Rivera',
    authorRole: 'Full Stack Engineer & Tech Lead',
    schemaDesc: 'Proven inbound marketing and programmatic SEO strategies to acquire high-value freelance contract projects.',
    content: (
      <div>
        <p style={{ fontSize: '1.1rem', lineHeight: '1.8', marginBottom: '24px' }}>
          Active outbound sales (cold calling, networking events, bidding on crowded marketplaces) are exhausting and offer low conversion ratios. The highest earning freelancers build inbound systems where clients search and find them at the precise moment they have buying intent.
        </p>

        <h3 id="toc-1" style={{ fontSize: '1.4rem', fontWeight: 800, margin: '28px 0 12px 0', color: 'var(--text-main)' }}>
          1. The Google SEO Funnel
        </h3>
        <p style={{ marginBottom: '16px' }}>
          When businesses require a specialized contractor, they search Google for terms like <em>&ldquo;Next.js developer in Toronto&rdquo;</em> or <em>&ldquo;invoice template for web designer&rdquo;</em>. By setting up a public card profile indexed inside verified directories, you position your skills right in front of active queries.
        </p>

        <h3 id="toc-2" style={{ fontSize: '1.4rem', fontWeight: 800, margin: '28px 0 12px 0', color: 'var(--text-main)' }}>
          2. The Landing Page Friction Bar
        </h3>
        <p style={{ marginBottom: '16px' }}>
          A standard portfolio website usually forces a client to look through dozens of mock projects and search for an elusive contact button. A premium profile card, however, uses conversion design standards: location availability status, starting rate clarity, verified review badges, and a simple client brief intake box.
        </p>
      </div>
    ),
    toc: [
      { id: 'toc-1', name: '1. The Google SEO Funnel' },
      { id: 'toc-2', name: '2. Landing Page Friction' }
    ]
  },
  'best-freelancer-crm': {
    category: 'Client Management',
    title: 'Why Standard Enterprise CRMs Fail Independent Professionals',
    subtitle: 'Heavy sales pipelines are built for enterprise teams. Learn why a simple visual CRM pipeline yields higher cash flows.',
    date: 'May 14, 2026',
    readTime: '5 min read',
    author: 'Marcus Todd',
    authorRole: 'Growth Strategist & Fractional CMO',
    schemaDesc: 'A comparative review of CRM pipelines, focusing on the needs of solo freelance businesses.',
    content: (
      <div>
        <p style={{ fontSize: '1.1rem', lineHeight: '1.8', marginBottom: '24px' }}>
          Enterprise CRM systems are overloaded with lead scoring algorithms, email nurture tracks, and cross-team permissions. As a freelance solo business, these elements create unnecessary admin overhead.
        </p>

        <h3 id="toc-1" style={{ fontSize: '1.4rem', fontWeight: 800, margin: '28px 0 12px 0', color: 'var(--text-main)' }}>
          1. Speed to Proposal is Everything
        </h3>
        <p style={{ marginBottom: '16px' }}>
          In independent contracting, the freelancer who scopes and proposals the fastest almost always wins the project. An optimal CRM should let you immediately parse an inbound lead brief, trigger an AI proposal builder, and generate a secure portal checkout link in seconds.
        </p>
      </div>
    ),
    toc: [
      { id: 'toc-1', name: '1. Speed to Proposal' }
    ]
  },
  'best-invoice-software-for-freelancers': {
    category: 'Invoices',
    title: 'The Modern Billing Stack: Milestone Invoicing vs Hourly Logs',
    subtitle: 'Hourly billing traps your income growth. Milestone schedules keep your payouts safe and aligned.',
    date: 'April 22, 2026',
    readTime: '7 min read',
    author: 'Sarah Chen',
    authorRole: 'UI/UX Product Designer & Advisor',
    schemaDesc: 'Compare milestone invoicing workflows with traditional hourly logging strategies to optimize cash collection cycles.',
    content: (
      <div>
        <p style={{ fontSize: '1.1rem', lineHeight: '1.8', marginBottom: '24px' }}>
          Traditional invoice generators create simple flat invoice PDFs that require back-and-forth email follow-ups. Milestone invoicing splits projects into logical segments with secure approval logs.
        </p>

        <h3 id="toc-1" style={{ fontSize: '1.4rem', fontWeight: 800, margin: '28px 0 12px 0', color: 'var(--text-main)' }}>
          1. Escrow & Milestone Safety
        </h3>
        <p style={{ marginBottom: '16px' }}>
          By implementing deposit milestones, you confirm client alignment prior to committing your calendar. Connecting subsequent design deliverables releases to invoice clearances guarantees that you never work for free.
        </p>
      </div>
    ),
    toc: [
      { id: 'toc-1', name: '1. Escrow & Milestone Safety' }
    ]
  },
  'freelance-contract-essentials': {
    category: 'Proposals',
    title: 'Contract Deliverables: Connecting Asset Handover to Payment Clearance',
    subtitle: 'Protect your intellectual property. Learn how to secure copyright releases only upon final invoice clearance.',
    date: 'April 05, 2026',
    readTime: '6 min read',
    author: 'Marcus Todd',
    authorRole: 'Growth Strategist & Fractional CMO',
    schemaDesc: 'Essential legal terms and payment rules to protect independent contractors against late payments.',
    content: (
      <div>
        <p style={{ fontSize: '1.1rem', lineHeight: '1.8', marginBottom: '24px' }}>
          Sending over design layouts or source repositories prior to invoice clearances is the most common cause of unpaid balance disputes. Your contract must explicitly specify how intellectual property handovers map to invoice settlements.
        </p>

        <h3 id="toc-1" style={{ fontSize: '1.4rem', fontWeight: 800, margin: '28px 0 12px 0', color: 'var(--text-main)' }}>
          1. The Intellectual Property Release Clause
        </h3>
        <p style={{ marginBottom: '16px' }}>
          Ensure your proposal agreements state: <em>&ldquo;All rights and intellectual property title in the deliverables remain with the contractor until all corresponding milestone invoices are paid in full.&rdquo;</em> This ensures that any premature use of assets constitutes copyright violation.
        </p>
      </div>
    ),
    toc: [
      { id: 'toc-1', name: '1. IP Release Clause' }
    ]
  }
};

export async function generateMetadata({ params }) {
  const unwrappedParams = await params;
  const slug = unwrappedParams.slug;
  const post = blogDatabase[slug];

  if (!post) {
    return {
      title: 'Article Not Found | Freelancer Business OS Blog',
      description: 'The requested guide was not found.'
    };
  }

  return {
    title: `${post.title} | Freelancer Business OS`,
    description: post.subtitle || post.schemaDesc,
    keywords: [post.category, 'freelance pricing', 'freelancer client crm', 'milestone invoice']
  };
}

function getBlogRelatedLinks(slug) {
  const normalized = String(slug || '').toLowerCase();
  if (normalized.includes('price') || normalized.includes('rate')) {
    return [
      { title: 'Designer Pricing Guide', url: '/how-to-price-designer-projects', desc: 'Step-by-step value-based rate sheet for designers.' },
      { title: 'Developer Invoicing Guide', url: '/invoice-template-for-developer', desc: 'Itemized milestone billing checkouts for engineers.' }
    ];
  } else if (normalized.includes('client') || normalized.includes('get')) {
    return [
      { title: 'Freelancer Client Guide', url: '/how-to-get-freelance-clients', desc: 'Organic SEO and directory client acquisition strategies.' },
      { title: 'Consultant Proposal Template', url: '/proposal-template-for-consultant', desc: 'High-converting scoping structures to close deals faster.' }
    ];
  } else {
    return [
      { title: 'Freelance Contract Guide', url: '/freelance-contract-template-guide', desc: 'Protect your IP and connect handovers to payments.' },
      { title: 'Invoice vs Quote vs Receipt', url: '/invoice-vs-quote-vs-receipt', desc: 'Understanding critical documents in client billing cycles.' }
    ];
  }
}

export default async function BlogPostPage({ params }) {
  const unwrappedParams = await params;
  const slug = unwrappedParams.slug;
  const post = blogDatabase[slug];

  if (!post) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--bg-page)', color: 'var(--text-main)' }}>
        <div className="card" style={{ maxWidth: '400px', textAlign: 'center', padding: '32px' }}>
          <h2 style={{ color: 'var(--danger)', marginBottom: '12px' }}>Post Not Found</h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: '24px', fontSize: '0.9rem' }}>The blog post you requested does not exist.</p>
          <Link href="/blog" className="btn btn-primary" style={{ width: '100%' }}>Return to Blog</Link>
        </div>
      </div>
    );
  }

  // Inject structured JSON-LD article schema
  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "headline": post.title,
    "alternativeHeadline": post.subtitle,
    "genre": "Freelancer Operations",
    "keywords": post.category,
    "wordcount": "1000",
    "datePublished": new Date(post.date).toISOString().substring(0, 10),
    "author": {
      "@type": "Person",
      "name": post.author
    },
    "publisher": {
      "@type": "Organization",
      "name": "Freelancer Business OS",
      "logo": {
        "@type": "ImageObject",
        "url": "https://freelancer-os.com/logo.png"
      }
    },
    "description": post.schemaDesc
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg-page)', color: 'var(--text-main)', fontFamily: 'Outfit, sans-serif' }}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
      />

      {/* Navbar Header */}
      <nav className="navbar" style={{ borderBottom: '1px solid var(--border)', padding: '0 2rem' }}>
        <div className="logo-container">
          <svg style={{ width: '22px', height: '22px' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
            <line x1="9" y1="9" x2="15" y2="9" />
            <line x1="9" y1="13" x2="15" y2="13" />
            <line x1="9" y1="17" x2="13" y2="17" />
          </svg>
          <Link href="/">Freelancer Business OS</Link>
        </div>
        <div className="nav-links">
          <Link href="/freelancers" className="nav-link">Directory</Link>
          <Link href="/blog" className="nav-link" style={{ fontWeight: 700 }}>Blog</Link>
          <Link href="/pricing" className="nav-link">Pricing</Link>
          <Link href="/dashboard" className="btn btn-secondary btn-sm">Dashboard</Link>
          <ThemeToggle />
        </div>
      </nav>

      {/* Main Grid content */}
      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '80px 24px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '3fr 1.2fr', gap: '48px', alignItems: 'start' }}>
          
          {/* Main article body */}
          <article>
            {/* Header metadata */}
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
              <span style={{ color: 'var(--accent)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{post.category}</span>
              <span>•</span>
              <span>{post.date}</span>
              <span>•</span>
              <span>{post.readTime}</span>
            </div>

            <h1 className="glow-gradient-text" style={{ fontSize: '2.5rem', fontWeight: 900, lineHeight: 1.15, letterSpacing: '-0.5px', marginBottom: '16px', color: 'var(--text-main)', textAlign: 'left', background: 'linear-gradient(135deg, var(--text-main) 30%, var(--text-muted) 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              {post.title}
            </h1>
            <p style={{ fontSize: '1.25rem', color: 'var(--text-muted)', lineHeight: '1.6', marginBottom: '40px', borderLeft: '3px solid var(--primary)', paddingLeft: '16px', textAlign: 'left' }}>
              {post.subtitle}
            </p>

            <div style={{ borderBottom: '1px solid var(--border)', marginBottom: '40px' }} />

            {/* Rendered post JSX content */}
            <div style={{ color: 'var(--text-main)', lineHeight: '1.8', fontSize: '1.05rem', textAlign: 'left', opacity: 0.9 }}>
              {post.content}
            </div>

            {/* Author Profile block */}
            <div className="card glass-panel" style={{ marginTop: '60px', padding: '32px', border: '1px solid var(--border)', borderRadius: '12px', display: 'flex', gap: '20px', alignItems: 'center', flexWrap: 'wrap', textAlign: 'left' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--primary), var(--accent))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', fontWeight: 800, color: '#fff' }}>
                {post.author.charAt(0)}
              </div>
              <div>
                <strong style={{ display: 'block', fontSize: '0.95rem', color: 'var(--text-main)' }}>Written by {post.author}</strong>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{post.authorRole}</span>
              </div>
            </div>

            {/* Related Tools & Guides cross-linking */}
            <div style={{ marginTop: '48px', borderTop: '1px solid var(--border)', paddingTop: '36px', textAlign: 'left' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '20px', color: 'var(--text-main)' }}>Recommended Guides & Success Resources</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
                <Link href="/freelancers" style={{ 
                  display: 'block', 
                  padding: '20px', 
                  backgroundColor: 'var(--btn-secondary-bg)', 
                  border: '1px solid var(--border)', 
                  borderRadius: '8px', 
                  textDecoration: 'none',
                  transition: 'var(--transition)'
                }} className="hover-card">
                  <strong style={{ display: 'block', color: 'var(--accent)', fontSize: '0.95rem', marginBottom: '6px' }}>
                    Freelancer Directory
                  </strong>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: '1.4', display: 'block' }}>
                    Connect and collaborate with verified developers, designers, and consultants.
                  </span>
                </Link>
                <Link href="/pricing" style={{ 
                  display: 'block', 
                  padding: '20px', 
                  backgroundColor: 'var(--btn-secondary-bg)', 
                  border: '1px solid var(--border)', 
                  borderRadius: '8px', 
                  textDecoration: 'none',
                  transition: 'var(--transition)'
                }} className="hover-card">
                  <strong style={{ display: 'block', color: 'var(--accent)', fontSize: '0.95rem', marginBottom: '6px' }}>
                    Business OS Pricing
                  </strong>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: '1.4', display: 'block' }}>
                    Compare client checkout fees, custom domains, and scoping pipelines.
                  </span>
                </Link>
                {getBlogRelatedLinks(slug).map((link, idx) => (
                  <Link 
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
                  </Link>
                ))}
              </div>
            </div>
          </article>

          {/* Sidebar (Table of Contents & CTA) */}
          <aside style={{ position: 'sticky', top: '96px', display: 'flex', flexDirection: 'column', gap: '32px', textAlign: 'left' }}>
            
            {/* Table of Contents */}
            <div className="card" style={{ padding: '24px', borderRadius: '8px' }}>
              <h4 style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '16px' }}>Table of Contents</h4>
              <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.85rem' }}>
                {post.toc.map(item => (
                  <li key={item.id}>
                    <a href={`#${item.id}`} style={{ color: 'var(--text-muted)', transition: 'var(--transition)' }} onMouseOver={e => e.currentTarget.style.color = 'var(--primary)'} onMouseOut={e => e.currentTarget.style.color = 'var(--text-muted)'}>
                      {item.name}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Sidebar conversion CTA */}
            <div className="card hover-glow" style={{ padding: '28px', border: '1px solid var(--primary)', borderRadius: '12px', background: 'var(--primary-glow)' }}>
              <h4 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '8px' }}>Freelancer Business OS</h4>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: '1.4', marginBottom: '20px' }}>
                Create your public card profile, capture high-quality client briefs, scoper milestone proposals, and get paid securely.
              </p>
              <Link href="/dashboard?action=create-profile" className="btn btn-primary btn-sm" style={{ width: '100%', fontWeight: 700 }}>
                Create Free Profile
              </Link>
            </div>

          </aside>

        </div>
      </div>
    </div>
  );
}
