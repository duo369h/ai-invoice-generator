'use client';

import React from 'react';
import Link from 'next/link';
import GlobalHeaderControlCluster from '../../components/layout/GlobalHeaderControlCluster';

const DEFAULT_NAV_LINKS = [
  { label: 'How It Works', href: '/#how-corvioz-works' },
  { label: 'For Photographers', href: '/for-photographers' },
  { label: 'Pricing', href: '/pricing' },
  {
    label: 'Resources',
    href: '#',
    children: [
      { label: 'Guides', href: '/#guides' },
      { label: 'Templates', href: '/quote-template' },
      { label: 'Blog', href: '/blog' },
      { label: 'Help Center', href: '/help' }
    ]
  },
  { label: 'Security', href: '/security' }
];

export default function PublicHeader({
  route = '/',
  surfaceId,
  navLinks = DEFAULT_NAV_LINKS,
  accountAction = { label: 'Sign in', href: '/dashboard', variant: 'secondary' },
  primaryAction = { label: 'Create Quote', href: '/signup?redirect=%2Fdashboard%3Ftool%3Dquote%26mode%3Dcreate%26flow%3Dfirst-quote', variant: 'primary' },
  className = 'navbar',
  logoSize,
  showThemeToggle = false,
}) {
  return (
    <nav className={`${className} public-v2-navbar`} data-public-header="v2">
      <Link href="/" className="public-v2-logo" aria-label="Corvioz home">
        <span className="public-v2-wordmark" data-logo-size={logoSize || undefined}>Corvioz</span>
      </Link>
      <GlobalHeaderControlCluster
        surfaceId={surfaceId || `public-header-${route}`}
        route={route}
        navLinks={navLinks}
        accountAction={accountAction}
        primaryAction={primaryAction}
        showThemeToggle={showThemeToggle}
        variant="publicV2"
      />
    </nav>
  );
}
