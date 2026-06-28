'use client';

import React from 'react';
import Link from 'next/link';
import { Icons } from '../../styles/icons';

export function Button({
  children,
  onClick,
  href,
  variant = 'primary', // 'primary', 'secondary', 'google', 'danger'
  size = 'md', // 'sm', 'md', 'lg'
  disabled = false,
  isLoading = false,
  type = 'button',
  style = {},
  className = '',
  icon: Icon,
  ...props
}) {
  const variantClass = variant === 'google' ? 'btn-google' : `btn-${variant}`;
  const sizeClass = size === 'md' ? '' : `btn-${size}`;
  const disabledProps = href && (disabled || isLoading) ? { 'aria-disabled': true, tabIndex: -1 } : {};
  const mergedClassName = ['btn', variantClass, sizeClass, className].filter(Boolean).join(' ');

  const content = (
    <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
      {isLoading && <Icons.Loader size={16} className="animate-spin" />}
      {!isLoading && Icon && <Icon size={16} />}
      {children}
    </span>
  );

  if (href) {
    return (
      <Link
        href={href}
        className={mergedClassName}
        style={style}
        onClick={(disabled || isLoading) ? (e) => e.preventDefault() : onClick}
        {...disabledProps}
        {...props}
      >
        {content}
      </Link>
    );
  }

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || isLoading}
      className={mergedClassName}
      style={style}
      {...props}
    >
      {content}
    </button>
  );
}
