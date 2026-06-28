'use client';

import React from 'react';
import { dashboardTokens } from '../../styles/tokens/index.js';

export function Container({ children, style = {}, className = '', ...props }) {
  return (
    <div
      className={`ui-container ${className}`}
      style={{
        padding: dashboardTokens.shellPadding,
        width: '100%',
        margin: '0 auto',
        boxSizing: 'border-box',
        ...style,
      }}
      {...props}
    >
      {children}
    </div>
  );
}

export default Container;
