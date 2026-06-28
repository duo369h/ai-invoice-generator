'use client';

import React from 'react';
import { Icons } from '../../styles/icons';

export function Modal({
  isOpen,
  onClose,
  title,
  children,
  maxWidth = '600px',
  ...props
}) {
  if (!isOpen) return null;

  return (
    <div 
      style={{ 
        position: 'fixed', 
        top: 0, 
        left: 0, 
        right: 0, 
        bottom: 0, 
        backgroundColor: 'rgba(0,0,0,0.7)', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        zIndex: 1000, 
        backdropFilter: 'blur(5px)' 
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget && onClose) onClose();
      }}
      {...props}
    >
      <div 
        className="card animate-fade-in" 
        style={{ 
          maxWidth: maxWidth, 
          width: '90%', 
          padding: '32px', 
          background: 'var(--bg-card)', 
          border: '1px solid var(--border)',
          position: 'relative'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          {title && <h3 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0, color: 'var(--text-main)' }}>{title}</h3>}
          {onClose && (
            <button 
              onClick={onClose} 
              style={{ 
                background: 'transparent', 
                border: 'none', 
                color: 'var(--text-muted)', 
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '4px',
                borderRadius: '4px',
                transition: 'var(--transition)'
              }}
              className="hover-bg"
            >
              <Icons.Close size={20} />
            </button>
          )}
        </div>
        {children}
      </div>
    </div>
  );
}
