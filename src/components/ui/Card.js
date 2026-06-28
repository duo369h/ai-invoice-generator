'use client';

import React from 'react';

export function Card({ children, style = {}, hoverGlow = false, className = '', ...props }) {
  return (
    <div
      style={style}
      className={['card', hoverGlow ? 'hover-glow' : '', className].filter(Boolean).join(' ')}
      {...props}
    >
      {children}
    </div>
  );
}
