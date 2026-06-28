'use client';

import React from 'react';

export function Input({
  type = 'text',
  className = '',
  error = false,
  style = {},
  ...props
}) {
  const mergedStyle = {
    ...style,
    ...(error ? { borderColor: 'var(--danger)' } : {})
  };

  return (
    <input
      type={type}
      className={['form-input', className].filter(Boolean).join(' ')}
      style={mergedStyle}
      {...props}
    />
  );
}

export function TextArea({
  className = '',
  error = false,
  style = {},
  ...props
}) {
  const mergedStyle = {
    ...style,
    ...(error ? { borderColor: 'var(--danger)' } : {})
  };

  return (
    <textarea
      className={['form-textarea', className].filter(Boolean).join(' ')}
      style={mergedStyle}
      {...props}
    />
  );
}

export function Select({
  children,
  className = '',
  error = false,
  style = {},
  ...props
}) {
  const mergedStyle = {
    ...style,
    ...(error ? { borderColor: 'var(--danger)' } : {})
  };

  return (
    <select
      className={['form-select', className].filter(Boolean).join(' ')}
      style={mergedStyle}
      {...props}
    >
      {children}
    </select>
  );
}
