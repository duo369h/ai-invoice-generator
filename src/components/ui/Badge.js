'use client';

import React from 'react';

export function Badge({ children, variant = 'primary', style = {}, className = '', ...props }) {
  return (
    <span 
      className={['badge', `badge-${variant}`, className].filter(Boolean).join(' ')} 
      style={style} 
      {...props}
    >
      {children}
    </span>
  );
}
