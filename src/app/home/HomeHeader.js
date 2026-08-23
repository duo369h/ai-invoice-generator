import PublicHeader from '../components/PublicHeader';

const CREATE_QUOTE_URL = '/signup?redirect=%2Fdashboard%3Ftool%3Dquote%26mode%3Dcreate%26flow%3Dfirst-quote';

const HOME_NAV_LINKS = [
  {
    label: 'How It Works',
    href: '/#how-corvioz-works',
    children: [
      { label: 'Workflow', href: '/#how-corvioz-works' },
      { label: 'Features', href: '/#features' },
      { label: 'Client Journey', href: '/#client-journey' },
    ],
  },
  { label: 'For Photographers', href: '/for-photographers' },
  { label: 'Pricing', href: '/pricing' },
  {
    label: 'Resources',
    href: '#',
    children: [
      { label: 'Guides', href: '/#guides' },
      { label: 'Templates', href: '/quote-template' },
      { label: 'Blog', href: '/blog' },
      { label: 'Help Center', href: '/help' },
    ],
  },
  { label: 'Security', href: '/security' },
];

export default function HomeHeader() {
  return (
    <>
      <style>{`
        @media (min-width: 821px) {
          .home-public-header.public-v2-navbar {
            display: grid;
            grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr);
            justify-content: initial;
          }

          .home-public-header .public-v2-controls {
            display: contents;
          }

          .home-public-header .public-v2-nav {
            position: static;
            grid-column: 2;
            grid-row: 1;
            transform: none;
          }

          .home-public-header .public-v2-actions {
            grid-column: 3;
            grid-row: 1;
            justify-self: end;
          }
        }

        @media (max-width: 820px) {
          .home-public-header .public-v2-controls {
            display: flex;
          }
        }

        .home-public-header .public-v2-cta,
        .home-public-header .public-v2-cta:hover,
        .home-public-header .public-v2-cta:focus-visible,
        .home-public-header .public-v2-cta:active,
        .home-public-header .public-v2-mobile-cta,
        .home-public-header .public-v2-mobile-cta:hover,
        .home-public-header .public-v2-mobile-cta:focus-visible,
        .home-public-header .public-v2-mobile-cta:active {
          background: #4f46e5;
          color: #ffffff;
        }

      `}</style>
      <PublicHeader
        route="/"
        surfaceId="home-global-control-surface"
        className="home-public-header"
        navLinks={HOME_NAV_LINKS}
        accountAction={{
          label: 'Sign in',
          href: '/dashboard',
          variant: 'secondary',
        }}
        primaryAction={{
          label: 'Create Quote',
          href: CREATE_QUOTE_URL,
          variant: 'primary',
        }}
      />
    </>
  );
}
