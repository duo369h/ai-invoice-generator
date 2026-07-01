'use client';

import React, { useEffect, useId, useState } from 'react';
import Link from 'next/link';
import ThemeToggle from '../../app/components/ThemeToggle';
import { Button } from '../ui/Button';
import { assertSingleControlSurface } from '../../core/ui/controlSurfaceEnforcer';

export interface HeaderControlLink {
  label: string;
  href: string;
  active?: boolean;
  onClick?: () => void;
}

export interface HeaderControlAction {
  label: string;
  href: string;
  variant?: 'primary' | 'secondary';
  onClick?: () => void;
}

export interface GlobalHeaderControlClusterProps {
  navLinks?: HeaderControlLink[];
  primaryAction?: HeaderControlAction | null;
  accountAction?: HeaderControlAction | null;
  surfaceId?: string;
  route?: string;
  compact?: boolean;
}

export function GlobalHeaderControlCluster({
  navLinks = [],
  primaryAction = null,
  accountAction = { label: 'Sign in', href: '/dashboard', variant: 'secondary' },
  surfaceId,
  route,
  compact = false,
}: GlobalHeaderControlClusterProps) {
  const generatedId = useId();
  const resolvedSurfaceId = surfaceId ?? `global-header-control-${generatedId}`;
  const [menuOpen, setMenuOpen] = useState(false);
  const hasMenu = navLinks.length > 0 || Boolean(accountAction) || Boolean(primaryAction);

  useEffect(() => {
    return assertSingleControlSurface(
      resolvedSurfaceId,
      ['theme_toggle', 'menu_trigger', 'auth_entry', 'workspace_switch'],
      route,
    );
  }, [resolvedSurfaceId, route]);

  const closeMenu = () => setMenuOpen(false);

  const renderAction = (action: HeaderControlAction, fallbackVariant: 'primary' | 'secondary') => (
    <Button
      href={action.href}
      variant={action.variant ?? fallbackVariant}
      size="sm"
      icon={undefined}
      className={action.variant === 'primary' ? 'btn-navbar-cta' : undefined}
      onClick={() => {
        closeMenu();
        action.onClick?.();
      }}
    >
      {action.label}
    </Button>
  );

  if (compact) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', flexWrap: 'wrap' }}>
        <ThemeToggle />
        {accountAction && renderAction(accountAction, 'secondary')}
      </div>
    );
  }

  return (
    <>
      <style>{`
        .global-control-actions {
          display: inline-flex;
          align-items: center;
          gap: 10px;
        }
        .global-control-menu-trigger {
          display: none;
        }
        @media (max-width: 768px) {
          .global-control-menu-trigger {
            display: inline-flex;
          }
        }
      `}</style>
      <div className="nav-links desktop-only">
        {navLinks.map((link) => (
          <Link
            key={`${link.href}-${link.label}`}
            href={link.href}
            className="nav-link"
            style={link.active ? { fontWeight: 700 } : undefined}
            onClick={link.onClick}
          >
            {link.label}
          </Link>
        ))}
        {accountAction && renderAction(accountAction, 'secondary')}
        {primaryAction && renderAction(primaryAction, 'primary')}
      </div>

      <div className="global-control-actions">
        <ThemeToggle />
        {hasMenu && (
          <button
            type="button"
            className={`hamburger-btn global-control-menu-trigger ${menuOpen ? 'open' : ''}`}
            onClick={() => setMenuOpen((current) => !current)}
            aria-label="Toggle menu"
            aria-expanded={menuOpen}
          >
            <span />
            <span />
            <span />
          </button>
        )}
      </div>

      {menuOpen && (
        <div className="mobile-menu-drawer animate-fade-in">
          {navLinks.map((link) => (
            <Link
              key={`mobile-${link.href}-${link.label}`}
              href={link.href}
              className="mobile-nav-link"
              onClick={() => {
                closeMenu();
                link.onClick?.();
              }}
            >
              {link.label}
            </Link>
          ))}
          {(accountAction || primaryAction) && <div className="mobile-menu-divider" />}
          {accountAction && renderAction(accountAction, 'secondary')}
          {primaryAction && renderAction(primaryAction, 'primary')}
        </div>
      )}
    </>
  );
}

export default GlobalHeaderControlCluster;
