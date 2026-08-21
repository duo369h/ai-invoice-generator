import Link from 'next/link';
import PublicHeader from '../components/PublicHeader';
import SharedFooter from '../components/SharedFooter';

export const metadata = {
  title: 'Help Center | Corvioz',
  description: 'One place for Corvioz contact, privacy, terms, refund, security, trust, and future documentation resources.',
};

const helpLinks = [
  { title: 'Contact', href: '/contact', body: 'Get help, send feedback, or ask a question about your Corvioz account.' },
  { title: 'Privacy Policy', href: '/privacy', body: 'Understand what data Corvioz collects and how it is used.' },
  { title: 'Terms of Service', href: '/terms', body: 'Review the rules and responsibilities for using Corvioz.' },
  { title: 'Refund Policy', href: '/refund-policy', body: 'See how paid subscription refund requests are handled.' },
  { title: 'Security Center', href: '/security', body: 'Review security practices for infrastructure, data, authentication, and billing.' },
  { title: 'Why Trust Corvioz', href: '/trust', body: 'Learn how Corvioz approaches transparency, data ownership, and product philosophy.' },
];

const futureResources = [
  'Documentation',
  'Changelog',
  'Status',
];

export default function HelpCenterPage() {
  return (
    <main className="resource-page">
      <PublicHeader route="/help" surfaceId="help-public-header" logoSize={24} />

      <section className="container resource-page__intro resource-page__intro--wide">
        <p className="section-kicker">Help Center</p>
        <h1 className="section-title resource-page__title">
          Trust, legal, and support resources in one place
        </h1>
        <p className="section-lede resource-page__lede">
          Use this page as the central entry for Corvioz support, policies, security, and transparency resources.
        </p>
      </section>

      <section className="container resource-page__content resource-page__content--wide">
        <div className="resource-page__grid">
          {helpLinks.map((item) => (
            <Link key={item.href} href={item.href} className="card hover-card resource-page__card resource-page__link-card">
              <h2 className="resource-page__card-title resource-page__link-card-title">
                {item.title}
              </h2>
              <p className="resource-page__card-copy resource-page__link-card-copy">
                {item.body}
              </p>
            </Link>
          ))}
        </div>

        <div className="card resource-page__card resource-page__future-card">
          <h2 className="resource-page__card-title resource-page__future-title">
            Future resources
          </h2>
          <p className="resource-page__card-copy resource-page__future-copy">
            These resources are planned as Corvioz grows. They are listed here as the future home for support expansion.
          </p>
          <ul className="resource-page__future-list">
            {futureResources.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      </section>

      <SharedFooter />
    </main>
  );
}
