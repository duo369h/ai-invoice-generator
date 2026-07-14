'use client';

import React from 'react';
import { Logo } from './UIComponents';
import GlobalHeaderControlCluster from '../../components/layout/GlobalHeaderControlCluster';

const DEFAULT_NAV_LINKS = [
  { label: 'How It Works', href: '/#how-corvioz-works' },
  { label: 'For Photographers', href: '/for-photographers' },
  { label: 'Pricing', href: '/pricing' },
  {
    label: 'Resources',
    href: '#',
    children: [
      { label: 'Blog', href: '/blog' },
      { label: 'Invoice Templates', href: '/invoice-template' },
      { label: 'Quote Templates', href: '/quote-template' }
    ]
  },
  { label: 'Security', href: '/security' },
  { label: 'Help Center', href: '/help' }
];

export default function PublicHeader({
  route = '/',
  surfaceId,
  navLinks = DEFAULT_NAV_LINKS,
  accountAction = { label: 'Sign in', href: '/dashboard', variant: 'secondary' },
  primaryAction = { label: 'Create Quote', href: '/dashboard?tool=quote', variant: 'primary' },
  className = 'navbar',
  logoSize,
}) {
  return (
    <nav className={className}>
      <Logo size={logoSize} />
      <GlobalHeaderControlCluster
        surfaceId={surfaceId || `public-header-${route}`}
        route={route}
        navLinks={navLinks}
        accountAction={accountAction}
        primaryAction={primaryAction}
      />
    </nav>
  );
}
