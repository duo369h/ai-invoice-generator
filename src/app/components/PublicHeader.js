'use client';

import React from 'react';
import { Logo } from './UIComponents';
import GlobalHeaderControlCluster from '../../components/layout/GlobalHeaderControlCluster';

const DEFAULT_NAV_LINKS = [
  { label: 'How it Works', href: '/#how-corvioz-works' },
  { label: 'Pricing', href: '/pricing' },
  { label: 'Resources', href: '/#resources' },
  { label: 'Security', href: '/security' },
  { label: 'Help Center', href: '/help' },
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
