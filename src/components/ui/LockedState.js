'use client';

import React from 'react';
import { Icons } from '../../styles/icons';
import { Button } from './Button';
import { Card } from './Card';
import { Badge } from './Badge';

export function LockedState({
  title = 'This Section is Locked',
  description = 'Upgrade to Corvioz Pro to unlock this section and manage freelance work.',
  features = [],
  ctaLabel = 'Unlock Workspace Now',
  ctaHref = '/pricing?checkout=pro',
  onCtaClick,
  style = {},
  ...props
}) {
  return (
    <Card 
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        padding: '64px 32px',
        background: 'rgba(255, 255, 255, 0.02)',
        backdropFilter: 'blur(12px)',
        border: '1px solid var(--border)',
        borderRadius: '16px',
        maxWidth: '680px',
        margin: '24px auto',
        boxShadow: 'var(--shadow-lg)',
        ...style
      }} 
      {...props}
    >
      <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'var(--primary-glow)', border: '1.5px solid var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px' }}>
        {/* Render a secure padlock symbol */}
        <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="var(--primary)" strokeWidth="2.5">
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
        </svg>
      </div>

      <Badge variant="accent" style={{ marginBottom: '12px' }}>PRO MODE</Badge>

      <h3 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '8px', letterSpacing: '-0.02em' }}>{title}</h3>
      <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', maxWidth: '460px', marginBottom: '24px', lineHeight: '1.5' }}>
        {description}
      </p>

      {features.length > 0 && (
        <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 32px 0', display: 'flex', flexDirection: 'column', gap: '10px', textAlign: 'left', maxWidth: '320px' }}>
          {features.map((f, i) => (
            <li key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              <Icons.Check size={14} style={{ color: 'var(--success)' }} />
              {f}
            </li>
          ))}
        </ul>
      )}

      <Button 
        href={ctaHref} 
        onClick={onCtaClick} 
        variant="primary"
        style={{ padding: '12px 32px', fontWeight: 700 }}
      >
        {ctaLabel}
      </Button>
    </Card>
  );
}
