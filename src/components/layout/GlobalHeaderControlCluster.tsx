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
  children?: HeaderControlLink[];
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
        .nav-link-group {
          position: relative;
          display: inline-flex;
          align-items: center;
        }
        .nav-link-dropdown {
          position: absolute;
          top: calc(100% + 10px);
          left: 50%;
          transform: translateX(-50%);
          min-width: 190px;
          padding: 8px;
          border: 1px solid var(--border);
          border-radius: 8px;
          background: var(--bg-card);
          box-shadow: var(--shadow-lg);
          opacity: 0;
          pointer-events: none;
          transition: opacity 160ms ease 150ms, transform 160ms ease 150ms;
          z-index: 50;
        }
        .nav-link-dropdown::before {
          content: "";
          position: absolute;
          top: -15px;
          left: 0;
          right: 0;
          height: 15px;
        }
        .nav-link-group:hover .nav-link-dropdown,
        .nav-link-group:focus-within .nav-link-dropdown {
          opacity: 1;
          pointer-events: auto;
          transform: translateX(-50%) translateY(2px);
          transition-delay: 0ms;
        }
        .nav-dropdown-link {
          display: block;
          padding: 9px 10px;
          border-radius: 6px;
          color: var(--text-muted);
          font-size: 0.84rem;
          font-weight: 650;
          text-decoration: none;
          white-space: nowrap;
        }
        .nav-dropdown-link:hover,
        .nav-dropdown-link:focus {
          color: var(--text-main);
          background: var(--btn-secondary-bg);
        }
        .mobile-nav-sublink {
          padding-left: 18px;
          font-size: 0.86rem;
          color: var(--text-muted);
        }
        @media (max-width: 768px) {
          .global-control-menu-trigger {
            display: inline-flex;
          }
        }
      `}</style>
      <div className="nav-links desktop-only">
        {navLinks.map((link) => (
          <div className="nav-link-group" key={`${link.href}-${link.label}`}>
            <Link
              href={link.href}
              className="nav-link"
              style={link.active ? { fontWeight: 700 } : undefined}
              onClick={(e) => {
                if (link.href === '#') e.preventDefault();
                if (link.onClick) link.onClick();
              }}
            >
              {link.label}
            </Link>
            {link.children && link.children.length > 0 && (
              <div className="nav-link-dropdown" aria-label={`${link.label} links`}>
                {link.children.map((child) => (
                  <Link
                    key={`${child.href}-${child.label}`}
                    href={child.href}
                    className="nav-dropdown-link"
                    onClick={child.onClick}
                  >
                    {child.label}
                  </Link>
                ))}
              </div>
            )}
          </div>
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
            <React.Fragment key={`mobile-${link.href}-${link.label}`}>
              <Link
                href={link.href}
                className="mobile-nav-link"
                onClick={(e) => {
                  if (link.href === '#') {
                    e.preventDefault();
                  } else {
                    closeMenu();
                  }
                  if (link.onClick) link.onClick();
                }}
              >
                {link.label}
              </Link>
              {link.children?.map((child) => (
                <Link
                  key={`mobile-${child.href}-${child.label}`}
                  href={child.href}
                  className="mobile-nav-link mobile-nav-sublink"
                  onClick={() => {
                    closeMenu();
                    child.onClick?.();
                  }}
                >
                  {child.label}
                </Link>
              ))}
            </React.Fragment>
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
