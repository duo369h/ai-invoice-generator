'use client';

import React from 'react';
import Link from 'next/link';

// 1. Button Component
export function Button({ 
  children, 
  onClick, 
  href, 
  variant = 'primary', // 'primary', 'secondary', 'google'
  size = 'md', // 'sm', 'md', 'lg'
  disabled = false,
  type = 'button',
  style = {},
  ...props 
}) {
  const baseStyle = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '6px',
    fontWeight: 600,
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.6 : 1,
    transition: 'var(--transition)',
    border: '1px solid transparent',
  };

  // Size configurations
  let sizeStyle = {};
  if (size === 'sm') {
    sizeStyle = { padding: '0.35rem 0.75rem', fontSize: '0.8rem', borderRadius: '4px' };
  } else if (size === 'lg') {
    sizeStyle = { padding: '0.9rem 2.5rem', fontSize: '1rem', borderRadius: '8px' };
  } else {
    sizeStyle = { padding: '0.5rem 1.2rem', fontSize: '0.875rem' };
  }

  // Variant configurations
  let variantStyle = {};
  if (variant === 'secondary') {
    variantStyle = {
      backgroundColor: 'var(--btn-secondary-bg)',
      color: 'var(--text-main)',
      borderColor: 'var(--border)',
    };
  } else if (variant === 'google') {
    variantStyle = {
      backgroundColor: 'var(--bg-surface)',
      color: 'var(--text-main)',
      borderColor: 'var(--border)',
      width: '100%',
      gap: '12px',
      padding: '0.65rem 1rem',
    };
  } else { // primary
    variantStyle = {
      backgroundColor: 'var(--btn-primary-bg)',
      color: 'var(--btn-primary-text)',
      borderColor: 'var(--btn-primary-border)',
      boxShadow: 'var(--shadow-sm)',
    };
  }

  const mergedStyle = { ...baseStyle, ...sizeStyle, ...variantStyle, ...style };

  const handleMouseOver = (e) => {
    if (disabled) return;
    if (variant === 'primary') {
      e.currentTarget.style.backgroundColor = 'var(--btn-primary-hover-bg)';
      e.currentTarget.style.boxShadow = 'var(--btn-primary-hover-shadow)';
      e.currentTarget.style.transform = 'translateY(-1px)';
    } else if (variant === 'secondary' || variant === 'google') {
      e.currentTarget.style.backgroundColor = 'var(--btn-secondary-hover-bg)';
      e.currentTarget.style.borderColor = 'var(--border-hover)';
      e.currentTarget.style.transform = 'translateY(-1px)';
    }
  };

  const handleMouseOut = (e) => {
    if (disabled) return;
    if (variant === 'primary') {
      e.currentTarget.style.backgroundColor = 'var(--btn-primary-bg)';
      e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
      e.currentTarget.style.transform = 'translateY(0)';
    } else if (variant === 'secondary' || variant === 'google') {
      e.currentTarget.style.backgroundColor = 'var(--btn-secondary-bg)';
      e.currentTarget.style.borderColor = 'var(--border)';
      e.currentTarget.style.transform = 'translateY(0)';
    }
  };

  if (href) {
    return (
      <Link 
        href={href} 
        style={mergedStyle} 
        onMouseOver={handleMouseOver} 
        onMouseOut={handleMouseOut} 
        {...props}
      >
        {children}
      </Link>
    );
  }

  return (
    <button 
      type={type}
      onClick={onClick} 
      disabled={disabled}
      style={mergedStyle} 
      onMouseOver={handleMouseOver} 
      onMouseOut={handleMouseOut} 
      {...props}
    >
      {children}
    </button>
  );
}

// 2. Card Component
export function Card({ children, style = {}, hoverGlow = false, className = '', ...props }) {
  const [hovered, setHovered] = React.useState(false);

  const baseStyle = {
    background: 'var(--bg-card)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-lg)',
    padding: '24px',
    boxShadow: hovered ? (hoverGlow ? 'var(--shadow-glow)' : 'var(--shadow-lg)') : 'var(--shadow-md)',
    borderColor: hovered ? 'var(--border-hover)' : 'var(--border)',
    transition: 'var(--transition)',
    position: 'relative',
  };

  // Merge transform styles safely (e.g. for pricing card scale & elevation)
  let mergedTransform = 'none';
  if (style.transform && style.transform !== 'none') {
    if (hovered) {
      if (style.transform.includes('scale')) {
        // Maintain the scale and translate it slightly higher
        mergedTransform = `${style.transform.replace(/translateY\([^)]+\)/g, '')} translateY(-16px)`;
      } else {
        mergedTransform = `${style.transform} translateY(-4px)`;
      }
    } else {
      mergedTransform = style.transform;
    }
  } else if (hovered) {
    mergedTransform = 'translateY(-4px)';
  }

  const mergedStyle = { ...baseStyle, ...style, transform: mergedTransform };

  return (
    <div 
      style={mergedStyle} 
      onMouseEnter={() => setHovered(true)} 
      onMouseLeave={() => setHovered(false)}
      className={`card ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

// 3. Badge Component
export function Badge({ children, variant = 'primary', style = {}, ...props }) {
  const baseStyle = {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '0.25rem 0.75rem',
    borderRadius: '9999px',
    fontSize: '0.75rem',
    fontWeight: 600,
    border: '1px solid transparent',
  };

  let variantStyle = {};
  if (variant === 'warning') {
    variantStyle = {
      backgroundColor: 'var(--warning-glow)',
      color: 'var(--warning-text)',
      borderColor: 'var(--warning-border)',
    };
  } else if (variant === 'success') {
    variantStyle = {
      backgroundColor: 'var(--success-glow)',
      color: 'var(--success-text)',
      borderColor: 'var(--success-border)',
    };
  } else if (variant === 'accent') {
    variantStyle = {
      backgroundColor: 'var(--accent-glow)',
      color: 'var(--accent-text)',
      borderColor: 'var(--accent-border)',
    };
  } else { // primary
    variantStyle = {
      backgroundColor: 'var(--primary-glow)',
      color: 'var(--primary)',
      borderColor: 'var(--border)',
    };
  }

  return (
    <span style={{ ...baseStyle, ...variantStyle, ...style }} {...props}>
      {children}
    </span>
  );
}

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
