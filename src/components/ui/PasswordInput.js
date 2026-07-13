'use client';

import React, { useState } from 'react';
import { Input } from './Input';

export function PasswordInput({
  id,
  value,
  onChange,
  placeholder = '••••••••',
  required,
  showRequirements = false,
  showStrength = false,
  className = '',
  style = {},
  ...props
}) {
  const [isVisible, setIsVisible] = useState(false);

  const toggleVisibility = () => setIsVisible(!isVisible);

  let strengthScore = 0;
  if (value) {
    if (value.length >= 6) strengthScore += 1;
    if (value.length >= 8) strengthScore += 1;
    if (/[A-Z]/.test(value) && /[a-z]/.test(value)) strengthScore += 1;
    if (/[0-9]/.test(value) && /[^A-Za-z0-9]/.test(value)) strengthScore += 1;
  }

  const strengthLabels = ['Too short', 'Weak', 'Fair', 'Good', 'Strong'];
  const strengthColors = ['var(--danger)', 'var(--danger)', 'var(--warning)', 'var(--success)', 'var(--success)'];

  return (
    <div style={{ width: '100%' }}>
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
        <Input
          id={id}
          type={isVisible ? 'text' : 'password'}
          className={className}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          required={required}
          style={{ ...style, paddingRight: '40px', width: '100%' }}
          {...props}
        />
        <button
          type="button"
          onClick={toggleVisibility}
          aria-label={isVisible ? 'Hide password' : 'Show password'}
          style={{
            position: 'absolute',
            right: '10px',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: 'var(--text-muted)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '4px',
          }}
        >
          {isVisible ? (
            <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
          ) : (
            <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
          )}
        </button>
      </div>

      {showStrength && value.length > 0 && (
        <div style={{ marginTop: '8px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          <div style={{ display: 'flex', gap: '4px', marginBottom: '4px' }}>
            {[1, 2, 3, 4].map((level) => (
              <div
                key={level}
                style={{
                  height: '4px',
                  flex: 1,
                  borderRadius: '2px',
                  background: level <= strengthScore ? strengthColors[strengthScore] : 'var(--border)',
                  transition: 'background 0.3s ease'
                }}
              />
            ))}
          </div>
          <div style={{ textAlign: 'right', color: strengthColors[strengthScore], fontWeight: 600 }}>
            {strengthLabels[strengthScore]}
          </div>
        </div>
      )}

      {showRequirements && (
        <div style={{ marginTop: '6px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          <ul style={{ margin: 0, paddingLeft: '16px' }}>
            <li style={{ color: value.length >= 6 ? 'var(--success)' : 'inherit' }}>Minimum 6 characters</li>
          </ul>
        </div>
      )}
    </div>
  );
}
