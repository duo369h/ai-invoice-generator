'use client';

import React from 'react';
import Link from 'next/link';

// Import standardized atomic components from design system core
import { Button, Card, Badge, Container, UpgradeModal, LockedState, PricingUpsellModal, ExportRestrictionModal, PricingRedirectOverlay, UpgradeBanner } from '../../components/ui/index.js';

// Re-export standardized components
export { Button, Card, Badge, Container, UpgradeModal, LockedState, PricingUpsellModal, ExportRestrictionModal, PricingRedirectOverlay, UpgradeBanner };


// 4. Section Component
export function Section({ children, id, style = {}, containerStyle = {}, ...props }) {
  return (
    <section 
      id={id} 
      style={{ 
        padding: '80px 24px', 
        borderTop: '1px solid var(--border)', 
        ...style 
      }} 
      {...props}
    >
      <div style={{ maxWidth: '1000px', margin: '0 auto', ...containerStyle }}>
        {children}
      </div>
    </section>
  );
}

// 5. Hero Component
export function Hero({ badge, title, subtitle, ctas = [], trustText, style = {}, ...props }) {
  return (
    <header style={{ padding: '120px 24px 80px 24px', maxWidth: '1100px', margin: '0 auto', textAlign: 'center', ...style }} {...props}>
      <div className="animate-fade-in">
        {badge && (
          <Badge style={{ marginBottom: '28px' }}>
            {badge}
          </Badge>
        )}

        <h1 className="glow-gradient-text" style={{ 
          fontSize: '4.5rem', 
          fontWeight: 900, 
          lineHeight: 1.05, 
          letterSpacing: '-0.04em', 
          marginBottom: '24px',
          maxWidth: '920px',
          margin: '0 auto 24px auto'
        }}>
          {title}
        </h1>

        {subtitle && (
          <p style={{ 
            fontSize: '1.2rem', 
            color: 'var(--text-muted)', 
            lineHeight: '1.6', 
            marginBottom: '48px', 
            maxWidth: '720px',
            margin: '0 auto 48px auto',
            fontWeight: 400
          }}>
            {subtitle}
          </p>
        )}

        {ctas.length > 0 && (
          <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '32px' }}>
            {ctas.map((cta, i) => (
              <Button key={i} href={cta.href} onClick={cta.onClick} variant={cta.variant} size="lg">
                {cta.label}
              </Button>
            ))}
          </div>
        )}

        {trustText && (
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 500 }}>
            {trustText}
          </p>
        )}
      </div>
    </header>
  );
}

// 6. PricingCard Component
export function PricingCard({ title, price, period, features = [], ctaLabel, ctaHref, ctaVariant = 'secondary', popular = false, style = {}, ...props }) {
  return (
    <Card style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      justifyContent: 'space-between', 
      padding: '36px',
      border: popular ? '2.5px solid var(--primary)' : '1px solid var(--border)',
      boxShadow: popular ? 'var(--shadow-glow)' : 'var(--shadow-md)',
      transform: popular ? 'scale(1.05) translateY(-8px)' : 'none',
      zIndex: popular ? 2 : 1,
      ...style 
    }} {...props}>
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 800 }}>{title}</h3>
          {popular && (
            <Badge style={{ fontSize: '0.65rem', fontWeight: 700, backgroundColor: 'var(--primary)', color: '#ffffff', border: 'none' }}>
              MOST POPULAR
            </Badge>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', marginBottom: '24px' }}>
          <span style={{ fontSize: '2.5rem', fontWeight: 800 }}>{price}</span>
          <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{period}</span>
        </div>
        <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '32px', color: 'var(--text-muted)', fontSize: '0.85rem', padding: 0 }}>
          {features.map((f, i) => (
            <li key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="var(--success)" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
              {f}
            </li>
          ))}
        </ul>
      </div>
      <Button href={ctaHref} variant={ctaVariant} style={{ width: '100%', textAlign: 'center' }}>
        {ctaLabel}
      </Button>
    </Card>
  );
}

// 7. MetricCard Component
export function MetricCard({ label, value, trend, style = {}, ...props }) {
  return (
    <Card style={{ padding: '20px', ...style }} {...props}>
      <span style={{ fontSize: '0.65rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</span>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginTop: '4px' }}>
        <h3 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
          {value}
        </h3>
        {trend && (
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: trend.startsWith('+') || trend.includes('up') ? 'var(--success-text)' : 'var(--danger-text)' }}>
            {trend}
          </span>
        )}
      </div>
    </Card>
  );
}

// 8. Logo Component
export function Logo({ textStyle = {}, style = {}, className = '' }) {
  return (
    <Link 
      href="/" 
      className={`logo-container ${className}`} 
      aria-label="Corvioz home" 
      style={{ display: 'flex', alignItems: 'center', gap: '8px', ...style }}
    >
      <span className="logo-wordmark" style={{ fontWeight: 900, letterSpacing: '-0.035em', ...textStyle }}>Corvioz</span>
    </Link>
  );
}
