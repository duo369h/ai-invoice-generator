'use client';

import React, { useEffect, useId, useState } from 'react';
import Link from 'next/link';
import ThemeToggle from '../../app/components/ThemeToggle';
import { Button } from '../ui/Button';
import { assertSingleControlSurface } from '../../core/ui/controlSurfaceEnforcer';
import type { GlobalControlSurfaceKey } from '../../core/ui/globalControlSurface';

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
  showThemeToggle?: boolean;
  variant?: 'default' | 'publicV2';
}

export function GlobalHeaderControlCluster({
  navLinks = [],
  primaryAction = null,
  accountAction = { label: 'Sign in', href: '/dashboard', variant: 'secondary' },
  surfaceId,
  route,
  compact = false,
  showThemeToggle = true,
  variant = 'default',
}: GlobalHeaderControlClusterProps) {
  const generatedId = useId();
  const resolvedSurfaceId = surfaceId ?? `global-header-control-${generatedId}`;
  const [menuOpen, setMenuOpen] = useState(false);
  const [publicDropdownOpen, setPublicDropdownOpen] = useState<string | null>(null);
  const [mobileHowOpen, setMobileHowOpen] = useState(false);
  const [mobileResourcesOpen, setMobileResourcesOpen] = useState(false);
  const lastTriggerRef = React.useRef<HTMLElement | null>(null);

  const menuOpenRef = React.useRef(menuOpen);
  const publicDropdownOpenRef = React.useRef(publicDropdownOpen);
  const mobileHowOpenRef = React.useRef(mobileHowOpen);
  const mobileResourcesOpenRef = React.useRef(mobileResourcesOpen);

  React.useEffect(() => { menuOpenRef.current = menuOpen; }, [menuOpen]);
  React.useEffect(() => { publicDropdownOpenRef.current = publicDropdownOpen; }, [publicDropdownOpen]);
  React.useEffect(() => { mobileHowOpenRef.current = mobileHowOpen; }, [mobileHowOpen]);
  React.useEffect(() => { mobileResourcesOpenRef.current = mobileResourcesOpen; }, [mobileResourcesOpen]);
  const hasMenu = navLinks.length > 0 || Boolean(accountAction) || Boolean(primaryAction);
  const idSeed = generatedId.replace(/[^a-zA-Z0-9_-]/g, '');
  const mobileTriggerId = `public-v2-mobile-trigger-${idSeed}`;
  const mobileMenuId = `public-v2-mobile-menu-${idSeed}`;

  useEffect(() => {
    const controls: GlobalControlSurfaceKey[] = showThemeToggle
      ? ['theme_toggle', 'menu_trigger', 'auth_entry', 'workspace_switch']
      : ['menu_trigger', 'auth_entry', 'workspace_switch'];

    const releaseSurface = assertSingleControlSurface(resolvedSurfaceId, controls, route);
    const cleanups: Array<() => void> = [];
    if (variant === 'publicV2') {
      const closeOnEscape = (event: KeyboardEvent) => {
        if (event.key === "Escape") {
          if (menuOpenRef.current) {
            event.preventDefault();
            setMenuOpen(false);
            setMobileHowOpen(false);
            setMobileResourcesOpen(false);
            const mobileTrigger = document.getElementById(mobileTriggerId);
            if (mobileTrigger) {
              mobileTrigger.focus();
            }
          } else if (publicDropdownOpenRef.current !== null) {
            event.preventDefault();
            setPublicDropdownOpen(null);
            if (lastTriggerRef.current) {
              lastTriggerRef.current.focus();
            }
          }
        }
      };
      const closeOnOutsidePointer = (event: PointerEvent) => {
        const target = event.target as HTMLElement | null;
        if (!target?.closest('.public-v2-navbar')) {
          setMenuOpen(false);
          setPublicDropdownOpen(null);
          setMobileHowOpen(false);
          setMobileResourcesOpen(false);
        }
      };
      document.addEventListener('keydown', closeOnEscape);
      document.addEventListener('pointerdown', closeOnOutsidePointer);
      cleanups.push(() => document.removeEventListener('keydown', closeOnEscape));
      cleanups.push(() => document.removeEventListener('pointerdown', closeOnOutsidePointer));
    }
    return () => {
      cleanups.forEach((cleanup) => cleanup());
      releaseSurface?.();
    };
  }, [resolvedSurfaceId, route, showThemeToggle, variant]);

  const toggleMobileSubmenu = (section: "how" | "resources", triggerEl: HTMLElement) => {
    lastTriggerRef.current = triggerEl;
    if (section === "how") {
      setMobileHowOpen((prev) => {
        if (!prev) setMobileResourcesOpen(false);
        return !prev;
      });
    } else {
      setMobileResourcesOpen((prev) => {
        if (!prev) setMobileHowOpen(false);
        return !prev;
      });
    }
  };

  const closeMenu = () => {
    setMenuOpen(false);
    setPublicDropdownOpen(null);
    setMobileHowOpen(false);
    setMobileResourcesOpen(false);
  };

  const renderAction = (action: HeaderControlAction, fallbackVariant: 'primary' | 'secondary') => (
    <Button
      href={action.href}
      variant={action.variant ?? fallbackVariant}
      size="sm"
      icon={undefined}
      className={action.variant === 'primary' ? 'btn-navbar-cta' : 'header-account-action'}
      onClick={() => {
        closeMenu();
        action.onClick?.();
      }}
    >
      {action.label}
    </Button>
  );

  if (variant === 'publicV2') {
    const renderPublicAction = (action: HeaderControlAction, kind: 'account' | 'primary') => (
      <Link
        href={action.href}
        className={kind === 'primary' ? 'public-v2-cta' : 'public-v2-signin'}
        onClick={() => { closeMenu(); action.onClick?.(); }}
      >
        {action.label}
      </Link>
    );

    return (
      <>
        <style>{`
          .public-v2-navbar {
            box-sizing: border-box;
            font-family: 'Geist', 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            height: 64px;
            width: 100%;
            padding: 0 32px;
            position: sticky;
            top: 0;
            z-index: 100;
            display: flex;
            align-items: center;
            justify-content: space-between;
            background: #f8fafc;
            border-bottom: 1px solid var(--border-medium, #e2e8f0);
            backdrop-filter: none;
            -webkit-backdrop-filter: none;
            transition: none;
          }
          .public-v2-logo { display: inline-flex; align-items: center; text-decoration: none; }
          .public-v2-wordmark { color: var(--text-main, #0f172a); font-size: 1.3rem; font-weight: 900; letter-spacing: -.035em; }
          .public-v2-controls { display: flex; align-items: center; gap: 24px; }
          .public-v2-actions { display: flex; align-items: center; gap: 24px; }
          .public-v2-nav { display: flex; align-items: center; gap: 24px; }
          .public-v2-nav-group { position: relative; display: inline-flex; align-items: center; }
          .public-v2-nav-trigger, .public-v2-nav-link, .public-v2-signin { position: relative; display: inline-flex; align-items: center; gap: 4px; padding: 8px 4px; border: 0; background: transparent; color: var(--text-muted, #64748b); font: inherit; font-size: .875rem; font-weight: 600; text-decoration: none; cursor: pointer; }
          .public-v2-nav-trigger::after, .public-v2-nav-link::after, .public-v2-signin::after { content: ''; position: absolute; left: 4px; right: 4px; bottom: 2px; height: 2px; border-radius: 99px; background: #4f46e5; opacity: 0; transform: translateY(2px); transition: opacity 150ms ease, transform 150ms ease; }
          .public-v2-nav-trigger:hover, .public-v2-nav-trigger:focus-visible, .public-v2-nav-link:hover, .public-v2-nav-link:focus-visible, .public-v2-signin:hover, .public-v2-signin:focus-visible { color: #4f46e5; outline: none; }
          .public-v2-nav-trigger:hover::after, .public-v2-nav-trigger:focus-visible::after, .public-v2-nav-trigger[aria-expanded="true"]::after, .public-v2-nav-link:hover::after, .public-v2-nav-link:focus-visible::after, .public-v2-signin:hover::after, .public-v2-signin:focus-visible::after { opacity: 1; transform: translateY(0); }
          .public-v2-chevron { width: 12px; height: 12px; opacity: .6; transition: transform 180ms ease; }
          .public-v2-nav-trigger[aria-expanded="true"] .public-v2-chevron, .public-v2-nav-group:hover .public-v2-chevron { transform: translateY(1px); }
          .public-v2-dropdown { position: absolute; top: 100%; left: 0; width: 200px; padding: 4px 0; border: 1px solid var(--border-medium, #e2e8f0); border-top: 2px solid #4f46e5; border-radius: 0 0 6px 6px; background: #fff; box-shadow: 0 4px 12px rgba(0,0,0,.05); opacity: 0; visibility: hidden; pointer-events: none; transition: opacity 120ms ease, visibility 120ms ease; z-index: 120; }
          .public-v2-nav-group:hover .public-v2-dropdown, .public-v2-dropdown[data-open="true"] { opacity: 1; visibility: visible; pointer-events: auto; }
          .public-v2-dropdown::before { content: ''; position: absolute; top: -10px; left: 0; right: 0; height: 10px; }
          .public-v2-dropdown-link { display: block; padding: 8px 16px; color: var(--text-muted, #64748b); font-size: .85rem; font-weight: 500; text-decoration: none; }
          .public-v2-dropdown-link:hover, .public-v2-dropdown-link:focus-visible { color: #4f46e5; background: var(--brand-light, #eef2ff); outline: none; }
          .public-v2-cta { display: inline-flex; align-items: center; justify-content: center; padding: 8px 18px; border: 1px solid #4f46e5; border-radius: 6px; background: #4f46e5; color: #fff; font-size: .875rem; font-weight: 600; text-decoration: none; white-space: nowrap; transition: background-color 150ms ease; }
          .public-v2-cta:hover, .public-v2-cta:focus-visible { background: #4338ca; outline: none; }
          .public-v2-mobile-trigger { display: none; width: 44px; height: 44px; align-items: center; justify-content: center; flex-direction: column; gap: 5px; border: 1px solid transparent; border-radius: 6px; background: transparent; color: var(--text-main, #0f172a); cursor: pointer; }
          .public-v2-mobile-trigger span { width: 18px; height: 2px; border-radius: 2px; background: currentColor; }
          .public-v2-mobile-menu { display: none; }
          @media (max-width: 1100px) { .public-v2-navbar { padding-left: 24px; padding-right: 24px; } .public-v2-nav, .public-v2-controls, .public-v2-actions { gap: 14px; } }
          @media (max-width: 820px) { .public-v2-navbar { padding-left: 20px; padding-right: 20px; } .public-v2-nav, .public-v2-signin, .public-v2-cta { display: none; } .public-v2-mobile-trigger { display: inline-flex; } .public-v2-mobile-menu { position: absolute; top: 64px; left: 0; right: 0; display: flex; flex-direction: column; gap: 4px; padding: 12px 20px 20px; border-bottom: 1px solid var(--border-medium, #e2e8f0); background: #f8fafc; box-shadow: 0 12px 20px rgba(15,23,42,.08); } .public-v2-mobile-menu[hidden] { display: none; } .public-v2-mobile-menu a, .public-v2-mobile-menu button { min-height: 44px; display: flex; align-items: center; padding: 10px 12px; border: 0; border-radius: 6px; background: transparent; color: var(--text-muted, #64748b); font: inherit; font-size: .95rem; font-weight: 650; text-align: left; text-decoration: none; } .public-v2-mobile-menu .public-v2-mobile-submenu-trigger { width: 100%; justify-content: space-between; } .public-v2-mobile-menu .public-v2-mobile-chevron { width: 12px; height: 12px; flex-shrink: 0; color: currentColor; transition: transform 220ms cubic-bezier(0.16, 1, 0.3, 1), color 180ms ease; } .public-v2-mobile-menu .public-v2-mobile-submenu-trigger[aria-expanded="true"] .public-v2-mobile-chevron { transform: rotate(180deg); color: var(--brand-primary, #4f46e5); } .public-v2-mobile-menu .public-v2-signin { display: flex; } .public-v2-mobile-menu > div { display: flex; flex-direction: column; gap: 4px; } .public-v2-mobile-menu [hidden] { display: none !important; } .public-v2-mobile-menu a:hover, .public-v2-mobile-menu a:focus-visible, .public-v2-mobile-menu button:hover, .public-v2-mobile-menu button:focus-visible { background: var(--brand-light, #eef2ff); color: #4f46e5; outline: none; } .public-v2-mobile-menu .public-v2-mobile-cta { justify-content: center; margin-top: 6px; background: #4f46e5; color: #fff; } .public-v2-mobile-menu .public-v2-mobile-cta:hover, .public-v2-mobile-menu .public-v2-mobile-cta:focus-visible { background: #4338ca; color: #fff; } }
          @media (max-width: 540px) { .public-v2-navbar { padding-left: 16px; padding-right: 16px; } .public-v2-mobile-menu { padding-left: 16px; padding-right: 16px; } }
          @media (prefers-reduced-motion: reduce) { .public-v2-navbar *, .public-v2-navbar *::after { transition: none !important; } }
        `}</style>
        <div className="public-v2-controls">
          <div className="public-v2-nav">
            {navLinks.map((link) => {
              const children = link.children?.length ? link.children : link.label === 'How It Works' ? [
                { label: 'Workflow', href: '/how-it-works' },
                { label: 'Features', href: '/#features' },
                { label: 'Client Journey', href: '/#client-journey' },
              ] : [];
              return children.length ? (
              <div className="public-v2-nav-group" key={`${link.href}-${link.label}`}>
                <button type="button" id={`public-v2-${link.label.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-trigger-${idSeed}`} className="public-v2-nav-trigger" aria-expanded={publicDropdownOpen === link.label} aria-controls={`public-v2-${link.label.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-panel-${idSeed}`} onClick={(e) => { lastTriggerRef.current = e.currentTarget; setPublicDropdownOpen((open) => open === link.label ? null : link.label); }}>
                  {link.label}<svg className="public-v2-chevron" viewBox="0 0 12 12" fill="none" aria-hidden="true"><path d="M2.5 4.5L6 8L9.5 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                </button>
                <div id={`public-v2-${link.label.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-panel-${idSeed}`} className="public-v2-dropdown" role="region" aria-labelledby={`public-v2-${link.label.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-trigger-${idSeed}`} data-open={publicDropdownOpen === link.label ? 'true' : 'false'}>{children.map((child) => <Link className="public-v2-dropdown-link" href={child.href} key={`${child.href}-${child.label}`} aria-current={route === child.href ? "page" : undefined} prefetch={child.href === "/how-it-works" ? false : undefined} onClick={closeMenu}>{child.label}</Link>)}</div>
              </div>
              ) : <Link className="public-v2-nav-link" href={link.href} key={`${link.href}-${link.label}`} aria-current={route === link.href ? 'page' : undefined}>{link.label}</Link>;
            })}
          </div>
          <div className="public-v2-actions">
            {accountAction && renderPublicAction(accountAction, 'account')}
            {primaryAction && renderPublicAction(primaryAction, 'primary')}
          </div>
          <button type="button" id={mobileTriggerId} className="public-v2-mobile-trigger" aria-label={menuOpen ? 'Close navigation menu' : 'Open navigation menu'} aria-expanded={menuOpen} aria-controls={mobileMenuId} onClick={(e) => { lastTriggerRef.current = e.currentTarget; setMenuOpen((open) => !open); }}><span /><span /><span /></button>
        </div>
        <nav id={mobileMenuId} className="public-v2-mobile-menu" aria-label="Mobile navigation" aria-labelledby={mobileTriggerId} hidden={!menuOpen}>
          {navLinks.map((link) => {
            const children = link.children?.length ? link.children : link.label === 'How It Works' ? [
              { label: 'Workflow', href: '/how-it-works' },
              { label: 'Features', href: '/#features' },
              { label: 'Client Journey', href: '/#client-journey' },
            ] : [];
            if (!children.length) return <Link href={link.href} key={`mobile-${link.href}-${link.label}`} aria-current={route === link.href ? 'page' : undefined} onClick={closeMenu}>{link.label}</Link>;
            const isHow = link.label === 'How It Works';
            const open = isHow ? mobileHowOpen : mobileResourcesOpen;
            const panelId = `public-v2-mobile-${isHow ? 'how' : 'resources'}-${idSeed}`;
            return <React.Fragment key={`mobile-${link.href}-${link.label}`}>
              <button type="button" className="public-v2-mobile-submenu-trigger" aria-expanded={open} aria-controls={panelId} onClick={(e) => toggleMobileSubmenu(isHow ? "how" : "resources", e.currentTarget)}>{link.label}<svg className="public-v2-mobile-chevron" viewBox="0 0 12 12" fill="none" aria-hidden="true"><path d="M2.5 4.5L6 8L9.5 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg></button>
              <div id={panelId} role="region" hidden={!open} aria-label={`${link.label} links`}>
                {children.map((child) => <Link href={child.href} key={`mobile-${child.href}-${child.label}`} aria-current={route === child.href ? "page" : undefined} prefetch={child.href === "/how-it-works" ? false : undefined} onClick={closeMenu}>{child.label}</Link>)}
              </div>
            </React.Fragment>;
          })}
          {accountAction && renderPublicAction(accountAction, 'account')}
          {primaryAction && <Link href={primaryAction.href} className="public-v2-mobile-cta" onClick={closeMenu}>{primaryAction.label}</Link>}
        </nav>
      </>
    );
  }

  if (compact) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', flexWrap: 'wrap' }}>
        {showThemeToggle && <ThemeToggle />}
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
        {showThemeToggle && <ThemeToggle />}
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
