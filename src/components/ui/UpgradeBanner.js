'use client';

import React, { useState } from 'react';
import { Icons } from '../../styles/icons';
import Link from 'next/link';

export function UpgradeBanner({ message, isOpen = true, onClose, ctaText = 'Upgrade', targetPlan = 'pro', onClickCTA }) {
  const [visible, setVisible] = useState(true);

  if (!isOpen || !visible || !message) return null;

  return (
    <div style={{
      background: 'linear-gradient(90deg, rgba(79, 70, 229, 0.08) 0%, rgba(6, 182, 212, 0.08) 100%)',
      border: '1.5px dashed rgba(79, 70, 229, 0.25)',
      borderRadius: '12px',
      padding: '12px 20px',
      marginBottom: '24px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: '16px',
      fontSize: '0.88rem',
      color: 'var(--text-main)',
      animation: 'fadeIn 0.3s ease-out forwards'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <Icons.Sparkles size={16} style={{ color: 'var(--primary)', flexShrink: 0 }} />
        <span style={{ fontWeight: 550 }}>{message}</span>
      </div>
      
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>
        <Link 
          href={`/pricing?checkout=${targetPlan || 'pro'}`}
          onClick={onClickCTA}
          style={{
            fontSize: '0.78rem',
            fontWeight: 700,
            color: '#ffffff',
            background: 'var(--primary)',
            padding: '4px 12px',
            borderRadius: '6px',
            textDecoration: 'none',
            boxShadow: 'var(--shadow-sm)',
            transition: 'var(--transition)'
          }}
          className="hover-bg"
        >
          {ctaText}
        </Link>
        <button 
          onClick={() => {
            setVisible(false);
            if (onClose) onClose();
          }}
          style={{
            background: 'transparent',
            border: 'none',
            color: 'var(--text-muted)',
            cursor: 'pointer',
            padding: '2px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
          aria-label="Dismiss banner"
        >
          <Icons.Close size={14} />
        </button>
      </div>
    </div>
  );
}
