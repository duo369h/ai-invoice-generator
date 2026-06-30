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
  className = '',
  style = {},
  ...props
}) {
  return (
    <Card 
      {...props}
      className={['locked-state-card', className].filter(Boolean).join(' ')}
      style={style} 
    >
      <div className="locked-state-icon">
        {/* Render a secure padlock symbol */}
        <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="var(--primary)" strokeWidth="2.5">
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
        </svg>
      </div>

      <Badge variant="accent" className="locked-state-badge">PRO MODE</Badge>

      <h3 className="locked-state-title">{title}</h3>
      <p className="locked-state-description">
        {description}
      </p>

      {features.length > 0 && (
        <ul className="locked-state-list">
          {features.map((f, i) => (
            <li key={i}>
              <Icons.Check size={14} className="locked-state-feature-icon" />
              {f}
            </li>
          ))}
        </ul>
      )}

      <Button 
        href={ctaHref} 
        onClick={onCtaClick} 
        variant="primary"
        className="locked-state-cta"
      >
        {ctaLabel}
      </Button>
    </Card>
  );
}
