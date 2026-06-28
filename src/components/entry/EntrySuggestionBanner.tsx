'use client';

import React from 'react';
import { useRouter } from 'next/navigation';

export interface EntrySuggestionBannerProps {
  recommendation: {
    route?:           string;
    type?:            string;
    message?:         string;
    suggested_route?: string;
  };
}

export function EntrySuggestionBanner({ recommendation }: EntrySuggestionBannerProps) {
  const router = useRouter();

  return (
    <div
      style={{
        display:         'flex',
        alignItems:      'center',
        justifyContent:  'space-between',
        padding:         '0.85rem 1.5rem',
        background:      'rgba(99, 102, 241, 0.08)',
        borderBottom:    '1px solid rgba(99, 102, 241, 0.2)',
        backdropFilter:  'blur(8px)',
        color:           '#fff',
        fontFamily:      'Inter, system-ui, sans-serif',
        fontSize:        '0.875rem',
        width:           '100%',
        zIndex:          100,
        boxSizing:       'border-box',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
        <span style={{ color: '#818cf8', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span>💡</span> Recommended Path:
        </span>
        <span style={{ color: '#d1d5db' }}>{recommendation.message || "User should be guided to activation flow"}</span>
        <span style={{ color: '#9ca3af', fontSize: '0.8rem' }}>
          (suggested: <code style={{ color: '#a5b4fc', background: '#111827', padding: '2px 6px', borderRadius: '4px', fontFamily: 'monospace' }}>{recommendation.route || recommendation.suggested_route || "/dashboard/activation"}</code>)
        </span>
      </div>
      
      <button
        onClick={() => router.push(recommendation.route || recommendation.suggested_route || "/dashboard/activation")}
        style={{
          background:   'linear-gradient(135deg, #6366f1, #4f46e5)',
          color:        '#fff',
          border:       'none',
          padding:      '6px 16px',
          borderRadius: '6px',
          fontWeight:   600,
          cursor:       'pointer',
          transition:   'opacity 0.2s',
        }}
        onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.9')}
        onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
      >
        Go to flow
      </button>
    </div>
  );
}
export default EntrySuggestionBanner;
