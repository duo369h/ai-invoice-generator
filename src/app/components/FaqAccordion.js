'use client';

import React, { useState } from 'react';

export default function FaqAccordion({ items = [] }) {
  const [openIndex, setOpenIndex] = useState(null);

  const toggle = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxWidth: '800px', margin: '0 auto', width: '100%' }}>
      {items.map((item, idx) => {
        const isOpen = openIndex === idx;
        return (
          <div 
            key={idx} 
            style={{ 
              background: 'var(--background-card)', 
              border: '1px solid var(--border)', 
              borderRadius: '8px', 
              overflow: 'hidden',
              transition: 'var(--transition)'
            }}
          >
            <button
              onClick={() => toggle(idx)}
              style={{
                width: '100%',
                padding: '16px 20px',
                textAlign: 'left',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                fontWeight: 600,
                fontSize: '1rem',
                cursor: 'pointer',
                color: 'var(--text-main)',
                background: isOpen ? 'rgba(255, 255, 255, 0.02)' : 'transparent',
                border: 'none',
                outline: 'none'
              }}
            >
              <span style={{ paddingRight: '15px' }}>{item.question}</span>
              <span style={{ 
                color: 'var(--primary)', 
                transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                transition: 'transform 0.2s ease',
                fontSize: '0.8rem'
              }}>
                ▼
              </span>
            </button>
            
            {isOpen && (
              <div style={{ 
                padding: '16px 20px', 
                fontSize: '0.9rem', 
                color: 'var(--text-muted)', 
                lineHeight: '1.6',
                borderTop: '1px solid var(--border)',
                background: 'rgba(255,255,255,0.01)'
              }}>
                {item.answer}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
