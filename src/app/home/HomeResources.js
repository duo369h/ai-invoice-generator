import Link from 'next/link';

const RESOURCES = [
  { href: '/blog/how-to-price-web-design-projects', title: 'Project Pricing: Structuring Work Beyond Hourly Rates', description: 'Learn how to structure freelance web design and development projects around scope, milestones, and client expectations.' },
  { href: '/blog/invoice-vs-quote-vs-receipt', title: 'Invoice vs Quote vs Receipt: What Freelancers Should Send and When', description: 'A simple guide to the difference between quotes, invoices, and receipts in a freelance client workflow.' },
  { href: '/blog/best-invoice-software-for-freelancers', title: 'The Modern Document Workflow: Milestone Invoicing vs Hourly Logs', description: 'Compare milestone document workflows with traditional hourly logging and learn how freelancers can keep client work organized.' },
];

function ArrowIcon() {
  return <svg className="resource-arrow-icon" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M4.166 10h11.668M10.833 5l5 5-5 5" strokeLinecap="round" strokeLinejoin="round"/></svg>;
}

export default function HomeResources() {
  return (
    <section className="section-resources-wrapper" id="resources">
      <div className="section-container">
        <div className="resources-header">
          <div className="section-kicker">RESOURCES</div>
          <h2 className="section-title">Practical help for clearer client work.</h2>
          <p className="section-intro">Use practical guides to think through project pricing, client documents, and the workflows that move work forward.</p>
        </div>
        <div className="resources-editorial-surface resources-reveal-item" id="resources-surface-reveal">
          <div className="resources-list-rows" id="guides">
            {RESOURCES.map((resource) => (
              <Link href={resource.href} className="resource-row-item" key={resource.href}>
                <div><span className="resource-category-tag">GUIDE</span></div>
                <div className="resource-row-content"><h3 className="resource-row-title">{resource.title}</h3><p className="resource-row-desc">{resource.description}</p></div>
                <div className="resource-arrow-cell"><ArrowIcon/></div>
              </Link>
            ))}
          </div>
        </div>
        <div className="resources-secondary-nav"><Link href="/blog" className="secondary-nav-link">Browse all articles →</Link><span className="secondary-nav-divider"/><Link href="/help" className="secondary-nav-link">Help Center →</Link></div>
      </div>
    </section>
  );
}
