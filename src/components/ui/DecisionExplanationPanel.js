'use client';

import React from 'react';

function compactFactors(explanation) {
  if (!explanation || !Array.isArray(explanation.factors)) return [];
  return explanation.factors
    .map((factor) => String(factor || '').trim())
    .filter(Boolean)
    .slice(0, 4);
}

export function DecisionExplanationPanel({
  explanation,
  title = 'Why am I seeing this?',
}) {
  const effectiveExplanation = explanation || {
    summary: 'Based on your freelance business stage.',
    factors: ['Upgrade to unlock professional client workflow capabilities.'],
  };

  const factors = compactFactors(effectiveExplanation);

  return (
    <div style={{
      margin: '0 auto 20px',
      padding: '14px',
      borderRadius: '12px',
      border: '1px solid var(--border)',
      background: 'var(--btn-secondary-bg)',
      textAlign: 'left',
      maxWidth: '420px',
    }}>
      <p style={{ margin: '0 0 6px', fontSize: '0.78rem', fontWeight: 800, color: 'var(--text-main)' }}>
        {title}
      </p>
      
      <div style={{ margin: '0 0 10px', fontSize: '0.76rem', lineHeight: 1.45, color: 'var(--text-muted)' }}>
        <p style={{ margin: '0 0 4px 0' }}>{effectiveExplanation.summary}</p>
      </div>

      {factors.length > 0 && (
        <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: '6px' }}>
          {factors.map((factor) => (
            <li key={factor} style={{ display: 'flex', alignItems: 'flex-start', gap: '7px', fontSize: '0.74rem', color: 'var(--text-main)' }}>
              <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: 'var(--primary)', marginTop: '6px', flexShrink: 0 }} />
              <span>{factor}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
