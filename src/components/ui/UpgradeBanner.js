'use client';

import React, { useState } from 'react';
import { Icons } from '../../styles/icons';
import Link from 'next/link';

export function UpgradeBanner({ message, isOpen = true, onClose, ctaText = 'Upgrade', targetPlan = 'pro', onClickCTA }) {
  const [visible, setVisible] = useState(true);

  if (!isOpen || !visible || !message) return null;

  return (
    <div className="upgrade-banner">
      <div className="upgrade-banner-message">
        <Icons.Sparkles size={16} style={{ color: 'var(--primary)', flexShrink: 0 }} />
        <span>{message}</span>
      </div>
      
      <div className="upgrade-banner-actions">
        <Link 
          href={`/pricing?checkout=${targetPlan || 'pro'}`}
          onClick={onClickCTA}
          className="upgrade-banner-cta"
        >
          {ctaText}
        </Link>
        <button 
          onClick={() => {
            setVisible(false);
            if (onClose) onClose();
          }}
          className="upgrade-banner-close"
          aria-label="Dismiss banner"
        >
          <Icons.Close size={14} />
        </button>
      </div>
    </div>
  );
}
